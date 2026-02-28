import { useState } from 'react';
import { ShieldAlert, ShieldX, ShieldCheck, ChevronDown, ChevronUp, AlertTriangle, Info, ExternalLink, CheckCircle2, FlaskConical, BookOpen } from 'lucide-react';

const RISK = {
  low:   { label:'LOW RISK',   cls:'border-jade-300 bg-jade-50',  text:'text-jade-700',  Icon:ShieldCheck },
  medium:{ label:'MEDIUM RISK',cls:'border-amber-300 bg-amber-50',text:'text-amber-700', Icon:ShieldAlert },
  high:  { label:'HIGH RISK',  cls:'border-rose-400 bg-rose-50',  text:'text-rose-700',  Icon:ShieldX },
  fatal: { label:'⛔ FATAL',   cls:'border-rose-600 bg-rose-100', text:'text-rose-800',  Icon:ShieldX },
};
const SEV = {
  fatal: { bg:'bg-rose-100 border-rose-400',text:'text-rose-800',label:'FATAL' },
  high:  { bg:'bg-rose-50 border-rose-300', text:'text-rose-700',label:'HIGH' },
  medium:{ bg:'bg-amber-50 border-amber-300',text:'text-amber-700',label:'MODERATE' },
  low:   { bg:'bg-blue-50 border-blue-300', text:'text-blue-700', label:'LOW' },
};
const TYPE_EMOJI = { interaction:'⚡',allergy:'🤧',age_factor:'👤',contraindication:'🚫',dose:'💊',system:'🔧' };

