import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { getAuth, onAuthStateChanged } from "firebase/auth";

// ✅ Helper to ensure URLs always include https://
const normalizeUrl = (url) => {
  if (!url) return "";
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed; // already has http or https
  return `https://${trimmed}`;
};

const CompanyAdminProfile = () => {
  const [editMode, setEditMode] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [originalData, setOriginalData] = useState(null);

  // ✅ Detect logged-in user and get companyId
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userInfo = userSnap.data();
            setUserData(userInfo);
            if (userInfo.companyId) setCompanyId(userInfo.companyId);
          }
        } catch (error) {
          console.error("Error fetching user:", error);
        }
      } else {
        setUserData(null);
        setCompanyId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // ✅ Fetch company data from Firestore
  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!companyId) return;
      setLoading(true);
      try {
        const companyRef = doc(db, "companies", companyId);
        const companySnap = await getDoc(companyRef);
        if (companySnap.exists()) {
          const data = companySnap.data();
          setCompanyData(data);
          setOriginalData(data);
        }
      } catch (error) {
        console.error("Error fetching company:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanyData();
  }, [companyId]);

  // ✅ Handle changes
  const handleChange = (e) => {
    setCompanyData({ ...companyData, [e.target.name]: e.target.value });
  };

  // ✅ Save updates to Firestore with URL normalization
  const handleSave = async () => {
    if (!companyId) return alert("No company ID found.");
    setLoading(true);
    try {
      const companyRef = doc(db, "companies", companyId);

      // Normalize URLs before saving
      const updatedData = {
        ...companyData,
        website: normalizeUrl(companyData.website),
        linkedin: normalizeUrl(companyData.linkedin),
      };

      await updateDoc(companyRef, updatedData);
      setOriginalData(updatedData);
      setCompanyData(updatedData);
      setEditMode(false);
      alert("✅ Company details updated successfully!");
    } catch (error) {
      console.error("Error updating company:", error);
      alert("❌ Failed to update company details.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Cancel edits
  const handleCancel = () => {
    setCompanyData(originalData);
    setEditMode(false);
  };

  if (loading || !companyData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500 text-lg">Loading company details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center items-start">
      <div className="w-full max-w-3xl bg-white shadow-md rounded-2xl p-6">
        <h1 className="text-2xl font-semibold mb-4 text-gray-800 text-center">
          Company Profile
        </h1>

        {/* ✅ Company Information */}
        <div className="space-y-4">
          {/* Company Name */}
          <div>
            <label className="text-gray-600 text-sm">Company Name</label>
            {editMode ? (
              <input
                type="text"
                name="companyName"
                value={companyData.companyName || ""}
                onChange={handleChange}
                className="border border-gray-300 rounded-md p-2 w-full"
              />
            ) : (
              <p className="font-medium text-gray-900">
                {companyData.companyName || "—"}
              </p>
            )}
          </div>

          {/* Admin Email */}
          <div>
            <label className="text-gray-600 text-sm">Admin Email</label>
            <p className="font-medium text-gray-900">
              {companyData.adminEmail || userData?.email || "—"}
            </p>
          </div>

          {/* Address */}
          <div>
            <label className="text-gray-600 text-sm">Address</label>
            {editMode ? (
              <textarea
                name="address"
                value={companyData.address || ""}
                onChange={handleChange}
                className="border border-gray-300 rounded-md p-2 w-full"
              />
            ) : (
              <p className="font-medium text-gray-900">
                {companyData.address || "—"}
              </p>
            )}
          </div>

          {/* City */}
          <div>
            <label className="text-gray-600 text-sm">City</label>
            {editMode ? (
              <input
                type="text"
                name="city"
                value={companyData.city || ""}
                onChange={handleChange}
                className="border border-gray-300 rounded-md p-2 w-full"
              />
            ) : (
              <p className="font-medium text-gray-900">
                {companyData.city || "—"}
              </p>
            )}
          </div>

          {/* State */}
          <div>
            <label className="text-gray-600 text-sm">State</label>
            {editMode ? (
              <input
                type="text"
                name="state"
                value={companyData.state || ""}
                onChange={handleChange}
                className="border border-gray-300 rounded-md p-2 w-full"
              />
            ) : (
              <p className="font-medium text-gray-900">
                {companyData.state || "—"}
              </p>
            )}
          </div>

          {/* Country */}
          <div>
            <label className="text-gray-600 text-sm">Country</label>
            <p className="font-medium text-gray-900">
              {companyData.country || "—"}
            </p>
          </div>

          {/* Website */}
          <div>
            <label className="text-gray-600 text-sm">Website</label>
            {editMode ? (
              <input
                type="text"
                name="website"
                value={companyData.website || ""}
                onChange={handleChange}
                className="border border-gray-300 rounded-md p-2 w-full"
                placeholder="e.g., oregonsys.in or https://oregonsys.in"
              />
            ) : (
              <p className="font-medium text-blue-600 underline">
                {companyData.website ? (
                  <a
                    href={normalizeUrl(companyData.website)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {normalizeUrl(companyData.website).replace(
                      /^https?:\/\//,
                      ""
                    )}
                  </a>
                ) : (
                  "—"
                )}
              </p>
            )}
          </div>

          {/* LinkedIn */}
          <div>
            <label className="text-gray-600 text-sm">LinkedIn</label>
            {editMode ? (
              <input
                type="text"
                name="linkedin"
                value={companyData.linkedin || ""}
                onChange={handleChange}
                className="border border-gray-300 rounded-md p-2 w-full"
                placeholder="e.g., linkedin.com/company/oregonsys"
              />
            ) : (
              <p className="font-medium text-blue-600 underline">
                {companyData.linkedin ? (
                  <a
                    href={normalizeUrl(companyData.linkedin)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {normalizeUrl(companyData.linkedin).replace(
                      /^https?:\/\//,
                      ""
                    )}
                  </a>
                ) : (
                  "—"
                )}
              </p>
            )}
          </div>

          {/* Company Size */}
          <div>
            <label className="text-gray-600 text-sm">Company Size</label>
            {editMode ? (
              <input
                type="text"
                name="size"
                value={companyData.size || ""}
                onChange={handleChange}
                className="border border-gray-300 rounded-md p-2 w-full"
              />
            ) : (
              <p className="font-medium text-gray-900">
                {companyData.size || "—"}
              </p>
            )}
          </div>

          {/* About */}
          <div>
            <label className="text-gray-600 text-sm">About</label>
            {editMode ? (
              <textarea
                name="about"
                value={companyData.about || ""}
                onChange={handleChange}
                className="border border-gray-300 rounded-md p-2 w-full"
              />
            ) : (
              <p className="font-medium text-gray-900 whitespace-pre-line">
                {companyData.about || "—"}
              </p>
            )}
          </div>
        </div>

        {/* ✅ Buttons */}
        <div className="mt-6 flex gap-3 justify-center">
          {editMode ? (
            <>
              <button
                onClick={handleSave}
                disabled={loading}
                className={`px-4 py-2 rounded-lg ${
                  loading ? "bg-gray-400" : "bg-blue-600"
                } text-white font-medium`}
              >
                {loading ? "Saving..." : "Save"}
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg border border-gray-300 font-medium"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyAdminProfile;
