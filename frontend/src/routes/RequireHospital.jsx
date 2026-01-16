import React from "react";
import { Navigate } from "react-router-dom";
import { useHospital } from "../context/HospitalContext";
import ProtectedRoutes from "./ProtectedRoutes";

const RequireHospital = ({ children }) => {
  const { hospital, loading } = useHospital();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600 font-medium">Loading...</p>
      </div>
    );
  }

  if (!hospital) {
    return <Navigate to="/setup-hospital" replace />;
  }

  return <ProtectedRoutes>{children}</ProtectedRoutes>;
};

export default RequireHospital;
