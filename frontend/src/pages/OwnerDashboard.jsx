// src/pages/OwnerDashboard.jsx
import { useState } from 'react';
import { Container, Row, Col, Button, Form, Table, Badge, Card, InputGroup } from 'react-bootstrap';

function OwnerDashboard({ triggerToast }) {
  const [activeTab, setActiveTab] = useState('manage');
  const [hostelName, setHostelName] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [roomTypes, setRoomTypes] = useState({
    1: { rooms: 5, price: 12000 },
    2: { rooms: 10, price: 8000 },
    3: { rooms: 15, price: 6000 },
    5: { rooms: 8, price: 5000 },
  });

  // Mock rooms state (dynamic)
  const [rooms, setRooms] = useState(() => {
    const initialRooms = [];
    let roomNumber = 101;
    Object.keys(roomTypes).forEach(sharing => {
      const numRooms = parseInt(roomTypes[sharing].rooms) || 0;
      const seatsPerRoom = parseInt(sharing);
      for (let i = 1; i <= numRooms; i++) {
        initialRooms.push({
          id: initialRooms.length + 1,
          roomNumber: `Room ${roomNumber++}`,
          type: sharing === '1' ? 'Single' : `${sharing}-Sharing`,
          totalSeats: seatsPerRoom,
          occupied: Math.floor(Math.random() * seatsPerRoom),
          available: 0, // Will be calculated
          status: 'Partial',
        });
      }
    });
    // Calculate available seats
    return initialRooms.map(room => ({
      ...room,
      available: room.totalSeats - room.occupied,
      status: room.totalSeats - room.occupied === 0 ? 'Full' :
              room.totalSeats - room.occupied === room.totalSeats ? 'Vacant' : 'Partial'
    }));
  });

  // Filter and search states
  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Add new room state
  const [newRoom, setNewRoom] = useState({
    roomNumber: '',
    type: 'Single',
    totalSeats: 1,
    occupied: 0,
  });

  // Totals
  const totalSeats = rooms.reduce((sum, room) => sum + room.totalSeats, 0);
  const totalOccupied = rooms.reduce((sum, room) => sum + room.occupied, 0);
  const totalAvailable = rooms.reduce((sum, room) => sum + room.available, 0);

  // Handle room number edit
  const handleEditRoomNumber = (id, newNumber) => {
    if (!newNumber || newNumber === '') {
      triggerToast('Room number cannot be empty!', 'error');
      return;
    }
    setRooms(rooms.map(room =>
      room.id === id ? { ...room, roomNumber: newNumber } : room
    ));
    triggerToast(`Room number updated to ${newNumber}!`);
  };

  // Handle add new room
  const handleAddRoom = (e) => {
    e.preventDefault();
    if (!newRoom.roomNumber) {
      triggerToast('Please enter a room number!', 'error');
      return;
    }
    const totalSeats = parseInt(newRoom.totalSeats);
    const occupied = parseInt(newRoom.occupied) || 0;
    if (occupied > totalSeats) {
      triggerToast('Occupied seats cannot exceed total seats!', 'error');
      return;
    }
    const newRoomData = {
      id: rooms.length + 1,
      roomNumber: newRoom.roomNumber,
      type: newRoom.type,
      totalSeats,
      occupied,
      available: totalSeats - occupied,
      status: totalSeats - occupied === 0 ? 'Full' :
              totalSeats - occupied === totalSeats ? 'Vacant' : 'Partial',
    };
    setRooms([...rooms, newRoomData]);
    setNewRoom({ roomNumber: '', type: 'Single', totalSeats: 1, occupied: 0 });
    triggerToast(`Room ${newRoomData.roomNumber} added successfully!`);
  };

  // Filter and search logic
  const filteredRooms = rooms.filter(room => {
    const matchesType = filterType === 'All' || room.type === filterType;
    const matchesSearch = room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Mock data for other tabs
  const mockBookings = [
    { id: 1, student: 'Rahul Sharma', room: 'Room 101', checkIn: '2025-01-10', status: 'Confirmed' },
    { id: 2, student: 'Priya Singh', room: 'Room 105', checkIn: '2025-01-15', status: 'Pending' },
    { id: 3, student: 'Vikram Singh', room: 'Room 201', checkIn: '2025-01-20', status: 'Confirmed' },
  ];

  const mockReviews = [
    { id: 1, student: 'Amit Kumar', rating: 4.8, comment: 'Great facilities and clean rooms!', date: '2025-12-10' },
    { id: 2, student: 'Neha Gupta', rating: 4.5, comment: 'Good food and helpful staff.', date: '2025-12-05' },
    { id: 3, student: 'Rohan Patel', rating: 5.0, comment: 'Best hostel in the area!', date: '2025-12-01' },
  ];

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(files.map(file => URL.createObjectURL(file)));
  };

  const handleAddHostel = (e) => {
    e.preventDefault();
    const totalAvailableSeats = Object.keys(roomTypes).reduce((total, sharing) => {
      const seatsPerRoom = parseInt(sharing);
      const numRooms = parseInt(roomTypes[sharing].rooms) || 0;
      return total + (seatsPerRoom * numRooms);
    }, 0);
    if (totalAvailableSeats === 0) {
      triggerToast('Please add at least one room!', 'error');
      return;
    }
    triggerToast(`Hostel added with ${totalAvailableSeats} seats!`);
    setHostelName('');
    setSelectedImages([]);
    setRoomTypes({
      1: { rooms: 0, price: 0 },
      2: { rooms: 0, price: 0 },
      3: { rooms: 0, price: 0 },
      5: { rooms: 0, price: 0 },
    });
  };

  const menuItems = [
    { key: 'add', icon: 'bi-building-add', label: 'Add New Hostel' },
    { key: 'manage', icon: 'bi-people-fill', label: 'Manage Seats' },
    { key: 'bookings', icon: 'bi-calendar-check', label: 'View Bookings' },
    { key: 'reviews', icon: 'bi-star-fill', label: 'View Reviews' },
  ];

  return (
    <section className="owner-dashboard min-vh-100 py-5 bg-light">
      <Container fluid>
        <Row>
          {/* Sidebar */}
          <Col lg={3} md={4} className="mb-4">
            <div className="dashboard-sidebar p-4 rounded-4 shadow-lg sticky-top" style={{ top: '20px' }}>
              <div className="text-center mb-5">
                <div className="bg-primary text-white rounded-circle mx-auto d-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                  <i className="bi bi-building fs-1"></i>
                </div>
                <h4 className="fw-bold text-primary">Owner Panel</h4>
                <p className="text-muted small">Sunrise Boys Hostel</p>
              </div>
              <div className="nav flex-column">
                {menuItems.map(item => (
                  <button
                    key={item.key}
                    className={`nav-link d-flex align-items-center mb-3 rounded-pill fw-medium px-4 py-3 transition-all ${
                      activeTab === item.key ? 'active-tab text-white' : 'text-muted hover-bg'
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
            <div className="content-card p-5 rounded-4 shadow-lg">
              <h3 className="fw-bold text-primary mb-4">
                {activeTab === 'add' && 'Add New Hostel'}
                {activeTab === 'manage' && 'Manage Seat Availability'}
                {activeTab === 'bookings' && 'Recent Bookings'}
                {activeTab === 'reviews' && 'Customer Reviews'}
              </h3>

              {/* Manage Seats Tab - Enhanced */}
              {activeTab === 'manage' && (
                <>
                  {/* Summary Cards */}
                  <Row className="mb-5 g-4">
                    <Col md={4}>
                      <Card className="text-center border-0 shadow-sm">
                        <Card.Body>
                          <i className="bi bi-building fs-1 text-primary mb-3"></i>
                          <h5>Total Seats</h5>
                          <h3 className="fw-bold text-dark">{totalSeats}</h3>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="text-center border-0 shadow-sm">
                        <Card.Body>
                          <i className="bi bi-person-check fs-1 text-success mb-3"></i>
                          <h5>Occupied</h5>
                          <h3 className="fw-bold text-success">{totalOccupied}</h3>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="text-center border-0 shadow-sm">
                        <Card.Body>
                          <i className="bi bi-person-plus fs-1 text-warning mb-3"></i>
                          <h5>Available</h5>
                          <h3 className="fw-bold text-warning">{totalAvailable}</h3>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  {/* Filters and Search */}
                  <Row className="mb-4 align-items-center">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-bold">Filter by Room Type</Form.Label>
                        <Form.Select
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                          className="stylish-input"
                        >
                          <option value="All">All Types</option>
                          <option value="Single">Single</option>
                          <option value="2-Sharing">2-Sharing</option>
                          <option value="3-Sharing">3-Sharing</option>
                          <option value="5-Sharing">5-Sharing</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-bold">Search Room Number</Form.Label>
                        <InputGroup>
                          <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                          <Form.Control
                            type="text"
                            placeholder="Enter room number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>
                    <Col md={4} className="text-end">
                      <Button
                        variant="primary"
                        className="mt-4 rounded-pill px-4 py-2 fw-bold"
                        onClick={() => document.getElementById('add-room-form').scrollIntoView({ behavior: 'smooth' })}
                      >
                        <i className="bi bi-plus-circle me-2"></i>Add New Room
                      </Button>
                    </Col>
                  </Row>

                  {/* Rooms Table */}
                  <Table responsive hover className="modern-table align-middle">
                    <thead>
                      <tr>
                        <th>Room No.</th>
                        <th>Type</th>
                        <th>Total Seats</th>
                        <th>Occupied</th>
                        <th>Available</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRooms.length > 0 ? (
                        filteredRooms.map(room => (
                          <tr key={room.id}>
                            <td>
                              <span
                                className="editable-room text-primary fw-bold"
                                onClick={() => {
                                  const newNumber = prompt('Enter new room number:', room.roomNumber);
                                  if (newNumber) handleEditRoomNumber(room.id, newNumber);
                                }}
                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                              >
                                {room.roomNumber}
                              </span>
                            </td>
                            <td><Badge bg="info" className="fs-6">{room.type}</Badge></td>
                            <td>{room.totalSeats}</td>
                            <td>{room.occupied}</td>
                            <td className="fw-bold text-success">{room.available}</td>
                            <td>
                              <Badge bg={
                                room.status === 'Vacant' ? 'success' :
                                room.status === 'Full' ? 'danger' : 'warning'
                              }>
                                {room.status}
                              </Badge>
                            </td>
                            <td>
                              <Button size="sm" variant="outline-primary" onClick={() => triggerToast(`Editing ${room.roomNumber} (Mock)`)}>
                                <i className="bi bi-pencil"></i> Edit
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center py-5 text-muted">
                            <i className="bi bi-search fs-1 d-block mb-3"></i>
                            No rooms match your filter/search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>

                  {/* Add New Room Form */}
                  <Card id="add-room-form" className="mt-5 p-4 shadow-lg">
                    <h5 className="fw-bold text-primary mb-4">
                      <i className="bi bi-plus-circle me-2"></i>Add New Room
                    </h5>
                    <Form onSubmit={handleAddRoom}>
                      <Row>
                        <Col md={3}>
                          <div className="form-floating mb-3">
                            <input
                              type="text"
                              className="form-control"
                              value={newRoom.roomNumber}
                              onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                              placeholder="Room Number"
                              required
                            />
                            <label>Room Number</label>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="form-floating mb-3">
                            <select
                              className="form-select"
                              value={newRoom.type}
                              onChange={(e) => setNewRoom({
                                ...newRoom,
                                type: e.target.value,
                                totalSeats: e.target.value === 'Single' ? 1 :
                                          e.target.value === '2-Sharing' ? 2 :
                                          e.target.value === '3-Sharing' ? 3 : 5
                              })}
                            >
                              <option value="Single">Single</option>
                              <option value="2-Sharing">2-Sharing</option>
                              <option value="3-Sharing">3-Sharing</option>
                              <option value="5-Sharing">5-Sharing</option>
                            </select>
                            <label>Room Type</label>
                          </div>
                        </Col>
                        <Col md={2}>
                          <div className="form-floating mb-3">
                            <input
                              type="number"
                              className="form-control"
                              value={newRoom.totalSeats}
                              onChange={(e) => setNewRoom({ ...newRoom, totalSeats: e.target.value })}
                              min="1"
                              readOnly
                            />
                            <label>Total Seats</label>
                          </div>
                        </Col>
                        <Col md={2}>
                          <div className="form-floating mb-3">
                            <input
                              type="number"
                              className="form-control"
                              value={newRoom.occupied}
                              onChange={(e) => setNewRoom({ ...newRoom, occupied: e.target.value })}
                              min="0"
                              max={newRoom.totalSeats}
                            />
                            <label>Occupied</label>
                          </div>
                        </Col>
                        <Col md={2}>
                          <Button type="submit" className="w-100 h-100 rounded-pill fw-bold" variant="primary">
                            <i className="bi bi-plus-lg me-2"></i>Add
                          </Button>
                        </Col>
                      </Row>
                    </Form>
                  </Card>
                </>
              )}

              {/* Add Hostel Tab */}
              {activeTab === 'add' && (
                <Form onSubmit={handleAddHostel}>
                  <Row className="mb-4">
                    <Col md={8}>
                      <div className="form-floating mb-4">
                        <input
                          type="text"
                          className="form-control stylish-input"
                          value={hostelName}
                          onChange={(e) => setHostelName(e.target.value)}
                          required
                        />
                        <label>Hostel Name</label>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="form-floating mb-4">
                        <select className="form-select stylish-input" required>
                          <option>Boys Hostel</option>
                          <option>Girls Hostel</option>
                          <option>Co-Living</option>
                        </select>
                        <label>Hostel Type</label>
                      </div>
                    </Col>
                  </Row>
                  <div className="mb-4">
                    <h5 className="fw-bold text-primary mb-4">Room Configuration</h5>
                    {[1, 2, 3, 5].map(sharing => (
                      <Card key={sharing} className="room-type-card mb-4 border-start border-primary border-5 shadow-sm">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="fw-bold m-0">
                              {sharing === 1 ? 'Single Room' : `${sharing}-Sharing Room`}
                            </h6>
                            <Badge bg="primary" className="fs-6">{sharing} bed{sharing > 1 && 's'}/room</Badge>
                          </div>
                          <Row>
                            <Col md={6}>
                              <div className="form-floating mb-3">
                                <input
                                  type="number"
                                  className="form-control"
                                  min="0"
                                  value={roomTypes[sharing].rooms}
                                  onChange={(e) => setRoomTypes({
                                    ...roomTypes,
                                    [sharing]: { ...roomTypes[sharing], rooms: e.target.value }
                                  })}
                                />
                                <label>No. of Rooms</label>
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="form-floating mb-3">
                                <input
                                  type="number"
                                  className="form-control"
                                  min="1000"
                                  step="100"
                                  value={roomTypes[sharing].price}
                                  onChange={(e) => setRoomTypes({
                                    ...roomTypes,
                                    [sharing]: { ...roomTypes[sharing], price: e.target.value }
                                  })}
                                />
                                <label>Price per Seat (₹)</label>
                              </div>
                            </Col>
                          </Row>
                          <div className="text-end text-muted small">
                            Seats from this type: <strong>{(sharing * (parseInt(roomTypes[sharing].rooms) || 0))}</strong>
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                  <Card className="bg-primary text-white p-4 mb-5 text-center shadow-lg">
                    <h4 className="fw-bold mb-2">Total Available Seats</h4>
                    <h2 className="display-4 fw-bold">
                      {Object.keys(roomTypes).reduce((total, sharing) => {
                        return total + (parseInt(sharing) * (parseInt(roomTypes[sharing].rooms) || 0));
                      }, 0)}
                    </h2>
                    <p className="mb-0">All seats will be marked as available initially</p>
                  </Card>
                  <div className="mb-4">
                    <label className="form-label fw-bold">Facilities Included</label>
                    <div className="row g-3">
                      {['WiFi', 'Food', 'Laundry', 'AC', 'Power Backup', 'CCTV', 'Gym', 'Housekeeping'].map(fac => (
                        <div key={fac} className="col-md-3 col-6">
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" id={fac} defaultChecked={['WiFi', 'Food', 'CCTV'].includes(fac)} />
                            <label className="form-check-label fw-medium" htmlFor={fac}>{fac}</label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mb-5">
                    <label className="form-label fw-bold">Hostel Images</label>
                    <input type="file" className="form-control" multiple accept="image/*" onChange={handleImageChange} />
                    {selectedImages.length > 0 && (
                      <div className="mt-3 row g-3">
                        {selectedImages.map((img, i) => (
                          <div key={i} className="col-3">
                            <img src={img} alt="preview" className="img-fluid rounded-3 shadow" style={{ height: '120px', objectFit: 'cover' }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <Button type="submit" size="lg" className="btn-primary px-7 py-3 rounded-pill fw-bold shadow-lg">
                      <i className="bi bi-check-circle-fill me-2"></i>
                      Publish Hostel
                    </Button>
                  </div>
                </Form>
              )}
              {activeTab === 'bookings' && (
                <Table responsive hover className="modern-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Room</th>
                      <th>Check-in</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockBookings.map(b => (
                      <tr key={b.id}>
                        <td>{b.student}</td>
                        <td>{b.room}</td>
                        <td>{b.checkIn}</td>
                        <td><Badge bg={b.status === 'Confirmed' ? 'success' : 'warning'}>{b.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
              {activeTab === 'reviews' && (
                <div>
                  {mockReviews.map(r => (
                    <div key={r.id} className="review-card p-4 mb-4 rounded-4 shadow-sm border-start border-warning border-5">
                      <div className="d-flex justify-content-between">
                        <div>
                          <h6 className="fw-bold">{r.student}</h6>
                          <p className="text-warning mb-1">
                            {'★★★★★'.substring(0, Math.floor(r.rating))}{'☆☆☆☆☆'.substring(0, 5 - Math.floor(r.rating))} {r.rating}
                          </p>
                          <p>{r.comment}</p>
                        </div>
                        <small className="text-muted">{r.date}</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}

export default OwnerDashboard;