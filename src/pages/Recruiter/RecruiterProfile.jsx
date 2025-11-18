import React, { useEffect, useState, useMemo } from "react";
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import CreditsTab from "./CreditsTab";
import CompanyTab from "./CompanyTab";
import { db, storage } from "../../firebase/config";
import { getAuth } from "firebase/auth";
import { indiaStates, usaStates } from "../../constants/Data";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { Camera, Edit2, Check, X, Users } from "lucide-react";
export default function RecruiterProfile() {
  const auth = getAuth();
  const uid = auth?.currentUser?.uid;
  const [userData, setUserData] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("profile");
  const [toast, setToast] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [creditHistory, setCreditHistory] = useState([]);
  const [loadingCredits, setLoadingCredits] = useState(false);
  // ---------- ADD MOBILE VALIDATION HELPER ----------
const validateMobile = (raw = "", country = "India") => {
  const digits = String(raw).replace(/\D/g, "");
if (country === "India") {
    if (!/^[6-9]\d{9}$/.test(digits)) {
      return {
        valid: false,
        message: "Invalid Indian mobile. Must be 10 digits starting with 6-9.",
      };
    }
  } else if (country === "USA") {
    if (!/^\d{10}$/.test(digits)) {
      return {
        valid: false,
        message: "Invalid US mobile. Must be 10 digits.",
      };
    }
  } else {
    if (!/^\d{10}$/.test(digits)) {
      return { valid: false, message: "Invalid mobile. Must be 10 digits." };
    }
  }
return { valid: true, digits };
};
// -------------------------------------------------
 const fieldConfig = useMemo(
    () => ({
      personalInfo: [
        { key: "profileImage", label: "Profile Picture", type: "image", editable: true },
        { key: "name", label: "Full Name", type: "text", editable: true },
        { key: "email", label: "Email", type: "email", editable: false },
        { key: "mobile", label: "Mobile Number", type: "tel", editable: true },
        { key: "country", label: "Country", type: "text", editable: false },
        { key: "state", label: "State / Region", type: "select", editable: true },
      ],
      professionalInfo: [
        { key: "designation", label: "Designation", type: "text", editable: true },
        { key: "linkedin", label: "LinkedIn URL", type: "url", editable: true },
      ],
      systemInfo: [
        { key: "role", label: "Role", type: "text", editable: false },
        { key: "profileComplete", label: "Profile Complete", type: "boolean", editable: false },
      ],
    }),
    []
  );
// realtime user doc
  useEffect(() => {
    if (!uid) return;
    setLoadingUser(true);
    const userRef = doc(db, "users", uid);
    const unsub = onSnapshot(
      userRef,
      (snap) => {
        setUserData(snap.exists() ? snap.data() : null);
        setLoadingUser(false);
      },
      (err) => {
        console.error("user onSnapshot error:", err);
        setToast({ type: "error", message: "Failed to load profile." });
        setLoadingUser(false);
      }
    );
   return () => unsub();
  }, [uid]);
// company doc snapshot
useEffect(() => {
    if (!userData?.companyId) {
      setCompanyData(null);
      return;
    }
   setLoadingCompany(true);
    const companyRef = doc(db, "companies", userData.companyId);
    const unsub = onSnapshot(
      companyRef,
      (snap) => {
        setCompanyData(snap.exists() ? snap.data() : null);
        setLoadingCompany(false);
      },
      (err) => {
        console.error("company onSnapshot error:", err);
        setToast({ type: "error", message: "Failed to load company info." });
        setLoadingCompany(false);
      }
    );

    return () => unsub();
  }, [userData?.companyId]);
// credit history
  const fetchCreditHistory = async () => {
    if (!uid) return;
    setLoadingCredits(true);
    try {
      const txRef = collection(db, "users", uid, "creditTransactions");
      const q = query(txRef, orderBy("createdAt", "desc"), limit(20));
      const snap = await getDocs(q);
      setCreditHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("get credit history", err);
      setToast({ type: "error", message: "Failed to load credit history." });
    }
    setLoadingCredits(false);
  };
useEffect(() => {
    if (activeTab === "credits") fetchCreditHistory();
  }, [activeTab]);
const showToast = (t) => {
    setToast(t);
    setTimeout(() => setToast(null), 4000);
  };
// unified mobile getter: prefer mobile, fallback to phone
const getMobile = (data) => {
  if (!data) return "-";
  return data.mobile || "-";
};
// format phone minimal (you can extend for country)
  const formatPhone = (num) => {
  if (!num || num === "-") return "-";
const digits = String(num).replace(/\D/g, "");
// INDIA
  if (userData?.country === "India") {

    // 98765 43210 → +91 98765-43210
    return `+91 ${digits.slice(0, 5)}-${digits.slice(5)}`;
  }

  // USA
  if (userData?.country === "USA") {

    // 4155552671 → +1 (415) 555-2671
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
// Default fallback
  return digits;
};
// optimistic local update
  const handleFieldChange = (key, value) => {
    setUserData((p) => ({ ...p, [key]: value }));
  };
// save one field (inline)
  const saveField = async (key) => {
    if (!uid) return showToast({ type: "error", message: "User not available." });
    setSaving(true);
    try {
      const userRef = doc(db, "users", uid);
// If editing mobile, store to mobile and phone for compatibility
     if (key === "mobile") {
  const mobileCheck = validateMobile(userData.mobile, userData?.country);
if (!mobileCheck.valid) {
    showToast({ type: "error", message: mobileCheck.message });
    setSaving(false);
    return;
  }
await updateDoc(userRef, {
    mobile: mobileCheck.digits,  // store digits only
  });
showToast({ type: "success", message: "Mobile updated" });
  setEditingField(null);
  setSaving(false);
  return;
}
else if (key === "designation") {
        // ensure default designation
        const val = userData.designation || "Recruiter";
        await updateDoc(userRef, { designation: val });
      } else {
  const newValue = userData[key];  // ALWAYS fresh from state
  await updateDoc(userRef, { [key]: newValue });
}
showToast({ type: "success", message: "Saved" });
      setEditingField(null);
    } catch (err) {
      console.error("saveField", err);
      showToast({ type: "error", message: "Save failed" });
    }
    setSaving(false);
  };
const saveAll = async () => {
  if (!uid) return showToast({ type: "error", message: "User not available." });
setSaving(true);
  try {
    const userRef = doc(db, "users", uid);
// Validate mobile before saving
    const mobileCheck = validateMobile(userData.mobile, userData?.country);
if (!mobileCheck.valid) {
      showToast({ type: "error", message: mobileCheck.message });
      setSaving(false);
      return;
    }
// 🔥 Build payload safely
    const payload = {
      ...userData,
      mobile: mobileCheck.digits,  // digits only
    };
// 🔥 Remove fields we should never save back
delete payload.phone;   // <— ADD THIS
delete payload.credits;
delete payload.role;
delete payload.profileComplete;
await updateDoc(userRef, payload);
showToast({ type: "success", message: "Profile updated" });
  } catch (err) {
    console.error("saveAll", err);
    showToast({ type: "error", message: "Update failed" });
  }
setSaving(false);
};
// upload image
const handleImagePick = (file) => {
    if (!file || !uid) return;
    setUploading(true);
    const path = `profileImages/${uid}/${Date.now()}_${file.name}`;
    const sRef = storageRef(storage, path);
    const uploadTask = uploadBytesResumable(sRef, file);
uploadTask.on(
      "state_changed",
      (snapshot) => {
        const prog = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setUploadProgress(prog);
      },
      (err) => {
        console.error("upload err", err);
        showToast({ type: "error", message: "Upload failed" });
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        try {
          await updateDoc(doc(db, "users", uid), { profileImage: url });
          showToast({ type: "success", message: "Profile image updated" });
        } catch (err) {
          console.error("save image url", err);
          showToast({ type: "error", message: "Failed to save image URL" });
        }
        setUploading(false);
        setUploadProgress(0);
      }
    );
  };

  // small components
  const Skeleton = ({ className = "", style = {} }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} style={style} />
  );
const InlineField = ({ field }) => {
    const key = field.key;
    let value;
    if (key === "mobile") value = getMobile(userData);
    else value = userData?.[key] ?? "";
if (field.type === "image") {
      return (
        <div className="flex items-center gap-4">
          <img
            src={userData?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || "User")}&background=0D8ABC&color=fff&rounded=true&size=128`}
            alt="avatar"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || "User")}&background=0D8ABC&color=fff&rounded=true&size=128`;
            }}
            className="w-28 h-28 rounded-full object-cover border"
          />
          <label className="cursor-pointer text-blue-600 flex items-center gap-2">
            <Camera size={16} />
            Change Photo
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => handleImagePick(e.target.files?.[0])}
            />
          </label>
        </div>
      );
    }

  if (field.type === "select") {
  const options =
  (userData?.country || "India") === "India" ? indiaStates : usaStates;
return (
    <div className="flex items-start gap-2">
      {editingField === key ? (
        <select
          value={value}
          onChange={(e) => handleFieldChange(key, e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Select</option>
          {options.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ) : (
        <div className="text-sm">{value || "-"}</div>
      )}
{field.editable && (
        <div>
          {editingField === key ? (
            <>
              <button
                onClick={() => saveField(key)}
                className="p-1 bg-green-600 text-white rounded"
                disabled={saving}
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => setEditingField(null)}
                className="p-1 bg-gray-200 ml-2 rounded"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <button
              className="p-1 text-blue-600"
              onClick={() => setEditingField(key)}
            >
              <Edit2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
return (
      <div className="flex items-start gap-2">
        {editingField === key ? (
          <input
            autoFocus
            value={value}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            className="w-full p-2 border rounded"
          />
        ) : (
          <div className="text-sm text-gray-700">
            {key === "designation" ? (value || "Recruiter") : (value || "-")}
          </div>
        )}

        {field.editable && (
          <div>
            {editingField === key ? (
              <>
                <button
                  onClick={() => saveField(key)}
                  className="p-1 bg-green-600 text-white rounded"
                  disabled={saving}
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => setEditingField(null)}
                  className="p-1 bg-gray-200 ml-2 rounded"
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <button
                className="p-1 text-blue-600"
                onClick={() => setEditingField(key)}
              >
                <Edit2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };
// render
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* TABS */}
        <div className="flex gap-4 mb-6">
          {["profile", "company", "credits"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded ${activeTab === tab ? "bg-white shadow" : "bg-gray-100"}`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LEFT CARD */}
<div className="bg-white rounded-xl p-6 shadow-md text-center">
  {/* Profile image container */}
  <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-white shadow-lg">
    <img
      src={userData?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || "User")}&background=0D8ABC&color=fff&rounded=true&size=128`}
      alt="Profile"
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || "User")}&background=0D8ABC&color=fff&rounded=true&size=128`;
      }}
      className="w-full h-full object-cover"
    />
    {/* Profile picture change button */}
    <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow-lg hover:bg-blue-700 transition">
      <Camera size={14} />
      <input
        type="file"
        className="hidden"
        accept="image/*"
        onChange={(e) => handleImagePick(e.target.files?.[0])}
      />
    </label>
  </div>

  {/* Name and Designation */}
  <h2 className="text-xl font-semibold mt-3">{userData?.name || "User Name"}</h2>
  <p className="text-sm text-gray-500">{userData?.designation || "Recruiter"}</p>

  {/* Location, Email, and Mobile */}
  <div className="mt-4 text-left text-sm text-gray-600">
    <div className="flex items-center gap-2">
      <Users size={16} />
      <span>{userData?.state ? `${userData.state}, ${userData.country}` : userData?.country || "-"}</span>
    </div>
    <div className="flex items-center gap-2 mt-2">
      <span className="font-semibold">Email:</span>
      <span>{userData?.email || "-"}</span>
    </div>
    <div className="flex items-center gap-2 mt-2">
      <span className="font-semibold">Mobile:</span>
      <span>{formatPhone(getMobile(userData))}</span>
    </div>
  </div>

  {/* Action buttons */}
  <div className="mt-6 flex justify-center gap-3">
    <button
      onClick={() => setEditingField("name")}
      className="px-5 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition"
    >
      Edit Profile
    </button>
    <button
      onClick={() => setActiveTab("company")}
      className="px-5 py-2 bg-gray-100 text-gray-700 rounded-md shadow hover:bg-gray-200 transition"
    >
      View Company
    </button>
  </div>

  {/* Uploading progress */}
  {uploading && (
    <div className="mt-3 text-sm text-blue-600">
      Uploading... {uploadProgress}%
    </div>
  )}

</div>

{/* RIGHT */}
          <div className="md:col-span-2 bg-white rounded-xl p-6 shadow">
            {/* PROFILE TAB */}
          {activeTab === "profile" && (
  <>
    {/* HEADER */}
    <div className="flex justify-between items-center mb-6 pb-2 border-b">
      <h3 className="text-xl font-semibold text-gray-800 tracking-wide">
        Profile Information
      </h3>

      <button
        onClick={saveAll}
        disabled={saving}
        className="px-5 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save All"}
      </button>
    </div>

    {/* FORM GRID */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {fieldConfig.personalInfo.map((f) => (
        <div
          key={f.key}
          className="p-5 bg-white border rounded-lg shadow-sm hover:shadow transition"
        >
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {f.label}
          </label>
          <div className="mt-3">
            <InlineField field={f} />
          </div>
        </div>
      ))}

      {fieldConfig.professionalInfo.map((f) => (
        <div
          key={f.key}
          className="p-5 bg-white border rounded-lg shadow-sm hover:shadow transition"
        >
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {f.label}
          </label>
          <div className="mt-3">
            <InlineField field={f} />
          </div>
        </div>
      ))}

      {fieldConfig.systemInfo.map((f) => (
        <div
          key={f.key}
          className="p-5 bg-white border rounded-lg shadow-sm hover:shadow transition"
        >
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {f.label}
          </label>
          <div className="mt-3 text-sm text-gray-800">
            {String(userData?.[f.key] ?? "-")}
          </div>
        </div>
      ))}
    </div>
  </>
)}

{activeTab === "company" && (
  <CompanyTab
    companyData={companyData}
    loadingCompany={loadingCompany}
  />
)}

{activeTab === "credits" && (
  <CreditsTab
    userData={userData}
    creditHistory={creditHistory}
    loadingCredits={loadingCredits}
    fetchCreditHistory={fetchCreditHistory}
  />
)}

</div>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`fixed right-6 bottom-6 p-3 rounded-md shadow-lg ${toast.type === "error" ? "bg-red-600 text-white" : toast.type === "success" ? "bg-green-600 text-white" : "bg-blue-600 text-white"}`}>
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}
