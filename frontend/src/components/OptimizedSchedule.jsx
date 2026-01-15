import React from "react";
import { Clock, MapPin, User, CheckCircle2 } from "lucide-react";

const OptimizedSchedule = ({ data }) => {
  return (
    <div className="divide-y divide-slate-200">
      {data.map((item, index) => (
        <div
          key={index}
          className="flex gap-4 px-6 py-4 hover:bg-slate-50 transition"
        >
          {/* TIME */}
          <div className="text-sm font-bold text-slate-600 w-16 shrink-0">
            {item.time}
          </div>

          {/* DETAILS */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <p className="font-semibold text-slate-800">
                {item.patient}
              </p>

              <span className="flex items-center gap-1 text-green-600 text-xs font-bold">
                <CheckCircle2 size={14} />
                OPTIMIZED
              </span>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <User size={12} />
                {item.surgeon}
              </span>

              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {item.room}
              </span>

              <span className="flex items-center gap-1">
                <Clock size={12} />
                {item.duration}m
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OptimizedSchedule;
