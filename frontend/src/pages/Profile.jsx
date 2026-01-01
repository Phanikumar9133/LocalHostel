// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, ListGroup, Form, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

function Profile({ userRole = 'user', isLoggedIn = true, triggerToast }) {
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    joinedDate: '',
    role: userRole,
  });
  const [bookings, setBookings] = useState([]);
  const [ownedHostels, setOwnedHostels] = useState([]);
  const [ownerStats, setOwnerStats] = useState({
    totalSeats: 0,
    occupiedSeats: 0,
    availableSeats: 0,
    monthlyEarnings: '₹0',
    pendingBookings: 0,
  });

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchProfileData = async () => {
      try {
        setLoading(true);

        // Fetch user profile
        const profileRes = await api.get('/profile');
        const user = profileRes.data;
        setUserData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          joinedDate: new Date(user.joinedDate || Date.now()).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          }),
          role: user.role,
        });

        // Fetch bookings
        if (user.role === 'user') {
          const bookingsRes = await api.get('/bookings/user');
          setBookings(bookingsRes.data);
        } else if (user.role === 'owner') {
          const bookingsRes = await api.get('/bookings/owner');
          setBookings(bookingsRes.data);

          // Fetch owned hostels
          const hostelsRes = await api.get('/hostels');
          const ownerHostels = hostelsRes.data.filter(h => h.owner === user._id);
          setOwnedHostels(ownerHostels);

          // Calculate stats
          let totalSeats = 0;
          let occupiedSeats = 0;
          ownerHostels.forEach(h => {
            h.rooms.forEach(r => {
              totalSeats += r.totalSeats || 0;
              occupiedSeats += r.occupied || 0;
            });
          });

          const availableSeats = totalSeats - occupiedSeats;
          const pendingBookings = bookingsRes.data.filter(b => b.status === 'Pending').length;
          const monthlyEarnings = `₹${(bookingsRes.data.reduce((sum, b) => sum + (b.price || 0), 0) * 0.8).toLocaleString()}`;

          setOwnerStats({
            totalSeats,
            occupiedSeats,
            availableSeats,
            monthlyEarnings,
            pendingBookings,
          });
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [isLoggedIn, userRole]);

  const validateForm = (data) => {
    if (!data.name || data.name.trim().length < 2) return "Name must be at least 2 characters.";
    if (!data.phone || !/^\+91\d{10}$/.test(data.phone.replace(/\s/g, ''))) return "Phone must be +91 followed by 10 digits.";
    return null;
  };

  const handleSave = async () => {
    const err = validateForm(userData);
    if (err) {
      setError(err);
      return;
    }

    try {
      await api.put('/profile', {
        name: userData.name,
        phone: userData.phone,
      });
      setEditMode(false);
      setError('');
      toast.success('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
      toast.error('Failed to update profile');
    }
  };

  if (!isLoggedIn) {
    return (
      <section className="py-5 bg-light min-vh-100 d-flex align-items-center">
        <Container>
          <Card className="text-center p-5 shadow-lg">
            <i className="bi bi-shield-lock fs-1 text-warning mb-4"></i>
            <h2>Please Login</h2>
            <p className="text-muted fs-5">You need to be logged in to view your profile and bookings.</p>
            <Button onClick={() => navigate('/login')} variant="primary" size="lg" className="rounded-pill px-5 mt-3">
              <i className="bi bi-box-arrow-in-right me-2"></i> Login Now
            </Button>
          </Card>
        </Container>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="py-5 text-center min-vh-100 d-flex align-items-center justify-content-center">
        <Spinner animation="border" variant="primary" />
        <h4 className="ms-3">Loading your profile...</h4>
      </section>
    );
  }

  return (
    <section className="profile-page py-5 bg-light min-vh-100">
      <Container>
        {error && <Alert variant="danger">{error}</Alert>}

        <Row className="mb-5">
          <Col>
            <h2 className="fw-bold text-primary text-center mb-4">
              <i className="bi bi-person-circle me-3"></i>
              My Profile
            </h2>
          </Col>
        </Row>

        {/* Profile Header Card */}
        <Row className="mb-5">
          <Col lg={4}>
            <Card className="text-center shadow-lg border-0">
              <Card.Body className="p-5">
                <div className={`rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center ${userRole === 'owner' ? 'bg-success text-white' : 'bg-primary text-white'}`} style={{ width: '120px', height: '120px' }}>
                  <i className={`bi ${userRole === 'owner' ? 'bi-building' : 'bi-person'} fs-1`}></i>
                </div>
                {!editMode ? (
                  <>
                    <h4 className="fw-bold">{userData.name}</h4>
                    <p className="text-muted">{userRole === 'owner' ? 'Hostel Owner' : 'Student'}</p>
                    <Badge bg={userRole === 'owner' ? 'warning' : 'success'} className="fs-6">
                      {userRole === 'owner' ? 'Verified Owner' : 'Active Member'}
                    </Badge>
                  </>
                ) : (
                  <Form.Control
                    type="text"
                    value={userData.name}
                    onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                    className="text-center fw-bold fs-4 border-primary"
                    placeholder="Your Name"
                  />
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={8}>
            <Card className="shadow-lg border-0 h-100">
              <Card.Body className="p-5">
                <h5 className="fw-bold text-primary mb-4">
                  <i className="bi bi-person-lines-fill me-2"></i> Personal Information
                </h5>
                {!editMode ? (
                  <ListGroup variant="flush">
                    <ListGroup.Item><strong>Email:</strong> {userData.email}</ListGroup.Item>
                    <ListGroup.Item><strong>Phone:</strong> {userData.phone || 'Not provided'}</ListGroup.Item>
                    <ListGroup.Item><strong>Member Since:</strong> {userData.joinedDate}</ListGroup.Item>
                  </ListGroup>
                ) : (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control type="email" value={userData.email} disabled />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone</Form.Label>
                      <Form.Control
                        type="tel"
                        value={userData.phone}
                        onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                        placeholder="+91 9876543210"
                      />
                    </Form.Group>
                  </>
                )}
                <div className="text-end mt-4">
                  {!editMode ? (
                    <Button variant="outline-primary" onClick={() => setEditMode(true)} className="rounded-pill px-5">
                      <i className="bi bi-pencil me-2"></i> Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button variant="secondary" onClick={() => setEditMode(false)} className="me-3 rounded-pill">Cancel</Button>
                      <Button variant="primary" onClick={handleSave} className="rounded-pill px-5">
                        <i className="bi bi-check-lg me-2"></i> Save Changes
                      </Button>
                    </>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Student Bookings */}
        {userRole === 'user' && (
          <Row>
            <Col>
              <h4 className="fw-bold text-primary mb-4">
                <i className="bi bi-calendar-check me-2"></i> My Bookings ({bookings.length})
              </h4>
              {bookings.length === 0 ? (
                <Card className="text-center p-5 bg-white shadow-sm">
                  <i className="bi bi-inbox fs-1 text-muted mb-3"></i>
                  <p className="text-muted fs-5">No bookings yet!</p>
                  <Button variant="primary" onClick={() => navigate('/hostels')} className="rounded-pill px-5 mt-3">
                    <i className="bi bi-search me-2"></i> Find Hostels
                  </Button>
                </Card>
              ) : (
                <Row className="g-4">
                  {bookings.map((booking) => (
                    <Col md={6} lg={4} key={booking._id}>
                      <Card className="shadow-sm border-0 h-100 hover-lift">
                        <Card.Body>
                          <div className="d-flex justify-content-between mb-3">
                            <h6 className="fw-bold">{booking.hostel?.name || 'Hostel'}</h6>
                            <Badge bg={booking.status === 'Confirmed' ? 'success' : 'warning'}>
                              {booking.status}
                            </Badge>
                          </div>
                          <p className="text-muted mb-2">
                            <i className="bi bi-door-open me-2"></i> {booking.roomType}
                          </p>
                          <p className="text-muted mb-2">
                            <i className="bi bi-currency-rupee me-2"></i> ₹{booking.price}/month
                          </p>
                          <p className="text-muted mb-0">
                            <i className="bi bi-calendar me-2"></i> Check-in: {new Date(booking.checkInDate).toLocaleDateString()}
                          </p>
                        </Card.Body>
                        <Card.Footer className="bg-transparent border-0 text-end">
                          <Button size="sm" variant="outline-primary" className="rounded-pill">
                            View Details
                          </Button>
                        </Card.Footer>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Col>
          </Row>
        )}

        {/* Owner Section */}
        {userRole === 'owner' && (
          <>
            {/* Stats Cards */}
            <Row className="g-4 mb-5">
              <Col md={4}>
                <Card className="text-center shadow-sm border-0">
                  <Card.Body>
                    <i className="bi bi-currency-rupee fs-1 text-success mb-3"></i>
                    <h6 className="text-muted">Monthly Earnings</h6>
                    <h4 className="fw-bold text-success">{ownerStats.monthlyEarnings}</h4>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="text-center shadow-sm border-0">
                  <Card.Body>
                    <i className="bi bi-person-plus fs-1 text-primary mb-3"></i>
                    <h6 className="text-muted">Occupancy Rate</h6>
                    <h4 className="fw-bold text-primary">
                      {ownerStats.totalSeats > 0
                        ? Math.round((ownerStats.occupiedSeats / ownerStats.totalSeats) * 100)
                        : 0}%
                    </h4>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="text-center shadow-sm border-0">
                  <Card.Body>
                    <i className="bi bi-bell fs-1 text-warning mb-3"></i>
                    <h6 className="text-muted">Pending Bookings</h6>
                    <h4 className="fw-bold text-warning">{ownerStats.pendingBookings}</h4>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Owned Hostels */}
            <Row className="mb-5">
              <Col>
                <h4 className="fw-bold text-primary mb-4">
                  <i className="bi bi-building me-2"></i> My Hostels ({ownedHostels.length})
                </h4>
                {ownedHostels.length === 0 ? (
                  <Card className="text-center p-5 bg-white shadow-sm">
                    <i className="bi bi-inbox fs-1 text-muted mb-3"></i>
                    <p className="text-muted fs-5">You haven't published any hostels yet!</p>
                    <Button variant="success" onClick={() => navigate('/owner-dashboard')} className="rounded-pill px-5 mt-3">
                      <i className="bi bi-plus-circle me-2"></i> Add Your First Hostel
                    </Button>
                  </Card>
                ) : (
                  <Row className="g-4">
                    {ownedHostels.map(hostel => (
                      <Col md={6} lg={4} key={hostel._id}>
                        <Card className="shadow-sm border-0 h-100 hover-lift">
                          <Card.Img
                            variant="top"
                            src={hostel.images?.[0] ? `https://localhostel.onrender.com${hostel.images[0]}` : 'https://via.placeholder.com/400x250?text=Hostel'}
                            style={{ height: '200px', objectFit: 'cover' }}
                          />
                          <Card.Body>
                            <Card.Title className="fw-bold">{hostel.name}</Card.Title>
                            <p className="text-muted mb-2">
                              <i className="bi bi-geo-alt me-2"></i>{hostel.location}
                            </p>
                            <p className="text-muted mb-2">
                              <i className="bi bi-people me-2"></i>{hostel.availableSeats || 0} seats available
                            </p>
                            <p className="text-muted mb-3">
                              <i className="bi bi-currency-rupee me-2"></i>₹{hostel.price}/seat
                            </p>
                            <Button variant="outline-primary" size="sm" as={Link} to={`/hostel/${hostel._id}`} className="w-100 rounded-pill">
                              View Details
                            </Button>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </Col>
            </Row>

            {/* Owner Dashboard Button */}
            <div className="text-center">
              <Button href="/owner-dashboard" size="lg" className="btn-success rounded-pill px-5 py-3 fw-bold shadow-lg">
                <i className="bi bi-speedometer2 me-2"></i> Go to Owner Dashboard
              </Button>
            </div>
          </>
        )}
      </Container>
    </section>
  );
}

export default Profile;