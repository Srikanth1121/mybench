import React from "react";
import PropTypes from "prop-types";
import CandidateCard from "./CandidateCard";

export default function CandidateList({ candidates = [], onView = () => {}, onUnlock = () => {} }) {
  if (!candidates.length) {
    return (
      <div className="p-6 text-center text-zinc-500 text-sm">
        No candidates found.
      </div>
    );
  }

  return (
    <div className="w-full">
      {candidates.map((candidate) => (
        <CandidateCard
          key={candidate.id}
          candidate={candidate}
          onView={() => onView(candidate)}
          onUnlock={() => onUnlock(candidate)}
        />
      ))}
    </div>
  );
}

CandidateList.propTypes = {
  candidates: PropTypes.array,
  onView: PropTypes.func,
  onUnlock: PropTypes.func,
};