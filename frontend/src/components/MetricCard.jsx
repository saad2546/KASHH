import React from "react";

const MetricCard = ({ title, value, subtext, colorClass = "text-slate-900" }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      {title}
    </p>

    <h3
      className={`text-3xl font-extrabold my-2 ${colorClass}`}
    >
      {value}
    </h3>

    <p className="text-sm text-slate-500 font-medium">
      {subtext}
    </p>
  </div>
);

export default MetricCard;
