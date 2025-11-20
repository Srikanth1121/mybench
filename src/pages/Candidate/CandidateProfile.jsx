// src/pages/Candidate/CandidateProfile.jsx
import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function CandidateProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    experience: "",
    skills: "",
    resumeUrl: "",
    resumeText: "",
  });

  // Load profile data
  useEffect(() => {
    async function load() {
      const current = auth.currentUser;
      if (!current) return;

      const snap = await getDoc(doc(db, "users", current.uid));
      if (snap.exists()) {
        const data = snap.data();
        setForm({
          name: data.name || "",
          email: current.email || "",
          mobile: data.mobile || "",
          experience: data.experience || "",
          skills: Array.isArray(data.skills)
            ? data.skills.join(", ")
            : data.skills || "",
          resumeUrl: data.resumeUrl || "",
          resumeText: data.resumeText || "",
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  // Update form fields
  const update = (key, value) =>
    setForm((f) => ({
      ...f,
      [key]: value,
    }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const current = auth.currentUser;
      if (!current) return;

      await updateDoc(doc(db, "users", current.uid), {
        name: form.name,
        mobile: form.mobile,
        experience: form.experience,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        resumeUrl: form.resumeUrl,
        resumeText: form.resumeText,
      });

      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <div className="p-6 text-slate-600">Loading profile…</div>;

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg border shadow-sm">
      <h2 className="text-2xl font-semibold mb-6 text-slate-800">
        Candidate Profile
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Name */}
        <div>
          <label className="text-sm font-medium text-slate-700">Full Name</label>
          <input
            className="w-full px-3 py-2 mt-1 border rounded-lg"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </div>

        {/* Email (readonly) */}
        <div>
          <label className="text-sm font-medium text-slate-700">Email</label>
          <input
            disabled
            className="w-full px-3 py-2 mt-1 border rounded-lg bg-slate-100 text-slate-500"
            value={form.email}
          />
        </div>

        {/* Mobile */}
        <div>
          <label className="text-sm font-medium text-slate-700">Mobile</label>
          <input
            className="w-full px-3 py-2 mt-1 border rounded-lg"
            value={form.mobile}
            onChange={(e) => update("mobile", e.target.value)}
          />
        </div>

        {/* Experience */}
        <div>
          <label className="text-sm font-medium text-slate-700">Experience (Years)</label>
          <input
            className="w-full px-3 py-2 mt-1 border rounded-lg"
            value={form.experience}
            onChange={(e) => update("experience", e.target.value)}
          />
        </div>

        {/* Skills */}
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-slate-700">
            Skills (comma separated)
          </label>
          <input
            className="w-full px-3 py-2 mt-1 border rounded-lg"
            placeholder="Java, React, Node.js"
            value={form.skills}
            onChange={(e) => update("skills", e.target.value)}
          />
        </div>

        {/* Resume URL */}
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-slate-700">Resume URL</label>
          <input
            className="w-full px-3 py-2 mt-1 border rounded-lg"
            value={form.resumeUrl}
            onChange={(e) => update("resumeUrl", e.target.value)}
            placeholder="https://yourresume.com/resume.pdf"
          />
        </div>

        {/* Resume Text */}
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-slate-700">Resume Text</label>
          <textarea
            rows={6}
            className="w-full px-3 py-2 mt-1 border rounded-lg"
            value={form.resumeText}
            onChange={(e) => update("resumeText", e.target.value)}
            placeholder="Paste resume text here..."
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-indigo-600 text-white rounded-md shadow disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
