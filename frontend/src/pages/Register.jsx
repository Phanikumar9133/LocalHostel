// src/pages/Register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Container, Row, Col, Form, Button, Spinner } from 'react-bootstrap';

function Register({ handleLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
        role,
        phone,
      });

      const { success, token, user } = response.data;

      if (success) {
        // Store token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('userRole', user.role);

        // Update parent state
        handleLogin(user.role);

        toast.success('Registration successful! Welcome to HostelHub!');
        navigate('/');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-section min-vh-100 d-flex align-items-center">
      <Container>
        <Row className="justify-content-center">
          <Col lg={5} md={7}>
            <div className="glass-card p-5 rounded-4 shadow-lg">
              {/* Logo & Title */}
              <div className="text-center mb-5">
                <img
                  src="/src/assets/hotel.png"
                  alt="HostelHub"
                  height="60"
                  className="mb-4"
                />
                <h2 className="fw-bold text-success">Create Account</h2>
                <p className="text-muted">Join thousands of students finding their perfect stay</p>
              </div>

              <Form onSubmit={handleSubmit}>
                {/* Name */}
                <div className="form-floating mb-4">
                  <input
                    type="text"
                    className="form-control stylish-input"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <label>Name</label>
                </div>

                {/* Email */}
                <div className="form-floating mb-4">
                  <input
                    type="email"
                    className="form-control stylish-input"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <label>Email Address</label>
                </div>

                {/* Password */}
                <div className="form-floating mb-4">
                  <input
                    type="password"
                    className="form-control stylish-input"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <label>Password</label>
                </div>

                {/* Phone */}
                <div className="form-floating mb-4">
                  <input
                    type="tel"
                    className="form-control stylish-input"
                    placeholder="Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <label>Phone (optional)</label>
                </div>

                {/* Role Selection */}
                <div className="mb-4">
                  <label className="form-label fw-bold text-dark">I am registering as:</label>
                  <div className="d-flex gap-4 justify-content-center">
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="userRole"
                        value="user"
                        checked={role === 'user'}
                        onChange={(e) => setRole(e.target.value)}
                      />
                      <label className="form-check-label fw-medium" htmlFor="userRole">
                        <i className="bi bi-person me-2 text-primary"></i> Student / User
                      </label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="ownerRole"
                        value="owner"
                        checked={role === 'owner'}
                        onChange={(e) => setRole(e.target.value)}
                      />
                      <label className="form-check-label fw-medium" htmlFor="ownerRole">
                        <i className="bi bi-building me-2 text-success"></i> Hostel Owner
                      </label>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="btn-success w-100 py-3 rounded-pill fw-bold mb-4 shadow"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-person-plus me-2"></i> Create Account
                    </>
                  )}
                </Button>

                {/* Divider */}
                <div className="text-center my-4 text-muted">OR</div>

                {/* Social Signup (placeholders) */}
                <div className="d-grid gap-3">
                  <Button variant="outline-danger" className="rounded-pill py-3" disabled>
                    <i className="bi bi-google me-2"></i> Sign up with Google
                  </Button>
                </div>

                {/* Login Link */}
                <p className="text-center mt-4 text-muted">
                  Already have an account?{' '}
                  <Link to="/login" className="text-success fw-bold text-decoration-none">
                    Login Here
                  </Link>
                </p>
              </Form>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}

export default Register;