// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, ListGroup, Form, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function Profile({ userRole = 'user', isLoggedIn = true, triggerToast }) {
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState([]);

  // Load real bookings from localStorage (made in HostelDetails)
  useEffect(() => {
    if (isLoggedIn && userRole === 'user') {
      const savedBookings = localStorage.getItem('mockUserBookings');
      if (savedBookings) {
        setBookings(JSON.parse(savedBookings));
      }
    }
  }, [isLoggedIn, userRole]);

  // Mock user data
  const [studentData, setStudentData] = useState({
    name: "Rahul Sharma",
    email: "rahul@student.com",
    phone: "+91 9876543210",
    joinedDate: "January 2025",
    savedHostels: 5,
  });

  const [ownerData, setOwnerData] = useState({
    name: "Ramesh Kumar",
    email: "ramesh@sunrisehostel.com",
    phone: "+91 9876543210",
    hostelName: "Sunrise Boys Hostel",
    totalRooms: 38,
    totalSeats: 108,
    occupiedSeats: 92,
    availableSeats: 16,
    monthlyEarnings: "₹4,85,000",
    pendingBookings: bookings.length > 0 ? bookings.filter(b => b.status !== 'Completed').length : 3,
  });

  // Show login prompt if not logged in
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

  // Validation
  const validateForm = (data, isOwner = false) => {
    if (!data.name || data.name.trim().length < 2) return "Name must be at least 2 characters.";
    if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) return "Enter a valid email address.";
    if (!data.phone || !/^\+91\d{10}$/.test(data.phone.replace(/\s/g, ''))) return "Phone must be +91 followed by 10 digits.";
    if (isOwner && (!data.hostelName || data.hostelName.trim().length < 3)) return "Hostel name is required.";
    return null;
  };

  const handleSaveStudent = () => {
    const err = validateForm(studentData);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setEditMode(false);
    triggerToast('Profile updated successfully!');
  };

  const handleSaveOwner = () => {
    const err = validateForm(ownerData, true);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setEditMode(false);
    triggerToast('Owner profile updated successfully!');
  };

  const handleInputChange = (e, data, setData) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <section className="profile-page py-5 bg-light min-vh-100">
      <Container>
        <Row className="mb-5">
          <Col>
            <h2 className="fw-bold text-primary text-center mb-4">
              <i className="bi bi-person-circle me-3"></i>
              My Profile
            </h2>
          </Col>
        </Row>

        {/* Student Profile */}
        {userRole === 'user' && (
          <>
            {/* Personal Info */}
            <Row className="mb-5">
              <Col lg={4}>
                <Card className="text-center shadow-lg border-0">
                  <Card.Body className="p-5">
                    <div className="bg-primary text-white rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center" style={{ width: '120px', height: '120px' }}>
                      <i className="bi bi-person fs-1"></i>
                    </div>
                    {!editMode ? (
                      <>
                        <h4 className="fw-bold">{studentData.name}</h4>
                        <p className="text-muted">Student</p>
                        <Badge bg="success" className="fs-6">Active Member</Badge>
                      </>
                    ) : (
                      <Form.Control
                        type="text"
                        name="name"
                        value={studentData.name}
                        onChange={(e) => handleInputChange(e, studentData, setStudentData)}
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
                    {error && <Alert variant="danger">{error}</Alert>}
                    {!editMode ? (
                      <ListGroup variant="flush">
                        <ListGroup.Item><strong>Email:</strong> {studentData.email}</ListGroup.Item>
                        <ListGroup.Item><strong>Phone:</strong> {studentData.phone}</ListGroup.Item>
                        <ListGroup.Item><strong>Member Since:</strong> {studentData.joinedDate}</ListGroup.Item>
                        <ListGroup.Item><strong>Saved Hostels:</strong> {studentData.savedHostels}</ListGroup.Item>
                      </ListGroup>
                    ) : (
                      <>
                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control type="email" name="email" value={studentData.email} onChange={(e) => handleInputChange(e, studentData, setStudentData)} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Phone</Form.Label>
                          <Form.Control type="tel" name="phone" value={studentData.phone} onChange={(e) => handleInputChange(e, studentData, setStudentData)} placeholder="+91 9876543210" />
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
                          <Button variant="primary" onClick={handleSaveStudent} className="rounded-pill px-5">
                            <i className="bi bi-check-lg me-2"></i> Save Changes
                          </Button>
                        </>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* My Bookings */}
            <Row>
              <Col>
                <h4 className="fw-bold text-primary mb-4">
                  <i className="bi bi-calendar-check me-2"></i> My Bookings ({bookings.length})
                </h4>
                {bookings.length === 0 ? (
                  <Card className="text-center p-5 bg-white shadow-sm">
                    <i className="bi bi-inbox fs-1 text-muted mb-3"></i>
                    <p className="text-muted fs-5">No bookings yet!</p>
                    <p className="text-muted">Start exploring and book your perfect hostel stay.</p>
                    <Button variant="primary" onClick={() => navigate('/hostels')} className="rounded-pill px-5 mt-3">
                      <i className="bi bi-search me-2"></i> Find Hostels
                    </Button>
                  </Card>
                ) : (
                  <Row className="g-4">
                    {bookings.map(booking => (
                      <Col md={6} lg={4} key={booking.id}>
                        <Card className="shadow-sm border-0 h-100 hover-lift">
                          <Card.Body>
                            <div className="d-flex justify-content-between mb-3">
                              <h6 className="fw-bold">{booking.hostelName}</h6>
                              <Badge bg="success">Confirmed</Badge>
                            </div>
                            <p className="text-muted mb-2">
                              <i className="bi bi-door-open me-2"></i> {booking.roomType}
                            </p>
                            <p className="text-muted mb-2">
                              <i className="bi bi-currency-rupee me-2"></i> ₹{booking.price}/month
                            </p>
                            <p className="text-muted mb-0">
                              <i className="bi bi-calendar me-2"></i> Check-in: {booking.checkIn}
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
          </>
        )}

        {/* Owner Profile */}
        {userRole === 'owner' && (
          <>
            <Row className="mb-5">
              <Col lg={4}>
                <Card className="text-center shadow-lg border-0">
                  <Card.Body className="p-5">
                    <div className="bg-success text-white rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center" style={{ width: '120px', height: '120px' }}>
                      <i className="bi bi-building fs-1"></i>
                    </div>
                    {!editMode ? (
                      <>
                        <h4 className="fw-bold">{ownerData.name}</h4>
                        <p className="text-muted">Hostel Owner</p>
                        <Badge bg="warning" className="text-dark fs-6">Verified Owner</Badge>
                      </>
                    ) : (
                      <Form.Control
                        type="text"
                        name="name"
                        value={ownerData.name}
                        onChange={(e) => handleInputChange(e, ownerData, setOwnerData)}
                        className="text-center fw-bold fs-4 border-success"
                        placeholder="Your Name"
                      />
                    )}
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={8}>
                <Card className="shadow-lg border-0 h-100">
                  <Card.Body className="p-5">
                    <h5 className="fw-bold text-success mb-4">
                      <i className="bi bi-building me-2"></i> Hostel Information
                    </h5>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {!editMode ? (
                      <ListGroup variant="flush">
                        <ListGroup.Item><strong>Hostel:</strong> {ownerData.hostelName}</ListGroup.Item>
                        <ListGroup.Item><strong>Email:</strong> {ownerData.email}</ListGroup.Item>
                        <ListGroup.Item><strong>Phone:</strong> {ownerData.phone}</ListGroup.Item>
                        <ListGroup.Item><strong>Total Seats:</strong> {ownerData.totalSeats} (Available: {ownerData.availableSeats})</ListGroup.Item>
                      </ListGroup>
                    ) : (
                      <>
                        <Form.Group className="mb-3">
                          <Form.Label>Hostel Name</Form.Label>
                          <Form.Control type="text" name="hostelName" value={ownerData.hostelName} onChange={(e) => handleInputChange(e, ownerData, setOwnerData)} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control type="email" name="email" value={ownerData.email} onChange={(e) => handleInputChange(e, ownerData, setOwnerData)} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Phone</Form.Label>
                          <Form.Control type="tel" name="phone" value={ownerData.phone} onChange={(e) => handleInputChange(e, ownerData, setOwnerData)} placeholder="+91 9876543210" />
                        </Form.Group>
                      </>
                    )}
                    <div className="text-end mt-4">
                      {!editMode ? (
                        <Button variant="outline-success" onClick={() => setEditMode(true)} className="rounded-pill px-5">
                          <i className="bi bi-pencil me-2"></i> Edit Profile
                        </Button>
                      ) : (
                        <>
                          <Button variant="secondary" onClick={() => setEditMode(false)} className="me-3 rounded-pill">Cancel</Button>
                          <Button variant="success" onClick={handleSaveOwner} className="rounded-pill px-5">
                            <i className="bi bi-check-lg me-2"></i> Save Changes
                          </Button>
                        </>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Owner Stats */}
            <Row className="g-4 mb-5">
              <Col md={4}>
                <Card className="text-center shadow-sm border-0">
                  <Card.Body>
                    <i className="bi bi-currency-rupee fs-1 text-success mb-3"></i>
                    <h6 className="text-muted">Monthly Earnings</h6>
                    <h4 className="fw-bold text-success">{ownerData.monthlyEarnings}</h4>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="text-center shadow-sm border-0">
                  <Card.Body>
                    <i className="bi bi-person-plus fs-1 text-primary mb-3"></i>
                    <h6 className="text-muted">Occupancy Rate</h6>
                    <h4 className="fw-bold text-primary">
                      {Math.round((ownerData.occupiedSeats / ownerData.totalSeats) * 100)}%
                    </h4>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="text-center shadow-sm border-0">
                  <Card.Body>
                    <i className="bi bi-bell fs-1 text-warning mb-3"></i>
                    <h6 className="text-muted">Pending Bookings</h6>
                    <h4 className="fw-bold text-warning">{ownerData.pendingBookings}</h4>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <div className="text-center">
              <Button href="/owner-dashboard" size="lg" className="btn-success rounded-pill px-6 py-3 fw-bold shadow-lg">
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