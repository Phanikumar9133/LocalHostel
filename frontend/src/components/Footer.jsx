// src/components/Footer.jsx
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="footer bg-dark text-white py-5">
      <div className="container">
        <div className="row">
          <div className="col-md-3 mb-4">
            <h5 className="fw-bold">About HostelHub</h5>
            <p className="text-light">
              Your trusted platform to find the perfect hostel in Andhra Pradesh and beyond.
            </p>
          </div>

          <div className="col-md-3 mb-4">
            <h5 className="fw-bold">Quick Links</h5>
            <ul className="list-unstyled">
              <li><Link to="/" className="text-light text-decoration-none">Home</Link></li>
              <li><Link to="/hostels" className="text-light text-decoration-none">Find Hostels</Link></li>
              <li><Link to="/about" className="text-light text-decoration-none">About Us</Link></li>
            </ul>
          </div>

          <div className="col-md-3 mb-4">
            <h5 className="fw-bold">Support</h5>
            <ul className="list-unstyled">
              <li><Link to="/faq" className="text-light text-decoration-none">FAQ</Link></li>
              <li><Link to="/privacy" className="text-light text-decoration-none">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-light text-decoration-none">Terms & Conditions</Link></li>
            </ul>
          </div>

          <div className="col-md-3 mb-4">
            <h5 className="fw-bold">Admin & Contact</h5>
            <p className="text-light">
              Email: support@hostelhub.com<br />
              Phone: +91 98765 43210
            </p>
            <div className="social-icons mt-3">
              <i className="bi bi-facebook me-3 fs-4"></i>
              <i className="bi bi-twitter me-3 fs-4"></i>
              <i className="bi bi-instagram fs-4"></i>
            </div>

            {/* Admin link – visible to everyone */}
            <div className="mt-4">
              <Link 
                to="/admin-login" 
                className="btn btn-outline-light btn-sm rounded-pill px-4"
              >
                <i className="bi bi-shield-lock me-2"></i>
                Admin Dashboard
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center mt-4 pt-4 border-top border-secondary">
          <small>© {new Date().getFullYear()} HostelHub. All rights reserved.</small>
        </div>
      </div>
    </footer>
  );
}

export default Footer;