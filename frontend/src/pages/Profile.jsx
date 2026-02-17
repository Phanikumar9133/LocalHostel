// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, ListGroup, Form, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

function Profile({ userRole = 'user', isLoggedIn = true }) {
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
        setError('');

        // 1. Get user profile
        const profileRes = await api.get('/profile');
        const user = profileRes?.data || {};

        setUserData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          joinedDate: user.joinedDate
            ? new Date(user.joinedDate).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })
            : 'N/A',
          role: user.role || userRole,
        });

        // 2. Role-specific data
        if (user.role === 'user' || (!user.role && userRole === 'user')) {
          const bookingsRes = await api.get('/bookings/user');
          setBookings(Array.isArray(bookingsRes?.data) ? bookingsRes.data : []);
        } 
        else if (user.role === 'owner' || (!user.role && userRole === 'owner')) {
          // Owner bookings
          const bookingsRes = await api.get('/bookings/owner');
          const ownerBookings = Array.isArray(bookingsRes?.data) ? bookingsRes.data : [];
          setBookings(ownerBookings);

          // Owned hostels
          const hostelsRes = await api.get('/hostels');
          const allHostels = Array.isArray(hostelsRes?.data) ? hostelsRes.data : [];
          const myHostels = allHostels.filter((h) => h.owner === user._id);
          setOwnedHostels(myHostels);

          // Stats calculation (safe version)
          let total = 0;
          let occupied = 0;
          myHostels.forEach((h) => {
            (h.rooms || []).forEach((r) => {
              total += Number(r.totalSeats || 0);
              occupied += Number(r.occupied || 0);
            });
          });

          const pending = ownerBookings.filter((b) => b.status === 'Pending').length;
          const earnings = ownerBookings.reduce((sum, b) => sum + Number(b.price || 0), 0) * 0.8;

          setOwnerStats({
            totalSeats: total,
            occupiedSeats: occupied,
            availableSeats: total - occupied,
            monthlyEarnings: `₹${Math.round(earnings).toLocaleString()}`,
            pendingBookings: pending,
          });
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
        const msg = err.response?.data?.message || 'Failed to load profile data';
        setError(msg);
        toast.error(msg);

        // Reset to safe empty values
        setBookings([]);
        setOwnedHostels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [isLoggedIn, userRole]);

  const validateForm = (data) => {
    if (!data.name?.trim() || data.name.trim().length < 2) {
      return 'Name must be at least 2 characters.';
    }
    if (!data.phone || !/^\+91[6-9]\d{9}$/.test(data.phone.replace(/\s/g, ''))) {
      return 'Phone must be valid Indian number (e.g. +919876543210)';
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm(userData);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    try {
      await api.put('/profile', {
        name: userData.name.trim(),
        phone: userData.phone.trim(),
      });
      setEditMode(false);
      setError('');
      toast.success('Profile updated successfully!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Update failed';
      setError(msg);
      toast.error(msg);
    }
  };

  if (!isLoggedIn) {
    return (
      <section className="py-5 bg-light min-vh-100 d-flex align-items-center">
        <Container>
          <Card className="text-center p-5 shadow-lg">
            <i className="bi bi-shield-lock fs-1 text-warning mb-4"></i>
            <h2>Please Login</h2>
            <p className="text-muted fs-5">
              You need to be logged in to view your profile and bookings.
            </p>
            <Button
              onClick={() => navigate('/login')}
              variant="primary"
              size="lg"
              className="rounded-pill px-5 mt-3"
            >
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
        {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

        <Row className="mb-5">
          <Col>
            <h2 className="fw-bold text-primary text-center mb-4">
              <i className="bi bi-person-circle me-3"></i>
              My Profile
            </h2>
          </Col>
        </Row>

        {/* Profile Header + Info */}
        <Row className="mb-5 g-4">
          <Col lg={4}>
            <Card className="text-center shadow-lg border-0 h-100">
              <Card.Body className="p-5">
                <div
                  className={`rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center ${
                    userData.role === 'owner' ? 'bg-success' : 'bg-primary'
                  } text-white`}
                  style={{ width: '120px', height: '120px' }}
                >
                  <i className={`bi ${userData.role === 'owner' ? 'bi-building' : 'bi-person'} fs-1`}></i>
                </div>

                {!editMode ? (
                  <>
                    <h4 className="fw-bold">{userData.name || 'User'}</h4>
                    <p className="text-muted">
                      {userData.role === 'owner' ? 'Hostel Owner' : 'Student / User'}
                    </p>
                    <Badge bg={userData.role === 'owner' ? 'warning' : 'success'} className="fs-6">
                      {userData.role === 'owner' ? 'Verified Owner' : 'Active Member'}
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
                    <ListGroup.Item>
                      <strong>Email:</strong> {userData.email || 'Not provided'}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Phone:</strong> {userData.phone || 'Not provided'}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Member Since:</strong> {userData.joinedDate}
                    </ListGroup.Item>
                  </ListGroup>
                ) : (
                  <>
                    <Form.Group className="mb-4">
                      <Form.Label>Email (cannot change)</Form.Label>
                      <Form.Control type="email" value={userData.email} disabled />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number</Form.Label>
                      <Form.Control
                        type="tel"
                        value={userData.phone}
                        onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                      />
                    </Form.Group>
                  </>
                )}

                <div className="text-end mt-4">
                  {!editMode ? (
                    <Button
                      variant="outline-primary"
                      onClick={() => setEditMode(true)}
                      className="rounded-pill px-5"
                    >
                      <i className="bi bi-pencil me-2"></i> Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setEditMode(false);
                          setError('');
                        }}
                        className="me-3 rounded-pill px-4"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleSave}
                        className="rounded-pill px-5"
                      >
                        <i className="bi bi-check-lg me-2"></i> Save Changes
                      </Button>
                    </>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* USER ROLE - Bookings */}
        {userData.role !== 'owner' && (
          <Row>
            <Col>
              <h4 className="fw-bold text-primary mb-4">
                <i className="bi bi-calendar-check me-2"></i> 
                My Bookings ({bookings?.length || 0})
              </h4>

              {(bookings ?? []).length === 0 ? (
                <Card className="text-center p-5 bg-white shadow-sm">
                  <i className="bi bi-inbox fs-1 text-muted mb-3"></i>
                  <p className="text-muted fs-5">No bookings yet!</p>
                  <Button
                    variant="primary"
                    onClick={() => navigate('/hostels')}
                    className="rounded-pill px-5 mt-3"
                  >
                    <i className="bi bi-search me-2"></i> Find Hostels
                  </Button>
                </Card>
              ) : (
                <Row className="g-4">
                  {(bookings ?? []).map((booking) => (
                    <Col md={6} lg={4} key={booking?._id || Math.random()}>
                      <Card className="shadow-sm border-0 h-100 hover-lift">
                        <Card.Body>
                          <div className="d-flex justify-content-between mb-3">
                            <h6 className="fw-bold">{booking?.hostel?.name || 'Hostel'}</h6>
                            <Badge bg={booking?.status === 'Confirmed' ? 'success' : 'warning'}>
                              {booking?.status || 'Unknown'}
                            </Badge>
                          </div>
                          <p className="text-muted mb-2">
                            <i className="bi bi-door-open me-2"></i> {booking?.roomType || 'N/A'}
                          </p>
                          <p className="text-muted mb-2">
                            <i className="bi bi-currency-rupee me-2"></i> 
                            ₹{booking?.price?.toLocaleString() || 0}/month
                          </p>
                          <p className="text-muted mb-0">
                            <i className="bi bi-calendar me-2"></i> Check-in:{' '}
                            {booking?.checkInDate
                              ? new Date(booking.checkInDate).toLocaleDateString()
                              : 'N/A'}
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

        {/* OWNER ROLE - Dashboard */}
        {userData.role === 'owner' && (
          <>
            {/* Stats */}
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

            {/* My Hostels */}
            <Row className="mb-5">
              <Col>
                <h4 className="fw-bold text-primary mb-4">
                  <i className="bi bi-building me-2"></i> My Hostels ({ownedHostels?.length || 0})
                </h4>

                {(ownedHostels ?? []).length === 0 ? (
                  <Card className="text-center p-5 bg-white shadow-sm">
                    <i className="bi bi-inbox fs-1 text-muted mb-3"></i>
                    <p className="text-muted fs-5">You haven't published any hostels yet!</p>
                    <Button
                      variant="success"
                      onClick={() => navigate('/owner-dashboard')}
                      className="rounded-pill px-5 mt-3"
                    >
                      <i className="bi bi-plus-circle me-2"></i> Add Your First Hostel
                    </Button>
                  </Card>
                ) : (
                  <Row className="g-4">
                    {(ownedHostels ?? []).map((hostel) => (
                      <Col md={6} lg={4} key={hostel?._id || Math.random()}>
                        <Card className="shadow-sm border-0 h-100 hover-lift">
                          <Card.Img
                            variant="top"
                            src={
                              hostel?.images?.[0]
                                ? `https://localhostel.onrender.com${hostel.images[0]}`
                                : 'https://via.placeholder.com/400x250?text=Hostel'
                            }
                            style={{ height: '200px', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/400x250?text=Image+Not+Found';
                            }}
                          />
                          <Card.Body>
                            <Card.Title className="fw-bold">{hostel?.name || 'Unnamed Hostel'}</Card.Title>
                            <p className="text-muted mb-2">
                              <i className="bi bi-geo-alt me-2"></i>
                              {hostel?.location || 'Location not set'}
                            </p>
                            <p className="text-muted mb-2">
                              <i className="bi bi-people me-2"></i>
                              {hostel?.availableSeats ?? 0} seats available
                            </p>
                            <p className="text-muted mb-3">
                              <i className="bi bi-currency-rupee me-2"></i>₹
                              {hostel?.price?.toLocaleString() || 0}/seat
                            </p>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              as={Link}
                              to={`/hostel/${hostel?._id}`}
                              className="w-100 rounded-pill"
                            >
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

            <div className="text-center mt-5">
              <Button
                href="/owner-dashboard"
                size="lg"
                variant="success"
                className="rounded-pill px-5 py-3 fw-bold shadow-lg"
              >
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