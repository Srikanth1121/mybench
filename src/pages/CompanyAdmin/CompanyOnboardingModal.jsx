import React, { useState } from "react";
import { db } from "../../firebase/config";
import { doc, setDoc, updateDoc, collection, addDoc, getDoc, serverTimestamp } from "firebase/firestore";



const CompanyOnboardingModal = ({ userId, userCountry, onClose, existingData }) => {
 const [formData, setFormData] = useState({
  companyName: existingData?.companyName || "",
  address: existingData?.address || "",
  state: existingData?.state || "",
  city: existingData?.city || "",
  website: existingData?.website || "",
  linkedin: existingData?.linkedin || "",
  size: existingData?.size || "",
  about: existingData?.about || "",
  country: existingData?.country || userCountry || "",
});


  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    // simple validation
    if (!formData.companyName || !formData.address || !formData.state || !formData.city || !formData.website) {
      alert("⚠️ Please fill all required fields.");
      return;
    }

    setSaving(true);
    try {
      // Step 1 — Add new company document
     let docRef;

if (existingData) {
  // ✅ Use userId’s company reference
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const userData = userSnap.data();
    const companyId = userData?.companyId;

    if (companyId) {
      const companyRef = doc(db, "companies", companyId);
      await updateDoc(companyRef, {
        ...formData,
        updatedAt: serverTimestamp(),
      });

      alert("✅ Company profile updated successfully!");
      onClose();
      return;
    } else {
      alert("❌ No company reference found for this user.");
      return;
    }
  } else {
    alert("❌ User record not found.");
    return;
  }
}
 else {
  // Create new company
  const companiesRef = collection(db, "companies");
  docRef = await addDoc(companiesRef, {
    ...formData,
    createdBy: userId,
    createdAt: serverTimestamp(),
  });

  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { companyId: docRef.id });
}


      // Step 2 — Update user's companyId
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { companyId: docRef.id });

      alert("✅ Company profile saved successfully!");
      onClose(); // trigger parent to refresh and hide modal
    } catch (error) {
      console.error("Error saving company details:", error);
      alert("❌ Failed to save company details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-xl relative">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 text-center">
  {existingData ? "Edit Company Profile" : "Company Onboarding"}
</h2>


        {/* Form Fields */}
        <div className="space-y-3">
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            placeholder="Company Name *"
            className="w-full p-2 border rounded-md"
          />

          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Address *"
            className="w-full p-2 border rounded-md"
          />

          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            placeholder="State *"
            className="w-full p-2 border rounded-md"
          />

          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="City *"
            className="w-full p-2 border rounded-md"
          />

          <input
            type="text"
            name="website"
            value={formData.website}
            onChange={handleChange}
            placeholder="Company Website (https://...) *"
            className="w-full p-2 border rounded-md"
          />

          <input
            type="text"
            name="linkedin"
            value={formData.linkedin}
            onChange={handleChange}
            placeholder="LinkedIn Profile (optional)"
            className="w-full p-2 border rounded-md"
          />

          <select
            name="size"
            value={formData.size}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Select Company Size (optional)</option>
            <option value="1-10">1-10 Employees</option>
            <option value="11-50">11-50 Employees</option>
            <option value="51-200">51-200 Employees</option>
            <option value="200+">200+ Employees</option>
          </select>

          <textarea
            name="about"
            value={formData.about}
            onChange={handleChange}
            placeholder="About Company (optional)"
            className="w-full p-2 border rounded-md"
          />

          <input
            type="text"
            name="country"
            value={formData.country}
            disabled
            className="w-full p-2 border rounded-md bg-gray-100 cursor-not-allowed"
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-400 rounded-md"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              saving ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyOnboardingModal;
