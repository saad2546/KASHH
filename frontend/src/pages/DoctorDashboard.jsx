import React, { useState, useEffect, useMemo } from "react";
import { io } from "socket.io-client";
import { User, LogOut, CheckCircle, Clock } from "lucide-react";
import { collection, onSnapshot, query, where, doc, updateDoc } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import { db } from "@/firebase";
import { useHospital } from "@/context/HospitalContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function DoctorDashboard() {
    const { hospital, doctorProfile, loading } = useHospital();
    const navigate = useNavigate();
    const [firestoreQueue, setFirestoreQueue] = useState([]);
    const [mobileQueue, setMobileQueue] = useState([]);

    const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

    // Combine Firestore and Mobile bookings
    const queue = useMemo(() => {
        const mobileMapped = mobileQueue.map(s => ({
            ...s,
            id: s.token_number || s.id,
            patient_name: s.patient_name,
            chief_complaint: s.complaint,
            isMobile: true
        }));

        return [...firestoreQueue, ...mobileMapped].sort((a, b) => {
            if (a.scheduled_start_time && b.scheduled_start_time) {
                return a.scheduled_start_time.localeCompare(b.scheduled_start_time);
            }
            return (b.priority_score || 0) - (a.priority_score || 0);
        });
    }, [firestoreQueue, mobileQueue]);

    // Poll Mobile Queue for this doctor every 5 seconds
    useEffect(() => {
        // We use the doctor's name or UID. The backend uses doctor_id.
        // For consistency with existing setup, let's try to match by UID
        if (loading || !doctorProfile?.uid) return;

        const fetchMobileQueue = async () => {
            try {
                const auth = getAuth();
                const user = auth.currentUser;
                const token = user ? await user.getIdToken() : "";

                const res = await fetch(`${API_URL}/api/queue/today?name=${encodeURIComponent(doctorProfile.name || "")}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                setMobileQueue(data.queue || []);
            } catch (err) {
                console.error("Mobile queue fetch error:", err);
            }
        };

        fetchMobileQueue();

        // Setup WebSocket connection for real-time updates
        const socket = io(API_URL);

        socket.on("connect", () => {
            console.log("Connected to queue WebSocket");
        });

        socket.on("queue_updated", (data) => {
            // Match by UID OR by Name (if the Admin used the name as id)
            const isMatch = data.doctor_id === doctorProfile.uid ||
                data.doctor_id === doctorProfile.name ||
                data.doctor_name === doctorProfile.name;

            if (isMatch) {
                console.log("Received update for my queue:", data);
                setMobileQueue(data.queue || []);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [doctorProfile?.uid, loading, API_URL]);

    useEffect(() => {
        if (loading || !hospital?.id || !doctorProfile?.name) return;

        // Fetch pending surgeries assigned to this doctor from Firebase
        const q = query(
            collection(db, "hospitals", hospital.id, "surgery_requests"),
            where("surgeon", "==", doctorProfile.name),
            where("status", "in", ["pending", "scheduled"])
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            const requests = snap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
            }));

            setFirestoreQueue(requests);
        });

        return () => unsubscribe();
    }, [hospital?.id, doctorProfile?.name, loading]);

    const handleLogout = () => {
        signOut(getAuth()).then(() => navigate("/login"));
    };

    const handleCompleteCase = async (id, patientName) => {
        try {
            await updateDoc(doc(db, "hospitals", hospital.id, "surgery_requests", id), {
                status: "completed"
            });
            toast.success(`Completed consultation for ${patientName}`);
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <p className="text-slate-500">Loading your profile...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans">
            <div className="max-w-5xl mx-auto space-y-8 mt-10">
                {/* HEADER */}
                <header className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-500">
                            <User size={28} className="text-blue-700" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-900">
                                Welcome, {doctorProfile?.name || "Doctor"}
                            </h1>
                            <p className="text-sm font-medium text-slate-500">
                                {doctorProfile?.specialization || "Department"} • {hospital?.hospital_name}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </header>

                {/* STATS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm text-center">
                        <p className="text-sm font-semibold uppercase text-slate-500 mb-1">Pending Patients</p>
                        <p className="text-4xl font-extrabold text-blue-600">{queue.length}</p>
                    </div>
                    <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm text-center">
                        <p className="text-sm font-semibold uppercase text-slate-500 mb-1">Urgent Cases</p>
                        <p className="text-4xl font-extrabold text-red-600">
                            {queue.filter(q => q.priority_score >= 7).length}
                        </p>
                    </div>
                    <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm text-center">
                        <p className="text-sm font-semibold uppercase text-slate-500 mb-1">Next Appointment</p>
                        <p className="text-xl font-bold text-slate-800 mt-2">
                            {queue.length > 0 ? queue[0].scheduled_start_time || "Now" : "None"}
                        </p>
                    </div>
                </div>

                {/* QUEUE LIST */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Clock size={18} className="text-blue-600" />
                            Your Patient Queue
                        </h2>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {queue.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 font-medium tracking-wide">
                                No patients in your queue right now. Great job!
                            </div>
                        ) : (
                            queue.map((patient, index) => {
                                const isUrgent = patient.priority_score >= 7;
                                return (
                                    <div key={patient.id} className="p-6 hover:bg-slate-50 transition flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-10 w-10 flex items-center justify-center rounded-full font-bold text-white shadow-sm ${isUrgent ? 'bg-red-500' : 'bg-slate-300'}`}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                                    {patient.patient_name}
                                                    {isUrgent && <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full border border-red-200">URGENT</span>}
                                                </h3>
                                                <p className="text-sm text-slate-500 font-medium mt-1">
                                                    Complaint: <span className="text-slate-700">{patient.chief_complaint}</span>
                                                </p>
                                                <ul className="flex gap-4 mt-2 text-xs font-semibold text-slate-400">
                                                    <li>Age: {patient.age || "N/A"}</li>
                                                    <li className="capitalize">Type: {patient.appointment_type || "New"}</li>
                                                    <li>Score: {Number(patient.priority_score || 0).toFixed(1)}</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 w-full md:w-auto">
                                            <div className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 text-center flex-1 md:flex-none">
                                                {patient.scheduled_start_time || "Pending"}
                                            </div>
                                            <button
                                                onClick={() => handleCompleteCase(patient.id, patient.patient_name)}
                                                className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-bold transition shadow-sm flex-1 md:flex-none"
                                            >
                                                <CheckCircle size={18} />
                                                Done
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
