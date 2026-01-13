import React from 'react';
import { PlusCircle } from 'lucide-react';

const SurgeryForm = () => {
  return (
    <div className="surgery-form-container">
      <h3 className="queue-title" style={{ marginBottom: '1.5rem' }}>Add Surgery Request</h3>
      <div className="space-y-4">
        <div className="form-group">
          <label className="form-label">Patient Name</label>
          <input type="text" className="form-input" placeholder="e.g. John Doe" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Surgeon</label>
            <select className="form-input">
              <option>Dr. Smith (Cardiology)</option>
              <option>Dr. Varma (Orthopedics)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Duration (Min)</label>
            <input type="number" className="form-input" placeholder="60" />
          </div>
        </div>
        <button className="bg-blue-600" style={{ width: '100%', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <PlusCircle size={18} /> Add to Queue
        </button>
      </div>
    </div>
  );
};

export default SurgeryForm;