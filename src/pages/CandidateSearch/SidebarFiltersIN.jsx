import React, { useState } from "react";
import { indiaStates } from "../../constants/Data";

export default function SidebarFiltersIN({ filters = {}, onFiltersChange = () => {} }) {
  const [local, setLocal] = useState({
    skills: "",
    state: "",
    minExp: "",
    maxExp: "",
    noticePeriod: "",
    ctcAmount: "",
    ctcType: "",
  });

  // Format Indian numbers (5,00,000)
  const formatIndianNumber = (num) => {
    num = num.replace(/,/g, "");
    if (isNaN(num) || num === "") return num;

    const lastThree = num.slice(-3);
    const otherNumbers = num.slice(0, -3);

    return (
      (otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",")) +
      (otherNumbers ? "," : "") +
      lastThree
    );
  };

  const update = (key, value) => {
    let updated = { ...local, [key]: value };

    // Format CTC input
    if (key === "ctcAmount") {
      const digits = value.replace(/\D/g, "");
      updated.ctcAmount = formatIndianNumber(digits);
    }

    setLocal(updated);

    // Map local -> output filters
    const output = {
      country: "India",

      keywords: updated.skills.trim(), // boolean search handled separately

      state: updated.state,
      minExp: updated.minExp,
      maxExp: updated.maxExp,

      noticePeriod: updated.noticePeriod,

      expectedCTC: updated.ctcAmount,
      expectedCTCType: updated.ctcType,
    };

    onFiltersChange(output);
  };

  const resetFilters = () => {
    const reset = {
      skills: "",
      state: "",
      minExp: "",
      maxExp: "",
      noticePeriod: "",
      ctcAmount: "",
      ctcType: "",
    };
    setLocal(reset);

    onFiltersChange({
      country: "India",
      keywords: "",
      state: "",
      minExp: "",
      maxExp: "",
      noticePeriod: "",
      expectedCTC: "",
      expectedCTCType: "",
    });
  };

  return (
    <aside className="w-72 bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-1">Filters (India)</h3>
      <p className="text-sm text-gray-500 mb-4">Narrow down bench & direct candidates</p>

      {/* Skills Search */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Skills Search</label>
        <input
          type="text"
          placeholder="e.g. React, Node, AWS"
          value={local.skills}
          onChange={(e) => update("skills", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        />
        <p className="text-xs text-gray-400 mt-1">Multi-keyword, case-insensitive.</p>
      </div>

      {/* State */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">State</label>
        <select
          value={local.state}
          onChange={(e) => update("state", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="">Any</option>
          {indiaStates.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Experience */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Experience (years)</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={local.minExp}
            onChange={(e) => update("minExp", e.target.value)}
            className="w-1/2 border border-gray-300 rounded-lg px-3 py-2"
          />
          <input
            type="number"
            placeholder="Max"
            value={local.maxExp}
            onChange={(e) => update("maxExp", e.target.value)}
            className="w-1/2 border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
      </div>

      {/* Notice Period */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Notice period</label>
        <select
          value={local.noticePeriod}
          onChange={(e) => update("noticePeriod", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="">Any</option>
          <option value="Immediate">Immediate</option>
          <option value="0-15 Days">0–15 Days</option>
          <option value="15-30 Days">15–30 Days</option>
          <option value="30-60 Days">30–60 Days</option>
          <option value="60-90 Days">60–90 Days</option>
          <option value="90+ Days">90+ Days</option>
        </select>
      </div>

      {/* Budget CTC */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Budget (₹)</label>
        <input
          type="text"
          placeholder="e.g. 5,00,000"
          value={local.ctcAmount}
          onChange={(e) => update("ctcAmount", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2"
        />

        <select
          value={local.ctcType}
          onChange={(e) => update("ctcType", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        >
        
          <option value="Per Month">Per Month</option>
          <option value="Per Annum">Per Annum</option>
        </select>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={resetFilters}
          className="text-gray-600 hover:underline text-sm"
          type="button"
        >
          Reset
        </button>

        <button
  onClick={() =>
    onFiltersChange({
      country: "India",

      skills: local.skills.trim(),

      state: local.state,
      minExp: local.minExp,
      maxExp: local.maxExp,

      noticePeriod: local.noticePeriod,

      expectedCTC: local.ctcAmount,
      expectedCTCType: local.ctcType,
    })
  }
  className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium shadow hover:bg-indigo-700 transition"
  type="button"
>
  Apply
</button>

      </div>
    </aside>
  );
}
