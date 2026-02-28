import React, { useEffect, useState } from "react";
import { PlusCircle, AlertTriangle } from "lucide-react";
import { collection, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { toast } from "sonner";
import { useHospital } from "@/context/HospitalContext";

const SurgeryForm = ({ onPatientAdded }) => {
  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  const { hospital } = useHospital();

  const [doctors, setDoctors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    patientName: "",
    doctor: "",
    scheduledDate: "",
    scheduledTime: "09:00",
    chiefComplaint: "",
    appointmentType: "new",
    age: "",
    isEmergency: false,
  });

  // Fetch doctors
  useEffect(() => {
    if (!hospital?.id) return;

    const ref = collection(db, "hospitals", hospital.id, "surgeons");

    const unsub = onSnapshot(ref, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setDoctors(list);

      // auto select first doctor if empty
      if (!formData.doctor && list.length > 0) {
        setFormData((prev) => ({
          ...prev,
          doctor: `${list[0].name} (${list[0].department})`,
        }));
      }
    });

    return () => unsub();
  }, [hospital?.id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Save request
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hospital?.id) {
      toast.error("Hospital not loaded");
      return;
    }

    if (!formData.chiefComplaint.trim()) {
      toast.error("Please enter a chief complaint");
      return;
    }

    if (!formData.age || Number(formData.age) <= 0) {
      toast.error("Please enter a valid age");
      return;
    }

    setSubmitting(true);

    try {
      // Call priority scoring API
      const priorityRes = await fetch(`${API_URL}/api/calculate-priority`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chief_complaint: formData.chiefComplaint,
          appointment_type: formData.appointmentType,
          age: Number(formData.age),
          is_emergency: formData.isEmergency,
        }),
      });

      const priorityData = await priorityRes.json();

      if (!priorityRes.ok) {
        toast.error(priorityData.error || "Failed to calculate priority");
        return;
      }

      // Save to Firestore with computed priority
      const surgeryDoc = await addDoc(
        collection(db, "hospitals", hospital.id, "surgery_requests"),
        {
          patient_name: formData.patientName,
          surgeon: formData.doctor,
          scheduled_date: formData.scheduledDate,
          scheduled_start_time: formData.scheduledTime,
          chief_complaint: formData.chiefComplaint,
          appointment_type: formData.appointmentType,
          age: Number(formData.age),
          is_emergency: formData.isEmergency,
          priority_score: priorityData.priority_score,
          urgency_score: priorityData.urgency_score,
          status: "scheduled",
          createdAt: serverTimestamp(),
        }
      );

      // ALSO add to the Python backend's in-memory queue to trigger WebSocket updates
      // Find the doctor object to get their name/id
      const selectedDoctorDoc = doctors.find(d => `${d.name} (${d.department})` === formData.doctor);

      try {
        await fetch(`${API_URL}/api/queue/add-patient`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            doctor_id: selectedDoctorDoc?.id || formData.doctor, // Fallback to label if no ID
            doctor_name: selectedDoctorDoc?.name || formData.doctor.split(' (')[0],
            patient_name: formData.patientName,
            complaint: formData.chiefComplaint,
            appointment_type: formData.appointmentType,
            age: Number(formData.age),
            is_emergency: formData.isEmergency,
            priority_score: priorityData.priority_score,
            urgency_score: priorityData.urgency_score,
            id: surgeryDoc.id, // Keep them linked
            hospital_id: hospital.id
          }),
        });
      } catch (apiErr) {
        console.warn("Failed to update real-time queue, but saved to Firestore:", apiErr);
      }

      toast.success(`Patient Added Successfully!`);

      // 4. Trigger Auto-Optimization
      if (onPatientAdded) {
        onPatientAdded();
      }

      setFormData({
        patientName: "",
        doctor: "",
        scheduledDate: "",
        scheduledTime: "09:00",
        chiefComplaint: "",
        appointmentType: "new",
        age: "",
        isEmergency: false,
      });
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Failed to add to queue");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <h3 className="font-bold text-slate-800 mb-6">Add Details</h3>

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
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. John Doe"
            required
          />
        </div>

        {/* DOCTOR */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Doctor
          </label>
          <select
            name="doctor"
            value={formData.doctor}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900"
            required
          >
            <option value="">Select Doctor</option>
            {doctors.map((s) => (
              <option key={s.id} value={`${s.name} (${s.department})`}>
                {s.name} ({s.department})
              </option>
            ))}
          </select>
        </div>

        {/* CHIEF COMPLAINT */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Chief Complaint
          </label>
          <input
            type="text"
            name="chiefComplaint"
            value={formData.chiefComplaint}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Severe stomach pain since morning"
            required
          />
        </div>

        {/* APPOINTMENT TYPE + AGE */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Appointment Type
            </label>
            <select
              name="appointmentType"
              value={formData.appointmentType}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900"
            >
              <option value="new">🩺 New Consultation</option>
              <option value="follow-up">🔁 Follow-up</option>
              <option value="report">📄 Report Review</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Age
            </label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900"
              placeholder="e.g. 45"
              min="0"
              max="150"
              required
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
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900"
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
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900"
              required
            />
          </div>
        </div>

        {/* EMERGENCY TOGGLE */}
        <div className="flex items-center gap-3 p-3 rounded-lg border border-red-100 bg-red-50/50">
          <input
            type="checkbox"
            name="isEmergency"
            id="isEmergency"
            checked={formData.isEmergency}
            onChange={handleChange}
            className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
          />
          <label
            htmlFor="isEmergency"
            className="flex items-center gap-2 text-sm font-semibold text-red-700 cursor-pointer select-none"
          >
            <AlertTriangle size={14} />
            This is an emergency
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-60"
        >
          <PlusCircle size={18} />
          {submitting ? "Calculating Priority..." : "Add to Queue"}
        </button>
      </form>
    </div>
  );
};

export default SurgeryForm;
