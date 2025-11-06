import React, { useState, useEffect } from "react";
import { browserLocalPersistence, setPersistence } from "firebase/auth";

import { db, auth, googleProvider } from "../../firebase/config";
import { collection, getDocs } from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import { log, error } from "../../utils/logger";
import { sendPasswordResetEmail } from "firebase/auth";
import { sendEmailVerification } from "firebase/auth";
import { useNavigate } from "react-router-dom";


export default function HomePage() {
  const [activeTab, setActiveTab] = useState("login");
    const [currentUser, setCurrentUser] = useState(null);
      // Forgot Password states
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [message, setMessage] = useState("");
const navigate = useNavigate();



    // --- Register New User ---
  


    // --- Login Existing User ---
 async function handleLogin(e) {
  e.preventDefault();
  const email = e.target[0].value;
  const password = e.target[1].value;

  try {
    // Keep user logged in on browser reload
    await setPersistence(auth, browserLocalPersistence);

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Check email verification
    if (!user.emailVerified) {
      alert("⚠️ Your email is not verified. Please check your inbox for the verification link.");
      await signOut(auth); // force logout
      return;
    }

    alert("✅ Logged in successfully!");
  } catch (err) {
    console.error("❌ Login Error:", err.message);
    alert(err.message);
  }
}



    // --- Google Sign-In ---
  async function handleGoogleLogin() {
  try {
    await setPersistence(auth, browserLocalPersistence);
    await signInWithPopup(auth, googleProvider);
    alert("✅ Logged in with Google");
  } catch (error) {
    error("❌ Google Sign-In Error:", error.message);
    alert(error.message);
  }
}
  // --- Password Reset (Forgot Password) ---
  const handlePasswordReset = async () => {
    // basic validation
    if (!resetEmail || resetEmail.trim() === "") {
      setMessage("⚠️ Please enter your email address.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setMessage("✅ Password reset link sent. Please check your email.");
    } catch (err) {
      // Provide a user-friendly message for common cases
      let friendly = err.message || "Failed to send reset email.";
      if (err.code) {
        switch (err.code) {
          case "auth/user-not-found":
            friendly = "No account found for that email.";
            break;
          case "auth/invalid-email":
            friendly = "Please enter a valid email address.";
            break;
          case "auth/too-many-requests":
            friendly = "Too many requests. Please try again later.";
            break;
          // add more cases if you want
          default:
            // keep original message for unexpected codes
            friendly = err.message || friendly;
        }
      }
      setMessage("❌ " + friendly);
    }
  };



  useEffect(() => {
    async function testFirestore() {
      try {
        const snapshot = await getDocs(collection(db, "test"));
        log(
          "✅ Firebase Connected:",
          snapshot.empty ? "No data yet" : "Data found"
        );
      } catch (error) {
        error("❌ Firebase Error:", error);
      }
    }
    testFirestore();
  }, []);
 useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      if (user.emailVerified) {
        setCurrentUser(user);
        log("✅ Verified user logged in:", user.email);
      } else {
        log("⚠️ Unverified user detected, signing out...");
        signOut(auth);
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
      log("🚪 No user logged in");
    }
  });
  return () => unsubscribe();
}, []);



  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">

      <div className="w-full flex flex-col lg:flex-row items-center justify-between px-8 lg:px-16 py-10 mx-auto">


        {/* Left Section */}
        <div className="text-center lg:text-left lg:w-1/2">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-800">
            MyBench
          </h1>
          <p className="mt-4 text-gray-600 text-sm sm:text-base max-w-md mx-auto lg:mx-0">
            The premier marketplace connecting hiring recruiters with bench
            talent and bench recruiters with open opportunities.
          </p>

          {/* Features Grid */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                icon: "/Logos/job.svg",
                title: "Job Postings",
                desc: "Post and manage contract opportunities.",
              },
              {
                icon: "/Logos/BenchTalent.svg",
                title: "Bench Talent",
                desc: "Showcase available candidates.",
              },
              {
                icon: "/Logos/Search.svg",
                title: "Advanced Search",
                desc: "Filter by skills, location, and more.",
              },
              {
                icon: "/Logos/DirectMessage.svg",
                title: "Direct Messaging",
                desc: "Connect instantly with recruiters.",
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
              >
                <img
                  src={icon}
                  alt={title}
                  className="h-10 w-10 mx-auto mb-3"
                />
                <h3 className="font-semibold text-gray-800 text-lg">{title}</h3>
                <p className="text-gray-500 text-sm mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Section - Auth Card */}
        <div className="mt-10 lg:mt-0 lg:w-1/2 flex justify-center">
          <div className="bg-white shadow-lg rounded-2xl w-full max-w-md p-8">
            

            {/* Auth Forms */}
            {activeTab === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">

                <input
                  type="email"
                  placeholder="Email"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                    <p
      onClick={() => setShowReset(true)}
      className="text-sm text-blue-600 cursor-pointer hover:underline text-right mt-1"
    >
      Forgot Password?
    </p>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  Login
                </button>
                <button
  type="button"
  onClick={() => navigate("/signup")}
  className="w-full border border-blue-600 text-blue-600 py-3 rounded-lg hover:bg-blue-50 transition mt-3"
>
  Create Account
</button>

              </form>
                       ) : null}

            {/* Forgot Password Reset Form */}
            {showReset && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-2xl shadow-xl w-80 relative">
      <h2 className="text-lg font-semibold mb-3 text-center">Reset Password</h2>

      <input
        type="email"
        value={resetEmail}
        onChange={(e) => setResetEmail(e.target.value)}
        placeholder="Enter your email"
        className="w-full p-2 border rounded mb-3"
      />

      <button
        onClick={handlePasswordReset}
        type="button"
        className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        Send Reset Link
      </button>

      {message && (
        <p className="text-sm text-gray-700 mt-2 text-center">{message}</p>
      )}

      <button
        onClick={() => {
          setShowReset(false);
          setMessage("");
        }}
        className="absolute top-2 right-3 text-gray-400 hover:text-gray-600 text-lg font-bold"
      >
        ×
      </button>
    </div>
  </div>
)}

            {/* Divider */}

            <div className="flex items-center my-6">
              <hr className="flex-grow border-gray-300" />
              <span className="mx-2 text-gray-400 text-sm">
                OR CONTINUE WITH
              </span>
              <hr className="flex-grow border-gray-300" />
            </div>

            {/* Google Button */}
            <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition">

              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="h-5 w-5 mr-2"
              />
              <span className="text-gray-700 font-medium">
                Continue with Google
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
