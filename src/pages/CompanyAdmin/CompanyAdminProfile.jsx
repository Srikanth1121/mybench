import React from "react";

const CompanyAdminProfile = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center items-start">
      <div className="w-full max-w-3xl bg-white shadow-md rounded-2xl p-6">
        <h1 className="text-2xl font-semibold mb-4 text-gray-800 text-center">
          Company Admin Profile
        </h1>

        {/* Company Information */}
        <div className="space-y-4">
          <div>
            <label className="text-gray-600 text-sm">Company Name</label>
            <p className="font-medium text-gray-900">OregonSys Technologies</p>
          </div>

          <div>
            <label className="text-gray-600 text-sm">Admin Email</label>
            <p className="font-medium text-gray-900">admin@oregonsys.com</p>
          </div>

          <div>
            <label className="text-gray-600 text-sm">Available Credits</label>
            <p className="font-medium text-green-600">250</p>
          </div>

          <div>
            <label className="text-gray-600 text-sm">Team Members</label>
            <p className="font-medium text-gray-900">5 Recruiters</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyAdminProfile;
