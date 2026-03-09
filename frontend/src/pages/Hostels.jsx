// src/pages/Hostels.jsx
import { useState, useEffect } from 'react';
import HostelCard from '../components/HostelCard';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Container, Row, Col, Spinner } from 'react-bootstrap';

function Hostels() {
  const [hostels, setHostels] = useState([]);           // always array
  const [filteredHostels, setFilteredHostels] = useState([]);
  const [filters, setFilters] = useState({
    location: '',
    type: '',
    price: '',
  });
  const [loading, setLoading] = useState(true);

  // Fetch all hostels from backend
  useEffect(() => {
    const fetchHostels = async () => {
      try {
        setLoading(true);
        const response = await api.get('/hostels');

        // ──── IMPORTANT FIX ────
        // Extract the real array – handle different possible response shapes
        let hostelArray = [];

        if (Array.isArray(response.data)) {
          hostelArray = response.data;
        } else if (Array.isArray(response.data?.hostels)) {
          hostelArray = response.data.hostels;
        } else if (Array.isArray(response.data?.data)) {
          hostelArray = response.data.data;
        } else {
          console.warn('Unexpected hostel response format:', response.data);
          hostelArray = [];
        }

        setHostels(hostelArray);
        setFilteredHostels(hostelArray); // Initial display = all hostels

      } catch (err) {
        console.error('Failed to fetch hostels:', err);
        toast.error('Failed to load hostels');
        setHostels([]);
        setFilteredHostels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHostels();
  }, []);

  // Apply filters whenever filters or hostels change
  useEffect(() => {
    // Start with full list (safe because it's always an array now)
    let result = [...hostels];

    // Filter by location (case-insensitive)
    if (filters.location.trim()) {
      const search = filters.location.trim().toLowerCase();
      result = result.filter(hostel =>
        hostel.location?.toLowerCase().includes(search)
      );
    }

    // Filter by type
    if (filters.type) {
      result = result.filter(hostel => hostel.type === filters.type);
    }

    // Filter by max price (convert to number safely)
    if (filters.price) {
      const maxPrice = Number(filters.price);
      if (!isNaN(maxPrice)) {
        result = result.filter(hostel => Number(hostel.price) <= maxPrice);
      }
    }

    setFilteredHostels(result);
  }, [filters, hostels]);

  return (
    <section className="py-5 bg-light">
      <Container>
        <h2 className="fw-bold text-primary mb-4">
          <i className="bi bi-house-door-fill me-2"></i> Hostel Listings
        </h2>

        {/* Filters */}
        <Row className="mb-5 g-3">
          <Col md={3}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by Location (e.g., Guntur)"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />
          </Col>

          <Col md={3}>
            <select
              className="form-select"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">All Hostel Types</option>
              <option value="Boys Hostel">Boys Hostel</option>
              <option value="Girls Hostel">Girls Hostel</option>
            </select>
          </Col>

          <Col md={3}>
            <input
              type="number"
              className="form-control"
              placeholder="Max Price (₹)"
              value={filters.price}
              onChange={(e) => setFilters({ ...filters, price: e.target.value })}
            />
          </Col>

          <Col md={3}>
            <button
              className="btn btn-primary w-100"
              onClick={() => setFilters({ location: '', type: '', price: '' })}
            >
              Reset Filters
            </button>
          </Col>
        </Row>

        {/* Hostel List */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <h5 className="mt-3">Loading hostels...</h5>
          </div>
        ) : filteredHostels.length > 0 ? (
          <Row>
            {filteredHostels.map((hostel) => (
              <HostelCard key={hostel._id} hostel={hostel} />
            ))}
          </Row>
        ) : (
          <div className="text-center py-5">
            <h4 className="text-muted">No hostels found matching your filters</h4>
            <p className="text-muted">Try adjusting your search or reset filters.</p>
          </div>
        )}
      </Container>
    </section>
  );
}

export default Hostels;