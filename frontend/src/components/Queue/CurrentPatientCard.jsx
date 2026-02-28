import { User, Clock, Hash, CheckCircle2, ChevronRight } from 'lucide-react';
import { Badge } from '../common/Badge';

export const CurrentPatientCard = ({ patient, onConsult, onComplete, loading }) => {
  if (!patient) return (
    <div className="card p-8 text-center">
      <div className="w-16 h-16 bg-jade-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 size={28} className="text-jade-500" />
      </div>
      <h3 className="font-semibold text-slate-700 mb-1">Queue Complete</h3>
      <p className="text-sm text-slate-400">No more patients waiting today.</p>
    </div>
  );

  return (
    <div className="card p-5 border-l-4 border-l-navy-500 animate-slide-up">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-navy-100 to-navy-200 rounded-2xl flex items-center justify-center">
            <User size={22} className="text-navy-600" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Current Patient</p>
            <h3 className="text-lg font-bold text-slate-800">{patient.patientName}</h3>
          </div>
        </div>
        <Badge variant="navy" dot>
          <Hash size={11} /> Token {patient.tokenNumber}
        </Badge>
      </div>

      <div className="flex items-center gap-4 mb-5 text-sm text-slate-500">
        <span className="flex items-center gap-1.5">
          <Clock size={14} className="text-slate-400" />
          {patient.appointmentTime}
        </span>
        <span className="text-slate-300">·</span>
        <span className="font-mono text-xs text-slate-400">ID: {patient.patientId}</span>
      </div>

      <div className="flex gap-2.5">
        <button onClick={() => onConsult(patient)} className="btn-primary flex-1 py-2.5">
          <ChevronRight size={16} /> Start Consultation
        </button>
        <button onClick={() => onComplete(patient.id)}
          disabled={loading}
          className="btn-secondary px-4 py-2.5 text-jade-600 border-jade-200 hover:bg-jade-50">
          <CheckCircle2 size={15} /> Done
        </button>
      </div>
    </div>
  );
};