export const AISafetyPanel = ({ report, loading=false, compact=false, onOverride, blocked=false }) => {
  const [expanded, setExpanded] = useState(!compact);
  const [altsOpen, setAltsOpen] = useState(false);
  const [srcsOpen, setSrcsOpen] = useState(false);

  if (loading) return (
    <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-slate-200 animate-spin border-2 border-t-navy-500 border-slate-300" />
        <div><div className="h-3.5 w-44 bg-slate-200 rounded mb-2" /><div className="h-3 w-60 bg-slate-100 rounded" /></div>
      </div>
    </div>
  );
  if (!report) return null;

  const risk = RISK[report.overallRisk] || RISK.medium;
  const RiskIcon = risk.Icon;
  const highF = (report.findings||[]).filter(f=>['fatal','high'].includes(f.severity));
  const otherF = (report.findings||[]).filter(f=>!['fatal','high'].includes(f.severity));

  return (
    <div className={`rounded-2xl border-2 overflow-hidden ${risk.cls} animate-slide-up`}>
      <div className="px-4 py-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${report.overallRisk==='low'?'bg-jade-100':report.overallRisk==='medium'?'bg-amber-100':'bg-rose-200'}`}>
            <RiskIcon size={18} className={risk.text} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-black tracking-widest uppercase ${risk.text}`}>{risk.label}</span>
              <span className="text-xs text-slate-500">· Gemini AI Safety</span>
            </div>
            <p className={`text-xs mt-0.5 leading-relaxed max-w-md ${risk.text} opacity-80`}>{report.summary}</p>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="p-1 rounded-lg hover:bg-white/60 transition-colors flex-shrink-0">
          {expanded ? <ChevronUp size={15} className="text-slate-500" /> : <ChevronDown size={15} className="text-slate-500" />}
        </button>
      </div>

      {report.stopAlert && (
        <div className="mx-4 mb-3 bg-rose-600 text-white rounded-xl p-3 flex gap-2.5">
          <ShieldX size={16} className="flex-shrink-0 mt-0.5" />
          <div><p className="text-xs font-bold mb-0.5">PRESCRIPTION BLOCKED</p><p className="text-xs opacity-90">{report.stopAlert}</p></div>
        </div>
      )}

      {expanded && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in">
          {highF.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><AlertTriangle size={11} className="text-rose-500" /> Critical Issues</p>
              {highF.map((f, i) => { const s = SEV[f.severity]||SEV.medium; return (
                <div key={i} className={`rounded-xl border p-3 ${s.bg}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-sm mt-0.5">{TYPE_EMOJI[f.type]||'⚠️'}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${s.bg} ${s.text}`}>{s.label}</span>
                        <span className={`text-sm font-bold ${s.text}`}>{f.drugA}{f.drugB&&f.drugB!==f.drugA&&<span className="text-slate-500 font-normal"> ↔ {f.drugB}</span>}</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed mb-1">{f.description}</p>
                      <p className="text-xs text-slate-500 italic">{f.mechanism}</p>
                      {f.recommendation && <div className="mt-2 flex items-start gap-1.5 bg-white/60 rounded-lg px-2.5 py-2"><CheckCircle2 size={11} className="text-jade-500 flex-shrink-0 mt-0.5" /><p className="text-xs text-slate-700">{f.recommendation}</p></div>}
                    </div>
                  </div>
                </div>
              );})}
            </div>
          )}
          {otherF.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Info size={11} className="text-amber-500" /> Other Notes</p>
              {otherF.map((f, i) => { const s = SEV[f.severity]||SEV.low; return (
                <div key={i} className={`rounded-xl border p-3 ${s.bg}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-sm">{TYPE_EMOJI[f.type]||'💡'}</span>
                    <div><p className={`text-xs font-semibold ${s.text}`}>{f.drugA}{f.drugB&&f.drugB!==f.drugA&&<span className="text-slate-500 font-normal"> ↔ {f.drugB}</span>}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{f.description}</p>
                    {f.recommendation&&<p className="text-xs text-jade-600 mt-1">→ {f.recommendation}</p>}</div>
                  </div>
                </div>
              );})}
            </div>
          )}
          {report.clearedMedicines?.length > 0 && (
            <div className="flex flex-wrap gap-1.5"><span className="text-xs text-slate-400 w-full flex items-center gap-1"><CheckCircle2 size={11} className="text-jade-500" /> No issues found</span>
            {report.clearedMedicines.map((m,i)=><span key={i} className="badge-green text-xs">✓ {m}</span>)}</div>
          )}
          {report.alternatives?.length > 0 && (
            <div>
              <button onClick={()=>setAltsOpen(!altsOpen)} className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider w-full ${risk.text} opacity-70 hover:opacity-100`}>
                <FlaskConical size={11} /> Safer Alternatives ({report.alternatives.length}){altsOpen?<ChevronUp size={11} className="ml-auto"/>:<ChevronDown size={11} className="ml-auto"/>}
              </button>
              {altsOpen && <div className="mt-2 space-y-2 animate-fade-in">{report.alternatives.map((a,i)=>(
                <div key={i} className="bg-white/60 border border-white/80 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1"><span className="text-xs text-slate-400 line-through">{a.insteadOf}</span><span className="text-slate-400">→</span><span className="text-sm font-bold text-navy-700">{a.suggest}</span></div>
                  <p className="text-xs text-slate-600">{a.reason}</p>{a.note&&<p className="text-xs text-amber-600 mt-1 italic">{a.note}</p>}
                </div>
              ))}</div>}
            </div>
          )}
          {report.sources?.length > 0 && (
            <div>
              <button onClick={()=>setSrcsOpen(!srcsOpen)} className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider w-full ${risk.text} opacity-70 hover:opacity-100`}>
                <BookOpen size={11} /> Sources ({report.sources.length}){srcsOpen?<ChevronUp size={11} className="ml-auto"/>:<ChevronDown size={11} className="ml-auto"/>}
              </button>
              {srcsOpen && <div className="mt-2 space-y-1 animate-fade-in">{report.sources.map((s,i)=>(
                <div key={i} className="flex items-center gap-2 bg-white/60 rounded-lg px-3 py-2">
                  <span className="text-xs font-semibold text-navy-600">{s.name}</span>
                  <span className="text-xs text-slate-400 flex-1 truncate">{s.reference}</span>
                  {s.url?.startsWith('http')&&<a href={s.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-navy-500"><ExternalLink size={11}/></a>}
                </div>
              ))}</div>}
            </div>
          )}
          {blocked && onOverride && (
            <div className="border border-rose-300 bg-rose-50 rounded-xl p-3">
              <p className="text-xs text-rose-700 mb-2">⚠️ Override only if clinically justified.</p>
              <button onClick={onOverride} className="w-full py-2 text-xs font-bold text-rose-600 border border-rose-300 rounded-xl hover:bg-rose-100 uppercase tracking-wider">
                Override — Accept Clinical Responsibility
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
