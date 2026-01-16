import React from "react";
import { Clock, MapPin, User, CheckCircle2, Calendar, ArrowRight } from "lucide-react";

const OptimizedSchedule = ({ data }) => {
  // Group schedules by date
  const groupedByDate = data.reduce((acc, item) => {
    const date = item.date || "Unknown Date";
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  // Sort dates
  const sortedDates = Object.keys(groupedByDate).sort();

  // Sort surgeries within each date by optimized_start time
  sortedDates.forEach(date => {
    groupedByDate[date].sort((a, b) => {
      // Convert time strings (HH:MM) to comparable numbers
      const timeA = a.optimized_start.split(':').map(Number);
      const timeB = b.optimized_start.split(':').map(Number);
      
      // Compare hours first, then minutes
      if (timeA[0] !== timeB[0]) {
        return timeA[0] - timeB[0];
      }
      return timeA[1] - timeB[1];
    });
  });

  if (data.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-slate-400">
        <Clock size={48} className="mx-auto mb-3 opacity-30" />
        <p className="font-medium">No optimized schedule yet</p>
        <p className="text-sm mt-1">Add surgeries and run the optimizer</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-200">
      {sortedDates.map((date) => (
        <div key={date}>
          {/* DATE HEADER */}
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-blue-600" />
              <span className="font-bold text-slate-700">
                {new Date(date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              <span className="ml-auto text-xs text-slate-500 font-medium">
                {groupedByDate[date].length} {groupedByDate[date].length === 1 ? 'surgery' : 'surgeries'}
              </span>
            </div>
          </div>

          {/* SURGERIES FOR THIS DATE */}
          {groupedByDate[date].map((item, index) => (
            <div
              key={index}
              className="flex gap-4 px-6 py-4 hover:bg-slate-50 transition"
            >
              {/* TIME COMPARISON */}
              <div className="text-sm font-mono w-32 shrink-0">
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 line-through text-xs">
                    {item.original_start}
                  </span>
                  <ArrowRight size={12} className="text-slate-400" />
                </div>
                <div className="font-bold text-blue-600">
                  {item.optimized_start}
                </div>
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
                    OR-{item.room}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default OptimizedSchedule;