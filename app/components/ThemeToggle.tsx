"use client";
import React, { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      const isDark = localStorage.getItem("spednav_pref_darkMode") === "true" ||
                     document.documentElement.getAttribute("data-theme") === "dark" ||
                     document.documentElement.classList.contains("dark");
      setDarkMode(isDark);
    };

    checkTheme();

    // Listen for theme changes from other components
    window.addEventListener("theme-change", checkTheme);
    return () => {
      window.removeEventListener("theme-change", checkTheme);
    };
  }, []);

  const toggleTheme = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    localStorage.setItem("spednav_pref_darkMode", newVal ? "true" : "false");
    
    if (newVal) {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
    }
    window.dispatchEvent(new Event("theme-change"));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flexShrink: 0 }}>
      <div 
        onClick={toggleTheme}
        className="dial-knob"
        style={{
          transform: `rotate(${darkMode ? '180deg' : '0deg'})`,
          width: "36px",
          height: "36px",
          borderWidth: "2px"
        }}
        aria-label="Toggle Theme Dial"
      />
      <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.5px", color: "var(--foreground)", textTransform: "uppercase" }}>
        {darkMode ? "LIGHT" : "DARK"}
      </span>
    </div>
  );
}
