import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar/Navbar';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Family from './pages/Family';
import NameDraw from './pages/NameDraw';
import Calendar from './pages/Calendar';

const SELECTED_USER_KEY = 'family-selected-user';

function App() {
  const [selectedUserId, setSelectedUserId] = useState(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    return window.localStorage.getItem(SELECTED_USER_KEY) || '';
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (!selectedUserId) {
      window.localStorage.removeItem(SELECTED_USER_KEY);
      return;
    }
    window.localStorage.setItem(SELECTED_USER_KEY, selectedUserId);
  }, [selectedUserId]);

  return (
    <Router>
      <Navbar selectedUserId={selectedUserId} onSelectUser={setSelectedUserId} />
      <Routes>
        <Route path="/" element={<Home selectedUserId={selectedUserId} />} />
        <Route path="/Family" element={<Family selectedUserId={selectedUserId} />} />
        <Route path="/NameDraw" element={<NameDraw selectedUserId={selectedUserId} />} />
        <Route path="/Calendar" element={<Calendar selectedUserId={selectedUserId} />} />
      </Routes>
    </Router>
  );
}

export default App;
