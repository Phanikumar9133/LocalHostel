// src/pages/HostelDetails.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { Carousel, Container, Row, Col, Badge, Button, Card, Modal, Form, Alert, Spinner, Table } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

// Backend base URL (change if needed)
const API_BASE_URL = 'https://localhostel.onrender.com';

function HostelDetails({ triggerToast, isLoggedIn }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [hostel, setHostel] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const fetchHostelData = async () => {
      try {
        setLoading(true);
        const hostelRes = await api.get(`/hostels/${id}`);
        setHostel(hostelRes.data);

        const reviewsRes = await api.get(`/reviews/${id}`);
        setReviews(reviewsRes.data);

        const firstAvailableRoom = hostelRes.data.rooms?.find(r => r.totalSeats > r.occupied);
        if (firstAvailableRoom) {
          setSelectedRoomType(firstAvailableRoom.type.toLowerCase().replace('-sharing', ''));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load hostel details');
        toast.error('Failed to load hostel details');
      } finally {
        setLoading(false);
      }
    };

    fetchHostelData();
  }, [id]);

  const facilitiesWithIcons = {
    "Free WiFi": "bi-wifi",
    "Food": "bi-cup-hot",
    "Laundry": "bi-droplet",
    "Power Backup": "bi-lightning-charge",
    "24/7 Security": "bi-shield-lock",
    "AC Rooms": "bi-snow",
    "CCTV": "bi-camera-video",
    "Housekeeping": "bi-broom",
    "Parking": "bi-truck",
    "Study Room": "bi-book",
  };

  const handleBookNow = () => {
    if (!isLoggedIn) {
      triggerToast('Please login to book a seat!');
      navigate('/login');
      return;
    }
    if (hostel?.availableSeats === 0) {
      triggerToast('Sorry, this hostel is fully booked!');
      return;
    }
    setShowBookingModal(true);
  };

  const confirmBooking = async () => {
    if (!checkInDate) {
      toast.error('Please select a check-in date!');
      return;
    }
    if (!selectedRoomType) {
      toast.error('Please select a room type!');
      return;
    }

    setBookingLoading(true);

    try {
      const selectedRoom = hostel.rooms?.find(r => r.type.toLowerCase().includes(selectedRoomType));
      if (!selectedRoom || selectedRoom.totalSeats - selectedRoom.occupied <= 0) {
        toast.error('Selected room type not available');
        return;
      }

      await api.post('/bookings', {
        hostel: id,
        roomType: selectedRoom.type,
        checkInDate,
        price: selectedRoom.price,
      });

      setShowBookingModal(false);
      setCheckInDate('');
      toast.success('Booking confirmed! Check your profile.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!isLoggedIn) {
      toast.error('Please login to submit a review');
      navigate('/login');
      return;
    }

    try {
      const res = await api.post('/reviews', {
        hostel: id,
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviews([...reviews, res.data]);
      setReviewComment('');
      setShowReviewForm(false);
      toast.success('Review submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    }
  };

  if (loading) {
    return (
      <section className="py-5 text-center min-vh-100 d-flex align-items-center justify-content-center">
        <Spinner animation="border" variant="primary" />
        <h4 className="ms-3">Loading hostel details...</h4>
      </section>
    );
  }

  if (error || !hostel) {
    return (
      <section className="py-5 text-center bg-light min-vh-100 d-flex align-items-center">
        <Container>
          <Card className="p-5 shadow">
            <h2 className="text-danger">Hostel Not Found</h2>
            <p>{error || "We couldn't find the hostel you're looking for."}</p>
            <Button variant="primary" onClick={() => navigate('/hostels')}>
              Back to Hostels
            </Button>
          </Card>
        </Container>
      </section>
    );
  }

  return (
    <section className="hostel-details py-5 bg-light min-vh-100">
      <Container>
        {error && <Alert variant="danger">{error}</Alert>}

        <Row>
          {/* Image Carousel */}
          <Col lg={8} className="mb-5">
            <Carousel className="shadow-lg rounded-4 overflow-hidden">
              {(hostel.images || []).length === 0 ? (
                <Carousel.Item>
                  <img
                    src="https://via.placeholder.com/800x500?text=No+Image+Available"
                    className="d-block w-100"
                    alt="No image"
                    style={{ height: '500px', objectFit: 'cover' }}
                  />
                </Carousel.Item>
              ) : (
                hostel.images.map((img, idx) => (
                  <Carousel.Item key={idx}>
                    <img
                      src={`${API_BASE_URL}${img}`} // Add base URL to relative paths
                      className="d-block w-100"
                      alt={`${hostel.name} - Image ${idx + 1}`}
                      style={{ height: '500px', objectFit: 'cover' }}
                      onError={(e) => e.target.src = 'https://via.placeholder.com/800x500?text=Image+Not+Found'}
                    />
                  </Carousel.Item>
                ))
              )}
            </Carousel>
          </Col>

          {/* Sidebar Info */}
          <Col lg={4}>
            <Card className="shadow-lg border-0 sticky-top" style={{ top: '100px' }}>
              <Card.Body className="p-4">
                <h2 className="fw-bold text-primary">{hostel.name || 'Unnamed Hostel'}</h2>
                <p className="text-muted">
                  <i className="bi bi-geo-alt-fill me-2"></i> {hostel.location || 'N/A'}
                </p>
                <div className="d-flex align-items-center mb-3">
                  <Badge bg="success" className="me-2 fs-6">{hostel.type || 'N/A'}</Badge>
                  <Badge bg="warning" className="text-dark fs-6">
                    <i className="bi bi-star-fill me-1"></i> {hostel.rating?.toFixed(1) || 'N/A'}
                  </Badge>
                </div>

                <div className="bg-primary text-white p-3 rounded-3 text-center mb-4">
                  <h4 className="mb-1">Total Available Seats</h4>
                  <h2 className="fw-bold mb-0">{hostel.availableSeats || 0}</h2>
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
            <Table responsive striped bordered hover variant="light">
              <thead>
                <tr>
                  <th>Room Type</th>
                  <th>Price per Month (₹)</th>
                  <th>Total Seats</th>
                  <th>Available Seats</th>
                </tr>
              </thead>
              <tbody>
                {(hostel.rooms || []).length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-3">No room details available</td>
                  </tr>
                ) : (
                  hostel.rooms.map((room, idx) => (
                    <tr key={idx}>
                      <td>{room.type || 'N/A'}</td>
                      <td>{room.price?.toLocaleString() || 'N/A'}</td>
                      <td>{room.totalSeats || 0}</td>
                      <td>{(room.totalSeats || 0) - (room.occupied || 0)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Col>
        </Row>

        {/* Facilities */}
        <Row className="mb-5">
          <Col lg={8}>
            <h3 className="fw-bold text-primary mb-4">
              <i className="bi bi-check2-circle me-2"></i> Facilities Included
            </h3>
            <Row className="g-4">
              {(hostel.facilities || []).length === 0 ? (
                <Col>
                  <p className="text-muted">No facilities listed</p>
                </Col>
              ) : (
                hostel.facilities.map((facility, idx) => (
                  <Col md={6} key={idx}>
                    <div className="d-flex align-items-center p-3 bg-white rounded-3 shadow-sm">
                      <i className={`bi ${facilitiesWithIcons[facility] || 'bi-check-circle'} fs-3 text-success me-3`}></i>
                      <span className="fw-medium">{facility}</span>
                    </div>
                  </Col>
                ))
              )}
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
                <h5 className="fw-bold">{hostel.owner?.name || 'Owner'}</h5>
                <p className="text-muted">
                  <i className="bi bi-telephone me-2"></i> {hostel.owner?.phone || 'N/A'}
                  <br />
                  <i className="bi bi-envelope me-2"></i> {hostel.owner?.email || 'N/A'}
                </p>
                <Button variant="outline-primary" className="rounded-pill">
                  <i className="bi bi-chat-dots me-2"></i> Contact Owner
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Reviews */}
        <Row className="mb-5">
          <Col>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fw-bold text-primary mb-0">
                <i className="bi bi-chat-quote me-2"></i> Student Reviews ({reviews.length})
              </h3>
              {isLoggedIn && (
                <Button variant="outline-primary" onClick={() => setShowReviewForm(!showReviewForm)}>
                  <i className="bi bi-plus-circle me-2"></i> Write a Review
                </Button>
              )}
            </div>

            {showReviewForm && isLoggedIn && (
              <Card className="mb-4 shadow-sm">
                <Card.Body>
                  <h5 className="mb-3">Share your experience</h5>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Rating</Form.Label>
                      <Form.Select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))}>
                        {[5, 4, 3, 2, 1].map((r) => (
                          <option key={r} value={r}>{r} Stars</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Your Review</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Tell us about your stay..."
                      />
                    </Form.Group>
                    <Button variant="primary" onClick={handleSubmitReview}>
                      Submit Review
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            )}

            {reviews.length === 0 ? (
              <Alert variant="info">No reviews yet. Be the first to review!</Alert>
            ) : (
              <Row className="g-4">
                {reviews.map((review) => (
                  <Col md={4} key={review._id}>
                    <Card className="shadow-sm border-0 h-100">
                      <Card.Body>
                        <div className="d-flex align-items-center mb-3">
                          <div className="bg-light rounded-circle me-3 d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                            <i className="bi bi-person fs-4 text-primary"></i>
                          </div>
                          <div>
                            <h6 className="mb-0 fw-bold">{review.user?.name || 'Student'}</h6>
                            <small className="text-muted">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </small>
                          </div>
                        </div>
                        <p className="text-warning mb-2">
                          {'★'.repeat(review.rating || 0)}{'☆'.repeat(5 - (review.rating || 0))}
                        </p>
                        <p className="text-muted">{review.comment || 'No comment'}</p>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
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
            <h5 className="fw-bold mb-3">{hostel.name || 'Unnamed Hostel'}</h5>
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold">Preferred Room Type</Form.Label>
              <Form.Select
                value={selectedRoomType}
                onChange={(e) => setSelectedRoomType(e.target.value)}
              >
                {(hostel.rooms || []).map((room) => {
                  const key = (room.type || '').toLowerCase().replace('-sharing', '');
                  return room.totalSeats > room.occupied ? (
                    <option key={room._id} value={key}>
                      {room.type || 'Unknown'} - ₹{room.price?.toLocaleString() || 'N/A'}/month ({room.totalSeats - room.occupied} available)
                    </option>
                  ) : null;
                })}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-4">
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
            <Button variant="secondary" onClick={() => setShowBookingModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmBooking} className="rounded-pill px-4" disabled={bookingLoading}>
              {bookingLoading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Booking...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i> Confirm Booking
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </section>
  );
}

export default HostelDetails;