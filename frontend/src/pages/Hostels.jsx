// Hostels.jsx
import { useState } from 'react';
import HostelCard from '../components/HostelCard';
import { sampleHostels } from '../data/sampleHostels';

function Hostels() {
  const [filters, setFilters] = useState({ location: '', type: '', price: '' });

  const filteredHostels = sampleHostels.filter(hostel => {
    return (
      (filters.location ? hostel.location.includes(filters.location) : true) &&
      (filters.type ? hostel.type === filters.type : true) &&
      (filters.price ? hostel.price <= filters.price : true)
    );
  });

  return (
    <section className="py-5">
      <div className="container">
        <h2>Hostel Listings</h2>
        <div className="row mb-4">
          <div className="col-md-3">
            <input type="text" className="form-control" placeholder="Location" onChange={e => setFilters({ ...filters, location: e.target.value })} />
          </div>
          <div className="col-md-3">
            <select className="form-select" onChange={e => setFilters({ ...filters, type: e.target.value })}>
              <option value="">Hostel Type</option>
              <option>Boys Hostel</option>
              <option>Girls Hostel</option>
            </select>
          </div>
          <div className="col-md-3">
            <input type="number" className="form-control" placeholder="Max Price" onChange={e => setFilters({ ...filters, price: e.target.value })} />
          </div>
          <div className="col-md-3">
            <input type="date" className="form-control" placeholder="Availability" /> {/* Mock */}
          </div>
        </div>
        <div className="row">
          {filteredHostels.length > 0 ? (
            filteredHostels.map(hostel => <HostelCard key={hostel.id} hostel={hostel} />)
          ) : (
            <p>No hostels found.</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default Hostels;