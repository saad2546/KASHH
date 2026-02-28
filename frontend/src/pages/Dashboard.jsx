import React, { useEffect, useMemo, useState } from "react";
import {
  BedDouble,
  Hospital,
  Activity,
  Building2,
  UserRound,
  Stethoscope,
  Loader2,
  UserPlus,
  X
} from "lucide-react";

import { collection, onSnapshot, query, orderBy, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, firebaseConfig } from "@/firebase";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { toast } from "sonner";

import { useHospital } from "@/context/HospitalContext";

const StatCard = ({ title, value, subtext, icon: Icon, badge }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </p>

          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {value ?? "-"}
          </p>

          {subtext && (
            <p className="text-sm text-slate-500 mt-1 font-medium">{subtext}</p>
          )}
        </div>

        <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
          <Icon size={20} className="text-blue-600" />
        </div>
      </div>

      {badge && (
        <div className="mt-4">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {badge}
          </span>
        </div>
      )}
    </div>
  );
};

const DoctorRow = ({ doctor }) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center">
          <UserRound size={18} className="text-purple-600" />
        </div>

        <div>
          <p className="font-semibold text-slate-900 text-sm">
            {doctor.name || "Unnamed Doctor"}
          </p>
          <p className="text-xs text-slate-500 font-medium">
            {doctor.department || "Department not set"}
          </p>
        </div>
      </div>

      <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
        Doctor
      </span>
    </div>
  );
};

