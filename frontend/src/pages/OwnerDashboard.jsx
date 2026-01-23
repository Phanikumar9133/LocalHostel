// src/pages/OwnerDashboard.jsx
import { useState, useEffect } from 'react';
import {
  Container, Row, Col, Button, Form, Table, Badge,
  Card, Modal, Spinner, Dropdown, Alert, Tabs, Tab,
  InputGroup, ListGroup
} from 'react-bootstrap';
import api from '../services/api';
import { toast } from 'react-toastify';

function OwnerDashboard({ triggerToast }) {
  const [activeTab, setActiveTab] = useState('add');
  const [loading, setLoading] = useState(true);
  const [publishLoading, setPublishLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Data states
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Add hostel form states
  const [newHostel, setNewHostel] = useState({
    name: '',
    location: '',
    type: 'Boys Hostel',
    price: '',
    facilities: [],
    images: []
  });

  const [roomTypesInput, setRoomTypesInput] = useState({
    single: { count: '', price: '' },
    double: { count: '', price: '' },
    triple: { count: '', price: '' },
    five: { count: '', price: '' }
  });

  // Edit hostel states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editHostel, setEditHostel] = useState(null);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteHostelId, setDeleteHostelId] = useState(null);

  // Facilities list
  const facilitiesOptions = [
    'Free WiFi', 'Food', 'Laundry', 'Power Backup',
    '24/7 Security', 'AC Rooms', 'CCTV', 'Housekeeping',
    'Parking', 'Study Room', 'Washing Machine', 'Gym',
    'Elevator', 'Hot Water', 'RO Water', 'TV Room'
  ];

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role !== 'owner') {
          toast.error('Only hostel owners can access this dashboard');
          return;
        }

        // Get owner's hostels
        const hostelsRes = await api.get('/hostels');
        const myHostels = hostelsRes.data.filter(h => h.owner?._id === user._id);
        setHostels(myHostels);

        // Get all bookings for owner
        const bookingsRes = await api.get('/bookings/owner');
        setBookings(bookingsRes.data || []);

        // Select first hostel if exists
        if (myHostels.length > 0) {
          const first = myHostels[0];
          setSelectedHostel(first);
          setRooms(first.rooms || []);
          await loadReviews(first._id);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const loadReviews = async (hostelId) => {
    try {
      const res = await api.get(`/reviews/${hostelId}`);
      setReviews(res.data || []);
    } catch (err) {
      console.error('Reviews fetch failed', err);
    }
  };

  // When selecting different hostel
  const handleSelectHostel = async (hostel) => {
    setSelectedHostel(hostel);
    setRooms(hostel.rooms || []);
    await loadReviews(hostel._id);
  };

  // Aggregated room stats for selected hostel
  const aggregatedRooms = {};
  rooms.forEach(room => {
    const type = room.type;
    if (!aggregatedRooms[type]) {
      aggregatedRooms[type] = {
        type,
        count: 0,
        totalSeats: 0,
        occupied: 0,
        available: 0,
        price: room.price
      };
    }
    aggregatedRooms[type].count += 1;
    aggregatedRooms[type].totalSeats += room.totalSeats || 0;
    aggregatedRooms[type].occupied += room.occupied || 0;
    aggregatedRooms[type].available += (room.totalSeats || 0) - (room.occupied || 0);
  });

  const totalSeats = Object.values(aggregatedRooms).reduce((sum, r) => sum + r.totalSeats, 0);
  const totalOccupied = Object.values(aggregatedRooms).reduce((sum, r) => sum + r.occupied, 0);
  const totalAvailable = totalSeats - totalOccupied;
  const pendingBookingsCount = bookings.filter(b => b.status === 'Pending').length;

  // Add new hostel
  const handlePublishHostel = async (e) => {
    e.preventDefault();
    setPublishLoading(true);

    // Validate basic fields
    if (!newHostel.name.trim() || !newHostel.location.trim() || !newHostel.price) {
      toast.error('Please fill all required fields');
      setPublishLoading(false);
      return;
    }

    // Build rooms array from input
    const roomsArray = [];
    const seatsMap = { single: 1, double: 2, triple: 3, five: 5 };
    const typeMap = { single: 'Single', double: '2-Sharing', triple: '3-Sharing', five: '5-Sharing' };

    Object.entries(roomTypesInput).forEach(([key, { count, price }]) => {
      const numRooms = parseInt(count) || 0;
      const pricePerSeat = parseInt(price) || 0;

      if (numRooms > 0 && pricePerSeat > 0) {
        const seatsPerRoom = seatsMap[key];
        const totalSeats = numRooms * seatsPerRoom;

        roomsArray.push({
          type: typeMap[key],
          totalSeats,
          occupied: 0,
          price: pricePerSeat
        });
      }
    });

    if (roomsArray.length === 0) {
      toast.error('Please add at least one room type with valid count and price');
      setPublishLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('name', newHostel.name.trim());
    formData.append('location', newHostel.location.trim());
    formData.append('type', newHostel.type);
    formData.append('price', newHostel.price);
    formData.append('facilities', JSON.stringify(newHostel.facilities));
    formData.append('rooms', JSON.stringify(roomsArray));

    newHostel.images.forEach(file => {
      formData.append('images', file);
    });

    try {
      const res = await api.post('/hostels', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Hostel published successfully!');
      setHostels(prev => [...prev, res.data]);
      setSelectedHostel(res.data);
      setRooms(res.data.rooms || []);

      // Reset form
      setNewHostel({ name: '', location: '', type: 'Boys Hostel', price: '', facilities: [], images: [] });
      setRoomTypesInput({
        single: { count: '', price: '' },
        double: { count: '', price: '' },
        triple: { count: '', price: '' },
        five: { count: '', price: '' }
      });

      setActiveTab('manage');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish hostel');
    } finally {
      setPublishLoading(false);
    }
  };

  // Update occupied seats for a room type
  const updateOccupiedSeats = async (roomType, newOccupied) => {
    const agg = aggregatedRooms[roomType];
    if (!agg) return;

    const maxPossible = agg.totalSeats;
    if (newOccupied < 0 || newOccupied > maxPossible) {
      toast.error(`Occupied seats must be between 0 and ${maxPossible}`);
      return;
    }

    setActionLoading(true);

    try {
      // Create updated rooms array
      const updatedRooms = rooms.map(room => {
        if (room.type === roomType) {
          return { ...room, occupied: newOccupied };
        }
        return room;
      });

      const res = await api.put(`/hostels/${selectedHostel._id}`, { rooms: updatedRooms });

      // Update local state
      setRooms(updatedRooms);
      setSelectedHostel(prev => ({
        ...prev,
        rooms: updatedRooms,
        availableSeats: res.data.availableSeats || prev.availableSeats
      }));

      toast.success('Occupied seats updated');
    } catch (err) {
      toast.error('Failed to update seats');
    } finally {
      setActionLoading(false);
    }
  };

  // Accept / Reject booking
 const handleBookingAction = async (bookingId, newStatus) => {
  if (!window.confirm(`Are you sure you want to ${newStatus.toLowerCase()} this booking?`)) {
    return;
  }

  try {
    // Explicitly create payload object
    const payload = { status: newStatus };

    console.log('Sending to:', `/bookings/${bookingId}/status`, payload); // Debug log

    const response = await api.put(`/bookings/${bookingId}/status`, payload);

    console.log('Response:', response.data); // Debug log

    toast.success(`Booking ${newStatus.toLowerCase()} successfully!`);

    // Update UI
    setBookings(prev =>
      prev.map(b => (b._id === bookingId ? { ...b, status: newStatus } : b))
    );
  } catch (err) {
    console.error('Booking action error:', err);
    const errorMsg = err.response?.data?.message || 'Failed to update booking status';
    toast.error(errorMsg);
  }
};

  const toggleFacility = (facility, isEdit = false) => {
    const setter = isEdit ? setEditHostel : setNewHostel;
    setter(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }));
  };

  const handleImageChange = (e, isEdit = false) => {
    const setter = isEdit ? setEditHostel : setNewHostel;
    setter(prev => ({
      ...prev,
      images: Array.from(e.target.files)
    }));
  };

  // Delete hostel
  const confirmDeleteHostel = async () => {
    try {
      await api.delete(`/hostels/${deleteHostelId}`);
      toast.success('Hostel deleted successfully');
      setHostels(prev => prev.filter(h => h._id !== deleteHostelId));
      setSelectedHostel(hostels[0] || null);
      setShowDeleteModal(false);
    } catch (err) {
      toast.error('Failed to delete hostel');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" variant="primary" />
        <h4 className="ms-4">Loading your dashboard...</h4>
      </div>
    );
  }

  return (
    <section className="owner-dashboard py-5 bg-light min-vh-100">
      <Container fluid>
        <Row>
          {/* Left Sidebar */}
          <Col lg={3} md={4} className="mb-5">
            <Card className="shadow-lg border-0 sticky-top" style={{ top: '20px' }}>
              <Card.Body className="p-4">
                <div className="text-center mb-5">
                  <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '90px', height: '90px' }}>
                    <i className="bi bi-building fs-1"></i>
                  </div>
                  <h4 className="fw-bold text-primary">Hostel Owner Panel</h4>
                  <p className="text-muted small">Managing {hostels.length} hostel{hostels.length !== 1 ? 's' : ''}</p>
                </div>

                <Dropdown className="mb-4">
                  <Dropdown.Toggle variant="outline-primary" className="w-100 text-start py-3">
                    {selectedHostel ? selectedHostel.name : 'Select Hostel to Manage'}
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="w-100">
                    {hostels.map(h => (
                      <Dropdown.Item key={h._id} onClick={() => handleSelectHostel(h)}>
                        {h.name} • {h.availableSeats || 0} seats left
                      </Dropdown.Item>
                    ))}
                    {hostels.length === 0 && <Dropdown.Item disabled>No hostels yet</Dropdown.Item>}
                  </Dropdown.Menu>
                </Dropdown>

                <div className="d-grid gap-3">
                  {[
                    { key: 'add', icon: 'bi-plus-circle', label: 'Add New Hostel', variant: 'outline-success' },
                    { key: 'manage', icon: 'bi-grid-3x3-gap', label: 'Manage Seats & Rooms', variant: 'outline-primary' },
                    { key: 'bookings', icon: 'bi-calendar-check', label: `Bookings (${pendingBookingsCount} pending)`, variant: 'outline-warning' },
                    { key: 'reviews', icon: 'bi-star', label: `Reviews (${reviews.length})`, variant: 'outline-info' }
                  ].map(item => (
                    <Button
                      key={item.key}
                      variant={item.variant}
                      className="d-flex align-items-center justify-content-start py-3 rounded-pill fw-medium"
                      onClick={() => setActiveTab(item.key)}
                      active={activeTab === item.key}
                    >
                      <i className={`bi ${item.icon} fs-4 me-3`}></i>
                      {item.label}
                    </Button>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Main Content Area */}
          <Col lg={9} md={8}>
            <Card className="shadow-lg border-0">
              <Card.Body className="p-5">
                {/* Header with title & actions */}
                <div className="d-flex justify-content-between align-items-center mb-5 pb-3 border-bottom">
                  <h3 className="fw-bold text-primary mb-0">
                    {activeTab === 'add' && 'Add New Hostel'}
                    {activeTab === 'manage' && 'Seat & Room Management'}
                    {activeTab === 'bookings' && 'Booking Requests'}
                    {activeTab === 'reviews' && 'Student Reviews'}
                  </h3>

                  {selectedHostel && activeTab !== 'add' && (
                    <div className="d-flex gap-3">
                      <Button
                        variant="outline-primary"
                        onClick={() => {
                          setEditHostel({ ...selectedHostel, images: [] });
                          setShowEditModal(true);
                        }}
                      >
                        <i className="bi bi-pencil me-2"></i> Edit Hostel
                      </Button>
                      <Button
                        variant="outline-danger"
                        onClick={() => {
                          setDeleteHostelId(selectedHostel._id);
                          setShowDeleteModal(true);
                        }}
                      >
                        <i className="bi bi-trash me-2"></i> Delete Hostel
                      </Button>
                    </div>
                  )}
                </div>

                {/* Add New Hostel Tab */}
                {activeTab === 'add' && (
                  <Form onSubmit={handlePublishHostel}>
                    <Row className="g-4 mb-5">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-bold">Hostel Name</Form.Label>
                          <Form.Control
                            placeholder="Enter hostel name"
                            value={newHostel.name}
                            onChange={e => setNewHostel({ ...newHostel, name: e.target.value })}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-bold">Location</Form.Label>
                          <Form.Control
                            placeholder="City / Area"
                            value={newHostel.location}
                            onChange={e => setNewHostel({ ...newHostel, location: e.target.value })}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-bold">Hostel Type</Form.Label>
                          <Form.Select
                            value={newHostel.type}
                            onChange={e => setNewHostel({ ...newHostel, type: e.target.value })}
                          >
                            <option>Boys Hostel</option>
                            <option>Girls Hostel</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-bold">Price per Seat (₹/month)</Form.Label>
                          <Form.Control
                            type="number"
                            placeholder="e.g. 5500"
                            value={newHostel.price}
                            onChange={e => setNewHostel({ ...newHostel, price: e.target.value })}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Facilities */}
                    <Form.Group className="mb-5">
                      <Form.Label className="fw-bold">Available Facilities</Form.Label>
                      <Row className="g-3">
                        {facilitiesOptions.map(facility => (
                          <Col md={4} key={facility}>
                            <Form.Check
                              type="checkbox"
                              id={`facility-${facility}`}
                              label={facility}
                              checked={newHostel.facilities.includes(facility)}
                              onChange={() => toggleFacility(facility)}
                            />
                          </Col>
                        ))}
                      </Row>
                    </Form.Group>

                    {/* Room Types Input */}
                    <Form.Group className="mb-5">
                      <h5 className="fw-bold mb-4 text-primary">Room Types & Pricing</h5>
                      <Row className="g-4">
                        {[
                          { key: 'single', label: 'Single Room', seats: 1 },
                          { key: 'double', label: '2-Sharing (Double)', seats: 2 },
                          { key: 'triple', label: '3-Sharing', seats: 3 },
                          { key: 'five', label: '5-Sharing', seats: 5 }
                        ].map(item => (
                          <Col md={6} key={item.key}>
                            <Card className="border-primary">
                              <Card.Body>
                                <Card.Title className="text-primary">{item.label}</Card.Title>
                                <Row className="g-3 mt-2">
                                  <Col xs={6}>
                                    <Form.Control
                                      type="number"
                                      placeholder="Number of Rooms"
                                      value={roomTypesInput[item.key].count}
                                      onChange={e => setRoomTypesInput({
                                        ...roomTypesInput,
                                        [item.key]: { ...roomTypesInput[item.key], count: e.target.value }
                                      })}
                                      min="0"
                                    />
                                  </Col>
                                  <Col xs={6}>
                                    <Form.Control
                                      type="number"
                                      placeholder="Price / Seat"
                                      value={roomTypesInput[item.key].price}
                                      onChange={e => setRoomTypesInput({
                                        ...roomTypesInput,
                                        [item.key]: { ...roomTypesInput[item.key], price: e.target.value }
                                      })}
                                      min="0"
                                    />
                                  </Col>
                                </Row>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </Form.Group>

                    {/* Image Upload */}
                    <Form.Group className="mb-5">
                      <Form.Label className="fw-bold">Upload Hostel Images (max 6)</Form.Label>
                      <Form.Control
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={e => handleImageChange(e)}
                      />
                      <Form.Text className="text-muted">
                        Recommended size: 1200×800 pixels or larger
                      </Form.Text>
                    </Form.Group>

                    <Button
                      type="submit"
                      size="lg"
                      variant="success"
                      className="w-100 rounded-pill fw-bold py-3"
                      disabled={publishLoading}
                    >
                      {publishLoading ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Publishing Hostel...
                        </>
                      ) : (
                        'Publish Hostel'
                      )}
                    </Button>
                  </Form>
                )}

                {/* Seat Management Tab */}
                {activeTab === 'manage' && selectedHostel && (
                  <div>
                    <Row className="g-4 mb-5">
                      <Col md={3}>
                        <Card className="text-center border-primary">
                          <Card.Body>
                            <h6 className="text-muted">Total Seats</h6>
                            <h3 className="fw-bold text-primary">{totalSeats}</h3>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={3}>
                        <Card className="text-center border-success">
                          <Card.Body>
                            <h6 className="text-muted">Available Seats</h6>
                            <h3 className="fw-bold text-success">{totalAvailable}</h3>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={3}>
                        <Card className="text-center border-warning">
                          <Card.Body>
                            <h6 className="text-muted">Occupied Seats</h6>
                            <h3 className="fw-bold text-warning">{totalOccupied}</h3>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={3}>
                        <Card className="text-center border-info">
                          <Card.Body>
                            <h6 className="text-muted">Occupancy Rate</h6>
                            <h3 className="fw-bold text-info">
                              {totalSeats > 0 ? Math.round((totalOccupied / totalSeats) * 100) : 0}%
                            </h3>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>

                    <h5 className="fw-bold text-primary mb-4">Room Type Overview</h5>
                    <Table striped bordered hover responsive className="mb-5">
                      <thead className="table-dark">
                        <tr>
                          <th>Room Type</th>
                          <th>Rooms</th>
                          <th>Total Seats</th>
                          <th>Occupied</th>
                          <th>Available</th>
                          <th>Price / Seat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.values(aggregatedRooms).length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center py-4">No rooms configured yet</td>
                          </tr>
                        ) : (
                          Object.values(aggregatedRooms).map((agg, idx) => (
                            <tr key={idx}>
                              <td className="fw-medium">{agg.type}</td>
                              <td>{agg.count}</td>
                              <td>{agg.totalSeats}</td>
                              <td>{agg.occupied}</td>
                              <td className={agg.available > 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                                {agg.available}
                              </td>
                              <td>₹{agg.price?.toLocaleString() || '—'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>

                    <Alert variant="info" className="mb-5">
                      <strong>Note:</strong> You can update occupied count per room type below.
                    </Alert>

                    {/* Occupied Seats Controls */}
                    <h5 className="fw-bold text-primary mb-4">Update Occupied Seats</h5>
                    <Row className="g-4">
                      {Object.keys(aggregatedRooms).map(type => {
                        const agg = aggregatedRooms[type];
                        return (
                          <Col md={6} key={type}>
                            <Card className="border-primary">
                              <Card.Body>
                                <Card.Title>{type}</Card.Title>
                                <InputGroup className="mb-3">
                                  <InputGroup.Text>Occupied Seats</InputGroup.Text>
                                  <Form.Control
                                    type="number"
                                    min="0"
                                    max={agg.totalSeats}
                                    value={agg.occupied}
                                    onChange={e => {
                                      const val = parseInt(e.target.value) || 0;
                                      updateOccupiedSeats(type, val);
                                    }}
                                  />
                                  <InputGroup.Text>/ {agg.totalSeats}</InputGroup.Text>
                                </InputGroup>
                                <small className="text-muted">
                                  Available: {agg.available} seats
                                </small>
                              </Card.Body>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                  </div>
                )}

                {/* Bookings Tab */}
                {activeTab === 'bookings' && (
                  <div>
                    <h5 className="fw-bold text-primary mb-4">
                      All Booking Requests ({bookings.length})
                      {pendingBookingsCount > 0 && (
                        <Badge bg="warning" className="ms-3 fs-6">
                          {pendingBookingsCount} Pending
                        </Badge>
                      )}
                    </h5>

                    {bookings.length === 0 ? (
                      <Alert variant="info" className="text-center p-5">
                        No booking requests received yet.
                      </Alert>
                    ) : (
                      <Table responsive hover bordered className="shadow-sm">
                        <thead className="table-dark">
                          <tr>
                            <th>Student</th>
                            <th>Hostel</th>
                            <th>Room Type</th>
                            <th>Check-in Date</th>
                            <th>Price</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.map(b => (
                            <tr key={b._id}>
                              <td>{b.user?.name || 'Anonymous'}</td>
                              <td>{b.hostel?.name || '—'}</td>
                              <td>{b.roomType}</td>
                              <td>{new Date(b.checkInDate).toLocaleDateString()}</td>
                              <td>₹{b.price?.toLocaleString() || '—'}</td>
                              <td>
                                <Badge
                                  bg={
                                    b.status === 'Confirmed' ? 'success' :
                                    b.status === 'Rejected' ? 'danger' :
                                    b.status === 'Pending' ? 'warning' : 'secondary'
                                  }
                                  className="fs-6 px-3 py-2"
                                >
                                  {b.status}
                                </Badge>
                              </td>
                              <td>
                                {b.status === 'Pending' && (
                                  <div className="d-flex gap-2">
                                    <Button
                                      variant="success"
                                      size="sm"
                                      onClick={() => handleBookingAction(b._id, 'Confirmed')}
                                      disabled={actionLoading}
                                    >
                                      <i className="bi bi-check-lg me-1"></i>Approve
                                    </Button>
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      onClick={() => handleBookingAction(b._id, 'Rejected')}
                                      disabled={actionLoading}
                                    >
                                      <i className="bi bi-x-lg me-1"></i>Reject
                                    </Button>
                                  </div>
                                )}

                                {b.status !== 'Pending' && (
                                  <span className="text-muted small fst-italic">Processed</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                  <div>
                    <h5 className="fw-bold text-primary mb-4">
                      Reviews & Ratings ({reviews.length})
                    </h5>

                    {reviews.length === 0 ? (
                      <Alert variant="info" className="text-center p-5">
                        No reviews received yet.
                      </Alert>
                    ) : (
                      <Row className="g-4">
                        {reviews.map(r => (
                          <Col md={6} key={r._id}>
                            <Card className="shadow-sm h-100">
                              <Card.Body>
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                  <div>
                                    <h6 className="fw-bold mb-1">{r.user?.name || 'Anonymous Student'}</h6>
                                    <div className="text-warning">
                                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                                    </div>
                                  </div>
                                  <small className="text-muted">
                                    {new Date(r.createdAt).toLocaleDateString()}
                                  </small>
                                </div>
                                <p className="mb-0">{r.comment || 'No comment provided'}</p>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">Delete Hostel</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete <strong>{selectedHostel?.name}</strong>?<br />
          <small className="text-muted">This action cannot be undone.</small>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDeleteHostel}>
            Yes, Delete Hostel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Hostel Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Hostel Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editHostel && (
            <Form>
              <Row className="g-3 mb-4">
                <Col md={6}>
                  <Form.Label className="fw-bold">Hostel Name</Form.Label>
                  <Form.Control
                    value={editHostel.name}
                    onChange={e => setEditHostel({ ...editHostel, name: e.target.value })}
                  />
                </Col>
                <Col md={6}>
                  <Form.Label className="fw-bold">Location</Form.Label>
                  <Form.Control
                    value={editHostel.location}
                    onChange={e => setEditHostel({ ...editHostel, location: e.target.value })}
                  />
                </Col>
              </Row>

              <Row className="g-3 mb-4">
                <Col md={6}>
                  <Form.Label className="fw-bold">Hostel Type</Form.Label>
                  <Form.Select
                    value={editHostel.type}
                    onChange={e => setEditHostel({ ...editHostel, type: e.target.value })}
                  >
                    <option>Boys Hostel</option>
                    <option>Girls Hostel</option>
                  </Form.Select>
                </Col>
                <Col md={6}>
                  <Form.Label className="fw-bold">Price per Seat (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    value={editHostel.price}
                    onChange={e => setEditHostel({ ...editHostel, price: e.target.value })}
                  />
                </Col>
              </Row>

              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Facilities</Form.Label>
                <Row className="g-3">
                  {facilitiesOptions.map(f => (
                    <Col md={4} key={f}>
                      <Form.Check
                        type="checkbox"
                        label={f}
                        checked={editHostel.facilities.includes(f)}
                        onChange={() => toggleFacility(f, true)}
                      />
                    </Col>
                  ))}
                </Row>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Add More Images (optional)</Form.Label>
                <Form.Control
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={e => handleImageChange(e, true)}
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              setPublishLoading(true);
              try {
                const formData = new FormData();
                formData.append('name', editHostel.name);
                formData.append('location', editHostel.location);
                formData.append('type', editHostel.type);
                formData.append('price', editHostel.price);
                formData.append('facilities', JSON.stringify(editHostel.facilities));
                editHostel.images.forEach(file => formData.append('images', file));

                const res = await api.put(`/hostels/${editHostel._id}`, formData, {
                  headers: { 'Content-Type': 'multipart/form-data' }
                });

                toast.success('Hostel updated successfully');
                setHostels(prev => prev.map(h => h._id === res.data._id ? res.data : h));
                setSelectedHostel(res.data);
                setRooms(res.data.rooms || []);
                setShowEditModal(false);
              } catch (err) {
                toast.error('Failed to update hostel');
              } finally {
                setPublishLoading(false);
              }
            }}
            disabled={publishLoading}
          >
            {publishLoading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}

export default OwnerDashboard;