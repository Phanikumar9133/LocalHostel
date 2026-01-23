import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Container, Row, Col, Form, Button, Spinner, Card } from 'react-bootstrap';

function AdminLogin({ handleLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });

      const { success, token, user } = response.data;

      if (success) {
        if (user.role !== 'admin') {
          toast.error('This account does not have admin privileges.');
          return;
        }

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('userRole', user.role);

        handleLogin(user.role);
        toast.success('Admin login successful!');
        navigate('/admin-dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Check credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Container>
        <Row className="justify-content-center">
          <Col lg={5} md={8}>
            <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
              <Card.Body className="p-5 bg-white">
                <div className="text-center mb-5">
                  <div className="mb-4">
                    <i className="bi bi-shield-lock-fill text-danger" style={{ fontSize: '4.5rem' }}></i>
                  </div>
                  <h2 className="fw-bold text-dark">Admin Control Panel</h2>
                  <p className="text-muted">Restricted access — System Administrators only</p>
                </div>

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4 form-floating">
                    <Form.Control
                      type="email"
                      id="adminEmail"
                      placeholder="admin@hostelhub.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                    <Form.Label htmlFor="adminEmail">Email address</Form.Label>
                  </Form.Group>

                  <Form.Group className="mb-5 form-floating">
                    <Form.Control
                      type="password"
                      id="adminPassword"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Form.Label htmlFor="adminPassword">Password</Form.Label>
                  </Form.Group>

                  <Button
                    type="submit"
                    variant="danger"
                    size="lg"
                    className="w-100 rounded-pill fw-bold py-3 shadow"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Login to Admin Panel
                      </>
                    )}
                  </Button>
                </Form>

                <p className="text-center mt-4 text-muted small">
                  Only one administrator account is active in the system.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default AdminLogin;