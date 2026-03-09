// src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
  Container, Row, Col, Card, Table, Button, Form, Pagination,
  Modal, Spinner, Alert, Badge, Tabs, Tab
} from 'react-bootstrap';
import '../styles/AdminDashboard.css';

function AdminDashboard({ triggerToast, handleLogout }) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Stats
  const [stats, setStats] = useState({
    users: 0, owners: 0, admins: 1, hostels: 0,
    bookings: 0, reviews: 0, pendingBookings: 0
  });

  // Users
  const [users, setUsers] = useState([]);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [totalUsers, setTotalUsers] = useState(0);

  // Hostels
  const [hostels, setHostels] = useState([]);

  // Modals
  const [showEditUser, setShowEditUser] = useState(false);
  const [showEditHostel, setShowEditHostel] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteType, setDeleteType] = useState(''); // 'user' or 'hostel'

  useEffect(() => {
    if (localStorage.getItem('userRole') !== 'admin') {
      navigate('/admin-login');
      return;
    }

    loadDashboardData();
  }, [navigate, userPage, userSearch, userRoleFilter]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Stats
      const statsRes = await api.get('/admin/dashboard');
      setStats(statsRes.data.stats || stats);

      // 2. Users (with pagination/search)
      const usersRes = await api.get('/admin/users', {
        params: { page: userPage, limit: 10, search: userSearch, role: userRoleFilter }
      });
      setUsers(usersRes.data.users || []);
      setTotalUsers(usersRes.data.pagination?.total || usersRes.data.total || 0);

      // 3. Hostels – FIXED: extract the real array
      const hostelsRes = await api.get('/hostels');
      
      let hostelArray = [];
      
      if (Array.isArray(hostelsRes.data)) {
        hostelArray = hostelsRes.data;
      } else if (Array.isArray(hostelsRes.data?.hostels)) {
        hostelArray = hostelsRes.data.hostels;
      } else if (Array.isArray(hostelsRes.data?.data)) {
        hostelArray = hostelsRes.data.data;
      } else {
        console.warn('Unexpected /hostels response format:', hostelsRes.data);
        hostelArray = [];
      }

      setHostels(hostelArray);

    } catch (err) {
      toast.error('Failed to load admin data');
      console.error('Admin data load error:', err);
      // Prevent map crashes
      setHostels([]);
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    if (window.confirm(`Change role to ${newRole}?`)) {
      try {
        await api.put(`/admin/users/${userId}/role`, { role: newRole });
        toast.success('Role updated');
        loadDashboardData();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to update role');
      }
    }
  };

  const handleDelete = async () => {
    try {
      if (deleteType === 'user') {
        await api.delete(`/admin/users/${selectedItem._id}`);
        toast.success('User deleted');
      } else if (deleteType === 'hostel') {
        await api.delete(`/hostels/${selectedItem._id}`);
        toast.success('Hostel deleted');
      }
      loadDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const openDeleteModal = (type, item) => {
    setDeleteType(type);
    setSelectedItem(item);
    setShowDeleteConfirm(true);
  };

  const openEditModal = (type, item) => {
    setSelectedItem(item);
    if (type === 'user') setShowEditUser(true);
    if (type === 'hostel') setShowEditHostel(true);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" variant="danger" style={{ width: '4rem', height: '4rem' }} />
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <Container fluid className="py-4">
        {/* Header */}
        <Row className="align-items-center mb-5 pb-3 border-bottom">
          <Col>
            <h1 className="fw-bold text-danger">
              <i className="bi bi-shield-lock-fill me-3"></i>
              Admin Control Center
            </h1>
          </Col>
          <Col xs="auto">
            <Button variant="outline-danger" size="lg" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-2"></i> Logout
            </Button>
          </Col>
        </Row>

        {/* Tabs Navigation */}
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-4 border-bottom"
          fill
        >
          <Tab eventKey="dashboard" title={<><i className="bi bi-speedometer2 me-2"></i>Dashboard</>}>
            <Row className="g-4">
              <Col md={3}><Card className="stats-card"><Card.Body><h5>Total Users</h5><h2>{stats.users}</h2></Card.Body></Card></Col>
              <Col md={3}><Card className="stats-card"><Card.Body><h5>Hostel Owners</h5><h2>{stats.owners}</h2></Card.Body></Card></Col>
              <Col md={3}><Card className="stats-card"><Card.Body><h5>Administrators</h5><h2>{stats.admins}</h2></Card.Body></Card></Col>
              <Col md={3}><Card className="stats-card"><Card.Body><h5>Hostels</h5><h2>{stats.hostels}</h2></Card.Body></Card></Col>
              <Col md={3}><Card className="stats-card"><Card.Body><h5>Bookings</h5><h2>{stats.bookings}</h2></Card.Body></Card></Col>
              <Col md={3}><Card className="stats-card"><Card.Body><h5>Reviews</h5><h2>{stats.reviews}</h2></Card.Body></Card></Col>
              <Col md={3}><Card className="stats-card"><Card.Body><h5>Pending</h5><h2 className="text-warning">{stats.pendingBookings}</h2></Card.Body></Card></Col>
            </Row>
          </Tab>

          <Tab eventKey="users" title={<><i className="bi bi-people-fill me-2"></i>Users</>}>
            <div className="mb-4">
              <Row>
                <Col md={5}>
                  <Form.Control
                    placeholder="Search name or email..."
                    value={userSearch}
                    onChange={e => { setUserSearch(e.target.value); setUserPage(1); }}
                  />
                </Col>
                <Col md={3}>
                  <Form.Select
                    value={userRoleFilter}
                    onChange={e => { setUserRoleFilter(e.target.value); setUserPage(1); }}
                  >
                    <option value="">All Roles</option>
                    <option value="user">Students</option>
                    <option value="owner">Owners</option>
                    <option value="admin">Admins</option>
                  </Form.Select>
                </Col>
              </Row>
            </div>

            <Table responsive hover className="table-admin">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-5">No users found</td></tr>
                ) : (
                  users.map(user => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.phone || '—'}</td>
                      <td>
                        <Badge
                          bg={
                            user.role === 'admin' ? 'danger' :
                            user.role === 'owner' ? 'warning' : 'success'
                          }
                        >
                          {user.role.toUpperCase()}
                        </Badge>
                      </td>
                      <td>{new Date(user.joinedDate).toLocaleDateString()}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => openEditModal('user', user)}
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => openDeleteModal('user', user)}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>

            {totalUsers > 10 && (
              <div className="d-flex justify-content-center mt-4">
                <Pagination>
                  <Pagination.Prev disabled={userPage === 1} onClick={() => setUserPage(p => p - 1)} />
                  <Pagination.Item active>{userPage}</Pagination.Item>
                  <Pagination.Next
                    disabled={userPage * 10 >= totalUsers}
                    onClick={() => setUserPage(p => p + 1)}
                  />
                </Pagination>
              </div>
            )}
          </Tab>

          <Tab eventKey="hostels" title={<><i className="bi bi-building-fill me-2"></i>Hostels</>}>
            <Table responsive hover className="table-admin">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Seats</th>
                  <th>Owner</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {hostels.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-5">No hostels found</td></tr>
                ) : (
                  hostels.map(h => (
                    <tr key={h._id}>
                      <td>{h.name}</td>
                      <td>{h.location}</td>
                      <td>{h.type}</td>
                      <td>{h.availableSeats || 0}</td>
                      <td>{h.owner?.name || '—'}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => openEditModal('hostel', h)}
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => openDeleteModal('hostel', h)}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Tab>
        </Tabs>
      </Container>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to permanently delete this {deleteType}?
          This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete Permanently
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit User Modal */}
      <Modal show={showEditUser} onHide={() => setShowEditUser(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedItem && (
            <>
              <p><strong>Name:</strong> {selectedItem.name}</p>
              <p><strong>Email:</strong> {selectedItem.email}</p>
              <p><strong>Phone:</strong> {selectedItem.phone || 'Not provided'}</p>
              <Form.Group className="mt-4">
                <Form.Label><strong>Change Role</strong></Form.Label>
                <Form.Select
                  value={selectedItem.role}
                  onChange={e => setSelectedItem({ ...selectedItem, role: e.target.value })}
                >
                  <option value="user">Student / User</option>
                  <option value="owner">Hostel Owner</option>
                  <option value="admin">Administrator</option>
                </Form.Select>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditUser(false)}>Close</Button>
          <Button variant="primary" onClick={() => {
            handleChangeRole(selectedItem._id, selectedItem.role);
            setShowEditUser(false);
          }}>
            Save Role Change
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Hostel Modal - simplified */}
      <Modal show={showEditHostel} onHide={() => setShowEditHostel(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Hostel</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedItem && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  value={selectedItem.name}
                  onChange={e => setSelectedItem({...selectedItem, name: e.target.value})}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Location</Form.Label>
                <Form.Control
                  value={selectedItem.location}
                  onChange={e => setSelectedItem({...selectedItem, location: e.target.value})}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Type</Form.Label>
                <Form.Select
                  value={selectedItem.type}
                  onChange={e => setSelectedItem({...selectedItem, type: e.target.value})}
                >
                  <option>Boys Hostel</option>
                  <option>Girls Hostel</option>
                </Form.Select>
              </Form.Group>
              {/* You can add more fields: price, facilities array, etc. */}
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditHostel(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => {
            api.put(`/hostels/${selectedItem._id}`, selectedItem)
              .then(() => {
                toast.success('Hostel updated');
                setShowEditHostel(false);
                loadDashboardData();
              })
              .catch(() => toast.error('Update failed'));
          }}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default AdminDashboard;