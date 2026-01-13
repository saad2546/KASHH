import React, { useState } from 'react';
import { 
  RefreshCcw, 
  BrainCircuit, 
  LayoutDashboard, 
  History, 
  Settings,
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
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

import MetricCard from '../components/MetricCard';
import SurgeryForm from '../components/SurgeryForm';
import PendingQueue from '../components/PendingQueue';
import OptimizedSchedule from '../components/OptimizedSchedule';

import '../App.css';

const SurgicalScheduling = () => {
  // State for the Pending Queue (Inputs)
  const [pendingSurgeries, setPendingSurgeries] = useState([
    { id: 1, patient: "Sarah Connor", surgeon: "Dr. Smith", duration: 120, priority: "Urgent" },
    { id: 2, patient: "Kyle Reese", surgeon: "Dr. Varma", duration: 45, priority: "Elective" },
    { id: 3, patient: "Ellen Ripley", surgeon: "Dr. Smith", duration: 90, priority: "Normal" },
  ]);

  // State for the Optimized Schedule (Outputs from Backend)
  const [optimizedData, setOptimizedData] = useState([
    { time: "08:00", patient: "Sarah Connor", surgeon: "Dr. Smith", room: "OR-1", duration: 120 },
    { time: "09:30", patient: "Kyle Reese", surgeon: "Dr. Varma", room: "OR-2", duration: 45 },
    { time: "10:15", patient: "Ellen Ripley", surgeon: "Dr. Smith", room: "OR-1", duration: 90 },
  ]);

  // Efficiency Comparison Data (Before AI vs After AI)
  const efficiencyData = [
    {
      metric: 'OR Utilization',
      before: 68.5,
      after: 84.2,
      unit: '%'
    },
    {
      metric: 'Avg Turnover Time',
      before: 45,
      after: 28,
      unit: 'min'
    },
    {
      metric: 'Cases Per Day',
      before: 12,
      after: 16,
      unit: 'cases'
    },
    {
      metric: 'Idle Time',
      before: 125,
      after: 62,
      unit: 'min'
    },
    {
      metric: 'Staff Overtime',
      before: 18,
      after: 7,
      unit: '%'
    }
  ];

  // Weekly Trend Data
  const weeklyTrendData = [
    { day: 'Mon', utilization: 76, conflicts: 3 },
    { day: 'Tue', utilization: 79, conflicts: 2 },
    { day: 'Wed', utilization: 82, conflicts: 1 },
    { day: 'Thu', utilization: 84, conflicts: 0 },
    { day: 'Fri', utilization: 85, conflicts: 0 },
  ];

  const handleDeleteFromQueue = (id) => {
    setPendingSurgeries(pendingSurgeries.filter(s => s.id !== id));
  };

  const handleRunOptimization = () => {
    console.log("Triggering Backend API for Optimization...");
    // Here your team will add the fetch/axios call to FastAPI
  };

  // Calculate improvement percentages
  const calculateImprovement = (before, after) => {
    const improvement = ((after - before) / before * 100).toFixed(1);
    return improvement > 0 ? `+${improvement}%` : `${improvement}%`;
  };

  return (
    <div className="dashboard-container">
      {/* 1. TOP NAVIGATION / HEADER */}
      <header className="header-section">
        <div className="header-left">
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard size={20} className="text-blue-600" />
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Operations Hub</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Surgical Schedule <span className="text-blue-600">Optimization</span>
          </h1>
          <p className="text-slate-500 font-medium">Real-time resource allocation and conflict resolution</p>
        </div>

        <div className="header-actions" style={{ display: 'flex', gap: '1rem' }}>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white bg-transparent">
            <History size={18} /> Logs
          </button>
          <button 
            onClick={handleRunOptimization}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-lg"
          >
            <RefreshCcw size={18} /> Re-run Optimizer
          </button>
        </div>
      </header>

      {/* 2. KPI METRICS ROW */}
      <div className="kpi-grid">
        <MetricCard 
          title="OR Utilization" 
          value="84.2%" 
          subtext="↑ 5.1% efficiency gain" 
          colorClass="text-blue-600" 
        />
        <MetricCard 
          title="Pending Backlog" 
          value={pendingSurgeries.length} 
          subtext="Cases awaiting slot" 
          colorClass="text-orange-600" 
        />
        <MetricCard 
          title="Conflict Alerts" 
          value="0" 
          subtext="System is optimized" 
          colorClass="text-green-600" 
        />
        <MetricCard 
          title="Staff Availability" 
          value="92%" 
          subtext="12 Surgeons on duty" 
          colorClass="text-slate-800" 
        />
      </div>

      {/* 3. MAIN CONTENT: 2-COLUMN LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: INPUTS & QUEUE (Span 4) */}
        <aside style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* New Case Entry Form */}
          <section>
            <SurgeryForm />
          </section>

          {/* Pending Queue List */}
          <section>
            <PendingQueue 
              surgeries={pendingSurgeries} 
              onDelete={handleDeleteFromQueue} 
            />
          </section>

          {/* AI Recommendations (Gemini Module placeholder) */}
          <section className="ai-insight-box">
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit size={18} className="text-amber-600" />
              <span className="ai-insight-title">Gemini AI Insights</span>
            </div>
            <p className="ai-insight-text">
              "Based on current staffing levels, moving Sarah Connor to OR-1 reduces turnover time by 15 minutes. No further conflicts detected for the next 8 hours."
            </p>
          </section>
        </aside>

        {/* RIGHT COLUMN: OPTIMIZED TIMELINE (Span 8) */}
        <main style={{ gridColumn: 'span 8' }}>
          <div className="schedule-container">
            <div className="schedule-header flex justify-between items-center">
              <span>Optimized Surgical Timeline</span>
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1 text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div> Occupied
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-slate-200"></div> Idle
                </span>
              </div>
            </div>
            
            {/* The Timeline Results Component */}
            <OptimizedSchedule data={optimizedData} />
          </div>

          {/* EFFICIENCY COMPARISON CHART */}
          <div className="mt-8 p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={20} className="text-green-600" />
                  <h3 className="font-bold text-slate-800 text-lg">Performance Metrics</h3>
                </div>
                <p className="text-sm text-slate-500">Before AI vs. After AI Optimization</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
                <span className="text-green-700 font-bold text-sm">+23% Overall Improvement</span>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={320}>
              <BarChart 
                data={efficiencyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="metric" 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value, name) => [
                    `${value}${efficiencyData.find(d => d.before === value || d.after === value)?.unit || ''}`,
                    name === 'before' ? 'Before AI' : 'After AI'
                  ]}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  formatter={(value) => value === 'before' ? 'Before AI' : 'After AI'}
                />
                <Bar 
                  dataKey="before" 
                  fill="#94a3b8" 
                  radius={[8, 8, 0, 0]}
                  name="before"
                />
                <Bar 
                  dataKey="after" 
                  fill="#2563eb" 
                  radius={[8, 8, 0, 0]}
                  name="after"
                />
              </BarChart>
            </ResponsiveContainer>

            {/* Key Improvements Summary */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={16} className="text-blue-600" />
                  <span className="text-xs font-bold text-blue-600 uppercase">Time Saved</span>
                </div>
                <p className="text-2xl font-bold text-blue-700">63 min</p>
                <p className="text-xs text-blue-600">Per OR per day</p>
              </div>
              
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-center gap-2 mb-1">
                  <LayoutDashboard size={16} className="text-purple-600" />
                  <span className="text-xs font-bold text-purple-600 uppercase">Capacity Gain</span>
                </div>
                <p className="text-2xl font-bold text-purple-700">+33%</p>
                <p className="text-xs text-purple-600">More cases per week</p>
              </div>
            </div>
          </div>
        </main>
        
      </div>
    </div>
  );
};

export default SurgicalScheduling;