import React from "react";
import { Home, Users, Briefcase, Layers, LogOut } from "lucide-react";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";


const Sidebar = ({ activeSection, setActiveSection }) => {
  const menuItems = [
    { name: "Dashboard", icon: Home },
    { name: "Recruiters", icon: Users },
    { name: "Candidates", icon: Layers },
    { name: "Jobs", icon: Briefcase },
    { name: "Job Tracker", icon: Layers },
  ];
  const auth = getAuth();
const navigate = useNavigate();

const handleLogout = async () => {
  await signOut(auth);
  navigate("/"); // redirect to login
};


  return (
    <>
      {/* Static Sidebar Container */}
      <div className="relative w-48 bg-card border-r border-border shadow-sm fixed md:static inset-y-0 left-0 z-30 overflow-y-auto p-3 flex flex-col items-center">
        {/* Sidebar Header */}
        <div className="mb-6">
          <h2 className="text-base font-semibold text-textPrimary">Admin</h2>
        </div>

        {/* Menu List */}
        <nav className="flex-1 flex flex-col gap-3 items-center">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveSection(item.name)}
              className={`flex items-center justify-start w-36 px-3 py-2 rounded-lg font-medium transition-all ${
                activeSection === item.name
                  ? "bg-primary text-white shadow-sm"
                  : "text-textSecondary hover:bg-blue-50 hover:text-primary"
              }`}
            >
              <item.icon size={18} className="mr-2" />
              <span>{item.name}</span>
            </button>
          ))}
{/* Profile Button */}
<button
  onClick={() => setActiveSection("Profile")}
  className={`flex items-center justify-start w-36 px-3 py-2 rounded-lg font-medium transition-all ${
    activeSection === "Profile"
      ? "bg-primary text-white shadow-sm"
      : "text-textSecondary hover:bg-blue-50 hover:text-primary"
  }`}
>
  <Users size={18} className="mr-2" />
  <span>Profile</span>
</button>

          {/* Logout Button */}
          <button
  onClick={handleLogout}
  className="flex items-center justify-start w-36 px-3 py-2 mt-4 rounded-lg text-red-600 hover:bg-red-50 transition"
>
  <LogOut size={18} className="mr-2" />
  <span>Logout</span>
</button>

        </nav>
      </div>
    </>
  );
};

export default Sidebar;
