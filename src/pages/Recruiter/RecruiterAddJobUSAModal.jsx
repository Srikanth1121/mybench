import React, { useState, useEffect } from "react";
import { visaOptions } from "../../constants/Data";
import { db } from "../../firebase/config";
import { skillsList } from "../../constants/skills";
import { indiaStates, usaStates } from "../../constants/Data";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  runTransaction,
  getDoc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";
const RecruiterAddJobUSAModal = ({ recruiterId, recruiterCountry, onClose, existingData }) => {

  const [jobData, setJobData] = useState({
   company: "",
    hideCompany: false,
    jobTitle: "",
    jobLocation: "",
    experience: "",
    payRate: "",
    payType: "Hourly",
    skills: "",
    workMode: "Remote",
    workAuth: "",
    visaType: "",
    jobType: "Contract",
    c2cAllowed: "Yes",
    referralFee: false,
    referralDetails: "",
    jobDescription: "",
    status: "Active",
    });

    const [skillInput, setSkillInput] = useState("");
const [skillSuggestions, setSkillSuggestions] = useState([]);

// ⭐ PREFILL FORM WHEN EDITING
useEffect(() => {
  if (!existingData) return;

  setJobData({
    company: existingData.company ?? "",
hideCompany: existingData.hideCompany ?? false,
jobTitle: existingData.jobTitle ?? "",
    jobLocation: existingData.jobLocation ?? "",
    experience: existingData.experience ?? "",
    payRate: existingData.payRate ?? "",
    payType: existingData.payType ?? "Hourly",
    skills: Array.isArray(existingData.skills)
      ? existingData.skills.join(", ")
      : existingData.skills ?? "",
    workMode: existingData.workMode ?? "Remote",
    workAuth: existingData.workAuth ?? "",
    visaType: existingData.visaType ?? "",
    jobType: existingData.jobType ?? "Contract",
    c2cAllowed: existingData.c2cAllowed ?? "Yes",
    referralFee: existingData.referralFee ?? false,
    referralDetails: existingData.referralDetails ?? "",
    jobDescription: existingData.jobDescription ?? "",
    status: existingData.status ?? "Active",
});
}, [existingData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setJobData({
      ...jobData,
      [name]: type === "checkbox" ? checked : value,
    });
  };
// -------------------------------------------------------------
// STEP 2 — Ensure Global Job Counter Exists (USA modal)
// -------------------------------------------------------------
const ensureJobCounterExists = async () => {
  try {
    const counterRef = doc(db, "counters", "jobCounter");
    const snap = await getDoc(counterRef);

    if (!snap.exists()) {
      await setDoc(counterRef, { lastJobId: 1 });
      console.log("Initialized counters/jobCounter for USA jobs");
    } else {
      console.log("USA: Counter exists:", snap.data());
    }
  } catch (err) {
    console.error("Failed to ensure jobCounter exists:", err);
  }
};

useEffect(() => {
  ensureJobCounterExists();
}, []);


// -------------------------------------------------------------
// Generate Unique Global Job ID (shared for India + USA)
// -------------------------------------------------------------
const generateJobId = async () => {
  const counterRef = doc(db, "counters", "jobCounter");

  return await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);

    if (!counterSnap.exists()) {
      transaction.set(counterRef, { lastJobId: 1 });
      return 1;
    }

    const lastId = counterSnap.data().lastJobId ?? 1;
    const newId = lastId + 1;

    transaction.update(counterRef, { lastJobId: newId });

    return newId;
  });
};

 const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    if (existingData && existingData.id) {
      // ⭐ UPDATE EXISTING JOB
      await updateDoc(doc(db, "jobs", existingData.id), {
        ...jobData,
        status: jobData.status || "Active",
        updatedAt: serverTimestamp(),
      });

      alert("Job Updated Successfully!");
    } else {
      // ⭐ ADD NEW JOB
      const newJobId = await generateJobId();

      await addDoc(collection(db, "jobs"), {
        recruiterId,
        country: recruiterCountry,
        jobId: newJobId,
        ...jobData,
        status: "Active", // Always Active when created
        createdAt: serverTimestamp(),
      });

      alert("USA Job Posted Successfully!");
    }

    onClose();
  } catch (err) {
    console.error("Error saving job:", err);
    alert("Failed to save job. Try again.");
  }
};


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 relative">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">
  {existingData ? "Edit Job" : "Add Job"}
