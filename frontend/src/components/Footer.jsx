// Footer.jsx
function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="row">
          <div className="col-md-3">
            <h5>About the Platform</h5>
            <p>HostelHub is your go-to for finding perfect hostels.</p>
          </div>
          <div className="col-md-3">
            <h5>Quick Links</h5>
            <ul className="list-unstyled">
              <li><a href="/">Home</a></li>
              <li><a href="/hostels">Hostels</a></li>
              <li><a href="/about">About</a></li>
            </ul>
          </div>
          <div className="col-md-3">
            <h5>Support</h5>
            <ul className="list-unstyled">
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms & Conditions</a></li>
            </ul>
          </div>
          <div className="col-md-3">
            <h5>Contact</h5>
            <p>Email: support@hostelhub.com<br />Phone: +91 1234567890</p>
            <div>
              <i className="bi bi-facebook me-2"></i>
              <i className="bi bi-twitter me-2"></i>
              <i className="bi bi-instagram"></i>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;