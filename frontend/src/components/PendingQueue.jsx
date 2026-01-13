import React from 'react';
import { AlertCircle, Clock, Trash2, GripVertical } from 'lucide-react';

const PendingQueue = ({ surgeries, onDelete }) => {
  return (
    <div className="pending-queue-container">
      <div className="queue-header">
        <h3 className="queue-title">Pending Requests</h3>
        <span className="queue-count">{surgeries.length} Cases</span>
      </div>
      <div className="queue-list">
        {surgeries.map((surgery) => (
          <div key={surgery.id} className="queue-item animate-entry">
            <div className="drag-handle"><GripVertical size={16} /></div>
            <div className="item-main">
              <div className="item-top">
                <span className="patient-name" style={{ fontSize: '0.9rem' }}>{surgery.patient}</span>
                <span className={`priority-badge ${surgery.priority.toLowerCase()}`}>{surgery.priority}</span>
              </div>
              <div className="meta-info">
                <span className="detail-tag"><Clock size={12} /> {surgery.duration}m</span>
                <span>{surgery.surgeon}</span>
              </div>
            </div>
            <button className="delete-btn" onClick={() => onDelete(surgery.id)}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingQueue;