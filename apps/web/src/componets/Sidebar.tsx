"use client";

import { UserIcon, BarChart, RotateCcw, Settings, Grid } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Dashboard from "./Dashboard";

const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", icon: <UserIcon />, href: "/web/home" },
    { name: "Sales", icon: <BarChart />, href: "/web/sales" },
    { name: "Play Game", icon: <RotateCcw />, href: "/web/bingo-image" },
    { name: "Settings", icon: <Settings />, href: "/web/setting" },
    { name: "Card", icon: <Grid />, href: "/web/bingo-card" },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-800 text-white flex flex-col p-6">
        <h1 className="text-xl font-bold mb-8 leading-tight">
          Agent / Cashier
          <br />
          Dashboard
        </h1>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded transition ${
                  isActive
                    ? "bg-white text-blue-800 font-semibold"
                    : "hover:bg-blue-700"
                }`}
              >
                <span className="w-5 h-5">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50">
        <Dashboard bingoPageId={""} />
      </div>
    </div>
  );
};

export default Sidebar;
