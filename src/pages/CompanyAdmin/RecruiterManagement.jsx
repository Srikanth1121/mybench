import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  // addDoc,         // remove if you don't use it elsewhere
  setDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import {
  initializeApp,
  getApps,
  getApp,
} from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

// 🔹 Secondary Firebase app config (same as your main)
const firebaseConfig = {
  apiKey: "AIzaSyDq56aUs91FWSyTGYbZi_JvBtH4KJ0droI",
  authDomain: "mybench-b3984.firebaseapp.com",
  projectId: "mybench-b3984",
  storageBucket: "mybench-b3984.appspot.com",
  messagingSenderId: "517163805217",
  appId: "1:517163805217:web:109f3d0e304838a7951160",
};

// ✅ Initialize secondary app (to avoid logging out main admin)
const secondaryApp =
  getApps().find((app) => app.name === "Secondary") ||
  initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

export default function RecruiterManagement({ companyId }) {
  const [recruiters, setRecruiters] = useState([]);
  const [newRecruiter, setNewRecruiter] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Live Fetch recruiters under this company
  useEffect(() => {
    if (!companyId) return;

    const q = query(collection(db, "companies", companyId, "recruiters"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setRecruiters(list);
    });

    return () => unsubscribe();
  }, [companyId]);

  // ✅ Add Recruiter
  // ✅ Add Recruiter (updated version with /users write)
const handleAddRecruiter = async (e) => {
  e.preventDefault();

  if (!newRecruiter.name || !newRecruiter.email || !newRecruiter.password) {
    alert("Please fill all required fields");
    return;
  }
  if (newRecruiter.password !== newRecruiter.confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  try {
    setLoading(true);

    // 🔹 Create recruiter in Firebase Auth (secondary app)
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth,
      newRecruiter.email,
      newRecruiter.password
    );
    const newUser = userCredential.user;
    await updateProfile(newUser, { displayName: newRecruiter.name });

    // 🔹 Add recruiter to global `/users` collection
    await setDoc(doc(db, "users", newUser.uid), {
      uid: newUser.uid,
      name: newRecruiter.name,
      email: newRecruiter.email,
      phone: newRecruiter.phone,
      role: "recruiter",
      companyId: companyId,
      createdAt: serverTimestamp(),
      isActive: true,
    });

    // 🔹 Store recruiter also under the company's recruiters subcollection
    await setDoc(doc(db, "companies", companyId, "recruiters", newUser.uid), {
      uid: newUser.uid,
      name: newRecruiter.name,
      email: newRecruiter.email,
      phone: newRecruiter.phone,
      role: "recruiter",
      createdAt: serverTimestamp(),
      isActive: true,
    });

    // ✅ Clear form and close modal
    setNewRecruiter({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    });
    setShowAdd(false);
    alert("✅ Recruiter added successfully!");

    // 🔹 Logout the secondary app (avoid switching main user)
    await secondaryAuth.signOut();

  } catch (error) {
    console.error("Error adding recruiter:", error);
    if (error.code === "auth/email-already-in-use") {
      alert("❌ This email is already registered.");
    } else {
      alert(error.message);
    }
  } finally {
    setLoading(false);
  }
};


  // ✅ Delete recruiter
  const handleDeleteRecruiter = async (id) => {
    if (!window.confirm("Are you sure you want to delete this recruiter?")) return;
    try {
      await deleteDoc(doc(db, "companies", companyId, "recruiters", id));
      alert("Recruiter deleted successfully!");
    } catch (error) {
      console.error("Error deleting recruiter:", error);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-textPrimary">
          👥 Recruiter Management
        </h1>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 rounded-2xl border border-border bg-primary/5 text-primary hover:bg-primary hover:text-white transition"
        >
          ➕ Add Recruiter
        </button>
      </div>

      {/* Recruiters Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {recruiters.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-6 text-textSecondary">
                  No recruiters found
                </td>
              </tr>
            ) : (
              recruiters.map((rec) => (
                <tr key={rec.id} className="border-b border-border hover:bg-muted/20">
                  <td className="px-4 py-3">{rec.name}</td>
                  <td className="px-4 py-3">{rec.email}</td>
                  <td className="px-4 py-3">{rec.phone || "—"}</td>
                  <td className="px-4 py-3">{rec.isActive ? "Active" : "Hold"}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDeleteRecruiter(rec.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Recruiter Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-semibold text-textPrimary mb-4">
              ➕ Add Recruiter
            </h2>
            <form onSubmit={handleAddRecruiter} className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                className="w-full border border-border rounded-lg p-2"
                value={newRecruiter.name}
                onChange={(e) =>
                  setNewRecruiter({ ...newRecruiter, name: e.target.value })
                }
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full border border-border rounded-lg p-2"
                value={newRecruiter.email}
                onChange={(e) =>
                  setNewRecruiter({ ...newRecruiter, email: e.target.value })
                }
              />
              <input
                type="tel"
                placeholder="Phone Number"
                className="w-full border border-border rounded-lg p-2"
                value={newRecruiter.phone}
                onChange={(e) =>
                  setNewRecruiter({ ...newRecruiter, phone: e.target.value })
                }
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full border border-border rounded-lg p-2"
                value={newRecruiter.password}
                onChange={(e) =>
                  setNewRecruiter({ ...newRecruiter, password: e.target.value })
                }
              />
              <input
                type="password"
                placeholder="Confirm Password"
                className="w-full border border-border rounded-lg p-2"
                value={newRecruiter.confirmPassword}
                onChange={(e) =>
                  setNewRecruiter({
                    ...newRecruiter,
                    confirmPassword: e.target.value,
                  })
                }
              />

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 border border-border rounded-lg text-textSecondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary text-white rounded-lg"
                >
                  {loading ? "Adding..." : "Add Recruiter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
