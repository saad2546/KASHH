import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import HospitalSetup from "./pages/HospitalSetup";
import Dashboard from "./pages/Dashboard";
import PatientFlow from "./pages/PatientFlow";
import SurgicalScheduling from "./pages/SurgicalScheduling";
import PharamcyInventory from "./pages/PharmacyInventory";
import ProtectedRoutes from "./routes/ProtectedRoutes";
import RequireHospital from "./routes/RequireHospital"; 
import AppRedirect from "./pages/AppRedirect"; 
import { HospitalProvider } from "./context/HospitalContext";


function App() {
  return (
    <HospitalProvider>
      <Router>
        <Navbar />
        <Toaster richColors position="bottom-right" />

        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* AUTH ENTRY POINT */}
          <Route
            path="/app"
            element={
              <ProtectedRoutes>
                <AppRedirect />
              </ProtectedRoutes>
            }
          />

          {/* SETUP (auth only) */}
          <Route
            path="/setup-hospital"
            element={
              <ProtectedRoutes>
                <HospitalSetup />
              </ProtectedRoutes>
            }
          />

          {/* HOSPITAL PROTECTED ROUTES */}
          <Route
            path="/dashboard"
            element={
              <RequireHospital>
                <Dashboard />
              </RequireHospital>
            }
          />

           <Route
            path="/patient-flow"
            element={
              <RequireHospital>
                <PatientFlow />
              </RequireHospital>
            }
          />

          <Route
            path="/scheduling"
            element={
              <RequireHospital>
                <SurgicalScheduling />
              </RequireHospital>
            }
          />

          <Route
            path="/inventory"
            element={
              <RequireHospital>
                <PharamcyInventory />
              </RequireHospital>
            }
          />
        </Routes>
      </Router>
    </HospitalProvider>
  );
}

export default App;
