import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase/config";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("candidate");
  const [linkedin, setLinkedin] = useState("");
  const [country, setCountry] = useState("India");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Validation states
  const [passwordStrength, setPasswordStrength] = useState("");
  const [emailExists, setEmailExists] = useState(false);
  const [mobileExists, setMobileExists] = useState(false);

  const navigate = useNavigate();

  // ----- Password Strength Checker -----
  useEffect(() => {
    const strongRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!password) setPasswordStrength("");
    else if (strongRegex.test(password)) setPasswordStrength("strong");
    else setPasswordStrength("weak");
  }, [password]);

  // ----- Real-time Email & Mobile Uniqueness Check -----
  useEffect(() => {
    const checkDuplicates = async () => {
      if (!email && !mobile) return;

      const usersRef = collection(db, "users");
      const qEmail = query(
        usersRef,
        where("role", "==", role),
        where("email", "==", email.trim().toLowerCase())
      );
      const qMobile = query(
        usersRef,
        where("role", "==", role),
        where("mobile", "==", mobile.trim())
      );

      const [emailSnap, mobileSnap] = await Promise.all([
        getDocs(qEmail),
        getDocs(qMobile),
      ]);

      setEmailExists(!emailSnap.empty);
      setMobileExists(!mobileSnap.empty);
    };

    // Debounce for better UX
    const timeout = setTimeout(checkDuplicates, 500);
    return () => clearTimeout(timeout);
  }, [email, mobile, role]);

  // ----- Handle Signup -----
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Validate all fields
    if (!name || !mobile || !email || !password) {

      setMessage("⚠️ Please fill all required fields.");
      setLoading(false);
      return;
    }

    if (emailExists) {
      setMessage("⚠️ This email is already registered for this role.");
      setLoading(false);
      return;
    }

    if (mobileExists) {
      setMessage("⚠️ This mobile number is already registered for this role.");
      setLoading(false);
      return;
    }

    if (passwordStrength !== "strong") {
      setMessage(
        "⚠️ Password must have 8+ chars, uppercase, lowercase, number & symbol."
      );
      setLoading(false);
      return;
    }

    try {
      // Normalize email
      const normalizedEmail = email.trim().toLowerCase();

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );
      const user = userCredential.user;

      // Send email verification
      await sendEmailVerification(user);

      // Save user to Firestore
      await setDoc(doc(db, "users", user.uid), {
        name,
        email: normalizedEmail,
        mobile: mobile.trim(),
        linkedin,
        role,
        country,
        credits: 50,
        createdAt: serverTimestamp(),
      });

      setMessage("✅ Account created! Please verify your email before login.");
      setLoading(false);

      setTimeout(() => navigate("/"), 3000);
    } catch (err) {
      console.error("Signup Error:", err.message);
      setMessage("❌ " + err.message);
      setLoading(false);
    }
  };

  // ----- Dynamic LinkedIn Placeholder -----
  const linkedInPlaceholder =
    role === "company-admin"
      ? "Enter your company website"
      : "Enter your LinkedIn profile URL";

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-sm sm:max-w-md scale-95">

        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Create an Account
        </h1>

        <form onSubmit={handleSignup} className="space-y-3">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="tel"
            placeholder="Mobile Number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              mobileExists ? "border-red-500" : ""
            }`}
            required
          />
          {mobileExists && (
            <p className="text-red-500 text-sm">
              ⚠️ This number is already used for this role.
            </p>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              emailExists ? "border-red-500" : ""
            }`}
            required
          />
          {emailExists && (
            <p className="text-red-500 text-sm">
              ⚠️ This email is already registered for this role.
            </p>
          )}

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          {password && (
            <p
              className={`text-sm ${
                passwordStrength === "strong"
                  ? "text-green-600"
                  : "text-red-500"
              }`}
            >
              {passwordStrength === "strong"
                ? "✅ Strong password"
                : "⚠️ Must have upper, lower, number & symbol"}
            </p>
          )}

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="candidate">Job Seeker</option>
            <option value="recruiter">Recruiter</option>
            <option value="company-admin">Company Admin</option>
          </select>

          <input
            type="text"
            placeholder={linkedInPlaceholder}
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />

          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="India">India</option>
            <option value="USA">USA</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm text-gray-700">{message}</p>
        )}

        <p
          onClick={() => navigate("/")}
          className="mt-6 text-center text-blue-600 cursor-pointer hover:underline"
        >
          Already have an account? Login
        </p>
      </div>
    </div>
  );
}
