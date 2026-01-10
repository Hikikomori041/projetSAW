import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Channels from './pages/Channels';
import TestDaisy from './components/TestDaisy';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/channels" element={<Channels />} />
        <Route path="/dashboard" element={<Navigate to="/channels" replace />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/test" element={<TestDaisy />} />
      </Routes>
    </Router>
  );
}

export default App;