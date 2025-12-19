// src/components/Hero.jsx
import { Container } from 'react-bootstrap';

function Hero() {
  return (
    <section className="hero">
      <Container className="h-100 d-flex align-items-center justify-content-center text-center">
        <div>
          <h1 className="display-4 fw-bold mb-4">Find Your Perfect Hostel Stay</h1>
          <p className="lead mb-5">Affordable, comfortable, and secure hostels near you</p>
          
          <div className="input-group input-group-lg shadow-lg rounded-pill overflow-hidden" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <input type="text" className="form-control border-0 ps-4" placeholder="Enter Location (e.g., Bangalore)" aria-label="Location" />
            <select className="form-select border-0" aria-label="Hostel Type">
              <option value="">All Types</option>
              <option value="boys">Boys Hostel</option>
              <option value="girls">Girls Hostel</option>
            </select>
            <input type="number" className="form-control border-0" placeholder="Max Price (₹)" aria-label="Price" />
            <button className="btn btn-primary px-5 fw-bold" type="button">
              <i className="bi bi-search me-2"></i> Search Hostels
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default Hero;