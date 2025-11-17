import React, { useState, useEffect } from "react";
import { indiaStates, usaStates } from "../../constants/Data";
import { skillsOptions } from "../../constants/skills";
import { db } from "../../firebase/config";
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
const RecruiterAddJobModal = ({ recruiterId, recruiterCountry, onClose, existingData }) => {

 const [jobData, setJobData] = useState({
  company: "",
  hideCompany: false,
  jobTitle: "",
  jobLocation: "",
  experience: "",
  salaryAmount: "",
  salaryType: "Per Month",
  qualification: "",
  genderPreference: "Any",
  skills: "",
  workMode: "Remote",
  jobType: "FullTime",
  c2cAllowed: "No",
  referralFee: false,
  referralDetails: "",
  jobDescription: "",
  status: "Active", // NEW FIELD
  visibility: "both", // NEW: "candidates" | "recruiters" | "both"
});

  const [skillInput, setSkillInput] = useState("");
const [skillSuggestions, setSkillSuggestions] = useState([]);
// Local skills array (tags)
const [skillsListState, setSkillsListState] = useState([]);


// ⭐ PREFILL FORM WHEN EDITING
useEffect(() => {
  if (!existingData) return;

  setJobData({
    company: existingData.company ?? "",
    hideCompany: existingData.hideCompany ?? false,
    jobTitle: existingData.jobTitle ?? "",
    jobLocation: existingData.jobLocation ?? "",
    experience: existingData.experience ?? "",
    salaryAmount: existingData.salaryAmount ?? "",
    salaryType: existingData.salaryType ?? "Per Month",
    qualification: existingData.qualification ?? "",
    genderPreference: existingData.genderPreference ?? "Any",
    skills: Array.isArray(existingData.skills)
      ? existingData.skills.join(", ")
      : existingData.skills ?? "",
    workMode: existingData.workMode ?? "Remote",
    jobType: existingData.jobType ?? "FullTime",
    c2cAllowed: existingData.c2cAllowed ?? "No",
    referralFee: existingData.referralFee ?? false,
    referralDetails: existingData.referralDetails ?? "",
    jobDescription: existingData.jobDescription ?? "",
     visibility: existingData.visibility ?? "both",
  });
 setSkillsListState(
  Array.isArray(existingData?.skills)
    ? existingData.skills
    : (existingData?.skills || "").split(",").map(s => s.trim()).filter(s => s.length > 0)
);

}, [existingData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setJobData({
      ...jobData,
      [name]: type === "checkbox" ? checked : value,
    });
  };
  // Ensure the counter document exists (created by code) — STEP 1
const ensureJobCounterExists = async () => {
  try {
    const counterRef = doc(db, "counters", "jobCounter");
    const snap = await getDoc(counterRef);

    if (!snap.exists()) {
      // Initialize to 1 so first created job will be #1 (and next will be 2)
      await setDoc(counterRef, { lastJobId: 1 });
      console.log("Initialized counters/jobCounter with lastJobId: 1");
    } else {
      console.log("counters/jobCounter already exists:", snap.data());
    }
  } catch (err) {
    console.error("Failed to ensure jobCounter exists:", err);
  }
};

// Call once when modal mounts
useEffect(() => {
  ensureJobCounterExists();
}, []);

// Generate unique never-reused Job ID
const generateJobId = async () => {
  const counterRef = doc(db, "counters", "jobCounter");

  return await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);

    // If counter doc doesn't exist, create it
    if (!counterSnap.exists()) {
      transaction.set(counterRef, { lastJobId: 0 });
      return 1; // First job ID
    }

    const lastId = counterSnap.data().lastJobId || 0;
    const newId = lastId + 1;

    transaction.update(counterRef, { lastJobId: newId });

    return newId;
  });
};

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
if (existingData && existingData.id) {
  // ⭐ UPDATE JOB (explicitly ensure important fields)
  await updateDoc(doc(db, "jobs", existingData.id), {
    ...jobData,
    // ensure skills stored as array
    skills: skillsListState,
    // ensure visibility and status are never left undefined
    visibility: jobData.visibility ?? "both",
    status: jobData.status ?? "Active",
    updatedAt: serverTimestamp(),
  });

  alert("Job updated successfully!");
}
 else {
      // ⭐ ADD NEW JOB
      // ⭐ ADD NEW JOB WITH UNIQUE JOB ID
const newJobId = await generateJobId();   // 🎯 Get the next number (1, 2, 3, ...)

await addDoc(collection(db, "jobs"), {
  recruiterId,
  country: recruiterCountry,
  jobId: newJobId,
  ...jobData,
skills: skillsListState,
status: "Active",
createdAt: serverTimestamp(),

});


      alert("Job added successfully!");
    }

    onClose();
  } catch (err) {
    console.error("Error saving job:", err);
    alert("Failed to save job. Please try again.");
  }
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 relative">

        <div className="flex justify-between items-center mb-4">
  <h2 className="text-2xl font-semibold">Add New Job (India)</h2>

  <button
    onClick={onClose}
    className="text-gray-600 hover:text-black text-2xl leading-none"
  >
    &times;
  </button>
