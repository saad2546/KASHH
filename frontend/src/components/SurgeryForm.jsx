import React, { useState } from "react";
import { PlusCircle } from "lucide-react";

const SurgeryForm = () => {
  const [formData, setFormData] = useState({
    patientName: "",
    surgeon: "Dr. Smith (Cardiology)",
    duration: "",
    scheduledDate: "",
    scheduledTime: "09:00",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
    setFormData({
      patientName: "",
      surgeon: "Dr. Smith (Cardiology)",
      duration: "",
      scheduledDate: "",
      scheduledTime: "09:00",
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <h3 className="font-bold text-slate-800 mb-6">
        Add Surgery Request
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* PATIENT */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Patient Name
          </label>
          <input
            type="text"
            name="patientName"
            value={formData.patientName}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. John Doe"
          />
        </div>

        {/* SURGEON + DURATION */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Surgeon
            </label>
            <select
              name="surgeon"
              value={formData.surgeon}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option>Dr. Smith (Cardiology)</option>
              <option>Dr. Varma (Orthopedics)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Duration (min)
            </label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              placeholder="60"
            />
          </div>
        </div>

        {/* DATE + TIME */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Scheduled Date
            </label>
            <input
              type="date"
              name="scheduledDate"
              value={formData.scheduledDate}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Scheduled Time
            </label>
            <input
              type="time"
              name="scheduledTime"
              value={formData.scheduledTime}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
        >
          <PlusCircle size={18} />
          Add to Queue
        </button>
      </form>
    </div>
  );
};

export default SurgeryForm;
