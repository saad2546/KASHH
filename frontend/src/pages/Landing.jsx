import { ArrowRight, Activity, CalendarClock, Package, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 text-slate-800">
      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block mb-4 px-4 py-1 text-xs font-bold tracking-wide text-blue-700 bg-blue-100 rounded-full">
            AI-Powered Hospital Operations
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6">
            Predict. Optimize. <span className="text-blue-600">Save Lives.</span>
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-xl">
            A smart hospital management platform that forecasts patient inflow,
            optimizes surgical schedules, and prevents resource shortages — all in real time.
          </p>
          <div className="flex gap-4">
            <button onClick={() => navigate("/patient-flow")} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow">
              Get Started <ArrowRight size={18} />
            </button>
            <button onClick={() => navigate("/scheduling")} className="border border-slate-300 px-6 py-3 rounded-xl font-semibold text-slate-700 hover:bg-white">
              View Schedule
            </button>
          </div>
        </div>

        {/* HERO CARD */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
          <img
            src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3"
            alt="Hospital dashboard preview"
            className="rounded-xl object-cover"
          />
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-extrabold text-center mb-4">
          Built for Modern Hospitals
        </h2>
        <p className="text-center text-slate-600 max-w-2xl mx-auto mb-12">
          Designed to help administrators, doctors, and planners make data-driven decisions faster.
        </p>

        <div className="grid md:grid-cols-4 gap-6">
          <FeatureCard
            icon={<Activity />}
            title="Patient Flow Forecasting"
            text="Predict admissions and discharges with ML-based time-series models."
          />
          <FeatureCard
            icon={<CalendarClock />}
            title="Surgical Scheduling"
            text="AI-optimized OR schedules that reduce wait time and idle hours."
          />
          <FeatureCard
            icon={<Package />}
            title="Inventory Intelligence"
            text="Prevent drug shortages with demand-aware pharmacy planning."
          />
          <FeatureCard
            icon={<ShieldCheck />}
            title="Secure & Compliant"
            text="Built with role-based access and healthcare-grade security."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 text-white py-20 mt-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold mb-4">
            Transform Hospital Operations Today
          </h2>
          <p className="text-blue-100 mb-8">
            Join the future of healthcare management with predictive intelligence.
          </p>
          <button onClick={() => navigate("/dashboard")} className="bg-white text-blue-600 font-bold px-8 py-3 rounded-xl hover:bg-blue-50">
            Launch Dashboard
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 text-center text-sm text-slate-500">
        © 2026 PulseOps · Built for Healthcare Innovation
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, text }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
      <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600 mb-4">
        {icon}
      </div>
      <h3 className="font-bold mb-2">{title}</h3>
      <p className="text-sm text-slate-600">{text}</p>
    </div>
  );
}
