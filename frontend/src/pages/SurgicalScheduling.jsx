import React, { useState, useEffect } from 'react';
import {
  RefreshCcw,
  BrainCircuit,
  LayoutDashboard,
  History,
  TrendingUp,
  Clock
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  collection,
  onSnapshot,
  query,
  where,
  addDoc,
  serverTimestamp,
  doc, 
  deleteDoc
} from "firebase/firestore";
import { db } from "@/firebase";
import { toast } from "sonner";

import MetricCard from '../components/MetricCard';
import SurgeryForm from '../components/SurgeryForm';
import PendingQueue from '../components/PendingQueue';
import OptimizedSchedule from '../components/OptimizedSchedule';

const SurgicalScheduling = () => {

  const [pendingSurgeries, setPendingSurgeries] = useState([]);
  const [optimizedData, setOptimizedData] = useState([]);

  useEffect(() => {
  const q = query(
    collection(db, "surgery_requests"),
    where("status", "==", "pending")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
  const surgeries = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      patient: data.patient_name,
      surgeon: data.surgeon,
      duration: data.duration_minutes,
      priority: data.priority || "Normal",
      scheduled_start_time: data.scheduled_start_time
    };
  });

  setPendingSurgeries(surgeries);
});

  return () => unsubscribe();
}, []);

  const runOptimizer = async () => {
    const response = await fetch("http://localhost:5000/api/optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        surgeries: pendingSurgeries.map((s) => ({
          id: s.id,
          patient_name: s.patient_name,
          surgeon: s.surgeon,
          duration_minutes: s.duration_minutes,
          scheduled_start_time: s.scheduled_start_time,
        })),
      }),
    });

    const data = await response.json();
    setOptimizedData(data.optimized_schedule);

    await addDoc(collection(db, "optimized_schedules"), {
      generatedAt: serverTimestamp(),
      schedule: data.optimized_schedule,
    });
  };

  const efficiencyData = [
    { metric: 'OR Utilization', before: 68.5, after: 84.2 },
    { metric: 'Avg Turnover Time', before: 45, after: 28 },
    { metric: 'Cases Per Day', before: 12, after: 16 },
    { metric: 'Idle Time', before: 125, after: 62 },
    { metric: 'Staff Overtime', before: 18, after: 7 }
  ];

  const handleDeleteFromQueue = async (id) => {
  await deleteDoc(doc(db, "surgery_requests", id));
  toast.success("Removed from queue");
};

  return (
    <div className="min-h-screen w-full bg-slate-50 p-6 space-y-8">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* HEADER */}
      <header className="flex justify-between items-end mt-10 mb-8">
        <div>

          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Surgical Schedule <span className="text-blue-600">Optimization</span>
          </h1>

          <p className="text-slate-500 font-medium">
            Real-time resource allocation and conflict resolution
          </p>
        </div>

        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white">
            <History size={18} />
            Logs
          </button>

          <button onClick={runOptimizer} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg">
            <RefreshCcw size={18} />
            Re-run Optimizer
          </button>
        </div>
      </header>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <MetricCard title="OR Utilization" value="84.2%" subtext="↑ 5.1% efficiency gain" />
        <MetricCard title="Pending Backlog" value={pendingSurgeries.length} subtext="Cases awaiting slot" />
        <MetricCard title="Conflict Alerts" value="0" subtext="System is optimized" />
        <MetricCard title="Staff Availability" value="92%" subtext="12 Surgeons on duty" />
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-12 gap-8 items-start">

        {/* LEFT COLUMN */}
        <aside className="col-span-12 lg:col-span-4 flex flex-col gap-8">

          <SurgeryForm />

          <PendingQueue
            surgeries={pendingSurgeries}
            onDelete={handleDeleteFromQueue}
          />

          {/* AI INSIGHTS */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit size={18} className="text-amber-600" />
              <span className="text-sm font-bold text-amber-800">
                Gemini AI Insights
              </span>
            </div>

            <p className="text-sm italic text-amber-700">
              “Moving Sarah Connor to OR-1 reduces turnover by 15 minutes.
              No conflicts detected for the next 8 hours.”
            </p>
          </div>
        </aside>

        {/* RIGHT COLUMN */}
        <main className="col-span-12 lg:col-span-8 space-y-8">

          {/* SCHEDULE */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 bg-blue-50 border-b border-blue-100">
              <span className="font-semibold text-blue-900">
                Optimized Surgical Timeline
              </span>

              <div className="flex gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Occupied
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-200" />
                  Idle
                </span>
              </div>
            </div>

            <OptimizedSchedule data={optimizedData} />
          </div>

          {/* PERFORMANCE CHART */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={20} className="text-green-600" />
                  <h3 className="font-bold text-slate-800 text-lg">
                    Performance Metrics
                  </h3>
                </div>
                <p className="text-sm text-slate-500">
                  Before AI vs After AI Optimization
                </p>
              </div>

              <div className="px-3 py-1.5 bg-green-50 rounded-lg text-green-700 font-bold text-sm">
                +23% Overall Improvement
              </div>
            </div>

            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={efficiencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="before" fill="#94a3b8" radius={[8, 8, 0, 0]} />
                <Bar dataKey="after" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* SUMMARY */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={16} className="text-blue-600" />
                  <span className="text-xs font-bold uppercase text-blue-600">
                    Time Saved
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-700">63 min</p>
                <p className="text-xs text-blue-600">Per OR per day</p>
              </div>

              <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <LayoutDashboard size={16} className="text-purple-600" />
                  <span className="text-xs font-bold uppercase text-purple-600">
                    Capacity Gain
                  </span>
                </div>
                <p className="text-2xl font-bold text-purple-700">+33%</p>
                <p className="text-xs text-purple-600">More cases per week</p>
              </div>
            </div>
          </div>

        </main>
      </div>
      </div>

      
    </div>
  );
};

export default SurgicalScheduling;
