import { Trash2 } from 'lucide-react';
import { MedicineSearchDropdown } from '../MedicineSearch/MedicineSearchDropdown';

const FREQUENCIES = ['Once daily','Twice daily','Three times daily','Four times daily','Every 6 hours','Every 8 hours','As needed (PRN)','Once weekly'];
const DURATIONS   = ['3 days','5 days','7 days','10 days','14 days','21 days','1 month','3 months','Ongoing'];
const ROUTES      = ['Oral','Topical','Injection','Inhalation','Sublingual','Rectal','Nasal','Ophthalmic'];

export const MedicineRow = ({ med, index, onChange, onRemove, isOnly }) => {
  const update = (field, val) => onChange(index, { ...med, [field]: val });

  const handleMedicineSelect = (medicine) => {
    onChange(index, {
      ...med,
      name:      medicine.name,
      strength:  medicine.strength || '',
      dosageForm:medicine.dosageForm || '',
      manufacturer: medicine.manufacturer || '',
      medicineId: medicine._id || '',
    });
  };

  return (
    <div className="card p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Medicine #{index + 1}
        </span>
        {!isOnly && (
          <button type="button" onClick={() => onRemove(index)}
            className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Medicine search */}
        <div className="sm:col-span-2">
          <label className="label">Medicine Name *</label>
          <MedicineSearchDropdown
            value={med.name}
            onChange={(val) => update('name', val)}
            onSelect={handleMedicineSelect}
            placeholder="Search 50,000+ medicines..."
          />
        </div>

        {/* Auto-filled fields */}
        <div>
          <label className="label">Strength</label>
          <input value={med.strength} onChange={e => update('strength', e.target.value)}
            className="input" placeholder="e.g. 500 mg" />
        </div>
        <div>
          <label className="label">Dosage Form</label>
          <input value={med.dosageForm} onChange={e => update('dosageForm', e.target.value)}
            className="input" placeholder="e.g. Tablet" />
        </div>

        <div>
          <label className="label">Frequency *</label>
          <select value={med.frequency} onChange={e => update('frequency', e.target.value)} className="input">
            {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Duration *</label>
          <select value={med.duration} onChange={e => update('duration', e.target.value)} className="input">
            {DURATIONS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Route</label>
          <select value={med.route} onChange={e => update('route', e.target.value)} className="input">
            {ROUTES.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Special Instructions</label>
          <input value={med.instructions} onChange={e => update('instructions', e.target.value)}
            className="input" placeholder="e.g. Take with food" />
        </div>
      </div>
    </div>
  );
};
