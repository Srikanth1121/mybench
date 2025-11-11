import React from "react";

const RecruiterMyCandidates = () => {
  return (
    <div className="p-6">
      {/* Page Heading */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">My Candidates</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + Add Candidate
        </button>
      </div>

      {/* Candidates List */}
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-gray-500">No candidates added yet.</p>
      </div>
    </div>
  );
};

export default RecruiterMyCandidates;
