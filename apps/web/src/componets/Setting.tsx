"use client";

import { useTheme } from "./TheamProvide";
import { FaSun, FaMoon, FaAdjust, FaPalette } from "react-icons/fa";
import { useState } from "react";

export default function Settings() {
  const { theme, setTheme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Settings Button stays fixed top-right */}
      <button
        aria-label="Toggle theme settings panel"
        onClick={() => setOpen(!open)}
        className="fixed top-4 right-4 p-3 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition z-50"
      >
        <FaPalette size={20} />
      </button>

      {/* Centered Settings Panel */}
      {open && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-40"
          onClick={() => setOpen(false)} // click outside closes panel
        >
          <div
            className="w-64 rounded-lg bg-white shadow-xl ring-1 ring-black ring-opacity-5 py-6 px-5 flex flex-col space-y-4 animate-fade-in"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
          >
            <h3 className="text-center font-semibold text-gray-700 text-lg">
              Choose Theme
            </h3>

            <button
              onClick={() => setTheme("black")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition ${
                theme === "black"
                  ? "bg-black text-white shadow-md"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
              title="Black Theme"
            >
              <FaMoon /> Black
            </button>

            <button
              onClick={() => setTheme("blue")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition ${
                theme === "blue"
                  ? "bg-blue-700 text-white shadow-md"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
              title="Blue Theme"
            >
              <FaSun /> Blue
            </button>

            <button
              onClick={() => setTheme("white")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition ${
                theme === "white"
                  ? "bg-gray-800 text-white shadow-md"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
              title="White Theme"
            >
              <FaAdjust /> White
            </button>

            <button
              onClick={toggleTheme}
              className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md py-2 font-semibold transition shadow"
              title="Toggle Theme"
            >
              Toggle Theme
            </button>
          </div>
        </div>
      )}
    </>
  );
}
