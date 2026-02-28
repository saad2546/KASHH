import { useNavigate } from 'react-router-dom';
import { FilePlus, Users, Activity, TrendingUp, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQueue } from '../hooks/useQueue';
import { CurrentPatientCard } from '../components/Queue/CurrentPatientCard';
import { PatientQueue } from '../components/Queue/PatientQueue';
import { Spinner } from '../components/common/Spinner';

export default function Dashboard() {
  const { doctor } = useAuth();
  const navigate = useNavigate();
  const { queue, currentPatient, stats, loading, refresh, markComplete } = useQueue();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleConsult = (patient) => {
    navigate('/prescriptions/new', { state: { patient } });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Greeting */}
      <div className="mb-8">
        <h1 className="font-display text-3xl text-navy-800">
          {greeting()}, {doctor?.name?.split(' ')[0] || 'Doctor'} 👋
        </h1>
        <p className="text-slate-500 mt-1">{new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Patients', value: stats.total, icon: Users, color: 'bg-navy-50 text-navy-600' },
          { label: 'Waiting', value: stats.waiting, icon: Activity, color: 'bg-amber-50 text-amber-600' },
          { label: 'Completed', value: stats.completed, icon: TrendingUp, color: 'bg-jade-50 text-jade-600' },
          { label: 'Today', value: new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short' }), icon: FilePlus, color: 'bg-purple-50 text-purple-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4 card-hover">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left col: current patient */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Current Patient</h2>
          {loading
            ? <div className="card p-8 flex justify-center"><Spinner /></div>
            : <CurrentPatientCard
                patient={currentPatient}
                onConsult={handleConsult}
                onComplete={markComplete}
                loading={loading}
              />
          }
          <button onClick={() => navigate('/prescriptions/new')} className="btn-primary w-full justify-center py-3">
            <FilePlus size={16} /> New Prescription
          </button>
        </div>

        {/* Right col: full queue */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Patient Queue</h2>
          </div>
          {loading
            ? <div className="card p-8 flex justify-center"><Spinner /></div>
            : <PatientQueue queue={queue} currentPatient={currentPatient} stats={stats} onRefresh={refresh} />
          }
        </div>
      </div>
    </div>
  );
}
