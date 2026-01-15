import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from './pages/Dashboard';
import SurgicalScheduling from './pages/SurgicalScheduling';
import Login from "./pages/Login";
import Navbar from "./components/Navbar";
import ProtectedRoutes from './routes/ProtectedRoutes';
import LandingPage from './pages/Landing';
import Register from './pages/Register';
import { Toaster } from 'sonner';

function App() {
  return (
    <Router>
      <Navbar />
      <Toaster richColors position="bottom-right" />

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />


        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoutes>
              <Dashboard />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/scheduling"
          element={
            <ProtectedRoutes>
              <SurgicalScheduling />
            </ProtectedRoutes>
          }
        />

        {/* Default Redirect */}
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}

export default App;
