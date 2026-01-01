// src/components/HostelCard.jsx
import { Link } from 'react-router-dom';
import { Card, Badge } from 'react-bootstrap';

// Backend base URL (change if your domain changes)
const API_BASE_URL = 'https://localhostel.onrender.com';

function HostelCard({ hostel }) {
  // Handle rating safely
  const rating = hostel.rating || 0;
  const fullStars = Math.floor(rating);
  const emptyStars = 5 - fullStars;

  // Use full URL for images with a reliable fallback
  const imageSrc = hostel.images?.length > 0 
    ? `${API_BASE_URL}${hostel.images[0]}`  // Add base URL to relative path
    : 'https://picsum.photos/seed/hostel/400/250';  // Reliable placeholder (random image)

  return (
    <div className="col-lg-4 col-md-6 mb-5">
      <Card className="h-100 border-0 overflow-hidden shadow-sm hover-lift">
        <div className="position-relative overflow-hidden">
          <img
            src={imageSrc}
            className="card-img-top"
            alt={hostel.name || 'Hostel'}
            style={{ height: '250px', objectFit: 'cover' }}
            onError={(e) => {
              e.target.onerror = null;  // Prevent infinite loop
              e.target.src = 'https://picsum.photos/seed/fallback/400/250';  // Reliable fallback
            }}
          />
          <div className="position-absolute top-0 end-0 m-3 bg-success text-white px-3 py-1 rounded-pill small fw-bold">
            {hostel.availableSeats || 0} Seats Left
          </div>
        </div>
        <Card.Body className="d-flex flex-column p-4">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <Card.Title className="mb-0 fw-bold">{hostel.name || 'Unnamed Hostel'}</Card.Title>
            <Badge bg="primary" className="fs-6">
              {hostel.type?.split(' ')[0] || 'N/A'} {/* e.g., "Boys" or "Girls" */}
            </Badge>
          </div>

          <Card.Text className="text-muted small mb-3">
            <i className="bi bi-geo-alt-fill me-1"></i> {hostel.location || 'N/A'}
          </Card.Text>

          <div className="mt-auto">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <span className="h4 fw-bold text-primary">₹{hostel.price || 'N/A'}</span>
                <small className="text-muted"> / seat</small>
              </div>
              <div className="text-warning fw-bold">
                {'★'.repeat(fullStars)}
                {'☆'.repeat(emptyStars)}
                <span className="text-dark small ms-1">({rating.toFixed(1)})</span>
              </div>
            </div>

            <Link
              to={`/hostel/${hostel._id}`}
              className="btn btn-primary w-100 rounded-pill fw-bold shadow-sm"
            >
              View Details <i className="bi bi-arrow-right ms-2"></i>
            </Link>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}

export default HostelCard;