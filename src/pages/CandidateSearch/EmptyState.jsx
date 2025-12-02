import React from "react";

export default function EmptyState({ message = "No candidates found.", onClear = () => {} }) {
  return (
    <div className="w-full flex flex-col items-center justify-center py-10 text-center text-zinc-500">
      <div className="w-20 h-20 bg-zinc-100 rounded-full mb-4 flex items-center justify-center">
        <span className="text-3xl">🧑‍💼</span>
      </div>

      <h2 className="text-lg font-semibold text-zinc-700 mb-2">No Results</h2>
      <p className="text-sm mb-4">{message}</p>

      <button
        onClick={onClear}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm shadow-sm"
      >
        Clear Filters
      </button>
    </div>
  );
}
