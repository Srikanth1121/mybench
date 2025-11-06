import React, { useState, useEffect } from "react";
import { db, auth, googleProvider } from "../../firebase/config";
import { collection, getDocs } from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup
} from "firebase/auth";


export default function HomePage() {
  const [activeTab, setActiveTab] = useState("login");

    // --- Register New User ---
  async function handleRegister(e) {
    e.preventDefault();
    const name = e.target[0].value;
    const email = e.target[1].value;
    const password = e.target[2].value;

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert(`✅ Account created for ${name}`);
    } catch (error) {
      console.error("❌ Registration Error:", error.message);
      alert(error.message);
    }
  }


    // --- Login Existing User ---
  async function handleLogin(e) {
    e.preventDefault();
    const email = e.target[0].value;
    const password = e.target[1].value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("✅ Logged in successfully");
    } catch (error) {
      console.error("❌ Login Error:", error.message);
      alert(error.message);
    }
  }


    // --- Google Sign-In ---
  async function handleGoogleLogin() {
    try {
      await signInWithPopup(auth, googleProvider);
      alert("✅ Logged in with Google");
    } catch (error) {
      console.error("❌ Google Sign-In Error:", error.message);
      alert(error.message);
    }
  }


  useEffect(() => {
    async function testFirestore() {
      try {
        const snapshot = await getDocs(collection(db, "test"));
        console.log(
          "✅ Firebase Connected:",
          snapshot.empty ? "No data yet" : "Data found"
        );
      } catch (error) {
        console.error("❌ Firebase Error:", error);
      }
    }
    testFirestore();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col justify-center items-center">
      <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center justify-between px-6 py-10">
        {/* Left Section */}
        <div className="text-center lg:text-left lg:w-1/2">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900">
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
                icon: "/Logos/bench.svg",
                title: "Bench Talent",
                desc: "Showcase available candidates.",
              },
              {
                icon: "/Logos/search.svg",
                title: "Advanced Search",
                desc: "Filter by skills, location, and more.",
              },
              {
                icon: "/Logos/message.svg",
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
            {/* Tabs */}
            <div className="flex mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("login")}
                className={`flex-1 pb-2 text-center font-semibold ${
                  activeTab === "login"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setActiveTab("register")}
                className={`flex-1 pb-2 text-center font-semibold ${
                  activeTab === "register"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500"
                }`}
              >
                Register
              </button>
            </div>

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
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  Login
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">

                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  Register
                </button>
              </form>
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
