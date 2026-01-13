import React from 'react';

const MetricCard = ({ title, value, subtext, colorClass }) => (
  <div className="metric-card">
    <p className="form-label">{title}</p>
    <h3 className={`patient-name ${colorClass}`} style={{ fontSize: '1.75rem', margin: '0.5rem 0' }}>
      {value}
    </h3>
    <p className="meta-info">{subtext}</p>
  </div>
);

export default MetricCard;