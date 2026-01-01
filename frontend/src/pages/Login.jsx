// src/pages/Login.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Container, Row, Col, Form, Button, Spinner } from 'react-bootstrap';

function Login({ handleLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // 'user' or 'owner'
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const { success, token, user } = response.data;

      if (success) {
        // Store token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('userRole', user.role);

        // Update parent state
        handleLogin(user.role);

        toast.success('Login successful! Welcome back.');
        navigate('/');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Login failed. Please try again.';
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
                <h2 className="fw-bold text-primary">Welcome Back!</h2>
                <p className="text-muted">Log in to continue to your account</p>
              </div>

              {/* Role Toggle */}
              <div className="text-center mb-5">
                <div className="role-toggle d-inline-flex align-items-center bg-light p-1 rounded-pill shadow-sm">
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-pill fw-bold ${
                      role === 'user' ? 'active-role' : 'text-muted'
                    }`}
                    onClick={() => setRole('user')}
                  >
                    <i className="bi bi-person-standing me-2"></i>
                    Student
                  </button>

                  <button
                    type="button"
                    className={`px-4 py-2 rounded-pill fw-bold ${
                      role === 'owner' ? 'active-role' : 'text-muted'
                    }`}
                    onClick={() => setRole('owner')}
                  >
                    <i className="bi bi-building me-2"></i>
                    Hostel Owner
                  </button>
                </div>

                <p className="mt-3 small text-muted">
                  Currently logging in as:{' '}
                  <strong>{role === 'owner' ? 'Hostel Owner' : 'Student'}</strong>
                </p>
              </div>

              {/* Login Form */}
              <Form onSubmit={handleSubmit}>
                {/* Email */}
                <div className="form-floating mb-4">
                  <input
                    type="email"
                    className="form-control stylish-input"
                    id="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <label htmlFor="email">
                    <i className="bi bi-envelope me-2"></i>
                    Email Address
                  </label>
                </div>

                {/* Password */}
                <div className="form-floating mb-4">
                  <input
                    type="password"
                    className="form-control stylish-input"
                    id="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <label htmlFor="password">
                    <i className="bi bi-lock me-2"></i>
                    Password
                  </label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="btn-primary w-100 py-3 rounded-pill fw-bold mb-4 shadow"
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
                      Logging in...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      {role === 'owner' ? 'Login as Owner' : 'Login as Student'}
                    </>
                  )}
                </Button>

                {/* Divider */}
                <div className="text-center my-4 text-muted">OR</div>

                {/* Social Login (placeholders) */}
                <div className="d-grid gap-3">
                  <Button variant="outline-danger" className="rounded-pill py-3" disabled>
                    <i className="bi bi-google me-2"></i>
                    Continue with Google
                  </Button>
                  <Button variant="outline-primary" className="rounded-pill py-3" disabled>
                    <i className="bi bi-facebook me-2"></i>
                    Continue with Facebook
                  </Button>
                </div>

                {/* Register Link */}
                <p className="text-center mt-4 text-muted">
                  Don&apos;t have an account?{' '}
                  <Link to="/register" className="text-primary fw-bold text-decoration-none">
                    Register Now
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

export default Login;