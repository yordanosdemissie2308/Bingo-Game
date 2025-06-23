"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "white" | "black" | "blue";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}>({
  theme: "white",
  setTheme: () => {},
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>("white");

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const toggleTheme = () => {
    setTheme(
      theme === "white" ? "black" : theme === "black" ? "blue" : "white"
    );
  };

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme;
    if (saved) setThemeState(saved);
  }, []);

  useEffect(() => {
    document.body.classList.remove("theme-white", "theme-black", "theme-blue");
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
