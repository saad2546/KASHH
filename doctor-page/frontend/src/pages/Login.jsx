import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Mail, Lock, Eye, EyeOff, AlertCircle, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email:'', password:'', name:'', specialization:'', hospitalId:'' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register, error } = useAuth();
  const navigate = useNavigate();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (mode === 'login') { await login(form.email, form.password); toast.success('Welcome back, Doctor!'); }
      else { await register(form.email, form.password, form.name, form.specialization, form.hospitalId); toast.success('Account created!'); }
      navigate('/dashboard');
    } catch {} finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-navy-600 rounded-2xl shadow-lg mb-4">
            <Stethoscope size={28} className="text-white" />
          </div>
          <h1 className="font-display text-3xl text-navy-800">MediRx</h1>
          <p className="text-slate-500 text-sm mt-1">Secure Digital Prescriptions for Doctors</p>
        </div>

        <div className="card p-8 shadow-card-hover">
          <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
            {[['login','Sign In',LogIn],['register','Register',UserPlus]].map(([v,l,Icon])=>(
              <button key={v} onClick={() => setMode(v)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all
                  ${mode===v?'bg-white shadow-sm text-navy-700':'text-slate-500 hover:text-slate-700'}`}>
                <Icon size={15} /> {l}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm mb-5 animate-fade-in">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div><label className="label">Full Name</label>
                  <input value={form.name} onChange={e=>set('name',e.target.value)} className="input" placeholder="Dr. Priya Sharma" required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Specialization</label>
                    <input value={form.specialization} onChange={e=>set('specialization',e.target.value)} className="input" placeholder="Cardiology" /></div>
                  <div><label className="label">Hospital ID</label>
                    <input value={form.hospitalId} onChange={e=>set('hospitalId',e.target.value)} className="input" placeholder="HOSP_001" /></div>
                </div>
              </>
            )}

            <div><label className="label">Email</label>
              <div className="relative"><Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" value={form.email} onChange={e=>set('email',e.target.value)} className="input pl-10" placeholder="doctor@hospital.com" required /></div></div>

            <div><label className="label">Password</label>
              <div className="relative"><Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={showPwd?'text':'password'} value={form.password} onChange={e=>set('password',e.target.value)}
                  className="input pl-10 pr-10" placeholder="Your password" required />
                <button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPwd?<EyeOff size={15}/>:<Eye size={15}/>}</button></div></div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 justify-center text-base">
              {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : mode==='login' ? 'Sign In to Dashboard' : 'Create Doctor Account'}
            </button>
          </form>

          <div className="mt-5 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
            <p className="text-xs text-slate-400 font-medium mb-1">Dev mode</p>
            <p className="text-xs font-mono text-slate-500">Backend bypasses auth if Firebase not configured</p>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">🔒 Firebase Auth · Patient data never sent to AI</p>
      </div>
    </div>
  );
}