</div>


        {/* Scrollable Section */}
        <div className="max-h-[75vh] overflow-y-auto pr-2">

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Company */}
            <div className="col-span-2">
              <label className="font-medium">Company you're hiring for</label>
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
                Don’t show this to candidates
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

            {/* Location */}
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
              <label className="font-medium">Work Experience</label>
              <input
                type="text"
                name="experience"
                value={jobData.experience}
                onChange={handleChange}
                className="w-full border p-2 rounded mt-1"
                placeholder="e.g., 2–4 years"
              />
            </div>

            {/* Qualification */}
            <div>
              <label className="font-medium">Qualification</label>
              <input
                type="text"
                name="qualification"
                value={jobData.qualification}
                onChange={handleChange}
                className="w-full border p-2 rounded mt-1"
              />
            </div>

            {/* Salary Amount */}
            <div>
              <label className="font-medium">Salary Amount</label>
              <input
                type="text"
                name="salaryAmount"
                value={jobData.salaryAmount}
                onChange={handleChange}
                className="w-full border p-2 rounded mt-1"
                placeholder="Enter salary"
              />
            </div>

            {/* Salary Type */}
            <div>
              <label className="font-medium">Salary Type</label>
              <select
                name="salaryType"
                value={jobData.salaryType}
                onChange={handleChange}
                className="w-full border p-2 rounded mt-1"
              >
                <option>Per Month</option>
                <option>Per Annum</option>
                <option>Hourly</option>
                <option>Daily</option>
              </select>
            </div>

            {/* Gender Preference */}
            <div>
              <label className="font-medium">Gender Preference</label>
              <select
                name="genderPreference"
                value={jobData.genderPreference}
                onChange={handleChange}
                className="w-full border p-2 rounded mt-1"
              >
                <option>Any</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>

            {/* Skills */}
            <div>
              <label className="font-medium">Mandatory Skills</label>
             <div>
  <label className="font-medium">Skills</label>

  {/* Tag Display */}
  <div className="flex flex-wrap gap-2 mt-1 mb-2">
    {skillsListState.map((skill, index) => (
      <span
        key={index}
        className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1"
      >
        {skill}
        <button
          type="button"
          onClick={() =>
            setSkillsListState(skillsListState.filter((_, i) => i !== index))
          }
          className="text-red-500 ml-1"
        >
          ×
        </button>
      </span>
    ))}
  </div>

  {/* Input to add new skill */}
  {/* Skills Autocomplete Input */}
<input
  type="text"
  value={skillInput}
  onChange={(e) => {
    const value = e.target.value;
    setSkillInput(value);

    // Show suggestions
    if (value.trim().length > 0) {
      const filtered = skillsOptions.filter(s =>
        s.toLowerCase().startsWith(value.toLowerCase())
      );
      setSkillSuggestions(filtered);
    } else {
      setSkillSuggestions([]);
    }
  }}
  className="w-full border p-2 rounded mt-1"
  placeholder="Type a skill..."
/>

{/* Suggestion Dropdown */}
{skillSuggestions.length > 0 && (
  <div className="border mt-1 bg-white rounded shadow p-2 max-h-40 overflow-y-auto">
    {skillSuggestions.map((skill, i) => (
      <div
        key={i}
        className="p-2 hover:bg-gray-100 cursor-pointer"
        onClick={() => {
          if (!skillsListState.includes(skill)) {
            setSkillsListState([...skillsListState, skill]);
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


            </div>

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
                <option>Onsite</option>
                <option>Hybrid</option>
              </select>
            </div>

            {/* Job Type */}
            <div>
              <label className="font-medium">Job Type</label>
              <select
                name="jobType"
                value={jobData.jobType}
                onChange={handleChange}
                className="w-full border p-2 rounded mt-1"
              >
                <option>FullTime</option>
                <option>Contract</option>
                <option>Freelance</option>
              </select>
            </div>
{/* Visibility Options */}
<div className="col-span-2">
  <label className="font-medium">Who should see this job?</label>

  <div className="mt-2 flex flex-col gap-2">

    {/* Candidates Only */}
    <label className="flex items-center gap-2">
      <input
        type="radio"
        name="visibility"
        value="candidates"
        checked={jobData.visibility === "candidates"}
        onChange={handleChange}
      />
      Candidates Only 
    </label>

    {/* Recruiters Only */}
    <label className="flex items-center gap-2">
      <input
        type="radio"
        name="visibility"
        value="recruiters"
        checked={jobData.visibility === "recruiters"}
        onChange={handleChange}
      />
      Recruiters Only
    </label>

    {/* Both */}
    <label className="flex items-center gap-2">
      <input
        type="radio"
        name="visibility"
        value="both"
        checked={jobData.visibility === "both"}
        onChange={handleChange}
      />
      Both Candidates & Recruiters
    </label>

  </div>
</div>

            {/* C2C Allowed */}
            {jobData.jobType === "Contract" && (
              <div>
                <label className="font-medium">C2C Allowed</label>
                <select
                  name="c2cAllowed"
                  value={jobData.c2cAllowed}
                  onChange={handleChange}
                  className="w-full border p-2 rounded mt-1"
                >
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
            )}

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

            {/* Referral Details */}
            {jobData.referralFee && (
              <div className="col-span-2">
                <label className="font-medium">Referral Details</label>
                <input
                  type="text"
                  name="referralDetails"
                  value={jobData.referralDetails}
                  onChange={handleChange}
                  className="w-full border p-2 rounded mt-1"
                  placeholder="₹5,000 after joining"
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

export default RecruiterAddJobModal;
