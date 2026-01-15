import React from "react";
import { AlertCircle, Clock, Trash2, GripVertical } from "lucide-react";

const priorityColors = {
  urgent: "bg-red-100 text-red-700",
  normal: "bg-yellow-100 text-yellow-700",
  elective: "bg-blue-100 text-blue-700",
};

const PendingQueue = ({ surgeries, onDelete }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
      {/* HEADER */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-slate-200">
        <h3 className="font-bold text-slate-800">
          Pending Requests
        </h3>
        <span className="text-xs font-semibold text-slate-500">
          {surgeries.length} Cases
        </span>
      </div>

      {/* LIST */}
      <div className="divide-y divide-slate-200">
        {surgeries.map((surgery) => (
          <div
            key={surgery.id}
            className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition"
          >
            {/* DRAG */}
            <GripVertical size={16} className="text-slate-400" />

            {/* MAIN */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-slate-800 text-sm">
                  {surgery.patient}
                </span>

                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    priorityColors[surgery.priority.toLowerCase()]
                  }`}
                >
                  {surgery.priority}
                </span>
              </div>

              <div className="flex gap-4 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {surgery.duration}m
                </span>
                <span>{surgery.surgeon}</span>
              </div>
            </div>

            {/* DELETE */}
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
