// src/pages/Recruiter/RecruiterInfoModal.jsx
import React, { useEffect, useState } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { getAuth } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";


export default function RecruiterInfoModal({ show, onClose }) {
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [designation, setDesignation] = useState("");
  const [loading, setLoading] = useState(false);

  const auth = getAuth();

  // 📦 Preload recruiter country from Firestore
  useEffect(() => {
    const fetchRecruiterCountry = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "users", user.uid); // or "recruiters" collection if used
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setCountry(data.country || "India"); // default fallback
        } else {
          setCountry("India");
        }
      }
    };
    fetchRecruiterCountry();
  }, [auth]);

  // 🇮🇳 Indian States List
  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
    "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
  ];

  // 🇺🇸 US States List
  const usStates = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
    "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
    "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine",
    "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri",
    "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
    "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
    "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee",
    "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
    "Wisconsin", "Wyoming"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!state || !linkedin) return alert("Please fill all mandatory fields.");

    try {
      setLoading(true);
      const user = auth.currentUser;
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        state,
        linkedin,
        designation,
        profileComplete: true,
      });
      setLoading(false);
      onClose();
    } catch (error) {
      console.error("Error updating recruiter info:", error);
      setLoading(false);
    }
  };

  if (!show) return null;

  const statesToShow = country === "USA" ? usStates : indianStates;

  return (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 border border-gray-100"
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-1">
            Complete Your Profile
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            Please complete your profile to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <input
                type="text"
                value={country}
                disabled
                className="w-full border border-gray-200 rounded-md p-2 bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>

            {/* State / Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {country === "India" ? "State" : "State / Region"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">
                  Select a {country === "India" ? "state" : "region"}
                </option>
                {statesToShow.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* LinkedIn */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://linkedin.com/in/yourprofile"
                required
              />
            </div>

            {/* Designation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Designation (optional)
              </label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Recruiter / Talent Specialist"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-md transition"
            >
              {loading ? "Saving..." : "Save & Continue"}
            </button>
          </form>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

}
