"use client";

import { useTheme } from "./TheamProvide";
import { Theme } from "./TheamProvide";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value as Theme);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="text-black text-3xl sm:text-4xl font-bold mb-6">
        Select a Theme
      </h1>
      <select
        value={theme}
        onChange={handleChange}
        className="w-full max-w-3xl px-5 py-3 text-lg text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-400 transition"
      >
        <option value="white">Default</option>
        <option value="yellow">Theme 1</option>
        <option value="blue">Theme 2</option>
      </select>
    </div>
  );
}
