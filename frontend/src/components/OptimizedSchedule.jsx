import React from 'react';
import { Clock, MapPin, User, CheckCircle2 } from 'lucide-react';

const OptimizedSchedule = ({ data }) => {
  return (
    <div className="schedule-list">
      {data.map((item, index) => (
        <div key={index} className="schedule-item animate-entry">
          <div className="time-slot">{item.time}</div>
          <div className="surgery-details">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p className="patient-name">{item.patient}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#22c55e', fontSize: '0.75rem', fontWeight: 'bold' }}>
                <CheckCircle2 size={14} /> OPTIMIZED
              </div>
            </div>
            <div className="meta-info">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><User size={12} /> {item.surgeon}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={12} /> {item.room}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={12} /> {item.duration}m</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OptimizedSchedule;