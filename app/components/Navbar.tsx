"use client";
import React from "react";

export default function Navbar() {
  return (
    <nav 
      aria-label="Main Navigation"
      style={{ 
        position: "sticky", 
        top: 0, 
        zIndex: 100,
        background: "rgba(15, 23, 42, 0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--glass-border)",
      }}
    >
      <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: "72px" }}>
        <a href="/home" style={{ display: "flex", alignItems: "center", gap: "12px", outlineColor: "var(--primary)" }} aria-label="Special Education Navigator Home">
          <img 
            src="/navigator-logo.jpg" 
            alt="" 
            style={{ 
              width: "40px", 
              height: "40px", 
              borderRadius: "50%", 
              boxShadow: "0 4px 12px var(--primary-glow)", 
              border: "1px solid var(--glass-border)", 
              objectFit: "cover"
            }} 
          />
          <span style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.01em", color: "var(--foreground)" }}>
            SpEd Navigator
          </span>
        </a>

        <div style={{ display: "flex", gap: "20px", alignItems: "center" }} role="menubar">
          <a href="/home" role="menuitem" style={{ color: "var(--foreground)", fontWeight: 500, fontSize: "0.95rem", padding: "6px 12px", borderRadius: "8px" }}>
            Home
          </a>
          <a href="/posts" role="menuitem" style={{ color: "var(--foreground)", fontWeight: 500, fontSize: "0.95rem", padding: "6px 12px", borderRadius: "8px" }}>
            Articles
          </a>
          <a href="/downloads" role="menuitem" style={{ color: "var(--foreground)", fontWeight: 500, fontSize: "0.95rem", padding: "6px 12px", borderRadius: "8px" }}>
            Downloads
          </a>
          <a href="/admin" role="menuitem" style={{ color: "var(--foreground)", fontWeight: 500, fontSize: "0.95rem", padding: "6px 12px", borderRadius: "8px" }}>
            Admin
          </a>
          <a href="/demo" role="menuitem" style={{ color: "var(--foreground)", fontWeight: 500, fontSize: "0.95rem", padding: "6px 12px", background: "var(--primary-glow)", border: "1px solid var(--primary)", borderRadius: "20px" }}>
            Try Demo
          </a>
          <a 
            href="/" 
            role="menuitem" 
            style={{ 
              padding: "8px 18px", 
              borderRadius: "20px", 
              background: "var(--primary)", 
              color: "white", 
              fontWeight: 600, 
              fontSize: "0.9rem",
              boxShadow: "0 4px 12px var(--primary-glow)"
            }}
          >
            Launch App
          </a>
        </div>
      </div>
    </nav>
  );
}
