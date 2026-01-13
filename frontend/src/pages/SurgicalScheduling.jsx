import React, { useState } from 'react';
import { 
  RefreshCcw, 
  BrainCircuit, 
  LayoutDashboard, 
  History, 
  Settings 
} from 'lucide-react';


import MetricCard from '../components/MetricCard.jsx';
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
  // In a real scenario, this would be updated after calling your FastAPI endpoint
  const [optimizedData, setOptimizedData] = useState([
    { time: "08:00", patient: "Sarah Connor", surgeon: "Dr. Smith", room: "OR-1", duration: 120 },
    { time: "09:30", patient: "Kyle Reese", surgeon: "Dr. Varma", room: "OR-2", duration: 45 },
    { time: "10:15", patient: "Ellen Ripley", surgeon: "Dr. Smith", room: "OR-1", duration: 90 },
  ]);

  const handleDeleteFromQueue = (id) => {
    setPendingSurgeries(pendingSurgeries.filter(s => s.id !== id));
  };

  const handleRunOptimization = () => {
    console.log("Triggering Backend API for Optimization...");
    // Here your team will add the fetch/axios call to FastAPI
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

          {/* Efficiency Comparison Chart Placeholder */}
          <div className="mt-8 p-6 bg-white border border-slate-200 rounded-xl">
             <div className="flex justify-between mb-4">
                <h3 className="font-bold text-slate-800">Efficiency Improvement (Before vs. After AI)</h3>
                <Settings size={16} className="text-slate-400" />
             </div>
             <div className="h-48 bg-slate-50 border-2 border-dashed border-slate-100 rounded flex items-center justify-center text-slate-400">
                [ Chart Module: Recharts/Chart.js Integration Point ]
             </div>
          </div>
        </main>
        
      </div>
    </div>
  );
};

export default SurgicalScheduling;