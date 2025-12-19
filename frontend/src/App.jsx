// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Hostels from './pages/Hostels';
import HostelDetails from './pages/HostelDetails';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import OwnerDashboard from './pages/OwnerDashboard';
import Profile from './pages/Profile';
import ToastNotification from './components/ToastNotification';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Check login status on app load
  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role) {
      setIsLoggedIn(true);
      setUserRole(role);
    }
  }, []);

  const handleLogin = (role) => {
    localStorage.setItem('userRole', role);
    setIsLoggedIn(true);
    setUserRole(role);
    triggerToast(`Welcome back! Logged in as ${role === 'owner' ? 'Hostel Owner' : 'Student'}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    setIsLoggedIn(false);
    setUserRole(null);
    triggerToast('Logged out successfully!');
  };

  const triggerToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <Router>
      <Navbar isLoggedIn={isLoggedIn} userRole={userRole} handleLogout={handleLogout} />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/hostels" element={<Hostels />} />
        
        {/* HostelDetails - Pass isLoggedIn and triggerToast */}
        <Route 
          path="/hostel/:id" 
          element={<HostelDetails triggerToast={triggerToast} isLoggedIn={isLoggedIn} />} 
        />

        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        {/* Login & Register - Redirect if already logged in */}
        <Route 
          path="/login" 
          element={isLoggedIn ? <Navigate to="/" /> : <Login handleLogin={handleLogin} />} 
        />
        <Route 
          path="/register" 
          element={isLoggedIn ? <Navigate to="/" /> : <Register handleLogin={handleLogin} />} 
        />

        {/* Owner Dashboard - Only for owners */}
        <Route 
          path="/owner-dashboard" 
          element={userRole === 'owner' ? <OwnerDashboard triggerToast={triggerToast} /> : <Navigate to="/login" />} 
        />

        {/* Profile - Only for logged-in users, with props */}
        <Route 
          path="/profile" 
          element={
            isLoggedIn 
              ? <Profile userRole={userRole} isLoggedIn={isLoggedIn} triggerToast={triggerToast} />
              : <Navigate to="/login" />
          } 
        />
      </Routes>

      <Footer />
      <ToastNotification show={showToast} message={toastMessage} />
    </Router>
  );
}

export default App;