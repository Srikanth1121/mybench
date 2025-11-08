import React from "react";
import { Menu } from "lucide-react";

const Topbar = ({ companyName, onLogout, onToggleSidebar }) => {

  return (
    <header className="flex items-center justify-between bg-white shadow-sm px-6 py-3 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Sidebar Toggle for small screens */}
        <button
  className="md:hidden p-2 rounded-md hover:bg-gray-100"
  onClick={onToggleSidebar}
>
  <Menu size={22} />
</button>


        {/* Company Name */}
        <h1 className="text-lg font-semibold text-gray-800">
          {companyName}
        </h1>
      </div>

      {/* Right Section */}
      <div>
        
      </div>
    </header>
  );
};

export default Topbar;
