// src/pages/OwnerDashboard.jsx - Complete Enhanced Version
import { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Button,
  Form,
  Table,
  Badge,
  Card,
  Modal,
  Spinner,
  Dropdown,
  Alert,
  InputGroup,
  ListGroup,
  FormCheck,
  FormLabel,
  FormGroup,
} from 'react-bootstrap';
import api from '../services/api';
import { toast } from 'react-toastify';

function OwnerDashboard({ triggerToast }) {
  // ─────────────────────────────────────────────────────────────────────────
  // State Management - All States Properly Initialized
  // ─────────────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('add'); // Default tab
  const [loading, setLoading] = useState(true);
  const [publishLoading, setPublishLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Core Data States (always initialized as arrays/objects)
  const [hostels, setHostels] = useState([]); // All owned hostels
  const [selectedHostel, setSelectedHostel] = useState(null); // Currently selected hostel
  const [rooms, setRooms] = useState([]); // Rooms of selected hostel
  const [bookings, setBookings] = useState([]); // All bookings for owner
  const [reviews, setReviews] = useState([]); // Reviews for selected hostel

  // Add New Hostel Form States
  const [newHostel, setNewHostel] = useState({
    name: '',
    location: '',
    type: 'Boys Hostel',
    price: '',
    facilities: [],
    images: [],
  });

  const [roomTypesInput, setRoomTypesInput] = useState({
    single: { count: '', price: '' },
    double: { count: '', price: '' },
    triple: { count: '', price: '' },
    five: { count: '', price: '' },
  });

  // Edit Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editHostel, setEditHostel] = useState(null);

  // Delete Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteHostelId, setDeleteHostelId] = useState(null);

  // Facilities Options
  const facilitiesOptions = [
    'Free WiFi', 'Food', 'Laundry', 'Power Backup',
    '24/7 Security', 'AC Rooms', 'CCTV', 'Housekeeping',
    'Parking', 'Study Room', 'Washing Machine', 'Gym',
    'Elevator', 'Hot Water', 'RO Water', 'TV Room',
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // Load All Dashboard Data
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchOwnerData = async () => {
      try {
        setLoading(true);

        // Get logged-in user
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role !== 'owner' || !user._id) {
          toast.error('Only hostel owners can access this dashboard');
          return;
        }

        // 1. Fetch all hostels and filter owned ones
        const hostelsRes = await api.get('/hostels/my-hostels');
        const ownedHostels = Array.isArray(hostelsRes.data)
          ? hostelsRes.data.filter((h) => h?.owner?._id === user._id)
          : [];
        setHostels(ownedHostels);

        // 2. Fetch all bookings for this owner
        const bookingsRes = await api.get('/bookings/owner');
        const bookingsData = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];
        setBookings(bookingsData);

        // 3. Auto-select first hostel if any exist
        if (ownedHostels.length > 0) {
          const firstHostel = ownedHostels[0];
          setSelectedHostel(firstHostel);
          setRooms(Array.isArray(firstHostel.rooms) ? firstHostel.rooms : []);

          // Load reviews for first hostel
          try {
            const reviewsRes = await api.get(`/reviews/${firstHostel._id}`);
            setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : []);
          } catch (reviewErr) {
            console.warn('Failed to load initial reviews:', reviewErr);
            setReviews([]);
          }
        }
      } catch (err) {
        console.error('Dashboard data fetch failed:', err);
        toast.error('Failed to load dashboard. Please refresh.');
      } finally {
        setLoading(false);
      }
    };

    fetchOwnerData();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Handle Hostel Selection from Dropdown
  // ─────────────────────────────────────────────────────────────────────────
  const handleSelectHostel = async (hostel) => {
    if (!hostel?._id) return;

    setSelectedHostel(hostel);
    setRooms(Array.isArray(hostel.rooms) ? hostel.rooms : []);

    // Load reviews for the selected hostel
    try {
      const res = await api.get(`/reviews/${hostel._id}`);
      setReviews(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn('Failed to load reviews for hostel:', hostel._id, err);
      setReviews([]);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Calculate Aggregated Room Statistics
  // ─────────────────────────────────────────────────────────────────────────
  const aggregatedRooms = rooms.reduce((acc, room) => {
    const type = room?.type || 'Unknown';
    if (!acc[type]) {
      acc[type] = {
        type,
        count: 0,
        totalSeats: 0,
        occupied: 0,
        available: 0,
        price: room?.price || 0,
      };
    }
    acc[type].count += 1;
    acc[type].totalSeats += Number(room?.totalSeats || 0);
    acc[type].occupied += Number(room?.occupied || 0);
    acc[type].available += Number(room?.totalSeats || 0) - Number(room?.occupied || 0);
    return acc;
  }, {});

  const seatStats = {
    totalRooms: rooms.length,
    totalSeats: 0,
    occupied: 0,
    available: 0,
  };

  Object.values(aggregatedRooms).forEach((agg) => {
    seatStats.totalSeats += agg.totalSeats;
    seatStats.occupied += agg.occupied;
    seatStats.available += agg.available;
  });

  const pendingBookingsCount = Array.isArray(bookings)
    ? bookings.filter((b) => b?.status === 'Pending').length
    : 0;

  // ─────────────────────────────────────────────────────────────────────────
  // Publish New Hostel
  // ─────────────────────────────────────────────────────────────────────────
  const handlePublishHostel = async (e) => {
    e.preventDefault();
    setPublishLoading(true);

    if (!newHostel.name.trim() || !newHostel.location.trim() || !newHostel.price) {
      toast.error('Name, location, and price are required');
      setPublishLoading(false);
      return;
    }

    const roomsArray = [];
    const seatsMap = { single: 1, double: 2, triple: 3, five: 5 };
    const typeMap = { single: 'Single', double: '2-Sharing', triple: '3-Sharing', five: '5-Sharing' };

    Object.entries(roomTypesInput).forEach(([key, { count, price }]) => {
      const numRooms = parseInt(count) || 0;
      const pricePerSeat = parseInt(price) || 0;
      if (numRooms > 0 && pricePerSeat > 0) {
        roomsArray.push({
          type: typeMap[key],
          totalSeats: numRooms * seatsMap[key],
          occupied: 0,
          price: pricePerSeat,
        });
      }
    });

    if (roomsArray.length === 0) {
      toast.error('Please add at least one valid room type');
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

    newHostel.images.forEach((file) => formData.append('images', file));

    try {
      const res = await api.post('/hostels', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Hostel published successfully!');
      setHostels((prev) => [...prev, res.data]);
      setSelectedHostel(res.data);
      setRooms(Array.isArray(res.data.rooms) ? res.data.rooms : []);

      // Reset form
      setNewHostel({
        name: '',
        location: '',
        type: 'Boys Hostel',
        price: '',
        facilities: [],
        images: [],
      });
      setRoomTypesInput({
        single: { count: '', price: '' },
        double: { count: '', price: '' },
        triple: { count: '', price: '' },
        five: { count: '', price: '' },
      });

      setActiveTab('manage');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish hostel');
      console.error('Publish hostel error:', err);
    } finally {
      setPublishLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Update Occupied Seats for Room Type
  // ─────────────────────────────────────────────────────────────────────────
  const handleOccupiedChange = async (roomType, newValue) => {
    const newOccupied = Number(newValue);
    if (isNaN(newOccupied) || newOccupied < 0) {
      toast.warning('Invalid occupied count');
      return;
    }

    const agg = aggregatedRooms[roomType];
    if (!agg || newOccupied > agg.totalSeats) {
      toast.warning(`Occupied cannot exceed ${agg?.totalSeats || 0}`);
      return;
    }

    setActionLoading(true);

    try {
      const updatedRooms = rooms.map((room) =>
        room.type === roomType ? { ...room, occupied: newOccupied } : room
      );

      const res = await api.put(`/hostels/${selectedHostel._id}`, { rooms: updatedRooms });

      setRooms(updatedRooms);
      setSelectedHostel((prev) => ({
        ...prev,
        rooms: updatedRooms,
        availableSeats: res.data?.availableSeats ?? prev.availableSeats ?? 0,
      }));

      toast.success('Occupied seats updated successfully');
    } catch (err) {
      toast.error('Failed to update seats');
      console.error('Occupied update error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Accept/Reject Booking Action
  // ─────────────────────────────────────────────────────────────────────────
  const handleBookingAction = async (bookingId, newStatus) => {
    if (!bookingId) return toast.warning('Invalid booking');

    if (!window.confirm(`Are you sure you want to ${newStatus.toLowerCase()} this booking?`)) {
      return;
    }

    setActionLoading(true);

    try {
      const payload = { status: newStatus };
      await api.put(`/bookings/${bookingId}/status`, payload);

      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, status: newStatus } : b))
      );

      toast.success(`Booking ${newStatus.toLowerCase()} successfully!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update booking status');
      console.error('Booking action error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Toggle Facility Checkbox
  // ─────────────────────────────────────────────────────────────────────────
  const toggleFacility = (facility, isEdit = false) => {
    const setter = isEdit ? setEditHostel : setNewHostel;
    setter((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter((f) => f !== facility)
        : [...prev.facilities, facility],
    }));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Handle Image Upload
  // ─────────────────────────────────────────────────────────────────────────
  const handleImageChange = (e, isEdit = false) => {
    const files = Array.from(e.target.files);
    if (files.length > 6) {
      toast.warning('Maximum 6 images allowed');
      return;
    }
    const setter = isEdit ? setEditHostel : setNewHostel;
    setter((prev) => ({
      ...prev,
      images: files,
    }));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Delete Hostel Confirmation
  // ─────────────────────────────────────────────────────────────────────────
  const confirmDeleteHostel = async () => {
    if (!deleteHostelId) return;

    try {
      await api.delete(`/hostels/${deleteHostelId}`);
      toast.success('Hostel deleted successfully');
      setHostels((prev) => prev.filter((h) => h._id !== deleteHostelId));
      setSelectedHostel(hostels[0] || null);
      setShowDeleteModal(false);
    } catch (err) {
      toast.error('Failed to delete hostel');
      console.error('Delete hostel error:', err);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Edit Hostel Modal Logic
  // ─────────────────────────────────────────────────────────────────────────
  const handleEditHostel = async () => {
    setPublishLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', editHostel.name.trim());
      formData.append('location', editHostel.location.trim());
      formData.append('type', editHostel.type);
      formData.append('price', editHostel.price);
      formData.append('facilities', JSON.stringify(editHostel.facilities));
      editHostel.images.forEach((file) => formData.append('images', file));

      const res = await api.put(`/hostels/${editHostel._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Hostel updated successfully');
      setHostels((prev) => prev.map((h) => (h._id === res.data._id ? res.data : h)));
      setSelectedHostel(res.data);
      setRooms(Array.isArray(res.data.rooms) ? res.data.rooms : []);
      setShowEditModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update hostel');
    } finally {
      setPublishLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <section className="py-5 min-vh-100 d-flex align-items-center justify-content-center">
        <Spinner animation="border" variant="primary" />
        <h4 className="ms-3">Loading your dashboard...</h4>
      </section>
    );
  }

  return (
    <section className="owner-dashboard py-5 bg-light min-vh-100">
      <Container fluid>
        <Row>
          {/* ─── Sidebar ────────────────────────────────────────────────────── */}
          <Col lg={3} md={4} className="mb-5">
            <Card className="shadow-lg border-0 sticky-top" style={{ top: '20px' }}>
              <Card.Body className="p-4">
                <div className="text-center mb-5">
                  <div
                    className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                    style={{ width: '90px', height: '90px' }}
                  >
                    <i className="bi bi-building fs-1"></i>
                  </div>
                  <h4 className="fw-bold text-primary">Owner Dashboard</h4>
                  <p className="text-muted small">
                    Managing <strong>{hostels.length}</strong> hostel{hostels.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Hostel Selector Dropdown */}
                <Dropdown className="mb-5">
                  <Dropdown.Toggle variant="outline-primary" className="w-100 text-start py-3">
                    {selectedHostel ? selectedHostel.name : 'Select a Hostel'}
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="w-100">
                    {hostels.length === 0 ? (
                      <Dropdown.Item disabled>No hostels added yet</Dropdown.Item>
                    ) : (
                      hostels.map((h) => (
                        <Dropdown.Item key={h._id} onClick={() => handleSelectHostel(h)}>
                          <div className="fw-medium">{h.name}</div>
                          <small className="text-muted d-block">
                            {h.availableSeats || 0} seats available
                          </small>
                        </Dropdown.Item>
                      ))
                    )}
                  </Dropdown.Menu>
                </Dropdown>

                {/* Tab Navigation */}
                <div className="d-grid gap-3">
                  {[
                    { key: 'add', icon: 'bi-plus-circle', label: 'Add New Hostel', variant: 'outline-success' },
                    { key: 'manage', icon: 'bi-grid-3x3-gap', label: 'Seat Management', variant: 'outline-primary' },
                    {
                      key: 'bookings',
                      icon: 'bi-calendar-check',
                      label: `Bookings (${pendingBookingsCount} pending)`,
                      variant: 'outline-warning',
                    },
                    { key: 'reviews', icon: 'bi-star-fill', label: `Reviews (${reviews.length})`, variant: 'outline-info' },
                  ].map((item) => (
                    <Button
                      key={item.key}
                      variant={activeTab === item.key ? 'primary' : item.variant}
                      className="d-flex align-items-center justify-content-start py-3 rounded-pill fw-medium"
                      onClick={() => setActiveTab(item.key)}
                    >
                      <i className={`bi ${item.icon} fs-4 me-3`}></i>
                      {item.label}
                    </Button>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* ─── Main Content ──────────────────────────────────────────────────── */}
          <Col lg={9} md={8}>
            <Card className="shadow-lg border-0">
              <Card.Body className="p-5">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-5 pb-3 border-bottom">
                  <h3 className="fw-bold text-primary mb-0">
                    {activeTab === 'add' && 'Add New Hostel'}
                    {activeTab === 'manage' && (selectedHostel ? `Managing: ${selectedHostel.name}` : 'Select a Hostel to Manage')}
                    {activeTab === 'bookings' && 'All Booking Requests'}
                    {activeTab === 'reviews' && 'Student Reviews'}
                  </h3>

                  {selectedHostel && activeTab !== 'add' && (
                    <div className="d-flex gap-3">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => {
                          setEditHostel({ ...selectedHostel, images: [] });
                          setShowEditModal(true);
                        }}
                      >
                        <i className="bi bi-pencil me-2"></i> Edit Hostel
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
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

                {/* ─── Add New Hostel Tab ──────────────────────────────────────── */}
                {activeTab === 'add' && (
                  <Form onSubmit={handlePublishHostel}>
                    <Row className="g-4 mb-5">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-bold">Hostel Name *</Form.Label>
                          <Form.Control
                            placeholder="e.g. Sunshine Boys Hostel"
                            value={newHostel.name}
                            onChange={(e) => setNewHostel({ ...newHostel, name: e.target.value })}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-bold">Location *</Form.Label>
                          <Form.Control
                            placeholder="e.g. Benz Circle, Vijayawada"
                            value={newHostel.location}
                            onChange={(e) => setNewHostel({ ...newHostel, location: e.target.value })}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-bold">Hostel Type</Form.Label>
                          <Form.Select
                            value={newHostel.type}
                            onChange={(e) => setNewHostel({ ...newHostel, type: e.target.value })}
                          >
                            <option>Boys Hostel</option>
                            <option>Girls Hostel</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-bold">Price per Seat (₹/month) *</Form.Label>
                          <Form.Control
                            type="number"
                            placeholder="5500"
                            value={newHostel.price}
                            onChange={(e) => setNewHostel({ ...newHostel, price: e.target.value })}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-5">
                      <Form.Label className="fw-bold">Available Facilities</Form.Label>
                      <Row className="g-3">
                        {facilitiesOptions.map((facility) => (
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

                    <Form.Group className="mb-5">
                      <h5 className="fw-bold text-primary mb-4">Room Types & Pricing</h5>
                      <Row className="g-4">
                        {[
                          { key: 'single', label: 'Single Room', seats: 1 },
                          { key: 'double', label: '2-Sharing (Double)', seats: 2 },
                          { key: 'triple', label: '3-Sharing', seats: 3 },
                          { key: 'five', label: '5-Sharing', seats: 5 },
                        ].map((item) => (
                          <Col md={6} key={item.key}>
                            <Card className="border-primary h-100">
                              <Card.Body>
                                <Card.Title className="text-primary">{item.label}</Card.Title>
                                <Row className="g-3 mt-3">
                                  <Col xs={6}>
                                    <Form.Control
                                      type="number"
                                      placeholder="No. of Rooms"
                                      value={roomTypesInput[item.key].count}
                                      onChange={(e) =>
                                        setRoomTypesInput((prev) => ({
                                          ...prev,
                                          [item.key]: { ...prev[item.key], count: e.target.value },
                                        }))
                                      }
                                      min="0"
                                    />
                                  </Col>
                                  <Col xs={6}>
                                    <Form.Control
                                      type="number"
                                      placeholder="Price / Seat"
                                      value={roomTypesInput[item.key].price}
                                      onChange={(e) =>
                                        setRoomTypesInput((prev) => ({
                                          ...prev,
                                          [item.key]: { ...prev[item.key], price: e.target.value },
                                        }))
                                      }
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

                    <Form.Group className="mb-5">
                      <Form.Label className="fw-bold">Upload Images (max 6)</Form.Label>
                      <Form.Control
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                      <Form.Text className="text-muted">
                        High-quality images recommended (1200×800 or larger)
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
                        'Publish New Hostel'
                      )}
                    </Button>
                  </Form>
                )}

                {/* ─── Manage Seats Tab ────────────────────────────────────────── */}
                {activeTab === 'manage' && selectedHostel && (
                  <div>
                    <Row className="g-4 mb-5">
                      <Col md={3}>
                        <Card className="text-center bg-primary text-white shadow">
                          <Card.Body>
                            <h6 className="text-white-50 mb-2">Total Seats</h6>
                            <h3 className="fw-bold">{seatStats.totalSeats}</h3>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={3}>
                        <Card className="text-center bg-success text-white shadow">
                          <Card.Body>
                            <h6 className="text-white-50 mb-2">Available Seats</h6>
                            <h3 className="fw-bold">{seatStats.available}</h3>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={3}>
                        <Card className="text-center bg-warning text-dark shadow">
                          <Card.Body>
                            <h6 className="text-dark mb-2">Occupied Seats</h6>
                            <h3 className="fw-bold">{seatStats.occupied}</h3>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={3}>
                        <Card className="text-center bg-info text-white shadow">
                          <Card.Body>
                            <h6 className="text-white-50 mb-2">Occupancy Rate</h6>
                            <h3 className="fw-bold">
                              {seatStats.totalSeats > 0
                                ? Math.round((seatStats.occupied / seatStats.totalSeats) * 100)
                                : 0}
                              %
                            </h3>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>

                    <h5 className="fw-bold text-primary mb-4">Room Type Breakdown</h5>
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
                        {Object.keys(aggregatedRooms).length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center py-4 text-muted">
                              No rooms configured yet
                            </td>
                          </tr>
                        ) : (
                          Object.values(aggregatedRooms).map((agg) => (
                            <tr key={agg.type}>
                              <td className="fw-medium">{agg.type}</td>
                              <td>{agg.count}</td>
                              <td>{agg.totalSeats}</td>
                              <td>
                                <Form.Control
                                  type="number"
                                  size="sm"
                                  min="0"
                                  max={agg.totalSeats}
                                  value={agg.occupied}
                                  onChange={(e) => handleOccupiedChange(agg.type, e.target.value)}
                                />
                              </td>
                              <td className={agg.available > 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                                {agg.available}
                              </td>
                              <td>₹{agg.price?.toLocaleString() || '—'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}

                {/* ─── Bookings Tab ─────────────────────────────────────────────── */}
                {activeTab === 'bookings' && (
                  <div>
                    <h5 className="fw-bold text-primary mb-4">
                      All Booking Requests ({bookings.length})
                      {pendingBookingsCount > 0 && (
                        <Badge bg="warning" className="ms-3">
                          {pendingBookingsCount} Pending
                        </Badge>
                      )}
                    </h5>

                    {Array.isArray(bookings) && bookings.length > 0 ? (
                      <Table responsive hover bordered className="shadow-sm">
                        <thead className="table-dark">
                          <tr>
                            <th>Student</th>
                            <th>Room Type</th>
                            <th>Check-in Date</th>
                            <th>Price</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.map((b) => (
                            <tr key={b._id}>
                              <td className="fw-medium">{b.user?.name || '—'}</td>
                              <td>{b.roomType}</td>
                              <td>{new Date(b.checkInDate).toLocaleDateString()}</td>
                              <td>₹{b.price?.toLocaleString() || '—'}</td>
                              <td>
                                <Badge
                                  bg={
                                    b.status === 'Confirmed' ? 'success' :
                                    b.status === 'Rejected' ? 'danger' :
                                    'warning'
                                  }
                                >
                                  {b.status}
                                </Badge>
                              </td>
                              <td>
                                {b.status === 'Pending' && (
                                  <div className="d-flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="success"
                                      onClick={() => handleBookingAction(b._id, 'Confirmed')}
                                      disabled={actionLoading}
                                    >
                                      <i className="bi bi-check-lg me-1"></i> Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="danger"
                                      onClick={() => handleBookingAction(b._id, 'Rejected')}
                                      disabled={actionLoading}
                                    >
                                      <i className="bi bi-x-lg me-1"></i> Reject
                                    </Button>
                                  </div>
                                )}
                                {b.status !== 'Pending' && (
                                  <span className="text-muted small">Processed</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <Alert variant="info" className="text-center p-5">
                        <i className="bi bi-inbox fs-1 mb-3 d-block"></i>
                        No booking requests yet
                      </Alert>
                    )}
                  </div>
                )}

                {/* ─── Reviews Tab ─────────────────────────────────────────────── */}
                {activeTab === 'reviews' && (
                  <div>
                    <h5 className="fw-bold text-primary mb-4">Student Reviews ({reviews.length})</h5>
                    {Array.isArray(reviews) && reviews.length > 0 ? (
                      <Row className="g-4">
                        {reviews.map((r) => (
                          <Col md={6} key={r._id}>
                            <Card className="shadow-sm h-100">
                              <Card.Body>
                                <div className="d-flex justify-content-between mb-3">
                                  <div>
                                    <h6 className="fw-bold mb-1">{r.user?.name || 'Anonymous'}</h6>
                                    <div className="text-warning">
                                      {'★'.repeat(r.rating || 0)}{'☆'.repeat(5 - (r.rating || 0))}
                                    </div>
                                  </div>
                                  <small className="text-muted">
                                    {new Date(r.createdAt).toLocaleDateString()}
                                  </small>
                                </div>
                                <p className="mb-0">{r.comment || 'No comment'}</p>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      <Alert variant="info" className="text-center p-5">
                        <i className="bi bi-star fs-1 mb-3 d-block"></i>
                        No reviews yet
                      </Alert>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* ─── Delete Confirmation Modal ──────────────────────────────────────── */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">Delete Hostel</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete <strong>{selectedHostel?.name}</strong>?</p>
          <p className="text-muted small">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDeleteHostel}>
            Delete Hostel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ─── Edit Hostel Modal ──────────────────────────────────────────────── */}
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
                    onChange={(e) => setEditHostel({ ...editHostel, name: e.target.value })}
                  />
                </Col>
                <Col md={6}>
                  <Form.Label className="fw-bold">Location</Form.Label>
                  <Form.Control
                    value={editHostel.location}
                    onChange={(e) => setEditHostel({ ...editHostel, location: e.target.value })}
                  />
                </Col>
              </Row>

              <Row className="g-3 mb-4">
                <Col md={6}>
                  <Form.Label className="fw-bold">Type</Form.Label>
                  <Form.Select
                    value={editHostel.type}
                    onChange={(e) => setEditHostel({ ...editHostel, type: e.target.value })}
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
                    onChange={(e) => setEditHostel({ ...editHostel, price: e.target.value })}
                  />
                </Col>
              </Row>

              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Facilities</Form.Label>
                <Row className="g-3">
                  {facilitiesOptions.map((f) => (
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
                  onChange={(e) => handleImageChange(e, true)}
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
                formData.append('name', editHostel.name.trim());
                formData.append('location', editHostel.location.trim());
                formData.append('type', editHostel.type);
                formData.append('price', editHostel.price);
                formData.append('facilities', JSON.stringify(editHostel.facilities));
                editHostel.images.forEach((file) => formData.append('images', file));

                const res = await api.put(`/hostels/${editHostel._id}`, formData, {
                  headers: { 'Content-Type': 'multipart/form-data' },
                });

                toast.success('Hostel updated successfully');
                setHostels((prev) => prev.map((h) => (h._id === res.data._id ? res.data : h)));
                setSelectedHostel(res.data);
                setRooms(Array.isArray(res.data.rooms) ? res.data.rooms : []);
                setShowEditModal(false);
              } catch (err) {
                toast.error('Failed to update hostel');
              } finally {
                setPublishLoading(false);
              }
            }}
            disabled={publishLoading}
          >
            {publishLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}

export default OwnerDashboard;