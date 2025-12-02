import React from "react";

export default function LoadingSkeleton() {
  const skeletonItems = [1, 2, 3, 4]; // Show 4 skeleton cards

  return (
    <div>
      {skeletonItems.map((i) => (
        <div
          key={i}
          className="w-full bg-white rounded-2xl shadow-sm p-4 border border-zinc-200 mb-4 animate-pulse"
        >
          {/* Top row */}
          <div className="flex justify-between mb-4">
            <div className="h-4 w-32 bg-zinc-200 rounded"></div>
            <div className="h-5 w-16 bg-zinc-200 rounded-full"></div>
          </div>

          {/* Location + Experience */}
          <div className="h-3 w-48 bg-zinc-200 rounded mb-2"></div>
          <div className="h-3 w-36 bg-zinc-200 rounded mb-4"></div>

          {/* Skills */}
          <div className="flex gap-2 mb-4">
            <div className="h-6 w-16 bg-zinc-200 rounded-full"></div>
            <div className="h-6 w-14 bg-zinc-200 rounded-full"></div>
            <div className="h-6 w-20 bg-zinc-200 rounded-full"></div>
          </div>

          {/* Bottom buttons */}
          <div className="flex gap-3">
            <div className="h-10 w-1/2 bg-zinc-200 rounded-lg"></div>
            <div className="h-10 w-1/2 bg-zinc-200 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );
}