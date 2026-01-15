import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

const ProtectedRoutes = ({ children }) => {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  if (user === undefined) {
    return <div>Loading...</div>;
  }

  return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoutes;
