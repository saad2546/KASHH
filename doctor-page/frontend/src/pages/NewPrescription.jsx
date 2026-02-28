import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Save, ArrowLeft, User, Stethoscope, Shield, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MedicineRow } from '../components/Prescription/MedicineRow';
import { AISafetyPanel } from '../components/Prescription/AISafetyPanel';
import { validateWithAI, createPrescription } from '../services/prescriptionService';
import { toast } from 'sonner';
import { useDebounce } from '../hooks/useDebounce';

const DEFAULT_MED = () => ({ name:'', strength:'', dosageForm:'', frequency:'Twice daily', duration:'7 days', route:'Oral', instructions:'', medicineId:'' });

export default function NewPrescription() {
  const { doctor } = useAuth();
  const { state } = useLocation();
  const navigate = useNavigate();
  const prePatient = state?.patient;

  const [patient, setPatient] = useState({
    patientId:   prePatient?.patientId || '',
    patientName: prePatient?.patientName || '',
    age:         '',
    gender:      '',
    phone:       '',
    allergies:   '',
    conditions:  '',
  });
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [medicines, setMedicines] = useState([DEFAULT_MED()]);
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [showVitals, setShowVitals] = useState(false);

  // AI safety state
  const [safetyReport, setSafetyReport] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [overrideSafety, setOverrideSafety] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const aiTimer = useRef(null);

  // Debounce for AI check trigger
  const medNames = medicines.map(m => m.name).filter(Boolean).join(',');
  const debouncedMeds = useDebounce(medNames, 1500);

  useEffect(() => {
    const completeMeds = medicines.filter(m => m.name && m.strength);
    if (completeMeds.length === 0 || !patient.patientId) return;

    const runCheck = async () => {
      setAiLoading(true); setOverrideSafety(false); setBlocked(false);
      try {
        const patientPayload = {
          age:       patient.age,
          gender:    patient.gender,
          allergies: patient.allergies.split(',').map(s=>s.trim()).filter(Boolean),
          conditions:patient.conditions.split(',').map(s=>s.trim()).filter(Boolean),
          symptoms:  symptoms.split(',').map(s=>s.trim()).filter(Boolean),
          // NOTE: name/phone/id are NOT sent — only the above clinical fields
        };
        const res = await validateWithAI(patientPayload, completeMeds, diagnosis);
        setSafetyReport(res.safetyReport);
        if (res.safetyReport?.overallRisk === 'fatal') setBlocked(true);
      } catch (err) { console.warn('AI check failed:', err); }
      finally { setAiLoading(false); }
    };
    runCheck();
  }, [debouncedMeds, patient.patientId, patient.age, patient.gender]);

  const updateMed = useCallback((idx, updated) => {
    setMedicines(prev => prev.map((m, i) => i === idx ? updated : m));
  }, []);
  const addMed = () => setMedicines(prev => [...prev, DEFAULT_MED()]);
  const removeMed = (idx) => setMedicines(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patient.patientId.trim()) { toast.error('Patient ID is required'); return; }
    if (!diagnosis.trim()) { toast.error('Diagnosis is required'); return; }
    const validMeds = medicines.filter(m => m.name);
    if (!validMeds.length) { toast.error('At least one medicine is required'); return; }
    if (blocked && !overrideSafety) { toast.error('⛔ Fatal risk — review AI safety panel'); return; }

    setSubmitting(true);
    try {
      const payload = {
        patientId:   patient.patientId,
        patientName: patient.patientName,
        patientAge:  parseInt(patient.age) || undefined,
        patientGender:patient.gender,
        patientPhone: patient.phone,
        diagnosis, symptoms: symptoms.split(',').map(s=>s.trim()).filter(Boolean),
        allergies: patient.allergies.split(',').map(s=>s.trim()).filter(Boolean),
        medicines: validMeds,
        notes, followUpDate,
        safetyReport: safetyReport ? { overallRisk:safetyReport.overallRisk, summary:safetyReport.summary, findings:safetyReport.findings, checkedAt:safetyReport.checkedAt } : undefined,
        queueId: prePatient?.id,
      };

      await createPrescription(payload);
      toast.success('Prescription saved successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save prescription');
    } finally { setSubmitting(false); }
  };

  const setP = (k, v) => setPatient(prev => ({ ...prev, [k]: v }));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-display text-2xl text-navy-800">New Prescription</h1>
          <p className="text-sm text-slate-500">
            {prePatient ? `Patient: ${prePatient.patientName} · Token ${prePatient.tokenNumber}` : 'Manual prescription entry'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Patient Section */}
        <div className="card p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">
            <User size={15} className="text-navy-500" /> Patient Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Patient ID *</label>
              <input value={patient.patientId} onChange={e=>setP('patientId',e.target.value)}
                className="input font-mono" placeholder="PAT_001" required />
            </div>
            <div>
              <label className="label">Patient Name</label>
              <input value={patient.patientName} onChange={e=>setP('patientName',e.target.value)}
                className="input" placeholder="Full name" />
            </div>
            <div>
              <label className="label">Age</label>
              <input type="number" value={patient.age} onChange={e=>setP('age',e.target.value)}
                className="input" placeholder="45" min="0" max="120" />
            </div>
            <div>
              <label className="label">Gender</label>
              <select value={patient.gender} onChange={e=>setP('gender',e.target.value)} className="input">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Phone</label>
              <input value={patient.phone} onChange={e=>setP('phone',e.target.value)}
                className="input" placeholder="9876543210" />
            </div>
            <div>
              <label className="label">Known Allergies</label>
              <input value={patient.allergies} onChange={e=>setP('allergies',e.target.value)}
                className="input" placeholder="penicillin, sulfa (comma separated)" />
            </div>
            <div className="sm:col-span-2 md:col-span-3">
              <label className="label">Known Conditions</label>
              <input value={patient.conditions} onChange={e=>setP('conditions',e.target.value)}
                className="input" placeholder="diabetes, hypertension (comma separated)" />
            </div>
          </div>
        </div>

        {/* Clinical Section */}
        <div className="card p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">
            <Stethoscope size={15} className="text-navy-500" /> Clinical Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Primary Diagnosis *</label>
              <textarea value={diagnosis} onChange={e=>setDiagnosis(e.target.value)}
                className="input min-h-[80px] resize-none" placeholder="Clinical impression and diagnosis..." required />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Symptoms</label>
              <input value={symptoms} onChange={e=>setSymptoms(e.target.value)}
                className="input" placeholder="fever, cough, fatigue (comma separated)" />
            </div>
          </div>
        </div>

        {/* Medicines */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider">
              💊 Medicines
              {aiLoading && <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-normal normal-case tracking-normal">
                <span className="w-2.5 h-2.5 border border-amber-500 border-t-transparent rounded-full animate-spin" /> AI checking...
              </span>}
            </h2>
            <button type="button" onClick={addMed}
              className="flex items-center gap-1.5 text-xs text-navy-600 hover:text-navy-800 bg-navy-50 hover:bg-navy-100 px-3 py-1.5 rounded-lg border border-navy-200 transition-all">
              <Plus size={13} /> Add Medicine
            </button>
          </div>

          <div className="space-y-3">
            {medicines.map((med, idx) => (
              <MedicineRow key={idx} med={med} index={idx} onChange={updateMed}
                onRemove={removeMed} isOnly={medicines.length === 1} />
            ))}
          </div>
        </div>

        {/* AI Safety Panel */}
        {(safetyReport || aiLoading) && (
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">
              <Shield size={15} className="text-amber-500" /> AI Safety Analysis
              <span className="text-xs text-slate-400 font-normal normal-case tracking-normal">(patient data anonymised before sending)</span>
            </h2>
            <AISafetyPanel report={safetyReport} loading={aiLoading}
              blocked={blocked} onOverride={() => { setOverrideSafety(true); setBlocked(false); }} />
            {overrideSafety && (
              <div className="mt-2 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-700">
                ⚠️ Safety override active — proceeding with clinical judgement
              </div>
            )}
          </div>
        )}

        {/* Notes & Follow-up */}
        <div className="card p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Clinical Notes</label>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)}
                className="input min-h-[80px] resize-none" placeholder="Additional clinical notes..." />
            </div>
            <div>
              <label className="label">Follow-up Date</label>
              <input type="date" value={followUpDate} onChange={e=>setFollowUpDate(e.target.value)}
                className="input" min={new Date().toISOString().split('T')[0]} />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pb-8">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary px-6">Cancel</button>
          <button type="submit" disabled={submitting || (blocked && !overrideSafety)}
            className={`btn-primary flex-1 justify-center py-3 text-base
              ${blocked && !overrideSafety ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {submitting
              ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : blocked && !overrideSafety ? '⛔ Blocked — Review Safety Panel'
              : <><Save size={18} /> Save Prescription</>}
          </button>
        </div>
      </form>
    </div>
  );
}