export default function Dashboard() {
  const { hospital, loading } = useHospital();

  // Doctors (subcollection)
  const [doctors, setDoctors] = useState([]);
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [newDoctor, setNewDoctor] = useState({ name: "", specialization: "" });
  const [addingDoctor, setAddingDoctor] = useState(false);

  const doctorCount = doctors.length;

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    if (!newDoctor.name || !newDoctor.specialization) {
      toast.error("Please fill in both name and specialization");
      return;
    }
    setAddingDoctor(true);
    try {
      // 1. Generate dummy email and password
      const cleanName = newDoctor.name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      const randomNum = Math.floor(Math.random() * 10000);
      const email = `${cleanName}${randomNum}@pulseops.com`;
      const password = `Doc@${randomNum}!`; // Secure default password

      // 2. Secondary Firebase App to avoid logging out current admin
      const appName = `SecondaryApp_${Date.now()}`;
      const secondaryApp = initializeApp(firebaseConfig, appName);
      const secondaryAuth = getAuth(secondaryApp);

      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const uid = userCredential.user.uid;

      // 3. Save to Global Users collection
      await setDoc(doc(db, "users", uid), {
        createdAt: serverTimestamp(),
        email: email,
        hospitalId: hospital.id,
        name: `Dr. ${newDoctor.name}`,
        role: "doctor",
        specialization: newDoctor.specialization,
        uid: uid
      });

      // 4. Save to Hospital Surgeons subcollection
      await setDoc(doc(db, "hospitals", hospital.id, "surgeons", uid), {
        name: `Dr. ${newDoctor.name}`,
        department: newDoctor.specialization,
        status: "available"
      });

      toast.success(
        <div>
          <p className="font-bold">Doctor Registered Successfully!</p>
          <p className="mt-1 text-xs">Email: {email}</p>
          <p className="text-xs">Password: {password}</p>
          <p className="text-xs mt-1 text-blue-800">Please provide these to the doctor safely!</p>
        </div>,
        { duration: 15000 }
      );

      setShowAddDoctor(false);
      setNewDoctor({ name: "", specialization: "" });
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to add doctor");
    } finally {
      setAddingDoctor(false);
    }
  };

  // Real-time doctors fetch
  useEffect(() => {
    if (loading) return;
    if (!hospital?.id) return;

    const surgeonsRef = collection(db, "hospitals", hospital.id, "surgeons");
    const q = query(surgeonsRef, orderBy("name", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setDoctors(list);
      },
      (error) => {
        console.error("Doctors listener error:", error);
      }
    );

    return () => unsubscribe();
  }, [hospital?.id, loading]);

  // Labels (small smart badges)
  const bedsBadge = useMemo(() => {
    const totalBeds = Number(hospital?.number_of_beds || 0);
    if (!totalBeds) return null;
    if (totalBeds >= 300) return "Large hospital";
    if (totalBeds >= 100) return "Mid-size hospital";
    return "Small facility";
  }, [hospital?.number_of_beds]);

  const icuBadge = useMemo(() => {
    const icu = Number(hospital?.icu_beds || 0);
    if (!icu) return null;
    return icu >= 25 ? "Healthy ICU capacity" : "Limited ICU capacity";
  }, [hospital?.icu_beds]);

  const emergencyBadge = useMemo(() => {
    const e = Number(hospital?.emergency_beds || 0);
    if (!e) return null;
    return e >= 15 ? "Emergency ready" : "Emergency tight";
  }, [hospital?.emergency_beds]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 font-medium">Loading hospital dashboard...</p>
      </div>
    );
  }

  // No hospital configured
  if (!hospital) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center px-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-lg w-full text-center">
          <h2 className="text-xl font-extrabold text-slate-900">
            Hospital not configured
          </h2>
          <p className="text-slate-500 mt-2">
            Please complete hospital setup to access dashboard analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* HEADER */}
        <header className="mt-10">
          <div className="flex items-center gap-2 mb-2">
            <Hospital size={20} className="text-blue-600" />
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Hospital Dashboard
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {hospital.hospital_name}
              </h1>

              <p className="text-slate-500 font-medium mt-1">
                {hospital.address}, {hospital.city}, {hospital.state}{" "}
                {hospital.pincode ? `- ${hospital.pincode}` : ""}
              </p>
            </div>

            <div className="flex gap-3">
              <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-xs font-bold text-blue-700 uppercase">
                  Operating Rooms
                </p>
                <p className="text-lg font-extrabold text-blue-900">
                  {hospital.operating_rooms ?? "-"}
                </p>
              </div>

              <div className="px-4 py-2 bg-slate-900 rounded-lg text-white">
                <p className="text-xs font-bold uppercase text-white/80">
                  Doctors
                </p>
                <p className="text-lg font-extrabold">{doctorCount}</p>
              </div>
            </div>
          </div>
        </header>

        {/* KPI GRID */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Beds"
            value={hospital.number_of_beds ?? 0}
            subtext="Total capacity"
            icon={BedDouble}
            badge={bedsBadge}
          />

          <StatCard
            title="ICU Beds"
            value={hospital.icu_beds ?? 0}
            subtext="Critical care beds"
            icon={Activity}
            badge={icuBadge}
          />

          <StatCard
            title="Emergency Beds"
            value={hospital.emergency_beds ?? 0}
            subtext="Emergency handling"
            icon={Building2}
            badge={emergencyBadge}
          />

          <StatCard
            title="Doctors"
            value={doctorCount}
            subtext="Available specialists"
            icon={Stethoscope}
            badge={doctorCount >= 10 ? "Strong team" : "Limited team"}
          />
        </section>

        {/* DOCTOR DIRECTORY */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Doctor Directory
              </h2>
            </div>

            <div className="flex gap-2 items-center">
              <div className="text-xs font-bold px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-100 text-purple-700">
                {doctorCount} total
              </div>
              <button
                onClick={() => setShowAddDoctor(true)}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                <UserPlus size={14} />
                Add Doctor
              </button>
            </div>
          </div>

          {/* Add Doctor Modal */}
          {showAddDoctor && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <UserPlus size={18} className="text-blue-600" />
                    Register New Doctor
                  </h3>
                  <button
                    onClick={() => setShowAddDoctor(false)}
                    className="text-slate-400 hover:text-slate-600 transition"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleAddDoctor} className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Doctor Name
                    </label>
                    <div className="flex bg-slate-50 border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                      <span className="px-3 py-2 text-sm text-slate-500 font-medium bg-slate-100 border-r border-slate-300">
                        Dr.
                      </span>
                      <input
                        type="text"
                        value={newDoctor.name}
                        onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-transparent focus:outline-none"
                        placeholder="e.g. Ayesha Khan"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Specialization / Department
                    </label>
                    <input
                      type="text"
                      value={newDoctor.specialization}
                      onChange={(e) => setNewDoctor({ ...newDoctor, specialization: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Cardiology"
                      required
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mt-4">
                    <p className="text-xs text-blue-800">
                      Login credentials (email & password) will be automatically generated and displayed after registration.
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowAddDoctor(false)}
                      className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addingDoctor}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-70"
                    >
                      {addingDoctor ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Registering...
                        </>
                      ) : (
                        "Register Doctor"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {doctors.length === 0 ? (
            <div className="text-center py-10 text-slate-500 font-medium">
              No doctors added yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {doctors.map((s) => (
                <DoctorRow key={s.id} doctor={s} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
