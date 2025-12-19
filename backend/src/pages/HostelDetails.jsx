// src/pages/HostelDetails.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { Carousel, Container, Row, Col, Badge, Button, Card, Modal, Form } from 'react-bootstrap';
import { useState } from 'react';
import { sampleHostels } from '../data/sampleHostels';

// Shared mock bookings (persists across pages)
let mockUserBookings = JSON.parse(localStorage.getItem('mockUserBookings') || '[]');

function HostelDetails({ triggerToast, isLoggedIn }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const hostel = sampleHostels.find(h => h.id === parseInt(id));

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState('double');
  const [checkInDate, setCheckInDate] = useState('');

  if (!hostel) {
    return (
      <section className="py-5 text-center bg-light min-vh-100 d-flex align-items-center">
        <Container>
          <Card className="p-5 shadow">
            <h2 className="text-danger">Hostel Not Found</h2>
            <p>We couldn't find the hostel you're looking for.</p>
          </Card>
        </Container>
      </section>
    );
  }

  // Room allocation
  const roomAllocation = {
    single: { rooms: 5, price: hostel.price + 2000, available: 3, label: 'Single Room' },
    double: { rooms: 10, price: hostel.price, available: 8, label: '2-Sharing' },
    triple: { rooms: 15, price: hostel.price - 500, available: 12, label: '3-Sharing' },
    fiveSharing: { rooms: 8, price: hostel.price - 1000, available: 5, label: '5-Sharing' },
  };

  const totalAvailable = Object.values(roomAllocation).reduce((sum, type) => sum + type.available, 0);

  const facilitiesWithIcons = {
    "Free WiFi": "bi-wifi",
    "Food": "bi-cup-hot",
    "Laundry": "bi-droplet",
    "Power Backup": "bi-lightning-charge",
    "24/7 Security": "bi-shield-lock",
    "AC Rooms": "bi-snow",
    "CCTV": "bi-camera-video",
    "Housekeeping": "bi-broom",
  };

  const handleBookNow = () => {
    if (!isLoggedIn) {
      triggerToast('Please login to book a seat!');
      navigate('/login');
      return;
    }

    if (totalAvailable === 0) {
      triggerToast('Sorry, this hostel is fully booked!');
      return;
    }

    setShowBookingModal(true);
  };

  const confirmBooking = () => {
    if (!checkInDate) {
      triggerToast('Please select a check-in date!');
      return;
    }

    const selectedType = roomAllocation[selectedRoomType];
    if (selectedType.available <= 0) {
      triggerToast(`No seats available in ${selectedType.label}!`);
      return;
    }

    const newBooking = {
      id: Date.now(),
      hostelId: hostel.id,
      hostelName: hostel.name,
      roomType: selectedType.label,
      price: selectedType.price,
      checkIn: checkInDate,
      status: 'Confirmed',
      bookedAt: new Date().toISOString().split('T')[0],
    };

    mockUserBookings.push(newBooking);
    localStorage.setItem('mockUserBookings', JSON.stringify(mockUserBookings));

    setShowBookingModal(false);
    setCheckInDate('');
    triggerToast(`Booking Confirmed! Seat booked in ${hostel.name} (${selectedType.label}). Check your profile!`, 'success');
  };

  return (
    <section className="hostel-details py-5 bg-light min-vh-100">
      <Container>
        <Row>
          {/* Image Carousel */}
          <Col lg={8} className="mb-5">
            <Carousel className="shadow-lg rounded-4 overflow-hidden">
              {hostel.images.map((img, idx) => (
                <Carousel.Item key={idx}>
                  <img
                    src={img}
                    className="d-block w-100"
                    alt={`${hostel.name} - Image ${idx + 1}`}
                    style={{ height: '500px', objectFit: 'cover' }}
                  />
                </Carousel.Item>
              ))}
            </Carousel>
          </Col>

          {/* Sidebar Info */}
          <Col lg={4}>
            <Card className="shadow-lg border-0 sticky-top" style={{ top: '20px' }}>
              <Card.Body className="p-4">
                <h2 className="fw-bold text-primary">{hostel.name}</h2>
                <p className="text-muted">
                  <i className="bi bi-geo-alt-fill me-2"></i> {hostel.location}
                </p>
                <div className="d-flex align-items-center mb-3">
                  <Badge bg="success" className="me-2 fs-6">{hostel.type}</Badge>
                  <Badge bg="warning" className="text-dark fs-6">
                    <i className="bi bi-star-fill me-1"></i> {hostel.rating}
                  </Badge>
                </div>

                <div className="bg-primary text-white p-3 rounded-3 text-center mb-4">
                  <h4 className="mb-1">Total Available Seats</h4>
                  <h2 className="fw-bold mb-0">{totalAvailable}</h2>
                </div>

                <Button
                  size="lg"
                  className="w-100 btn-primary rounded-pill fw-bold py-3 shadow-lg"
                  onClick={handleBookNow}
                >
                  <i className="bi bi-calendar-check me-2"></i>
                  Book Now
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Room Types & Pricing */}
        <Row className="mb-5">
          <Col>
            <h3 className="fw-bold text-primary mb-4">
              <i className="bi bi-door-open me-2"></i> Room Types & Pricing
            </h3>
            <Row className="g-4">
              {Object.entries(roomAllocation).map(([key, data]) => {
                const typeName = key === 'single' ? 'Single Room' :
                                key === 'double' ? '2-Sharing' :
                                key === 'triple' ? '3-Sharing' : '5-Sharing';
                const beds = key === 'single' ? 1 : key === 'double' ? 2 : key === 'triple' ? 3 : 5;

                return (
                  <Col md={6} lg={3} key={key}>
                    <Card className="h-100 shadow-sm border-0 hover-lift">
                      <Card.Body className="text-center p-4">
                        <i className={`bi ${beds === 1 ? 'bi-person' : 'bi-people'} fs-1 text-primary mb-3`}></i>
                        <h5 className="fw-bold">{typeName}</h5>
                        <p className="text-muted small">{data.rooms} rooms available</p>
                        <h4 className="text-success fw-bold">₹{data.price.toLocaleString()}/month</h4>
                        <Badge bg={data.available > 0 ? 'success' : 'danger'} className="fs-6">
                          {data.available} seats left
                        </Badge>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Col>
        </Row>

        {/* Facilities */}
        <Row className="mb-5">
          <Col lg={8}>
            <h3 className="fw-bold text-primary mb-4">
              <i className="bi bi-check2-circle me-2"></i> Facilities Included
            </h3>
            <Row className="g-4">
              {hostel.facilities.map((facility, idx) => (
                <Col md={6} key={idx}>
                  <div className="d-flex align-items-center p-3 bg-white rounded-3 shadow-sm">
                    <i className={`bi ${facilitiesWithIcons[facility] || 'bi-check-circle'} fs-3 text-success me-3`}></i>
                    <span className="fw-medium">{facility}</span>
                  </div>
                </Col>
              ))}
            </Row>
          </Col>

          {/* Owner Contact */}
          <Col lg={4}>
            <Card className="shadow-lg border-0">
              <Card.Header className="bg-primary text-white text-center py-3">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-person-circle me-2"></i> Hostel Owner
                </h5>
              </Card.Header>
              <Card.Body className="text-center">
                <div className="bg-light rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                  <i className="bi bi-person fs-1 text-primary"></i>
                </div>
                <h5 className="fw-bold">{hostel.owner.name}</h5>
                <p className="text-muted">
                  <i className="bi bi-telephone me-2"></i> {hostel.owner.phone}
                  <br />
                  <i className="bi bi-envelope me-2"></i> {hostel.owner.email}
                </p>
                <Button variant="outline-primary" className="rounded-pill">
                  <i className="bi bi-chat-dots me-2"></i> Contact Owner
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Reviews */}
        <Row>
          <Col>
            <h3 className="fw-bold text-primary mb-4">
              <i className="bi bi-chat-quote me-2"></i> Student Reviews
            </h3>
            <Row className="g-4">
              {[1, 2, 3].map(i => (
                <Col md={4} key={i}>
                  <Card className="shadow-sm border-0 h-100">
                    <Card.Body>
                      <div className="d-flex align-items-center mb-3">
                        <div className="bg-light rounded-circle me-3 d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                          <i className="bi bi-person fs-4 text-primary"></i>
                        </div>
                        <div>
                          <h6 className="mb-0 fw-bold">Student {i}</h6>
                          <small className="text-muted">Stayed in 2025</small>
                        </div>
                      </div>
                      <p className="text-warning mb-2">
                        {'★'.repeat(4 + (i % 2))}{'☆'.repeat(5 - (4 + (i % 2)))}
                      </p>
                      <p className="text-muted">
                        {i === 1 && "Excellent facilities, clean rooms, and helpful staff!"}
                        {i === 2 && "Great value for money. Food is good and location is perfect."}
                        {i === 3 && "Highly recommend! Safe and comfortable stay."}
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>

        {/* Booking Modal */}
        <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold text-primary">
              <i className="bi bi-calendar-check me-2"></i> Confirm Booking
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h5 className="fw-bold mb-3">{hostel.name}</h5>
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold">Preferred Room Type</Form.Label>
              <Form.Select value={selectedRoomType} onChange={(e) => setSelectedRoomType(e.target.value)}>
                {Object.entries(roomAllocation).map(([key, data]) => (
                  data.available > 0 && (
                    <option key={key} value={key}>
                      {data.label} - ₹{data.price}/month ({data.available} available)
                    </option>
                  )
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label className="fw-bold">Preferred Check-in Date</Form.Label>
              <Form.Control
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </Form.Group>
            <div className="alert alert-info mt-4">
              <strong>Note:</strong> Final allocation will be confirmed by the hostel owner.
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowBookingModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={confirmBooking} className="rounded-pill px-4">
              <i className="bi bi-check-circle me-2"></i> Confirm Booking
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </section>
  );
}

export default HostelDetails;