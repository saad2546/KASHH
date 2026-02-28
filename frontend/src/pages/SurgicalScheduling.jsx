import React, { useState, useEffect, useMemo } from "react";
import { io } from "socket.io-client";
import {
  RefreshCcw,
  TrendingUp,
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
import OptimizedSchedule from "../components/OptimizedSchedule";

import { useHospital } from "@/context/HospitalContext";

const SurgicalScheduling = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const { hospital, loading } = useHospital();

  const [pendingSurgeries, setPendingSurgeries] = useState([]);
  const [mobileSurgeries, setMobileSurgeries] = useState([]);
  const [optimizedData, setOptimizedData] = useState([]);

  // Combine Firestore and Mobile bookings
  const allSurgeries = useMemo(() => {
    const mobileMapped = mobileSurgeries.map(s => ({
      ...s,
      id: s.token_number || s.id,
      patient: s.patient_name,
      surgeon: s.doctor_name,
      isMobile: true
    }));

    return [...pendingSurgeries, ...mobileMapped].sort(
      (a, b) => (b.priority_score || 0) - (a.priority_score || 0)
    );
  }, [pendingSurgeries, mobileSurgeries]);

  // Derived optimized data for the timeline (persists on refresh)
  const displayedOptimizedData = useMemo(() => {
    if (optimizedData.length > 0) return optimizedData;

    return allSurgeries
      .map(s => ({
        id: s.id,
        patient: s.patient,
        surgeon: s.surgeon,
        optimized_start: s.scheduled_start_time || "09:00",
        room: s.room_number || 1,
        date: s.scheduled_date
      }));
  }, [optimizedData, allSurgeries]);

  const pendingCount = allSurgeries.length;

  const urgentCount = allSurgeries.filter(
    (s) => (s.priority_score || 0) >= 7
  ).length;

  const avgPriorityScore = pendingCount > 0
    ? (allSurgeries.reduce((sum, s) => sum + (s.priority_score || 0), 0) / pendingCount).toFixed(1)
    : "0.0";

  const doctorCount = new Set(allSurgeries.map((s) => s.surgeon)).size;

  // Poll Mobile Queue every 5 seconds
  useEffect(() => {
    if (loading || !hospital?.id) return;

    const fetchMobileQueue = async () => {
      try {
        const res = await fetch(`${API_URL}/api/queue/get-all-queues`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setMobileSurgeries(data.queue || []);
      } catch (err) {
        console.error("Mobile queue fetch error:", err);
      }
    };

    fetchMobileQueue();

    // Subscribe to WebSocket events instead of polling
    const socket = io(API_URL);

    socket.on("all_queues_updated", () => {
      fetchMobileQueue();
    });

    socket.on("queue_updated", () => {
      fetchMobileQueue();
    });

    return () => socket.disconnect();
  }, [hospital?.id, loading, API_URL]);

  // Fetch pending surgery requests from Firestore
  useEffect(() => {
    if (loading) return;
    if (!hospital?.id) return;

    const q = query(
      collection(db, "hospitals", hospital.id, "surgery_requests"),
      where("status", "==", "scheduled")
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
            priority_score: Number(data.priority_score || 0),
            urgency_score: Number(data.urgency_score || 0),
            appointment_type: data.appointment_type || "",
            is_emergency: Boolean(data.is_emergency),
            scheduled_start_time: data.scheduled_start_time || "09:00",
            scheduled_date: data.scheduled_date || "",
            duration_minutes: data.duration_minutes || 60,
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
    const grouped = allSurgeries.reduce((acc, s) => {
      const day = s.scheduled_date || "No date";
      if (!acc[day]) {
        acc[day] = { day, pending_cases: 0, total_score: 0 };
      }
      acc[day].pending_cases += 1;
      acc[day].total_score += (s.priority_score || 0);
      return acc;
    }, {});

    return Object.values(grouped)
      .map((d) => ({
        ...d,
        avg_priority: d.pending_cases > 0
          ? Number((d.total_score / d.pending_cases).toFixed(1))
          : 0,
      }))
      .sort((a, b) => {
        if (a.day === "No date") return 1;
        if (b.day === "No date") return -1;
        return a.day.localeCompare(b.day);
      });
  }, [allSurgeries]);


  // Run optimizer grouped by date
  const runOptimizer = async () => {
    if (!hospital?.id) {
      toast.error("Hospital not loaded");
      return;
    }

    if (allSurgeries.length === 0) {
      toast.error("No surgeries to optimize");
      return;
    }

    const groupedByDate = allSurgeries.reduce((acc, surgery) => {
      const date = surgery.scheduled_date || "unscheduled";
      if (!acc[date]) acc[date] = [];
      acc[date].push(surgery);
      return acc;
    }, {});

    // Warn and skip surgeries with no date
    if (groupedByDate["unscheduled"]) {
      toast.warning(
        `${groupedByDate["unscheduled"].length} surgery(s) have no scheduled date and will be skipped`
      );
      delete groupedByDate["unscheduled"];
    }

    if (Object.keys(groupedByDate).length === 0) {
      toast.error("No surgeries with a scheduled date to optimize");
      return;
    }

    const allOptimizedResults = [];

    for (const [date, surgeries] of Object.entries(groupedByDate)) {
      const payload = {
        hospital_id: hospital.id,
        surgeries: surgeries.map((s) => ({
          id: s.id,
          patient_name: s.patient || "Unknown Patient",
          surgeon: s.surgeon || "Unknown Surgeon",
          scheduled_start_time: s.scheduled_start_time || "09:00",
          duration_minutes: s.duration_minutes || 60,
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

        if (data.warning) {
          toast.warning(data.warning);
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

    if (allOptimizedResults.length > 0) {
      setOptimizedData(allOptimizedResults);
      toast.success(
        `Optimized ${Object.keys(groupedByDate).length} day(s) successfully`
      );
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
              Patient Queue{" "}
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
            title="Urgent Cases"
            value={urgentCount}
            subtext="Score ≥ 7.0 in queue"
          />

          <MetricCard
            title="Avg Priority Score"
            value={avgPriorityScore}
            subtext="Weighted queue urgency"
          />

          <MetricCard
            title="Doctors Scheduled"
            value={doctorCount}
            subtext="Unique doctors in queue"
          />
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN */}
          <aside className="col-span-12 lg:col-span-4 flex flex-col gap-8">
            <SurgeryForm onPatientAdded={runOptimizer} />
          </aside>

          {/* RIGHT COLUMN */}
          <main className="col-span-12 lg:col-span-8 space-y-8">
            {/* SCHEDULE */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex justify-between items-center px-6 py-4 bg-blue-50 border-b border-blue-100">
                <span className="font-semibold text-blue-900">
                  Optimized Appointment Timeline
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

              <OptimizedSchedule data={displayedOptimizedData} />
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
                    Cases and avg priority score by scheduled date
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
                      if (name === "avg_priority") return [`${val}`, "Avg Priority Score"];
                      return [val, name];
                    }}
                  />

                  <Legend
                    formatter={(val) => {
                      if (val === "pending_cases") return "Pending Cases";
                      if (val === "avg_priority") return "Avg Priority Score";
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
                    dataKey="avg_priority"
                    fill="#2563eb"
                    radius={[8, 8, 0, 0]}
                    name="avg_priority"
                  />
                </BarChart>
              </ResponsiveContainer>

              {pendingLoadChartData.length === 0 && (
                <div className="mt-4 text-center text-sm text-slate-500">
                  No pending appointments yet. Add requests to see the chart.
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