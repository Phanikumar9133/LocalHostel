// src/components/WhyChooseUs.jsx
import { Container, Row, Col } from 'react-bootstrap';

function WhyChooseUs() {
  const features = [
    {
      icon: "bi-shield-check",
      title: "100% Safe & Secure",
      desc: "Verified hostels with 24/7 security and CCTV"
    },
    {
      icon: "bi-currency-rupee",
      title: "Best Price Guarantee",
      desc: "Most affordable rates with no hidden charges"
    },
    {
      icon: "bi-headset",
      title: "24/7 Customer Support",
      desc: "We're here to help you anytime"
    },
    {
      icon: "bi-check-circle",
      title: "Easy Booking Process",
      desc: "Book in seconds with instant confirmation"
    },
    {
      icon: "bi-star-fill",
      title: "Verified Reviews",
      desc: "Real feedback from real students"
    },
    {
      icon: "bi-truck",
      title: "Hassle-Free Moving",
      desc: "Food, laundry & all amenities included"
    }
  ];

  return (
    <section className="py-5 bg-light">
      <Container>
        <div className="text-center mb-5">
          <h2>Why Choose HostelHub?</h2>
          <p className="lead text-muted">Thousands of students trust us for their perfect stay</p>
        </div>
        <Row>
          {features.map((feature, index) => (
            <Col md={4} className="mb-4" key={index}>
              <div className="icon-box text-center p-4 h-100 rounded-4">
                <i className={`bi ${feature.icon} text-primary mb-4`} style={{ fontSize: '3.5rem' }}></i>
                <h5 className="fw-bold mb-3">{feature.title}</h5>
                <p className="text-muted">{feature.desc}</p>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
}

export default WhyChooseUs;