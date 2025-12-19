// src/pages/Register.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';

function Register({ handleLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin(role);
  };

  return (
    <section className="login-section min-vh-100 d-flex align-items-center">
      <Container>
        <Row className="justify-content-center">
          <Col lg={5} md={7}>
            <div className="glass-card p-5 rounded-4 shadow-lg">
              {/* Header */}
              <div className="text-center mb-5">
                <img src="/src/assets/hotel.png" alt="HostelHub" height="60" className="mb-4" />
                <h2 className="fw-bold text-success">Create Account</h2>
                <p className="text-muted">Join thousands of students finding their perfect stay</p>
              </div>

              <Form onSubmit={handleSubmit}>
                {/* Email */}
                <div className="form-floating mb-4">
                  <input
                    type="email"
                    className="form-control stylish-input"
                    id="reg-email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <label htmlFor="reg-email">
                    <i className="bi bi-envelope me-2"></i> Email Address
                  </label>
                </div>

                {/* Password */}
                <div className="form-floating mb-4">
                  <input
                    type="password"
                    className="form-control stylish-input"
                    id="reg-password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <label htmlFor="reg-password">
                    <i className="bi bi-lock me-2"></i> Create Password
                  </label>
                </div>

                {/* Role Selection - Stylish Toggle */}
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

                {/* Submit */}
                <Button
                  type="submit"
                  className="btn-success w-100 py-3 rounded-pill fw-bold mb-4 shadow"
                  size="lg"
                >
                  <i className="bi bi-person-plus me-2"></i> Create Account
                </Button>

                {/* Divider */}
                <div className="text-center my-4 text-muted">OR</div>

                {/* Social */}
                <div className="d-grid gap-3">
                  <Button variant="outline-danger" className="rounded-pill py-3">
                    <i className="bi bi-google me-2"></i> Sign up with Google
                  </Button>
                </div>

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