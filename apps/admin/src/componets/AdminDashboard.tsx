"use client";

import React, { useState } from "react";
import { Users, DollarSign } from "lucide-react";

import { useRouter } from "next/navigation";
import SettingPage from "./SettingPage";
import AdminUsers from "./AdminUsers";
import { ManageUsersAction } from "./MangeUsersAction";
export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("settings");

  const navItemClasses = (section: string) =>
    `flex items-center gap-3 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
      activeSection === section
        ? "bg-white text-purple-900 shadow-md"
        : "hover:bg-purple-200 hover:text-purple-900"
    }`;

  const renderSection = () => {
    switch (activeSection) {
      case "users":
        return <ManageUsersAction />;
      case "settings":
        return <SettingPage />;

      case "payments":
        return <AdminUsers />;
      default:
        return null;
    }
  };
  const route = useRouter();
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 to-yellow-900 text-gray-800 font-sans">
      <aside className="w-72 bg-gradient-to-b from-yellow-900 to-yellow-900 text-white p-6 space-y-8 shadow-xl">
        <div className="text-3xl font-extrabold text-white tracking-tight">
          Bingo Admin
        </div>
        <nav className="space-y-2">
          <button
            onClick={() => setActiveSection("users")}
            className={navItemClasses("users")}
          >
            <Users size={20} />
            Manage Users
          </button>
          <button
            onClick={() => setActiveSection("settings")}
            className={navItemClasses("settings")}
          >
            Settings
          </button>

          <button
            onClick={() => route.push("logout")}
            className={navItemClasses("money")}
          >
            <DollarSign size={20} />
            Log Out
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto transition-all duration-300">
        {renderSection()}
      </main>
    </div>
  );
}
