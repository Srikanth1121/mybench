import React from "react";

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

export default function CreditsTab({
  userData,
  creditHistory,
  loadingCredits,
  fetchCreditHistory,
}) {
  return (
    <div>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Credits & Transactions</h3>
        <div className="text-sm text-gray-500">
          Available: {userData?.credits ?? 0}
        </div>
      </div>

      <div className="space-y-3">
        {/* PERSONAL CREDITS CARD */}
        <div className="p-3 border rounded bg-gray-50">
          <div className="text-sm text-gray-600">Personal Credits</div>
          <div className="text-2xl font-semibold">
            {userData?.credits ?? 0}
          </div>
          <div className="text-xs text-gray-500">
            Each unlock costs 10 credits
          </div>
        </div>

        {/* TRANSACTIONS LIST */}
        <div className="p-3 border rounded">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Recent Transactions</div>
            <button
              onClick={fetchCreditHistory}
              className="text-sm text-blue-600"
            >
              Refresh
            </button>
          </div>

          {/* LOADING STATE */}
          {loadingCredits ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : creditHistory.length ? (
            /* TRANSACTIONS LIST */
            <ul className="space-y-2">
              {creditHistory.map((t) => (
                <li key={t.id} className="flex justify-between text-sm">
                  <div>
                    <div className="font-medium">{t.type || "Txn"}</div>
                    <div className="text-gray-500">
                      {new Date(
                        t.createdAt?.toDate?.() ||
                          t.createdAt ||
                          Date.now()
                      ).toLocaleString()}
                    </div>
                  </div>

                  <div
                    className={`font-semibold ${
                      t.amount >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {t.amount > 0 ? `+${t.amount}` : t.amount}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            /* EMPTY STATE */
            <div className="text-gray-500 text-sm">
              No recent transactions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
