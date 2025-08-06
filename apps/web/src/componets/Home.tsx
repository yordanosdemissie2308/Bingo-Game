"use client";

import { useState } from "react";
import {
  UserIcon,
  BarChart,
  RotateCcw,
  Settings,
  Grid,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Dashboard from "./Dashboard";

const navItems = [
  { name: "Dashboard", icon: UserIcon, href: "/web/home" },
  { name: "Sales", icon: BarChart, href: "/web/sales" },
  { name: "Play Game", icon: RotateCcw, href: "/web/bingo-image" },
  { name: "Settings", icon: Settings, href: "/web/settings" },
  { name: "Card", icon: Grid, href: "/web/bingo-card" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <aside
        className={`fixed top-0 left-0 h-full bg-blue-800 text-white flex flex-col
          transition-all duration-300 shadow-lg z-50
          ${isOpen ? "w-56" : "w-16"}`}
      >
        {/* Toggle button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 focus:outline-none self-end text-white hover:bg-blue-700"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>

        {/* Nav items */}
        <nav className="flex flex-col mt-6 space-y-2 flex-1">
          {navItems.map(({ name, icon: Icon, href }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={name}
                href={href}
                className={`flex items-center gap-4 py-3 px-4 mx-2 rounded-lg transition-colors
                  ${isActive ? "bg-white text-blue-800 font-semibold" : "hover:bg-blue-700"}`}
                aria-current={isActive ? "page" : undefined}
                aria-label={name}
              >
                <Icon size={24} />
                {isOpen && <span className="whitespace-nowrap">{name}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content container: shifted right by sidebar width, centered vertically & horizontally */}
      <div
        className={`ml-${isOpen ? "56" : "16"} flex items-center justify-center min-h-screen`}
        style={{ marginLeft: isOpen ? "14rem" : "4rem" }} // Tailwind w-56 = 14rem, w-16=4rem
      >
        <Dashboard bingoPageId={""} />
      </div>
    </>
  );
}
