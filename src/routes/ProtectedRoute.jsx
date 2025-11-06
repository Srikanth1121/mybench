import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // ✅ use shared context

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();
  const isSuperAdminRoute = location.pathname.startsWith("/superadmin");

  // 🌀 1️⃣ While Firebase is still checking
  if (loading) return <p>Loading...</p>;

  // 🚫 2️⃣ Not logged in → redirect properly
  if (!user) {
    return (
      <Navigate
        to={isSuperAdminRoute ? "/superadmin-login" : "/"}
        replace
      />
    );
  }

  // 🚫 3️⃣ Logged in but wrong role → redirect to Home
  if (role !== allowedRole) return <Navigate to="/" replace />;

  // ✅ 4️⃣ Role matches → allow access
  return children;
};

export default ProtectedRoute;
