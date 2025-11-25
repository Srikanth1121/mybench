import React, { useState, useEffect } from "react";
import { db, storage } from "../../firebase/config";
import { collection, addDoc, serverTimestamp, getDoc, doc, updateDoc, query, where, getDocs } from "firebase/firestore";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";////
import Select from "react-select";
import { indiaStates, usaStates, visaOptions } from "../../constants/Data";//////////
const RecruiterAddCandidateModal = ({ show, onClose, editingCandidate }) => {

  if (!show) return null;

  const [resumeMode, setResumeMode] = useState("upload"); // 'upload' or 'paste'////
  const auth = getAuth();
  // ✅ Auto-set recruiter country when modal opens
useEffect(() => {
  const fetchRecruiterCountry = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const recruiterRef = doc(db, "users", user.uid);

      const recruiterSnap = await getDoc(recruiterRef);
      if (recruiterSnap.exists()) {
        const recruiterCountry = recruiterSnap.data().country || "India";
        setFormData((prev) => ({
          ...prev,
          country: recruiterCountry,
        }));
      }
    } catch (error) {
      console.error("Error fetching recruiter country:", error);
    }
  };

  if (show) {
    fetchRecruiterCountry();
  }
}, [show]);

// ✅ Helper function to get states based on selected country
const getStateOptions = () => {
  const list = formData?.country === "USA" ? usaStates : indiaStates;
  return list.map((st) => ({ label: st, value: st }));
};

 const [formData, setFormData] = useState({
  fullName: "",
  email: "",
  country: "India",
  mobile: "",
  experience: "",
  jobTitle: "",
  city: "",
  state: "",
  qualification: "",
  gender: "",
  visaType: "",
  linkedin: "", // ✅ new
  resumeFile: null,
  resumeText: "",
});
// ✅ Prefill data when editing an existing candidate
useEffect(() => {
  if (!editingCandidate) return;
  setFormData({
    fullName: editingCandidate.fullName || "",
    email: editingCandidate.email || "",
    country: editingCandidate.country || "India",
    mobile: editingCandidate.mobile || "",
    experience: editingCandidate.experience || "",
    jobTitle: editingCandidate.jobTitle || "",
    city: editingCandidate.city || "",
    state: editingCandidate.state || "",
    qualification: editingCandidate.qualification || "",
    gender: editingCandidate.gender || "",
    visaType: editingCandidate.visaType || "",
    linkedin: editingCandidate.linkedin || "",
    currentCTC: editingCandidate.currentCTC || "",
currentCTCType: editingCandidate.currentCTCType || "",
noticePeriod: editingCandidate.noticePeriod || "",
resumeFile: null,
    resumeText: editingCandidate.resumeText || "",
  });
}, [editingCandidate]);




  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };
const formatIndianNumber = (num) => {
  num = num.replace(/,/g, ""); // remove old commas
  if (isNaN(num) || num === "") return num;

  const lastThree = num.slice(-3);
  const otherNumbers = num.slice(0, -3);

  return (
    (otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",")) +
    (otherNumbers ? "," : "") +
    lastThree
  );
};

