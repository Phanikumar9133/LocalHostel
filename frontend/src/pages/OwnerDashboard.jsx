// src/pages/OwnerDashboard.jsx
import { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form, Table, Badge, Card, Modal, Spinner, Dropdown } from 'react-bootstrap';
import api from '../services/api';
import { toast } from 'react-toastify';

function OwnerDashboard({ triggerToast }) {
  const [activeTab, setActiveTab] = useState('add');
  const [loading, setLoading] = useState(true);
  const [publishLoading, setPublishLoading] = useState(false);
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editHostel, setEditHostel] = useState(null);

  const [newHostel, setNewHostel] = useState({
    name: '',
    location: '',
    type: 'Boys Hostel',
    price: '',
    facilities: [],
    images: [],
  });
  const [roomTypes, setRoomTypes] = useState({
    single: { count: '', price: '' },
    double: { count: '', price: '' },
    triple: { count: '', price: '' },
    five: { count: '', price: '' },
  });

  const facilitiesOptions = [
    'Free WiFi', 'Food', 'Laundry', 'Power Backup',
    '24/7 Security', 'AC Rooms', 'CCTV', 'Housekeeping',
    'Parking', 'Study Room', 'Washing Machine'
  ];

  // Fetch owner data
  useEffect(() => {
    const fetchOwnerData = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || user.role !== 'owner') {
          toast.error('Owner access required');
          return;
        }

        const hostelsRes = await api.get('/hostels');
        const ownerHostels = hostelsRes.data.filter(h => h.owner === user._id);
        setHostels(ownerHostels);

        if (ownerHostels.length > 0) {
          const first = ownerHostels[0];
          setSelectedHostel(first);
          setRooms(first.rooms || []);
          const bookingsRes = await api.get('/bookings/owner');
          setBookings(bookingsRes.data);
          const reviewsRes = await api.get(`/reviews/${first._id}`);
          setReviews(reviewsRes.data);
        }
      } catch (err) {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchOwnerData();
  }, []);

  const totalSeats = rooms.reduce((sum, r) => sum + (r.totalSeats || 0), 0);
  const totalOccupied = rooms.reduce((sum, r) => sum + (r.occupied || 0), 0);
  const totalAvailable = totalSeats - totalOccupied;
  const pendingBookings = bookings.filter(b => b.status === 'Pending').length;

  const toggleFacility = (facility, isEdit = false) => {
    const setter = isEdit ? setEditHostel : setNewHostel;
    setter(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility],
    }));
  };

  // Publish new hostel
  const handlePublishHostel = async (e) => {
    e.preventDefault();
    setPublishLoading(true);

    const roomsArray = [];
    Object.entries(roomTypes).forEach(([key, { count, price }]) => {
      const num = parseInt(count) || 0;
      const p = parseInt(price) || 0;
      if (num > 0 && p > 0) {
        const typeMap = { single: 'Single', double: '2-Sharing', triple: '3-Sharing', five: '5-Sharing' };
        const seats = key === 'single' ? 1 : parseInt(typeMap[key].charAt(0));
        for (let i = 1; i <= num; i++) {
          roomsArray.push({
            type: typeMap[key],
            roomNumber: `${typeMap[key]} ${i}`,
            totalSeats: seats,
            price: p,
            occupied: 0,
          });
        }
      }
    });

    if (roomsArray.length === 0) {
      toast.error('Add at least one room type');
      setPublishLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('name', newHostel.name);
    formData.append('location', newHostel.location);
    formData.append('type', newHostel.type);
    formData.append('price', newHostel.price);
    formData.append('facilities', JSON.stringify(newHostel.facilities));
    formData.append('rooms', JSON.stringify(roomsArray));
    newHostel.images.forEach(file => formData.append('images', file));

    try {
      const res = await api.post('/hostels', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Hostel published!');
      setHostels(prev => [...prev, res.data]);
      setSelectedHostel(res.data);
      setRooms(res.data.rooms || []);
      setNewHostel({ name: '', location: '', type: 'Boys Hostel', price: '', facilities: [], images: [] });
      setRoomTypes({ single: { count: '', price: '' }, double: { count: '', price: '' }, triple: { count: '', price: '' }, five: { count: '', price: '' } });
      setActiveTab('manage');
    } catch (err) {
      toast.error('Failed to publish hostel');
    } finally {
      setPublishLoading(false);
    }
  };

  // Update selected hostel
  const handleHostelSelect = async (hostel) => {
    setSelectedHostel(hostel);
    setRooms(hostel.rooms || []);
    const bookingsRes = await api.get('/bookings/owner');
    setBookings(bookingsRes.data);
    const reviewsRes = await api.get(`/reviews/${hostel._id}`);
    setReviews(reviewsRes.data);
  };

  // Edit hostel
  const handleEditHostel = async () => {
    try {
      const formData = new FormData();
      formData.append('name', editHostel.name);
      formData.append('location', editHostel.location);
      formData.append('type', editHostel.type);
      formData.append('price', editHostel.price);
      formData.append('facilities', JSON.stringify(editHostel.facilities));
      editHostel.images.forEach(file => formData.append('images', file));

      const res = await api.put(`/hostels/${editHostel._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Hostel updated!');
      setHostels(prev => prev.map(h => h._id === res.data._id ? res.data : h));
      setSelectedHostel(res.data);
      setRooms(res.data.rooms || []);
      setShowEditModal(false);
    } catch (err) {
      toast.error('Failed to update hostel');
    }
  };

  // Delete hostel
  const handleDeleteHostel = async () => {
    try {
      await api.delete(`/hostels/${selectedHostel._id}`);
      toast.success('Hostel deleted');
      setHostels(prev => prev.filter(h => h._id !== selectedHostel._id));
      setSelectedHostel(hostels[0] || null);
      setShowDeleteModal(false);
    } catch (err) {
      toast.error('Failed to delete hostel');
    }
  };

  if (loading) {
    return <div className="d-flex justify-content-center min-vh-100 align-items-center"><Spinner animation="border" /></div>;
  }

  return (
    <section className="py-5 bg-light">
      <Container fluid>
        <Row>
          {/* Sidebar */}
          <Col lg={3} md={4} className="mb-4">
            <div className="dashboard-sidebar p-4 rounded-4 shadow-lg sticky-top bg-white" style={{ top: '20px' }}>
              <div className="text-center mb-4">
                <div className="bg-primary text-white rounded-circle mx-auto d-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                  <i className="bi bi-building fs-1"></i>
                </div>
                <h4 className="fw-bold text-primary">Owner Dashboard</h4>
              </div>

              <Dropdown className="mb-4">
                <Dropdown.Toggle variant="outline-primary" className="w-100">
                  {selectedHostel ? selectedHostel.name : 'Select Hostel'}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {hostels.map(h => (
                    <Dropdown.Item key={h._id} onClick={() => handleHostelSelect(h)}>
                      {h.name}
                    </Dropdown.Item>
                  ))}
                  {hostels.length === 0 && <Dropdown.Item disabled>No hostels yet</Dropdown.Item>}
                </Dropdown.Menu>
              </Dropdown>

              <div className="nav flex-column">
                {[
                  { key: 'add', icon: 'bi-building-add', label: 'Add New Hostel' },
                  { key: 'manage', icon: 'bi-people-fill', label: 'Manage Seats' },
                  { key: 'bookings', icon: 'bi-calendar-check', label: 'View Bookings' },
                  { key: 'reviews', icon: 'bi-star-fill', label: 'View Reviews' },
                ].map(item => (
                  <button
                    key={item.key}
                    className={`nav-link d-flex align-items-center mb-3 rounded-pill fw-medium px-4 py-3 ${
                      activeTab === item.key ? 'bg-primary text-white' : 'text-muted hover-bg-light'
                    }`}
                    onClick={() => setActiveTab(item.key)}
                  >
                    <i className={`bi ${item.icon} fs-4 me-3`}></i>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </Col>

          {/* Main Content */}
          <Col lg={9} md={8}>
            <div className="content-card p-5 rounded-4 shadow-lg bg-white">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold text-primary">
                  {activeTab === 'add' && 'Add New Hostel'}
                  {activeTab === 'manage' && 'Manage Seats'}
                  {activeTab === 'bookings' && 'Bookings'}
                  {activeTab === 'reviews' && 'Reviews'}
                </h3>

                {selectedHostel && activeTab !== 'add' && (
                  <div>
                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => {
                      setEditHostel({ ...selectedHostel });
                      setShowEditModal(true);
                    }}>
                      Edit Hostel
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => setShowDeleteModal(true)}>
                      Delete Hostel
                    </Button>
                  </div>
                )}
              </div>

              {/* Add Hostel */}
              {activeTab === 'add' && (
                <Form onSubmit={handlePublishHostel}>
                  {/* Name, Location, Type, Price */}
                  <Row className="mb-4 g-3">
                    <Col md={6}><Form.Control placeholder="Hostel Name" value={newHostel.name} onChange={e => setNewHostel({ ...newHostel, name: e.target.value })} required /></Col>
                    <Col md={6}><Form.Control placeholder="Location" value={newHostel.location} onChange={e => setNewHostel({ ...newHostel, location: e.target.value })} required /></Col>
                  </Row>
                  <Row className="mb-4 g-3">
                    <Col md={6}>
                      <Form.Select value={newHostel.type} onChange={e => setNewHostel({ ...newHostel, type: e.target.value })}>
                        <option>Boys Hostel</option>
                        <option>Girls Hostel</option>
                      </Form.Select>
                    </Col>
                    <Col md={6}>
                      <Form.Control type="number" placeholder="Price per Seat (₹)" value={newHostel.price} onChange={e => setNewHostel({ ...newHostel, price: e.target.value })} required />
                    </Col>
                  </Row>

                  {/* Facilities */}
                  <div className="mb-4">
                    <Form.Label className="fw-bold">Facilities</Form.Label>
                    <Row className="g-3">
                      {facilitiesOptions.map(f => (
                        <Col md={3} key={f}>
                          <Form.Check type="checkbox" label={f} checked={newHostel.facilities.includes(f)} onChange={() => toggleFacility(f)} />
                        </Col>
                      ))}
                    </Row>
                  </div>

                  {/* Rooms */}
                  <div className="mb-5">
                    <h5 className="fw-bold text-primary mb-3">Room Types</h5>
                    {Object.entries(roomTypes).map(([key, data]) => (
                      <Row key={key} className="mb-3 g-3">
                        <Col md={4}>
                          <Form.Control type="number" placeholder={`${key.charAt(0).toUpperCase() + key.slice(1)} Rooms`} value={data.count} onChange={e => setRoomTypes({ ...roomTypes, [key]: { ...data, count: e.target.value } })} />
                        </Col>
                        <Col md={4}>
                          <Form.Control type="number" placeholder="Price per Seat (₹)" value={data.price} onChange={e => setRoomTypes({ ...roomTypes, [key]: { ...data, price: e.target.value } })} />
                        </Col>
                      </Row>
                    ))}
                  </div>

                  {/* Images */}
                  <div className="mb-4">
                    <Form.Label className="fw-bold">Images</Form.Label>
                    <Form.Control type="file" multiple onChange={e => setNewHostel({ ...newHostel, images: Array.from(e.target.files) })} />
                  </div>

                  <Button type="submit" variant="success" size="lg" className="w-100" disabled={publishLoading}>
                    {publishLoading ? <><Spinner as="span" animation="border" size="sm" className="me-2" /> Publishing...</> : 'Publish Hostel'}
                  </Button>
                </Form>
              )}

              {/* Manage Seats */}
              {activeTab === 'manage' && selectedHostel && (
                <>
                  <Row className="g-4 mb-5">
                    <Col md={3}><Card className="text-center shadow-sm"><Card.Body><h6>Total Seats</h6><h4>{totalSeats}</h4></Card.Body></Card></Col>
                    <Col md={3}><Card className="text-center shadow-sm"><Card.Body><h6>Occupied</h6><h4>{totalOccupied}</h4></Card.Body></Card></Col>
                    <Col md={3}><Card className="text-center shadow-sm"><Card.Body><h6>Available</h6><h4>{totalAvailable}</h4></Card.Body></Card></Col>
                    <Col md={3}><Card className="text-center shadow-sm"><Card.Body><h6>Pending Bookings</h6><h4>{pendingBookings}</h4></Card.Body></Card></Col>
                  </Row>

                  <Table responsive hover className="mb-5">
                    <thead>
                      <tr>
                        <th>Room No.</th>
                        <th>Type</th>
                        <th>Total Seats</th>
                        <th>Occupied</th>
                        <th>Available</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rooms.map(room => (
                        <tr key={room._id}>
                          <td>{room.roomNumber || 'N/A'}</td>
                          <td>{room.type || 'N/A'}</td>
                          <td>{room.totalSeats || 0}</td>
                          <td>
                            <Form.Control
                              type="number"
                              min="0"
                              max={room.totalSeats || 0}
                              value={room.occupied || 0}
                              onChange={e => {
                                const updatedRooms = rooms.map(r => r._id === room._id ? { ...r, occupied: Number(e.target.value) } : r);
                                setRooms(updatedRooms);
                                api.put(`/hostels/${selectedHostel._id}`, { rooms: updatedRooms });
                              }}
                            />
                          </td>
                          <td>{(room.totalSeats || 0) - (room.occupied || 0)}</td>
                          <td>
                            <Badge bg={(room.totalSeats || 0) === (room.occupied || 0) ? 'danger' : 'success'}>
                              {(room.totalSeats || 0) === (room.occupied || 0) ? 'Full' : 'Available'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {rooms.length === 0 && <tr><td colSpan="6" className="text-center py-5">No rooms yet</td></tr>}
                    </tbody>
                  </Table>
                </>
              )}

              {/* Bookings */}
              {activeTab === 'bookings' && (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Room Type</th>
                      <th>Check-in</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.length === 0 ? (
                      <tr><td colSpan="4" className="text-center py-5">No bookings yet</td></tr>
                    ) : (
                      bookings.map(b => (
                        <tr key={b._id}>
                          <td>{b.user?.name || 'N/A'}</td>
                          <td>{b.roomType}</td>
                          <td>{new Date(b.checkInDate).toLocaleDateString()}</td>
                          <td>
                            <Badge bg={b.status === 'Confirmed' ? 'success' : b.status === 'Rejected' ? 'danger' : 'warning'}>
                              {b.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              )}

              {/* Reviews */}
              {activeTab === 'reviews' && (
                <div>
                  {reviews.length === 0 ? (
                    <p className="text-muted">No reviews yet</p>
                  ) : (
                    reviews.map(r => (
                      <Card key={r._id} className="mb-3">
                        <Card.Body>
                          <div className="d-flex justify-content-between">
                            <div>
                              <h6>{r.user?.name || 'Anonymous'}</h6>
                              <div className="text-warning">
                                {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                              </div>
                            </div>
                            <small>{new Date(r.createdAt).toLocaleDateString()}</small>
                          </div>
                          <p className="mt-2">{r.comment || 'No comment'}</p>
                        </Card.Body>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Container>

      {/* Delete Confirmation */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Hostel</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete <strong>{selectedHostel?.name}</strong>? This cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteHostel}>Delete</Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Hostel Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Hostel</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editHostel && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Hostel Name</Form.Label>
                <Form.Control value={editHostel.name} onChange={e => setEditHostel({ ...editHostel, name: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Location</Form.Label>
                <Form.Control value={editHostel.location} onChange={e => setEditHostel({ ...editHostel, location: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Type</Form.Label>
                <Form.Select value={editHostel.type} onChange={e => setEditHostel({ ...editHostel, type: e.target.value })}>
                  <option>Boys Hostel</option>
                  <option>Girls Hostel</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Price per Seat</Form.Label>
                <Form.Control type="number" value={editHostel.price} onChange={e => setEditHostel({ ...editHostel, price: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Facilities</Form.Label>
                <Row className="g-3">
                  {facilitiesOptions.map(f => (
                    <Col md={3} key={f}>
                      <Form.Check type="checkbox" label={f} checked={editHostel.facilities.includes(f)} onChange={() => toggleFacility(f, true)} />
                    </Col>
                  ))}
                </Row>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>New Images (optional)</Form.Label>
                <Form.Control type="file" multiple onChange={e => setEditHostel({ ...editHostel, images: Array.from(e.target.files) })} />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleEditHostel}>Save Changes</Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}

export default OwnerDashboard;