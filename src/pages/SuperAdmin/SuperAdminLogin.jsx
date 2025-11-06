import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/config";

const SuperAdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

 const handleLogin = async (e) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    // 🔐 Step 1: Sign in user
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // ⏳ Step 2: Wait a bit for Firebase to update session
    await new Promise((resolve) => setTimeout(resolve, 500)); // 0.5 second delay

    // 🧠 Step 3: Fetch Firestore document
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      setError("No user record found in Firestore.");
      await signOut(auth);
      return;
    }

    const role = userSnap.data().role?.toLowerCase();
    console.log("Role fetched:", role);

    // ✅ Step 4: Check role
    if (role === "superadmin") {
      navigate("/superadmin");
    } else {
      await signOut(auth);
      setError("Access denied: not a Super Admin account.");
      navigate("/");
    }
  } catch (err) {
    console.error("Login error:", err.message);
    setError("Invalid email or password.");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6 border">
        <h2 className="text-2xl font-semibold text-center mb-4">Super Admin Login</h2>

        {error && (
          <div className="bg-red-100 text-red-600 p-2 mb-3 rounded-md text-center text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@yourdomain.com"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Logging in…" : "Login"}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-blue-500 hover:underline"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
