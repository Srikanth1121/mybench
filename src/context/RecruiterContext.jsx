import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth";

export const RecruiterContext = createContext(null);

export const RecruiterProvider = ({ children }) => {
  const [recruiter, setRecruiter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const docRef = doc(db, "recruiters", currentUser.uid);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          setRecruiter({
            id: currentUser.uid,
            ...snap.data(),
          });
        } else {
          setRecruiter(null);
        }
      } else {
        setRecruiter(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <RecruiterContext.Provider value={recruiter}>
      {!loading && children}
    </RecruiterContext.Provider>
  );
};

export const useRecruiter = () => useContext(RecruiterContext);