</h2>

          <button
            onClick={onClose}
            className="text-gray-600 hover:text-black text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="max-h-[75vh] overflow-y-auto pr-2">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Client Name */}
            <div className="col-span-2">
             <label className="font-medium">Company</label>
<input
  type="text"
  name="company"
  value={jobData.company}
  onChange={handleChange}

                className="w-full border p-2 rounded mt-1"
              />

              <label className="flex items-center gap-2 mt-1 text-sm">
                <input
                  type="checkbox"
                  name="hideCompany"
checked={jobData.hideCompany}

                  onChange={handleChange}
                />
                Don’t show client name to candidates
              </label>
            </div>

            {/* Job Title */}
            <div>
              <label className="font-medium">Job Title</label>
              <input
                type="text"
                name="jobTitle"
                value={jobData.jobTitle}
                onChange={handleChange}
                className="w-full border p-2 rounded mt-1"
                required
              />
            </div>

            {/* Job Location */}
           {/* Job Location (dynamic: states for India/USA, fallback to free text) */}
<div>
  <label className="font-medium">Job Location</label>

  {recruiterCountry === "India" || recruiterCountry === "USA" ? (
    <select
      name="jobLocation"
      value={jobData.jobLocation}
      onChange={handleChange}
      className="w-full border p-2 rounded mt-1"
      required
    >
      <option value="">{`Select ${recruiterCountry === "India" ? "State" : "State/Region"}`}</option>

      {(recruiterCountry === "India" ? indiaStates : usaStates).map((s, i) => (
        <option key={i} value={s}>
          {s}
        </option>
      ))}
    </select>
  ) : (
    // if recruiterCountry missing or other, keep a free-text input
    <input
      type="text"
      name="jobLocation"
      value={jobData.jobLocation}
      onChange={handleChange}
      className="w-full border p-2 rounded mt-1"
      required
    />
  )}
</div>


            {/* Experience */}
            <div>
              <label className="font-medium">Experience</label>
              <input
                type="text"
                name="experience"
                value={jobData.experience}
                onChange={handleChange}
                className="w-full border p-2 rounded mt-1"
                placeholder="e.g., 5–7 years"
              />
            </div>

            {/* Pay Rate */}
            <div>
              <label className="font-medium">Pay Rate (USD)</label>
              <input
                type="text"
                name="payRate"
                value={jobData.payRate}
                onChange={handleChange}
                className="w-full border p-2 rounded mt-1"
                placeholder="$50/hr"
              />
            </div>

            {/* Pay Type */}
            <div>
              <label className="font-medium">Pay Type</label>
              <select
                name="payType"
                value={jobData.payType}
                onChange={handleChange}
                className="w-full border p-2 rounded mt-1"
              >
                <option>Hourly</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </div>

            {/* Skills */}
            <div className="col-span-2">
  <label className="font-medium">Mandatory Skills</label>

  {/* Input box */}
  <input
    type="text"
    value={skillInput}
    onChange={(e) => {
      const value = e.target.value;
      setSkillInput(value);

      // Generate suggestions
     if (value.trim().length > 0) {
  const filtered = skillsList.filter(s =>
    s.toLowerCase().startsWith(value.toLowerCase())
  );
  setSkillSuggestions(filtered);
}
else {
        setSkillSuggestions([]);
      }
    }}
    className="w-full border p-2 rounded mt-1"
    placeholder="Type a skill..."
  />

  {/* Dropdown Suggestion Box */}
  {skillSuggestions.length > 0 && (
    <div className="border mt-1 bg-white rounded shadow p-2 max-h-40 overflow-y-auto">
      {skillSuggestions.map((skill, i) => (
        <div
          key={i}
          className="p-2 hover:bg-gray-100 cursor-pointer"
          onClick={() => {
            // Add selected skill to the jobData.skills list
            const currentSkills = jobData.skills
              ? jobData.skills.split(",").map(s => s.trim())
              : [];

            if (!currentSkills.includes(skill)) {
              const updatedSkills = [...currentSkills, skill];
              setJobData({ ...jobData, skills: updatedSkills.join(", ") });
            }

            setSkillInput("");
            setSkillSuggestions([]);
          }}
        >
          {skill}
        </div>
      ))}
    </div>
  )}
