import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar/Navbar';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Thomas from './pages/Thomas';
import NameDraw from './pages/NameDraw';

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
        <Route path="/" element={<Home />} />
        <Route path="/Thomas" element={<Thomas />} />
        <Route path="/NameDraw" element={<NameDraw selectedUserId={selectedUserId} />} />
      </Routes>
    </Router>
  );
}

export default App;
