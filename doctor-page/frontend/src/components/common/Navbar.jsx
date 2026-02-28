import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Stethoscope, LayoutDashboard, FilePlus, ClipboardList, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/prescriptions/new', label: 'New Rx', icon: FilePlus },
  { to: '/prescriptions', label: 'History', icon: ClipboardList },
];

export const Navbar = () => {
  const { doctor, logout } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out successfully');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-navy-600 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-navy-700 transition-colors">
            <Stethoscope size={18} className="text-white" />
          </div>
          <div>
            <span className="font-display text-xl text-navy-700 leading-none">MediRx</span>
            <p className="text-[10px] text-slate-400 leading-none tracking-wider uppercase mt-0.5">Digital Prescriptions</p>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                pathname === to
                  ? 'bg-navy-50 text-navy-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}>
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Doctor menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-navy-500 to-navy-700 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {(doctor?.name || 'D').charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-slate-800 leading-tight">{doctor?.name || 'Doctor'}</p>
              <p className="text-xs text-slate-400 leading-tight">{doctor?.specialization}</p>
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden z-50 animate-fade-in">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-800">{doctor?.name}</p>
                <p className="text-xs text-slate-400 truncate">{doctor?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut size={15} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
