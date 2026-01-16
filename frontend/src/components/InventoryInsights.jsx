import React from "react";
import { BrainCircuit } from "lucide-react";

export default function InventoryInsights({ insights }) {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <BrainCircuit size={18} className="text-amber-600" />
        <h3 className="text-sm font-bold text-amber-800">
          AI Insights
        </h3>
      </div>

      <ul className="space-y-2 text-sm text-amber-700 font-medium">
        {insights.map((point, idx) => (
          <li key={idx} className="flex gap-2">
            <span className="text-amber-600 font-bold">•</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
