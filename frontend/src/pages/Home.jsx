// src/pages/Home.jsx
import { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import WhyChooseUs from '../components/WhyChooseUs';
import HostelCard from '../components/HostelCard';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Container, Row, Spinner } from 'react-bootstrap';

function Home() {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHostels = async () => {
      try {
        setLoading(true);

        const response = await api.get('/hostels');
        
        // Fix: extract the actual array
        const hostelArray = 
          Array.isArray(response.data) 
            ? response.data 
            : Array.isArray(response.data?.hostels) 
              ? response.data.hostels 
              : Array.isArray(response.data?.data) 
                ? response.data.data 
                : [];

        setHostels(hostelArray);
      } catch (err) {
        console.error("Failed to fetch hostels:", err); // optional debug
        setError(err.response?.data?.message || 'Failed to load hostels');
        toast.error('Failed to load featured hostels');
        setHostels([]); // prevent undefined crash
      } finally {
        setLoading(false);
      }
    };

    fetchHostels();
  }, []);

  // Now this is safe – hostels is always an array
  const topRatedHostels = [...hostels]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0)) // also protect against missing rating
    .slice(0, 4);

  return (
    <>
      <Hero />

      <section className="py-5 bg-light">
        <Container>
          {/* Featured Hostels */}
          <h2 className="fw-bold text-primary mb-4">
            <i className="bi bi-star-fill me-2"></i> Featured Hostels
          </h2>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <h5 className="mt-3">Loading featured hostels...</h5>
            </div>
          ) : error ? (
            <div className="text-center py-5">
              <h4 className="text-danger">{error}</h4>
            </div>
          ) : hostels.length === 0 ? (
            <div className="text-center py-5">
              <h5>No hostels available right now</h5>
            </div>
          ) : (
            <Row>
              {hostels.map((hostel) => (
                <HostelCard key={hostel._id} hostel={hostel} />
              ))}
            </Row>
          )}

          {/* Top-Rated Hostels */}
          <h2 className="fw-bold text-primary mt-5 mb-4">
            <i className="bi bi-trophy-fill me-2"></i> Top-Rated Hostels
          </h2>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : error ? (
            <div className="text-center py-5">
              <h4 className="text-danger">{error}</h4>
            </div>
          ) : topRatedHostels.length === 0 ? (
            <div className="text-center py-5">
              <h5>No top-rated hostels yet</h5>
            </div>
          ) : (
            <Row>
              {topRatedHostels.map((hostel) => (
                <HostelCard key={hostel._id} hostel={hostel} />
              ))}
            </Row>
          )}
        </Container>
      </section>

      <WhyChooseUs />
    </>
  );
}

export default Home;