import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase/config";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  fetchSignInMethodsForEmail,
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

  // ----- Real-time Email & Mobile Uniqueness Check (Firestore users collection) -----
  useEffect(() => {
    const checkDuplicates = async () => {
      if (!email && !mobile) return;

      try {
        const usersRef = collection(db, "users");
        const qEmail = query(
          usersRef,
          where("role", "==", role),
          where("email", "==", email.trim().toLowerCase())
        );
        // Normalize mobile for comparison (digits only)
const normalizedMobile = mobile.trim().replace(/\D/g, "");

// Build query using normalized mobile
const qMobile = query(
  usersRef,
  where("role", "==", role),
  where("mobile", "==", normalizedMobile)
);


        const [emailSnap, mobileSnap] = await Promise.all([
          getDocs(qEmail),
          getDocs(qMobile),
        ]);

        setEmailExists(!emailSnap.empty);
        setMobileExists(!mobileSnap.empty);
      } catch (err) {
        console.error("Duplicate check error:", err.message);
        // keep UX silent; don't block signup for transient errors
      }
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
    // --- Validate mobile number by country ---
const mobileDigits = mobile.trim().replace(/\D/g, ""); // keep only numbers

if (country === "India") {
  // India: 10 digits, starts with 6–9
  if (!/^[6-9]\d{9}$/.test(mobileDigits)) {
    setMessage("⚠️ Please enter a valid 10-digit Indian mobile number (starting with 6–9).");
    setLoading(false);
    return;
  }
} else if (country === "USA") {
  // USA: 10 digits (any)
  if (!/^\d{10}$/.test(mobileDigits)) {
    setMessage("⚠️ Please enter a valid 10-digit US mobile number.");
    setLoading(false);
    return;
  }
}


    // Validate LinkedIn/Website format if provided
    if (
      linkedin &&
      !/^https?:\/\/[\w.-]+\.[a-z]{2,}.*$/i.test(linkedin.trim())
    ) {
      setMessage("⚠️ Please enter a valid URL starting with http:// or https://");
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

      // Friendly check: is this email already present in Firebase Auth (globally)?
      const methods = await fetchSignInMethodsForEmail(auth, normalizedEmail);
      if (methods && methods.length > 0) {
        setMessage(
          "⚠️ This email is already registered. One email can only be used for a single account."
        );
        setLoading(false);
        return;
      }

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
      try {
        await setDoc(doc(db, "users", user.uid), {
          name,
          email: normalizedEmail,
          mobile: mobile.trim().replace(/\D/g, ""), // store only digits

          linkedin,
          role,
          country,
          credits: 50,
          createdAt: serverTimestamp(),
        });
      } catch (fireErr) {
        console.error("Firestore write error:", fireErr.message);
        // We won't delete the auth user automatically here, but you could consider cleanup
        setMessage(
          "❌ Account created in Auth but failed to save profile in Firestore. Check console for details."
        );
        setLoading(false);
        return;
      }

      setMessage("✅ Account created! Please verify your email before login.");
      setLoading(false);

      // Keep user on-screen so they can read the message. Provide button to go to login.
      // If you prefer auto-redirect, uncomment the next line:
      // setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      console.error("Signup Error:", err);
      // Firebase error messages can be technical; show friendly alternatives where possible
      const friendly =
        err.code === "auth/weak-password"
          ? "❌ Weak password. Use 8+ chars with a number and symbol."
          : err.code === "auth/email-already-in-use"
          ? "❌ This email is already in use."
          : err.message;

      setMessage("❌ " + friendly);
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

          <div className="flex items-center border rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
  <span className="px-3 min-w-[50px] text-gray-500 text-sm font-medium select-none">

    {country === "India" ? "+91" : "+1"}
  </span>
  <input
    type="tel"
    placeholder="Mobile Number"
    value={mobile}
    onChange={(e) => setMobile(e.target.value)}
    className="flex-1 p-3 outline-none rounded-r-lg"
    required
  />
</div>
{mobileExists && (
  <p className="text-red-500 text-sm">
    ⚠️ This number is already used for this role.
  </p>
)}

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
                passwordStrength === "strong" ? "text-green-600" : "text-red-500"
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
            disabled={loading || emailExists || mobileExists}
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
