import React from "react";
import { Users } from "lucide-react";

export default function CompanyTab({ companyData, loadingCompany }) {
  // Inline Skeleton (no import needed)
  const Skeleton = ({ className = "" }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Company Information</h3>
        <div className="text-sm text-gray-500">
          {companyData ? (companyData.name || companyData.companyName) : "No company"}
        </div>
      </div>

      {loadingCompany ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-6 w-1/4" />
        </div>
      ) : companyData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded">
            <div className="text-xs text-gray-500">Company Name</div>
            <div className="font-medium">
              {companyData.name || companyData.companyName}
            </div>

            <div className="mt-3 text-xs text-gray-500">Website</div>
            <a
              href={companyData.website}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600"
            >
              {companyData.website}
            </a>

            <div className="mt-3 text-xs text-gray-500">Email</div>
            <div>{companyData.email}</div>
          </div>

          <div className="p-4 border rounded">
            <div className="text-xs text-gray-500">Country</div>
            <div className="font-medium">{companyData.country}</div>

            <div className="mt-3 text-xs text-gray-500">Shared Credits</div>
            <div className="text-xl font-semibold">{companyData.companyCredits ?? 0}</div>

            <div className="mt-3 text-xs text-gray-500">Team Size</div>
            <div className="flex items-center gap-2">
              <Users size={16} />
              <div>{companyData.recruiters?.length ?? 1}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-gray-500">No company linked to this account.</div>
      )}
    </div>
  );
}
