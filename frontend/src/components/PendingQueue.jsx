import React from "react";
import { Trash2, GripVertical, Zap, User } from "lucide-react";

const getScoreColor = (score) => {
  if (score >= 7) return "bg-red-100 text-red-700 border-red-200";
  if (score >= 4) return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-green-100 text-green-700 border-green-200";
};

const getScoreLabel = (score) => {
  if (score >= 7) return "Urgent";
  if (score >= 4) return "Moderate";
  return "Low";
};

const PendingQueue = ({ surgeries, onDelete }) => {
  // Sort by priority_score descending (highest priority first)
  const sorted = [...surgeries].sort(
    (a, b) => (b.priority_score || 0) - (a.priority_score || 0)
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
      {/* HEADER */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-slate-200">
        <h3 className="font-bold text-slate-800">Pending Requests</h3>
        <span className="text-xs font-semibold text-slate-500">
          {surgeries.length} Cases
        </span>
      </div>

      {/* LIST */}
      <div className="divide-y divide-slate-200">
        {sorted.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-slate-400">
            No pending requests yet
          </div>
        )}

        {sorted.map((surgery) => (
          <div
            key={surgery.id}
            className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition"
          >
            <GripVertical size={16} className="text-slate-400" />

            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-slate-800 text-sm">
                  {surgery.patient}
                </span>

                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getScoreColor(
                    surgery.priority_score || 0
                  )}`}
                >
                  {(surgery.priority_score || 0).toFixed(1)} — {getScoreLabel(surgery.priority_score || 0)}
                </span>
              </div>

              <div className="flex gap-4 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <User size={12} />
                  {surgery.surgeon}
                </span>

                {surgery.is_emergency && (
                  <span className="flex items-center gap-1 text-red-600 font-bold">
                    <Zap size={12} />
                    EMERGENCY
                  </span>
                )}

                {surgery.appointment_type && (
                  <span className="capitalize">
                    {surgery.appointment_type === "new"
                      ? "New"
                      : surgery.appointment_type === "follow-up"
                        ? "Follow-up"
                        : "Report"}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => onDelete(surgery.id)}
              className="text-slate-400 hover:text-red-600 transition"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingQueue;