// Handle CTC input formatting
const handleCTCChange = (e) => {
  let value = e.target.value.replace(/\D/g, ""); // only digits
  let formatted = formatIndianNumber(value);

  setFormData((prev) => ({
    ...prev,
    currentCTC: formatted,
  }));
};
  const handleSubmit = async (e) => {
  e.preventDefault();

  // Validation
  const requiredFields = [
    "fullName",
    "email",
    "country",
    "mobile",
    "experience",
    "jobTitle",
    "city",
    "state",
    "qualification",
    "gender",
  ];

  // ✅ Validate that state is one of the allowed options
const validStates = formData.country === "USA" ? usaStates : indiaStates;
if (!validStates.includes(formData.state)) {
  alert("Please select a valid state from the dropdown.");
  return;
}

  if (formData.country === "USA" && !formData.visaType) {
    alert("Please select the VISA Type for USA candidates.");
    return;
  }

  if (!formData.resumeFile && !formData.resumeText.trim()) {
    alert("Please either upload a resume file or paste resume text.");
    return;
  }

  try {
    const user = auth.currentUser;
    if (!user) {
      alert("User not authenticated.");////
      return;
    }
// ✅ Check if candidate with same email already exists
// ✅ Normalize and check duplicate email (case-insensitive)
// ✅ Normalize and check duplicate email (handles old + new candidates)
// ✅ Normalize email and mobile for duplicate checking
const normalizedEmail = formData.email.trim().toLowerCase();
const normalizedMobile = formData.mobile.replace(/\D/g, ""); // digits only

// Query 1: check normalizedEmail
const q1 = query(
  collection(db, "candidates"),
  where("normalizedEmail", "==", normalizedEmail)
);
const snap1 = await getDocs(q1);

// Query 2: check plain email (old entries)
const q2 = query(
  collection(db, "candidates"),
  where("email", "==", formData.email.trim())
);
const snap2 = await getDocs(q2);

// Query 3: check mobile (normalize to digits)
// Query 3: check normalizedMobile field (digits only)
const q3 = query(
  collection(db, "candidates"),
  where("normalizedMobile", "==", normalizedMobile)
);
const snap3 = await getDocs(q3);


// Combine all results
if (!editingCandidate && (!snap1.empty || !snap2.empty || !snap3.empty)) {
  alert("❌ A candidate with this email or mobile number already exists.");
  return;
}



    let parsedResumeText = "";

    // ✅ Read uploaded resume text if provided
    if (formData.resumeFile) {
      parsedResumeText = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (err) => reject(err);
        reader.readAsText(formData.resumeFile);
      });
    } else {
      parsedResumeText = formData.resumeText.trim();
    }

    // ✅ Prepare data for Firestore
    // ✅ Fetch recruiter’s country from Firestore
const recruiterRef = doc(db, "users", user.uid);

const recruiterSnap = await getDoc(recruiterRef);

if (!recruiterSnap.exists()) {
  alert("❌ Recruiter profile not found.");
  return;
}

const recruiterCountry = recruiterSnap.data().country || "India"; // Default fallback

// ✅ Prepare data for Firestore
const candidateData = {
  recruiterId: user.uid,
  fullName: formData.fullName.trim(),
  email: formData.email.trim(),
  mobile: formData.mobile.trim(),
normalizedMobile: formData.mobile.replace(/\D/g, ""), // store digits-only version
country: recruiterCountry, // 👈 auto-filled, no user selection
  visaType: recruiterCountry === "USA" ? formData.visaType : null,
  experience: formData.experience.trim(),
  jobTitle: formData.jobTitle.trim(),
  city: formData.city.trim(),
  state: formData.state.trim(),
  qualification: formData.qualification.trim(),
  gender: formData.gender,
  linkedin: formData.linkedin.trim(),
  currentCTC: formData.currentCTC || "",
currentCTCType: formData.currentCTCType || "",
noticePeriod: formData.noticePeriod || "",
resumeType: formData.resumeFile ? "upload" : "paste",
  resumeText: parsedResumeText,
  status: "Active",
  normalizedEmail: formData.email.trim().toLowerCase(),
  createdAt: serverTimestamp(),
};

if (editingCandidate && editingCandidate.id) {
  // 📝 Update existing candidate
  await updateDoc(doc(db, "candidates", editingCandidate.id), candidateData);
  alert("✅ Candidate updated successfully!");
  onClose(); // 👈 closes modal after alert
} else {
  // ➕ Add new candidate
  await addDoc(collection(db, "candidates"), candidateData);
  alert("✅ Candidate added successfully!");
  onClose(); // 👈 closes modal after alert
}


  } catch (error) {
    console.error("Error saving candidate:", error);
    alert("❌ Failed to save candidate. Check console for details.");
  }
};

return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
  <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl p-8 overflow-y-auto max-h-[85vh] relative text-[16px]">
{/* X (Close) Button */}
{/* Sleek Close (Corporate Style) */}
<button
  onClick={onClose}
  className="absolute top-5 right-6 text-gray-400 hover:text-gray-600 transition transform hover:scale-110"

  aria-label="Close"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="2"
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
</button>




  <h2 className="text-3xl font-bold mb-6 text-gray-900">Add Candidate</h2>



        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Full Name */}
  <input
    type="text"
    name="fullName"
    placeholder="Full Name"
    value={formData.fullName}
    onChange={handleChange}
    className="border border-gray-600 bg-gray-50 rounded-lg px-4 py-3 text-[16px]"
    required
  />

  {/* Email ID */}
  <input
    type="email"
    name="email"
    placeholder="Email ID"
    value={formData.email}
    onChange={handleChange}
    className="border border-gray-600 bg-gray-50 rounded-lg px-4 py-3 text-[16px]"
    required
  />
