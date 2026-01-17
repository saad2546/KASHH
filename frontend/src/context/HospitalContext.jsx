import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const HospitalContext = createContext(null);

export const HospitalProvider = ({ children }) => {
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHospital = async (uid) => {
    if (!uid) {
      setHospital(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
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
    } catch (error) {
      console.error("Error fetching hospital:", error);
      setHospital(null);
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
        refreshHospital: () => fetchHospital(auth.currentUser?.uid),
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
};

export const useHospital = () => useContext(HospitalContext);
