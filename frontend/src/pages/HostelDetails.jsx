// src/pages/HostelDetails.jsx
import { useParams, useNavigate } from 'react-router-dom';
import {
  Carousel,
  Container,
  Row,
  Col,
  Badge,
  Button,
  Card,
  Modal,
  Form,
  Alert,
  Spinner,
  Table
} from 'react-bootstrap';
import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

function HostelDetails({ triggerToast, isLoggedIn }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [hostel, setHostel] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Booking modal states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Review form states
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [hostelRes, reviewsRes] = await Promise.all([
          api.get(`/hostels/${id}`),
          api.get(`/reviews/${id}`)
        ]);

        // Fix: Extract the actual hostel object (backend returns {success: true, hostel: {...}})
        const hostelData = hostelRes.data.hostel || hostelRes.data || null;
        if (!hostelData) {
          throw new Error('Hostel data not found in response');
        }
        setHostel(hostelData);

        setReviews(reviewsRes.data || []);

        // Auto-select first available room type
        const firstAvailable = hostelData.rooms?.find(
          r => (r.totalSeats || 0) > (r.occupied || 0)
        );
        if (firstAvailable) {
          setSelectedRoomType(firstAvailable.type);
        }
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to load hostel details';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
      toast.warning('Please login to book a seat');
      navigate('/login');
      return;
    }
    if ((hostel?.availableSeats || 0) <= 0) {
      toast.error('Sorry, no seats available right now');
      return;
    }
    setShowBookingModal(true);
  };

  const confirmBooking = async () => {
    // Validation
    if (!selectedRoomType) {
      return toast.error('Please select a room type');
    }
    if (!checkInDate) {
      return toast.error('Please select a check-in date');
    }

    setBookingLoading(true);

    try {
      // Find the room object to get its price (though backend calculates it, sending it ensures consistency)
      const selectedRoom = hostel.rooms?.find(r => r.type === selectedRoomType);
      if (!selectedRoom) {
        throw new Error('Selected room type not found');
      }

      const payload = {
        hostel: id,
        roomType: selectedRoomType,
        checkInDate,
        price: selectedRoom.price  // Optional: backend will override if needed
      };

      const response = await api.post('/bookings', payload);

      toast.success('Booking request sent successfully! Owner will review it soon.');
      setShowBookingModal(false);
      setCheckInDate('');
      setSelectedRoomType('');
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to create booking. Please try again.';
      toast.error(errorMsg);
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
    if (!reviewComment.trim()) {
      return toast.warning('Review comment cannot be empty');
    }

    try {
      const res = await api.post('/reviews', {
        hostelId: id,  // backend expects hostelId (not hostel)
        rating: reviewRating,
        comment: reviewComment.trim()
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
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" variant="primary" style={{ width: '4rem', height: '4rem' }} />
      </div>
    );
  }

  if (error || !hostel) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center p-5 shadow">
          <h3>{error || "Hostel not found"}</h3>
          <Button variant="primary" size="lg" className="mt-3" onClick={() => navigate('/hostels')}>
            Back to Hostels
          </Button>
        </Alert>
      </Container>
    );
  }

  // Aggregate room types for display
  const roomSummary = {};
  (hostel.rooms || []).forEach(r => {
    if (!roomSummary[r.type]) {
      roomSummary[r.type] = {
        type: r.type,
        totalSeats: 0,
        occupied: 0,
        available: 0,
        price: r.price
      };
    }
    roomSummary[r.type].totalSeats += r.totalSeats || 0;
    roomSummary[r.type].occupied += r.occupied || 0;
    roomSummary[r.type].available += (r.totalSeats || 0) - (r.occupied || 0);
  });

  const availableRoomTypes = Object.values(roomSummary).filter(r => r.available > 0);

  return (
    <section className="hostel-details py-5 bg-light min-vh-100">
      <Container>
        <Row className="g-5">
          {/* Images + Details */}
          <Col lg={8}>
            <Carousel className="rounded-4 shadow-lg overflow-hidden mb-5">
              {(hostel.images?.length || 0) > 0 ? (
                hostel.images.map((img, idx) => (
                  <Carousel.Item key={idx}>
                    <img
                      src={img}
                      className="d-block w-100"
                      alt={`Hostel image ${idx + 1}`}
                      style={{ height: '520px', objectFit: 'cover' }}
                      onError={e => e.target.src = 'https://via.placeholder.com/1200x520?text=Image+Not+Found'}
                    />
                  </Carousel.Item>
                ))
              ) : (
                <Carousel.Item>
                  <img
                    src="https://via.placeholder.com/1200x520?text=No+Images+Uploaded"
                    className="d-block w-100"
                    alt="No images"
                  />
                </Carousel.Item>
              )}
            </Carousel>

            <Card className="shadow-lg border-0 mb-5">
              <Card.Body className="p-5">
                <h1 className="fw-bold mb-3 text-primary">{hostel.name}</h1>
                <p className="lead text-muted mb-4">
                  <i className="bi bi-geo-alt-fill me-2 text-danger"></i>
                  {hostel.location} • {hostel.type}
                </p>

                <div className="d-flex flex-wrap gap-3 mb-4">
                  <Badge bg="success" className="fs-5 px-4 py-2">
                    {hostel.availableSeats || 0} Seats Available
                  </Badge>
                  <Badge bg="warning" className="fs-5 px-4 py-2 text-dark">
                    Rating: {hostel.rating?.toFixed(1) || 'New'} ★
                  </Badge>
                </div>

                <Button
                  size="lg"
                  variant="primary"
                  className="w-100 rounded-pill fw-bold py-3 shadow"
                  onClick={handleBookNow}
                >
                  <i className="bi bi-calendar-check-fill me-2 fs-4"></i>
                  Book a Seat Now
                </Button>
              </Card.Body>
            </Card>

            {/* Room Types Table */}
            <Card className="shadow-sm mb-5">
              <Card.Header className="bg-primary text-white">
                <h4 className="mb-0">Room Types & Availability</h4>
              </Card.Header>
              <Card.Body>
                <Table striped bordered hover responsive className="mb-0">
                  <thead>
                    <tr>
                      <th>Room Type</th>
                      <th>Total Seats</th>
                      <th>Occupied</th>
                      <th>Available</th>
                      <th>Price per Seat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(roomSummary).length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted">
                          No room types configured yet
                        </td>
                      </tr>
                    ) : (
                      Object.values(roomSummary).map((r, i) => (
                        <tr key={i}>
                          <td className="fw-medium">{r.type}</td>
                          <td>{r.totalSeats}</td>
                          <td>{r.occupied}</td>
                          <td className={r.available > 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                            {r.available}
                          </td>
                          <td>₹{r.price?.toLocaleString() || '—'}/month</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>

            {/* Facilities */}
            <Card className="shadow-sm mb-5">
              <Card.Header className="bg-info text-white">
                <h4 className="mb-0">Facilities</h4>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  {(hostel.facilities || []).length === 0 ? (
                    <Col><p className="text-muted text-center py-4">No facilities listed</p></Col>
                  ) : (
                    hostel.facilities.map((f, i) => (
                      <Col md={4} key={i}>
                        <div className="d-flex align-items-center p-3 bg-white rounded shadow-sm">
                          <i className={`bi ${facilitiesWithIcons[f] || 'bi-check-circle-fill'} fs-3 text-info me-3`}></i>
                          <span className="fw-medium fs-5">{f}</span>
                        </div>
                      </Col>
                    ))
                  )}
                </Row>
              </Card.Body>
            </Card>
          </Col>

          {/* Sidebar - Owner Info */}
          <Col lg={4}>
            <Card className="shadow-lg border-0 sticky-top" style={{ top: '80px' }}>
              <Card.Header className="bg-dark text-white text-center py-4">
                <h4 className="mb-0">Hostel Owner</h4>
              </Card.Header>
              <Card.Body className="text-center py-5">
                <div className="bg-light rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center" style={{ width: '120px', height: '120px' }}>
                  <i className="bi bi-person-circle fs-1 text-primary"></i>
                </div>
                <h4 className="fw-bold mb-2">{hostel.owner?.name || 'Owner'}</h4>
                <p className="text-muted mb-3">
                  <i className="bi bi-telephone-fill me-2"></i>
                  {hostel.owner?.phone || 'Not available'}
                </p>
                <p className="text-muted mb-4">
                  <i className="bi bi-envelope-fill me-2"></i>
                  {hostel.owner?.email || 'Not available'}
                </p>
                <Button variant="outline-primary" size="lg" className="rounded-pill px-5">
                  <i className="bi bi-chat-dots-fill me-2"></i>
                  Contact Owner
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Booking Modal */}
        <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)} centered size="md">
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold text-primary">
              <i className="bi bi-calendar-check me-2"></i>
              Book Your Seat
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h5 className="mb-4">{hostel.name}</h5>
            <Form>
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Select Room Type</Form.Label>
                <Form.Select
                  value={selectedRoomType}
                  onChange={e => setSelectedRoomType(e.target.value)}
                >
                  <option value="">Choose...</option>
                  {availableRoomTypes.map(r => (
                    <option key={r.type} value={r.type}>
                      {r.type} — {r.available} available • ₹{r.price?.toLocaleString()}/month
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Preferred Check-in Date</Form.Label>
                <Form.Control
                  type="date"
                  value={checkInDate}
                  onChange={e => setCheckInDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </Form.Group>

              <Alert variant="info" className="mb-0">
                <strong>Important:</strong> Your booking will be pending until the owner confirms it.
              </Alert>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowBookingModal(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={confirmBooking}
              disabled={bookingLoading || !selectedRoomType || !checkInDate}
              className="px-4"
            >
              {bookingLoading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Booking...
                </>
              ) : (
                'Confirm Booking'
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Reviews Section */}
        <Row className="mt-5">
          <Col>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fw-bold text-primary mb-0">
                <i className="bi bi-chat-quote me-2"></i>
                Student Reviews ({reviews.length})
              </h3>

              {isLoggedIn && (
                <Button
                  variant="outline-primary"
                  onClick={() => setShowReviewForm(!showReviewForm)}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Write Review
                </Button>
              )}
            </div>

            {showReviewForm && isLoggedIn && (
              <Card className="mb-5 shadow-sm">
                <Card.Body>
                  <h5 className="mb-3">Your Experience</h5>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Rating (1–5)</Form.Label>
                      <Form.Select
                        value={reviewRating}
                        onChange={e => setReviewRating(Number(e.target.value))}
                      >
                        {[5, 4, 3, 2, 1].map(r => (
                          <option key={r} value={r}>{r} Stars</option>
                        ))}
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Your Review</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                        placeholder="Share your honest feedback..."
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
              <Alert variant="info" className="text-center py-5">
                No reviews yet. Be the first to share your experience!
              </Alert>
            ) : (
              <Row className="g-4">
                {reviews.map(review => (
                  <Col md={6} key={review._id}>
                    <Card className="shadow-sm h-100">
                      <Card.Body>
                        <div className="d-flex justify-content-between mb-3">
                          <div>
                            <h6 className="fw-bold mb-1">{review.user?.name || 'Anonymous'}</h6>
                            <div className="text-warning fs-5">
                              {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                            </div>
                          </div>
                          <small className="text-muted">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </small>
                        </div>
                        <p className="text-muted mb-0">{review.comment || 'No comment provided'}</p>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Col>
        </Row>
      </Container>
    </section>
  );
}

export default HostelDetails;