</div>


          {/* Mobile Number */}
         {/* Country */}
{/* Mobile Number */}
<div className="flex items-center space-x-2">
  <span className="text-gray-700 font-medium">
    {formData.country === "USA" ? "+1" : "+91"}
  </span>
  <input
    type="tel"
    name="mobile"
    placeholder={
      formData.country === "USA"
        ? "(xxx) xxx-xxxx"
        : "xxxxx xxxxx"
    }
    value={formData.mobile}
    onChange={(e) => {
      let input = e.target.value.replace(/\D/g, ""); // digits only

      if (formData.country === "India") {
        // 10-digit Indian format: 98765 43210
        input = input.slice(0, 10);
        if (input.length > 5)
          input = `${input.slice(0, 5)} ${input.slice(5)}`;
      } else {
        // US format: (415) 555-2671
        input = input.slice(0, 10);
        if (input.length > 6)
          input = `(${input.slice(0, 3)}) ${input.slice(
            3,
            6
          )}-${input.slice(6)}`;
        else if (input.length > 3)
          input = `(${input.slice(0, 3)}) ${input.slice(3)}`;
      }

      setFormData((prev) => ({ ...prev, mobile: input }));
    }}
    className="border border-gray-600 bg-gray-50 rounded-lg px-4 py-3 text-[16px]"
    required
  />
