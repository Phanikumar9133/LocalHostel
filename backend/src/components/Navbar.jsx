// src/components/Navbar.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar as BSNavbar, Nav, Container } from 'react-bootstrap';

function Navbar({ isLoggedIn, userRole, handleLogout }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const closeMobileMenu = () => setExpanded(false);

  const onLogout = () => {
    handleLogout();
    closeMobileMenu();
    navigate('/');
  };

  return (
    <BSNavbar bg="white" expand="lg" expanded={expanded} className="shadow-sm py-3" fixed="top">
      <Container>
        {/* Logo */}
        <BSNavbar.Brand as={Link} to="/">
          <img
            src="/src/assets/hotel.png"
            alt="HostelHub"
            height="48"
            className="d-inline-block align-top"
          />
        </BSNavbar.Brand>

        {/* Hamburger Toggle */}
        <BSNavbar.Toggle
          aria-controls="basic-navbar-nav"
          onClick={() => setExpanded(expanded ? false : 'expanded')}
        >
          <i className="bi bi-list fs-3 text-primary"></i>
        </BSNavbar.Toggle>

        {/* Navigation Links */}
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            {/* Main Links - Uniform Style */}
            <Nav.Link as={Link} to="/" className="nav-item-custom" onClick={closeMobileMenu}>
              Home
            </Nav.Link>
            <Nav.Link as={Link} to="/hostels" className="nav-item-custom" onClick={closeMobileMenu}>
              Hostels
            </Nav.Link>
            <Nav.Link as={Link} to="/about" className="nav-item-custom" onClick={closeMobileMenu}>
              About
            </Nav.Link>
            <Nav.Link as={Link} to="/contact" className="nav-item-custom" onClick={closeMobileMenu}>
              Contact
            </Nav.Link>

            {/* Auth Section - Consistent Buttons */}
            {!isLoggedIn ? (
              <>
                <Nav.Link
                  as={Link}
                  to="/login"
                  className="nav-btn-outline mx-2"
                  onClick={closeMobileMenu}
                >
                  Login
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/register"
                  className="nav-btn-primary mx-2"
                  onClick={closeMobileMenu}
                >
                  Register
                </Nav.Link>
              </>
            ) : (
              <>
                {userRole === 'owner' && (
                  <Nav.Link
                    as={Link}
                    to="/owner-dashboard"
                    className="nav-item-custom"
                    onClick={closeMobileMenu}
                  >
                    Owner Dashboard
                  </Nav.Link>
                )}
                <Nav.Link
                  as={Link}
                  to="/profile"
                  className="nav-item-custom"
                  onClick={closeMobileMenu}
                >
                  Profile
                </Nav.Link>
                <Nav.Link
                  onClick={onLogout}
                  className="nav-item-custom text-danger fw-semibold"
                >
                  Logout
                </Nav.Link>
              </>
            )}
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
}

export default Navbar;