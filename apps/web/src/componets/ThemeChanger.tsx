"use client";

import { useEffect } from "react";
import { useTheme } from "../theme-context/page";

const themeMap = {
  light: {
    "--bg": "#ffffff",
    "--text": "#000000",
    "--border": "#cccccc",
  },
  dark: {
    "--bg": "#1a1a1a",
    "--text": "#f5f5f5",
    "--border": "#333333",
  },
  babe: {
    "--bg": "#ffe6f0",
    "--text": "#ff3399",
    "--border": "#ff99cc",
  },
  blue: {
    "--bg": "#e0f2ff",
    "--text": "#003366",
    "--border": "#66b2ff",
  },
} as const;

type ThemeType = keyof typeof themeMap;

export default function ThemeChanger() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const selectedTheme = themeMap[theme as ThemeType];
    if (selectedTheme) {
      Object.entries(selectedTheme).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  return (
    <div className="p-6 bg-[var(--bg)] text-[var(--text)] min-h-screen transition-all duration-300">
      <div className="max-w-md mx-auto rounded border border-[var(--border)] shadow-lg p-6">
        <label className="block mb-2 text-lg font-semibold">Choose Theme</label>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as ThemeType)}
          className="w-full px-4 py-2 border rounded bg-[var(--bg)] text-[var(--text)] border-[var(--border)]"
        >
          <option value="light">Light 🌞</option>
          <option value="dark">Dark 🌙</option>
          <option value="blue">Blue 💙</option>
        </select>
      </div>
    </div>
  );
}
