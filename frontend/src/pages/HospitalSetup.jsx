import React, { useState } from "react";
import { auth, db } from "@/firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  setDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useHospital } from "@/context/HospitalContext";

export default function HospitalSetup() {
  const navigate = useNavigate();
  const { refreshHospital } = useHospital();

  // Hospital Form
  const [formData, setFormData] = useState({
    hospital_name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    number_of_beds: "",
    icu_beds: "",
    emergency_beds: "",
    operating_rooms: "",
  });

  const [numDoctors, setNumDoctors] = useState(1);
  const [doctors, setDoctors] = useState([{ name: "", department: "" }]);

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleNumDoctorsChange = (e) => {
    const value = Math.max(1, Number(e.target.value || 1));
    setNumDoctors(value);

    setDoctors((prev) => {
      const updated = [...prev];

      if (value > updated.length) {
        while (updated.length < value) updated.push({ name: "", department: "" });
      } else {
        updated.length = value;
      }

      return updated;
    });
  };

  const handleDoctorChange = (index, field, value) => {
    setDoctors((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      toast.error("You must be logged in to setup hospital");
      return;
    }

    // basic validation
    if (doctors.some((s) => !s.name.trim() || !s.department.trim())) {
      toast.error("Please fill doctor name + department for all doctors");
      return;
    }

    setLoading(true);

    try {
      // Save hospital document
      const hospitalRef = await addDoc(collection(db, "hospitals"), {
        ...formData,
        number_of_beds: Number(formData.number_of_beds),
        icu_beds: Number(formData.icu_beds),
        emergency_beds: Number(formData.emergency_beds),
        operating_rooms: Number(formData.operating_rooms),

        admin_uid: user.uid,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Save doctors inside subcollection
      for (const doctor of doctors) {
        await addDoc(collection(db, "hospitals", hospitalRef.id, "surgeons"), {
          name: doctor.name.trim(),
          department: doctor.department.trim(),
          createdAt: serverTimestamp(),
        });
      }

      toast.success("Hospital setup saved");

      // refresh context
      await refreshHospital();

      navigate("/dashboard");
    } catch (err) {
      console.error("Setup error:", err);
      toast.error(err.message || "Failed to setup hospital");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 p-6 mt-12 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-3xl bg-white border border-slate-200 rounded-xl shadow-sm p-8 space-y-8"
      >
        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Hospital Setup
          </h1>
          <p className="text-slate-500 mt-1">
            Enter your hospital details to configure the system
          </p>
        </div>

        {/* HOSPITAL DETAILS */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Hospital Details</h2>

          <input
            name="hospital_name"
            placeholder="Hospital Name"
            value={formData.hospital_name}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-4 py-2"
            required
          />

          <input
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-4 py-2"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-4 py-2"
              required
            />
            <input
              name="state"
              placeholder="State"
              value={formData.state}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-4 py-2"
              required
            />
          </div>

          <input
            name="pincode"
            placeholder="Pincode"
            value={formData.pincode}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-4 py-2"
            required
          />
        </div>

        {/* RESOURCES */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            Hospital Resources
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              name="number_of_beds"
              type="number"
              placeholder="Total Beds"
              value={formData.number_of_beds}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-4 py-2"
              required
            />
            <input
              name="icu_beds"
              type="number"
              placeholder="ICU Beds"
              value={formData.icu_beds}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-4 py-2"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              name="emergency_beds"
              type="number"
              placeholder="Emergency Beds"
              value={formData.emergency_beds}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-4 py-2"
              required
            />
            <input
              name="operating_rooms"
              type="number"
              placeholder="Number of Operating Rooms"
              value={formData.operating_rooms}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-4 py-2"
              required
            />
          </div>
        </div>

        {/* DOCTOR SETUP */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Doctor Setup</h2>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">
              Number of Doctors
            </label>
            <input
              type="number"
              min={1}
              value={numDoctors}
              onChange={handleNumDoctorsChange}
              className="w-full border border-slate-300 rounded-lg px-4 py-2"
            />
          </div>

          <div className="space-y-4">
            {doctors.map((s, index) => (
              <div
                key={index}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border border-slate-200 rounded-lg bg-slate-50"
              >
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">
                    Doctor Name
                  </label>
                  <input
                    type="text"
                    value={s.name}
                    onChange={(e) =>
                      handleDoctorChange(index, "name", e.target.value)
                    }
                    placeholder="Dr. Smith"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={s.department}
                    onChange={(e) =>
                      handleDoctorChange(index, "department", e.target.value)
                    }
                    placeholder="Cardiology"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Hospital Setup"}
        </button>
      </form>
    </div>
  );
}
