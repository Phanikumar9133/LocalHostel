// src/components/HostelCard.jsx
import { Link } from 'react-router-dom';
import { Card } from 'react-bootstrap';

function HostelCard({ hostel }) {
  const fullStars = Math.floor(hostel.rating);
  const emptyStars = 5 - fullStars;

  return (
    <div className="col-lg-4 col-md-6 mb-5">
      <Card className="h-100 border-0 overflow-hidden">
        <div className="position-relative overflow-hidden">
          <img 
            src={hostel.images[0]} 
            className="card-img-top" 
            alt={hostel.name} 
            style={{ height: '250px', objectFit: 'cover' }} 
          />
          <div className="position-absolute top-0 end-0 m-3 bg-success text-white px-3 py-1 rounded-pill small fw-bold">
            {hostel.availableSeats} Seats Left
          </div>
        </div>
        <Card.Body className="d-flex flex-column p-4">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <Card.Title className="mb-0 fw-bold">{hostel.name}</Card.Title>
            <span className="badge bg-primary fs-6">{hostel.type.split(' ')[0]}</span>
          </div>
          <Card.Text className="text-muted small">
            <i className="bi bi-geo-alt-fill me-1"></i> {hostel.location}
          </Card.Text>
          
          <div className="mt-auto">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <span className="h4 fw-bold text-primary">₹{hostel.price}</span>
                <small className="text-muted"> / seat</small>
              </div>
              <div className="text-warning fw-bold">
                {'★'.repeat(fullStars)}{'☆'.repeat(emptyStars)} <span className="text-dark small">{hostel.rating}</span>
              </div>
            </div>
            <Link to={`/hostel/${hostel.id}`} className="btn btn-primary w-100 rounded-pill fw-bold">
              View Details <i className="bi bi-arrow-right ms-2"></i>
            </Link>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}

export default HostelCard;