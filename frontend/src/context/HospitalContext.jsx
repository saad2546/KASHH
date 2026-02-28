import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const HospitalContext = createContext(null);

export const HospitalProvider = ({ children }) => {
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);

  const fetchHospital = async (uid) => {
    if (!uid) {
      setHospital(null);
      setUserRole(null);
      setDoctorProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // 1. Fetch User Profile to get Role
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      let uRole = "admin"; // default fallback
      let hospId = null;

      if (userSnap.exists()) {
        const uData = userSnap.data();
        uRole = uData.role || "admin";
        hospId = uData.hospitalId;
        setUserRole(uRole);
        if (uRole === "doctor") {
          setDoctorProfile(uData);
        }
      } else {
        setUserRole("admin");
      }

      // 2. Fetch Hospital
      if (uRole === "doctor" && hospId) {
        // Fetch hospital by ID directly
        const hRef = doc(db, "hospitals", hospId);
        const hSnap = await getDoc(hRef);
        if (hSnap.exists()) {
          setHospital({ id: hSnap.id, ...hSnap.data() });
        } else {
          setHospital(null);
        }
      } else {
        // Admin: fetch by admin_uid
        const q = query(
          collection(db, "hospitals"),
          where("admin_uid", "==", uid)
        );

        const snap = await getDocs(q);

        if (!snap.empty) {
          const h = snap.docs[0];
          setHospital({ id: h.id, ...h.data() });
        } else {
          setHospital(null);
        }
      }
    } catch (error) {
      console.error("Error fetching hospital:", error);
      setHospital(null);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  // LISTEN TO AUTH STATE CHANGES
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // when login/logout happens, re-fetch hospital
      fetchHospital(user?.uid);
    });

    return () => unsubscribe();
  }, []);

  return (
    <HospitalContext.Provider
      value={{
        hospital,
        loading,
        userRole,
        doctorProfile,
        refreshHospital: () => fetchHospital(auth.currentUser?.uid),
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
};

export const useHospital = () => useContext(HospitalContext);
