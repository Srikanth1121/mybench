import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase/config";
import { collection, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";


export default function SuperAdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
const navigate = useNavigate();

  // Super admin email (hardcoded for now)
  const SUPER_ADMIN_EMAIL = "team@oregonsys.in";

  useEffect(() => {
    // Redirect if current user is not super admin
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user || user.email !== SUPER_ADMIN_EMAIL) {
  signOut(auth).then(() => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/superadmin-login", { replace: true });
  });
}

    });

    // Listen for users collection updates
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const userList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(userList);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUsers();
    };
  }, []);

  if (loading) return <p className="p-8">Loading users...</p>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Super Admin Dashboard
      </h1>

      <button
        onClick={() => signOut(auth)}
        className="mb-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Logout
      </button>

      <table className="w-full border border-gray-200 bg-white shadow-sm rounded">
        <thead className="bg-blue-100 text-gray-700">
          <tr>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Role</th>
            <th className="p-2 border">Credits</th>
            <th className="p-2 border">Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50">
              <td className="p-2 border">{u.name}</td>
              <td className="p-2 border">{u.email}</td>
              <td className="p-2 border">{u.role}</td>
              <td className="p-2 border text-center">{u.credits ?? 0}</td>
              <td className="p-2 border text-center">
                {u.active ? "✅ Active" : "❌ Inactive"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