</div>

{/* Selected Skill Tags */}
{jobData.skills && jobData.skills.length > 0 && (
  <div className="flex flex-wrap gap-2 mt-2">
    {jobData.skills.split(",").map((skill, index) => (
      <div
        key={index}
        className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
      >
        {skill.trim()}
        <button
          type="button"
          className="ml-2 text-red-500 font-bold"
          onClick={() => {
            const updated = jobData.skills
              .split(",")
              .map(s => s.trim())
              .filter(s => s !== skill.trim());
            setJobData({ ...jobData, skills: updated.join(", ") });
          }}
        >
          ×
        </button>
      </div>
    ))}
  </div>
)}

            {/* Work Mode */}
            <div>
              <label className="font-medium">Work Mode</label>
              <select
                name="workMode"
                value={jobData.workMode}
                onChange={handleChange}
                className="w-full border p-2 rounded mt-1"
              >
                <option>Remote</option>
                <option>Hybrid</option>
                <option>Onsite</option>
              </select>
            </div>

            {/* Work Authorization */}
            <div>
              <label className="font-medium">Work Type</label>
              <select
                name="workAuth"
                value={jobData.workAuth}
                onChange={handleChange}
                className="w-full border p-2 rounded mt-1"
                required
              >
                <option value="">Select Work Authorization</option>
                <option>W2</option>
                <option>C2C</option>
                <option>1099</option>
              </select>
            </div>

            {/* Visa Type */}
            <div>
              <label className="font-medium">Visa Type</label>
              <select
  name="visaType"
  value={jobData.visaType}
  onChange={handleChange}
  className="w-full border p-2 rounded mt-1"
  required
>
  <option value="">Select Visa</option>

  {visaOptions.map((visa, index) => (
    <option key={index} value={visa}>
      {visa}
    </option>
  ))}
</select>

            </div>

            {/* Referral Reward */}
            <div>
              <label className="font-medium">Referral Reward</label>
              <select
                name="referralFee"
                value={jobData.referralFee ? "Yes" : "No"}
                onChange={(e) =>
                  setJobData({
                    ...jobData,
                    referralFee: e.target.value === "Yes",
                  })
                }
                className="w-full border p-2 rounded mt-1"
              >
                <option>No</option>
                <option>Yes</option>
              </select>
            </div>

            {jobData.referralFee && (
              <div className="col-span-2">
                <label className="font-medium">Referral Details</label>
                <input
                  type="text"
                  name="referralDetails"
                  value={jobData.referralDetails}
                  onChange={handleChange}
                  className="w-full border p-2 rounded mt-1"
                  placeholder="$500 after placement"
                />
              </div>
            )}

            {/* Job Description */}
            <div className="col-span-2">
              <label className="font-medium">Job Description</label>
              <textarea
                name="jobDescription"
                value={jobData.jobDescription}
                onChange={handleChange}
                rows={6}
                className="w-full border p-2 rounded mt-1"
                placeholder="Paste full job description..."
              ></textarea>
            </div>

            {/* Buttons */}
            <div className="col-span-2 flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Save Job
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default RecruiterAddJobUSAModal;
