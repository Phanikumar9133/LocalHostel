// Home.jsx
import Hero from '../components/Hero';
import WhyChooseUs from '../components/WhyChooseUs';
import HostelCard from '../components/HostelCard';
import { sampleHostels } from '../data/sampleHostels';

function Home() {
  return (
    <>
      <Hero />
      <section className="py-5">
        <div className="container">
          <h2>Featured Hostels</h2>
          <div className="row">
            {sampleHostels.map(hostel => <HostelCard key={hostel.id} hostel={hostel} />)}
          </div>
          <h2 className="mt-5">Top-Rated Hostels</h2>
          <div className="row">
            {sampleHostels.slice(0, 2).map(hostel => <HostelCard key={hostel.id} hostel={hostel} />)} {/* Mock top-rated */}
          </div>
        </div>
      </section>
      <WhyChooseUs />
    </>
  );
}

export default Home;