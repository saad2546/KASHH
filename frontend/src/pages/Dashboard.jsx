import React, { useEffect, useMemo, useState } from "react";
import {
  BedDouble,
  Hospital,
  Activity,
  Building2,
  UserRound,
  Stethoscope,
} from "lucide-react";

import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase";

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

const SurgeonRow = ({ surgeon }) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center">
          <UserRound size={18} className="text-purple-600" />
        </div>

        <div>
          <p className="font-semibold text-slate-900 text-sm">
            {surgeon.name || "Unnamed Surgeon"}
          </p>
          <p className="text-xs text-slate-500 font-medium">
            {surgeon.department || "Department not set"}
          </p>
        </div>
      </div>

      <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
        Surgeon
      </span>
    </div>
  );
};

export default function Dashboard() {
  const { hospital, loading } = useHospital();

  // Surgeons (subcollection)
  const [surgeons, setSurgeons] = useState([]);

  const surgeonCount = surgeons.length;

  // ✅ Real-time surgeons fetch
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
        setSurgeons(list);
      },
      (error) => {
        console.error("Surgeons listener error:", error);
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
                  Surgeons
                </p>
                <p className="text-lg font-extrabold">{surgeonCount}</p>
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
            title="Surgeons"
            value={surgeonCount}
            subtext="Available specialists"
            icon={Stethoscope}
            badge={surgeonCount >= 10 ? "Strong team" : "Limited team"}
          />
        </section>

        {/* SURGEON DIRECTORY */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Surgeon Directory
              </h2>
            </div>

            <div className="text-xs font-bold px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-100 text-purple-700">
              {surgeonCount} total
            </div>
          </div>

          {surgeons.length === 0 ? (
            <div className="text-center py-10 text-slate-500 font-medium">
              No surgeons added yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {surgeons.map((s) => (
                <SurgeonRow key={s.id} surgeon={s} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
