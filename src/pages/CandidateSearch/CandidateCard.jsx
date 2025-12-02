import React from "react";

export default function CandidateCard({ candidate, onView }) {
  return (
    <div className="border rounded-xl p-4 shadow-sm bg-white mb-4">
      {/* Candidate Name */}
      <h3 className="text-lg font-semibold text-gray-900">
        {candidate.fullName || "No Name"}
      </h3>

      {/* Location */}
      <p className="text-sm text-gray-600 mt-1">
        {candidate.city ? `${candidate.city}, ${candidate.state}` : candidate.state}
        {candidate.country ? ` • ${candidate.country}` : ""}
      </p>

      {/* Experience */}
      <p className="text-sm text-gray-700 mt-1">
        {candidate.experience ? `${candidate.experience} yrs experience` : ""}
      </p>

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => onView(candidate)}
          className="w-full bg-gray-900 text-white rounded-lg py-2.5 font-medium hover:bg-black transition"
        >
          View Profile
        </button>
      </div>
    </div>
  );
}
