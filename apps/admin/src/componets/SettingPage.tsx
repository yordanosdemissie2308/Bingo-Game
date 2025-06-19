"use client";

import React, { useEffect, useState } from "react";
import {
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "./Firebase";

const SettingPage = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const [role, setRole] = useState("");

  const router = useRouter();

  useEffect(() => {
    const fetchRole = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setRole(docSnap.data().role || "No role assigned");
          } else {
            setRole("No role found");
          }
        } catch (err) {
          console.error("Error fetching role:", err);
          setRole("Failed to fetch role");
        }
      }
    };

    fetchRole();
  }, []);

  const handleTogglePasswordForm = () => {
    setVisible(!visible);
    setMessage("");
    setError("");
  };

  const handleUpdatePassword = async () => {
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      setError("No authenticated user.");
      return;
    }

    const credential = EmailAuthProvider.credential(user.email, oldPassword);

    try {
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setMessage("Password updated successfully.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    }
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm("Do you want to log out?");
    if (!confirmLogout) return;

    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setError("Failed to log out.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 p-8 flex items-center justify-center">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl p-10 space-y-8">
        <h2 className="text-3xl font-bold text-indigo-800 border-b pb-4">
          Settings
        </h2>

        {/* Display user role */}
        <div className="text-lg text-gray-800">
          <strong>Role:</strong> {role}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Change Password Section */}
          <div className="p-6 bg-indigo-50 rounded-xl shadow hover:shadow-md transition duration-300 ease-in-out">
            <div
              onClick={handleTogglePasswordForm}
              className="cursor-pointer text-lg font-semibold text-indigo-700 mb-4"
            >
              Change Password {visible ? "▲" : "▼"}
            </div>

            {visible && (
              <div className="flex flex-col p-5 gap-4">
                <input
                  type="password"
                  placeholder="Enter old password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />

                {message && <p className="text-green-600">{message}</p>}
                {error && <p className="text-red-600">{error}</p>}

                <button
                  onClick={handleUpdatePassword}
                  className="mt-2 w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg hover:bg-indigo-700 transition duration-300"
                >
                  Update Password
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <div className="flex justify-end mt-8">
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition duration-300"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingPage;
