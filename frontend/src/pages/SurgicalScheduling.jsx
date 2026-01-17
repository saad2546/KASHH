import React, { useState, useEffect, useMemo } from "react";
import {
  RefreshCcw,
  BrainCircuit,
  LayoutDashboard,
  TrendingUp,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/firebase";
import { toast } from "sonner";

import MetricCard from "../components/MetricCard";
import SurgeryForm from "../components/SurgeryForm";
import PendingQueue from "../components/PendingQueue";
import OptimizedSchedule from "../components/OptimizedSchedule";

import { useHospital } from "@/context/HospitalContext";

const SurgicalScheduling = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const { hospital, loading } = useHospital();

  const [pendingSurgeries, setPendingSurgeries] = useState([]);
  const [optimizedData, setOptimizedData] = useState([]);

  const pendingCount = pendingSurgeries.length;

  const highPriorityCount = pendingSurgeries.filter(
    (s) => (s.priority || "").toLowerCase() === "high"
  ).length;

  const totalQueueMinutes = pendingSurgeries.reduce(
    (sum, s) => sum + Number(s.duration || 0),
    0
  );

  const surgeonCount = new Set(pendingSurgeries.map((s) => s.surgeon)).size;

  // Fetch pending surgery requests
  useEffect(() => {
    if (loading) return;
    if (!hospital?.id) return;

    const q = query(
      collection(db, "hospitals", hospital.id, "surgery_requests"),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const surgeries = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();

          return {
            id: docSnap.id,
            patient: data.patient_name,
            surgeon: data.surgeon,
            duration: Number(data.duration_minutes),
            priority: data.priority || "Normal",
            scheduled_start_time: data.scheduled_start_time,
            scheduled_date: data.scheduled_date,
          };
        });

        setPendingSurgeries(surgeries);
      },
      (error) => {
        console.error("Firestore listener error:", error);
        toast.error("Failed to load pending surgeries");
      }
    );

    return () => unsubscribe();
  }, [hospital?.id, loading]);

  // Dynamic chart data from realtime pending surgeries
  const pendingLoadChartData = useMemo(() => {
    const grouped = pendingSurgeries.reduce((acc, s) => {
      const day = s.scheduled_date || "No date";
      if (!acc[day]) {
        acc[day] = { day, pending_cases: 0, pending_minutes: 0 };
      }
      acc[day].pending_cases += 1;
      acc[day].pending_minutes += Number(s.duration || 0);
      return acc;
    }, {});

    // sort by date if possible (YYYY-MM-DD)
    return Object.values(grouped).sort((a, b) => {
      if (a.day === "No date") return 1;
      if (b.day === "No date") return -1;
      return a.day.localeCompare(b.day);
    });
  }, [pendingSurgeries]);


  // Run optimizer grouped by date 
  const runOptimizer = async () => {
    if (!hospital?.id) {
      toast.error("Hospital not loaded");
      return;
    }

    if (pendingSurgeries.length === 0) {
      toast.error("No surgeries to optimize");
      return;
    }

    const groupedByDate = pendingSurgeries.reduce((acc, surgery) => {
      const date = surgery.scheduled_date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(surgery);
      return acc;
    }, {});

    const allOptimizedResults = [];

    for (const [date, surgeries] of Object.entries(groupedByDate)) {
      const payload = {
        surgeries: surgeries.map((s) => ({
          id: s.id,
          patient_name: s.patient, 
          surgeon: s.surgeon,
          duration_minutes: s.duration,
          scheduled_start_time: s.scheduled_start_time,
        })),
      };

      try {
        const response = await fetch(
          `${API_URL}/api/optimize-schedule`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          console.error(`Optimizer error for ${date}:`, data);
          toast.error(
            `Failed to optimize ${date}: ${data.error || "Unknown error"}`
          );
          continue;
        }

        const resultsWithDate = (data.optimized_schedule || []).map((item) => ({
          ...item,
          date,
        }));

        allOptimizedResults.push(...resultsWithDate);
      } catch (error) {
        console.error(`Network error for ${date}:`, error);
        toast.error(`Failed to connect to optimizer for ${date}`);
      }
    }

    setOptimizedData(allOptimizedResults);

    toast.success(
      `Optimized ${Object.keys(groupedByDate).length} day(s) successfully`
    );
  };

  // Delete surgery from pending queue
  const handleDeleteFromQueue = async (id) => {
    if (!hospital?.id) {
      toast.error("Hospital not loaded");
      return;
    }

    try {
      await deleteDoc(
        doc(db, "hospitals", hospital.id, "surgery_requests", id)
      );
      toast.success("Removed from queue");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete request");
    }
  };

  // Loading UI
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 font-medium">Loading hospital...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 p-6 space-y-8">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* HEADER */}
        <header className="flex justify-between items-end mt-10 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Surgical Schedule{" "}
              <span className="text-blue-600">Optimization</span>
            </h1>

            <p className="text-slate-500 font-medium">
              Real-time resource allocation and conflict resolution
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={runOptimizer}
              className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg"
            >
              <RefreshCcw size={18} />
              Re-run Optimizer
            </button>
          </div>
        </header>

        {/* KPI GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <MetricCard
          title="Pending Backlog"
          value={pendingCount}
          subtext="Cases awaiting slot"
        />

        <MetricCard
          title="High Priority Cases"
          value={highPriorityCount}
          subtext="Urgent surgeries in queue"
        />

        <MetricCard
          title="Workload (Minutes)"
          value={`${totalQueueMinutes} min`}
          subtext="Total pending duration"
        />

        <MetricCard
          title="Surgeons Scheduled"
          value={surgeonCount}
          subtext="Unique surgeons in queue"
        />
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

            {/* DYNAMIC PERFORMANCE CHART */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={20} className="text-green-600" />
                    <h3 className="font-bold text-slate-800 text-lg">
                      Pending Load Forecast
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500">
                    Cases and workload (minutes) by scheduled date
                  </p>
                </div>

                <div className="px-3 py-1.5 bg-blue-50 rounded-lg text-blue-700 font-bold text-sm">
                  {pendingCount} Total Pending
                </div>
              </div>

              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={pendingLoadChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      fontSize: "12px",
                    }}
                    formatter={(val, name) => {
                      if (name === "pending_cases") return [`${val}`, "Pending Cases"];
                      if (name === "pending_minutes") return [`${val} min`, "Pending Minutes"];
                      return [val, name];
                    }}
                  />

                  <Legend
                    formatter={(val) => {
                      if (val === "pending_cases") return "Pending Cases";
                      if (val === "pending_minutes") return "Pending Workload (min)";
                      return val;
                    }}
                  />

                  <Bar
                    yAxisId="left"
                    dataKey="pending_cases"
                    fill="#94a3b8"    
                    radius={[8, 8, 0, 0]}
                    name="pending_cases"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="pending_minutes"
                    fill="#2563eb"     
                    radius={[8, 8, 0, 0]}
                    name="pending_minutes"
                  />
                </BarChart>
              </ResponsiveContainer>

              {/* Empty state */}
              {pendingLoadChartData.length === 0 && (
                <div className="mt-4 text-center text-sm text-slate-500">
                  No pending surgeries yet. Add requests to see the chart.
                </div>
              )}
            </div>

          </main>
        </div>
      </div>
    </div>
  );
};

export default SurgicalScheduling;
