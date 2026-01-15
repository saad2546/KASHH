import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';

const SurgeryForm = () => {
  const [formData, setFormData] = useState({
    patientName: '',
    surgeon: 'Dr. Smith (Cardiology)',
    duration: '',
    scheduledDate: '',
    scheduledTime: '09:00',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Surgery form submitted:', formData);
    // Reset form
    setFormData({
      patientName: '',
      surgeon: 'Dr. Smith (Cardiology)',
      duration: '',
      scheduledDate: '',
      scheduledTime: '09:00',
    });
  };

  return (
    <div className="surgery-form-container">
      <h3 className="queue-title" style={{ marginBottom: '1.5rem' }}>Add Surgery Request</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <label className="form-label">Patient Name</label>
          <input 
            type="text" 
            name="patientName"
            value={formData.patientName}
            onChange={handleChange}
            className="form-input" 
            placeholder="e.g. John Doe" 
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Surgeon</label>
            <select 
              name="surgeon"
              value={formData.surgeon}
              onChange={handleChange}
              className="form-input"
            >
              <option>Dr. Smith (Cardiology)</option>
              <option>Dr. Varma (Orthopedics)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Duration (Min)</label>
            <input 
              type="number" 
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="form-input" 
              placeholder="60" 
            />
          </div>
        </div>
        
        {/* Date and Time Input Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Scheduled Date</label>
            <input 
              type="date" 
              name="scheduledDate"
              value={formData.scheduledDate}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Scheduled Time</label>
            <input 
              type="time" 
              name="scheduledTime"
              value={formData.scheduledTime}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
        </div>

        <button type="submit" className="bg-blue-600" style={{ width: '100%', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <PlusCircle size={18} /> Add to Queue
        </button>
      </form>
    </div>
  );
};

export default SurgeryForm;