import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Loader2, Pill, X } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { searchMedicines } from '../../services/medicineService';

const CAT_COLORS = {
  'Antibiotic':'bg-blue-100 text-blue-700','Antiviral':'bg-purple-100 text-purple-700',
  'Antifungal':'bg-orange-100 text-orange-700','Analgesic':'bg-pink-100 text-pink-700',
  'Antipyretic':'bg-red-100 text-red-700','Antidiabetic':'bg-teal-100 text-teal-700',
  'Antidepressant':'bg-indigo-100 text-indigo-700','Antiseptic':'bg-green-100 text-green-700',
};

const MedicineOption = ({ medicine, isHighlighted, onClick }) => (
  <button type="button" onClick={() => onClick(medicine)}
    className={`w-full text-left px-4 py-3 transition-colors border-b border-slate-100 last:border-0
      ${isHighlighted ? 'bg-navy-50' : 'hover:bg-slate-50'}`}>
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-slate-800">{medicine.name}</span>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${CAT_COLORS[medicine.category] || 'bg-slate-100 text-slate-600'}`}>
            {medicine.category}
          </span>
          {medicine.classification === 'Prescription' && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Rx</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
          {medicine.strength && <span className="font-mono font-medium text-navy-600">{medicine.strength}</span>}
          {medicine.dosageForm && <span>{medicine.dosageForm}</span>}
          {medicine.manufacturer && <span className="truncate opacity-75">· {medicine.manufacturer}</span>}
        </div>
        {medicine.indication && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">For: {medicine.indication}</p>
        )}
      </div>
      <Pill size={14} className="text-slate-300 flex-shrink-0 mt-1" />
    </div>
  </button>
);

export const MedicineSearchDropdown = ({
  value = '', onChange, onSelect,
  placeholder = 'Search medicine by name, category, indication...',
  className = '', disabled = false,
}) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) { setResults([]); setOpen(false); return; }
    const fetch = async () => {
      setLoading(true); setError(null);
      try {
        const data = await searchMedicines(debouncedQuery, { limit: 15 });
        setResults(data); setOpen(true); setHighlighted(0);
      } catch { setError('Search unavailable.'); setResults([]); }
      finally { setLoading(false); }
    };
    fetch();
  }, [debouncedQuery]);

  useEffect(() => {
    const h = (e) => { if (!dropdownRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleInput = (e) => {
    const val = e.target.value; setQuery(val); onChange?.(val);
    if (!val) { setResults([]); setOpen(false); }
  };

  const handleSelect = useCallback((medicine) => {
    setQuery(medicine.name); setOpen(false); setResults([]);
    onSelect?.(medicine); onChange?.(medicine.name);
  }, [onSelect, onChange]);

  const handleClear = () => { setQuery(''); setResults([]); setOpen(false); onChange?.(''); inputRef.current?.focus(); };

  const handleKeyDown = (e) => {
    if (!open || !results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h+1, results.length-1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h-1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (results[highlighted]) handleSelect(results[highlighted]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div className={`relative flex items-center bg-white border rounded-xl transition-all
        ${open ? 'border-navy-400 ring-2 ring-navy-500/20' : 'border-slate-200 hover:border-slate-300'}`}>
        <Search size={16} className={`absolute left-3.5 ${loading ? 'text-navy-500' : 'text-slate-400'}`} />
        <input ref={inputRef} type="text" value={query} onChange={handleInput}
          onKeyDown={handleKeyDown} onFocus={() => results.length && setOpen(true)}
          placeholder={placeholder} disabled={disabled} autoComplete="off"
          className="w-full pl-10 pr-10 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 bg-transparent rounded-xl outline-none" />
        <div className="absolute right-3 flex items-center gap-1">
          {loading && <Loader2 size={15} className="text-navy-500 animate-spin" />}
          {query && !loading && (
            <button type="button" onClick={handleClear} className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors"><X size={14} /></button>
          )}
        </div>
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden z-50 max-h-72 overflow-y-auto animate-slide-up">
          {error ? (
            <div className="px-4 py-3 text-sm text-rose-500 text-center">{error}</div>
          ) : results.length === 0 && !loading ? (
            <div className="px-4 py-6 text-center">
              <Pill size={28} className="text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No results for "<strong>{query}</strong>"</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">{results.length} results · ↑↓ navigate · Enter select</span>
              </div>
              {results.map((med, idx) => (
                <MedicineOption key={med._id || idx} medicine={med} isHighlighted={idx === highlighted} onClick={handleSelect} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};
