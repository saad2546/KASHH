import { Clock, CheckCircle2, User, Hash, RefreshCw } from 'lucide-react';

const STATUS_CFG = {
  waiting:   { cls: 'badge-navy',  dot: '🔵', label: 'Waiting' },
  completed: { cls: 'badge-green', dot: '✅', label: 'Done' },
  in_progress:{ cls:'badge-yellow',dot: '🟡', label: 'Active' },
};

export const PatientQueue = ({ queue, currentPatient, stats, onRefresh }) => (
  <div className="card overflow-hidden">
    {/* Header */}
    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
      <div>
        <h2 className="font-semibold text-slate-800">Today's Queue</h2>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
          <span>{stats.total} total</span>
          <span className="text-jade-500 font-medium">{stats.completed} done</span>
          <span className="text-navy-600 font-medium">{stats.waiting} waiting</span>
        </div>
      </div>
      <button onClick={onRefresh} className="btn-ghost p-2 rounded-xl">
        <RefreshCw size={15} />
      </button>
    </div>

    {/* Queue list */}
    <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
      {queue.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-400">No patients today</div>
      ) : queue.map((p) => {
        const isCurrent = currentPatient?.id === p.id;
        const cfg = STATUS_CFG[p.status] || STATUS_CFG.waiting;
        return (
          <div key={p.id} className={`flex items-center gap-3 px-5 py-3.5 transition-colors
            ${isCurrent ? 'bg-navy-50 border-l-2 border-navy-500' : 'hover:bg-slate-50'}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold
              ${p.status === 'completed' ? 'bg-jade-100 text-jade-600' : 'bg-slate-100 text-slate-600'}`}>
              {p.tokenNumber}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${p.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                {p.patientName}
              </p>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Clock size={10} /> {p.appointmentTime}
              </p>
            </div>
            <span className={`badge text-xs ${cfg.cls}`}>{cfg.label}</span>
          </div>
        );
      })}
    </div>
  </div>
);
