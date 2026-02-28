import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useHospital } from "../context/HospitalContext";

const AppRedirect = () => {
  const { hospital, loading, userRole } = useHospital();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (userRole === "doctor" && hospital) {
      navigate("/doctor-dashboard", { replace: true });
    } else if (hospital) {
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/setup-hospital", { replace: true });
    }
  }, [hospital, loading, userRole, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-slate-600 font-medium">Redirecting...</p>
    </div>
  );
};

export default AppRedirect;