</div>


          {/* Total Experience & Job Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
  type="number"
  name="experience"
  placeholder="Total Experience (in years)"
  value={formData.experience}
  onChange={(e) => {
    const value = e.target.value;
    // Only allow numbers 0–99
    if (/^\d{0,2}$/.test(value)) {
      setFormData((prev) => ({ ...prev, experience: value }));
    }
  }}
  min="0"
  max="50"
  className="border border-gray-600 bg-gray-50 rounded-lg px-4 py-3 text-[16px]"
  required
/>


            <input
              type="text"
              name="jobTitle"
              placeholder="Job Title"
              value={formData.jobTitle}
              onChange={handleChange}
              className="border border-gray-600 bg-gray-50 rounded-lg px-4 py-3 text-[16px]"
              required
            />
          </div>
{/* New Fields: Current CTC (amount + type) and Notice Period */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

  {/* Current CTC Amount + CTC Type */}
  <div className="flex gap-2">

    {/* Amount */}
    <input
      type="text"
      name="currentCTC"
      placeholder="Current CTC"
      value={formData.currentCTC || ""}
      onChange={handleCTCChange}
className="border border-gray-600 bg-gray-50 rounded-lg px-4 py-3 text-[16px]"
      required
    />

    {/* Type */}
    <select
  name="currentCTCType"
  value={formData.currentCTCType || ""}
  onChange={handleChange}
  className="border border-gray-600 bg-gray-50 rounded-lg px-4 py-3 text-[16px]"
  required
>
  <option value="">Type</option>

  {formData.country === "USA" ? (
    <>
      <option value="Per Hour">Per Hour</option>
      <option value="Per Annum">Per Annum</option>
    </>
  ) : (
    <>
      <option value="Per Month">Per Month</option>
      <option value="Per Annum">Per Annum</option>
    </>
  )}
</select>


  </div>

  {/* Notice Period */}
  <select
    name="noticePeriod"
    value={formData.noticePeriod || ""}
    onChange={handleChange}
    className="border border-gray-600 bg-gray-50 rounded-lg px-4 py-3 text-[16px]"
    required
  >
    <option value="">Select Notice Period</option>
    <option value="Immediate">Immediate</option>
    <option value="0-15 Days">0–15 Days</option>
    <option value="15-30 Days">15–30 Days</option>
    <option value="30-60 Days">30–60 Days</option>
    <option value="60-90 Days">60–90 Days</option>
    <option value="90+ Days">90+ Days</option>
  </select>

</div>

          {/* City & State */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="city"
              placeholder="Current City"
              value={formData.city}
              onChange={handleChange}
              className="border border-gray-600 bg-gray-50 rounded-lg px-4 py-3 text-[16px]"
              required
            />

            {/* ✅ Searchable State Dropdown */}
<Select
  options={getStateOptions()}
  value={
    formData.state
      ? { label: formData.state, value: formData.state }
      : null
  }
  onChange={(selected) =>
    setFormData((prev) => ({ ...prev, state: selected?.value || "" }))
  }
  placeholder="Select or type State"
  isSearchable
  required

  styles={{
    control: (base) => ({
      ...base,
      backgroundColor: "#f9fafb",          // bg-gray-50
      borderColor: "#4b5563",              // border-gray-600
      borderWidth: "1px",
      borderRadius: "0.5rem",              // rounded-lg
      minHeight: "52px",                   // same height as py-3 input
      paddingLeft: "0.5rem",               // px-4
      paddingRight: "0.5rem",
      fontSize: "16px",                    // text-[16px]
      boxShadow: "none",
      "&:hover": { borderColor: "#374151" } // darker hover
    }),

    valueContainer: (base) => ({
      ...base,
      paddingLeft: "0px",
    }),

    input: (base) => ({
      ...base,
      color: "#111827", // text-gray-900
    }),

    placeholder: (base) => ({
      ...base,
      color: "#6b7280", // text-gray-500
      fontSize: "16px",
    }),

    singleValue: (base) => ({
      ...base,
      color: "#111827",
      fontSize: "16px",
    }),
  }}
/>
  </div>

          {/* Qualification & Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="qualification"
              placeholder="Highest Qualification"
              value={formData.qualification}
              onChange={handleChange}
              className="border border-gray-600 bg-gray-50 rounded-lg px-4 py-3 text-[16px]
"
              required
            />

            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="border border-gray-600 bg-gray-50 rounded-lg px-4 py-3 text-[16px]"
              required
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          {/* LinkedIn Profile URL */}
<div>
  <label className="block text-gray-700 font-medium mb-1">
    LinkedIn Profile URL (optional)
  </label>
  <input
    type="url"
    name="linkedin"
    placeholder="https://www.linkedin.com/in/username"
    value={formData.linkedin}
    onChange={handleChange}
    className="border border-gray-600 bg-gray-50 rounded-lg px-4 py-3 text-[16px]"
  />
</div>


          {/* VISA Type - Only visible if USA */}
{/* VISA Type - Only visible if USA */}
{formData.country === "USA" && (
  <select
    name="visaType"
    value={formData.visaType}
    onChange={handleChange}
    className="border border-gray-600 bg-gray-50 rounded-lg px-4 py-3 text-[16px]"
    required
  >
    <option value="">Select VISA Type</option>
    <option value="H-1B">H-1B</option>
    <option value="L-1A">L-1A</option>
    <option value="L-1B">L-1B</option>
    <option value="OPT">OPT</option>
    <option value="CPT">CPT</option>
    <option value="TN">TN</option>
    <option value="E-3">E-3</option>
    <option value="H-4 EAD">H-4 EAD</option>
    <option value="O-1">O-1</option>
    <option value="Green Card">Green Card</option>
    <option value="US Citizen">US Citizen</option>
  </select>
)}



          {/* Resume Section */}
          <div className="border rounded-lg p-4">
            <label className="font-medium mb-2 block">Resume</label>

            <div className="flex space-x-4 mb-4">
              <button
                type="button"
                className={`px-4 py-2 rounded-lg ${
                  resumeMode === "upload"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
                onClick={() => setResumeMode("upload")}
              >
                Upload
              </button>

              <button
                type="button"
                className={`px-4 py-2 rounded-lg ${
                  resumeMode === "paste"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
                onClick={() => setResumeMode("paste")}
              >
                Paste
              </button>
            </div>

            {resumeMode === "upload" ? (
              <input
                type="file"
                name="resumeFile"
                accept=".pdf,.doc,.docx"
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-1"
              />
            ) : (
              <textarea
                name="resumeText"
                placeholder="Paste resume text here..."
                value={formData.resumeText}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3 text-[15px] min-h-[140px]"

              />
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2.5 rounded-lg font-medium"

              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm"

            >
              Save Candidate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecruiterAddCandidateModal;
