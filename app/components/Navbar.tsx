"use client";
import React, { useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isAdmin) {
      e.preventDefault();
      window.open(href, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <>
      <nav 
        aria-label="Main Navigation"
        style={{ 
          position: "sticky", 
          top: 0, 
          zIndex: 100,
          background: "var(--nav-bg)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--glass-border)",
        }}
      >
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: "72px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            {/* Hamburger menu button for mobile screens */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mobile-menu-btn"
              style={{
                background: "transparent", border: "none", fontSize: "1.5rem", color: "var(--foreground)",
                cursor: "pointer", display: "none", padding: "4px 8px"
              }}
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? "✕" : "☰"}
            </button>

            <a 
              href="/home" 
              style={{ display: "flex", alignItems: "center", gap: "12px", outlineColor: "var(--primary)" }} 
              aria-label="Special Education Navigator Home"
              onClick={(e) => handleLinkClick(e, "/home")}
              target={isAdmin ? "_blank" : undefined}
              rel={isAdmin ? "noopener noreferrer" : undefined}
            >
              <img 
                src="/navigator-logo.jpg" 
                alt="" 
                className="nav-logo"
                style={{ 
                  width: "40px", 
                  height: "40px", 
                  borderRadius: "50%", 
                  boxShadow: "0 4px 12px var(--primary-glow)", 
                  border: "1px solid var(--glass-border)", 
                  objectFit: "cover"
                }} 
              />
              <span className="nav-title" style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.01em", color: "var(--foreground)" }}>
                SpEd Navigator
              </span>
            </a>
          </div>

          <div style={{ display: "flex", gap: "20px", alignItems: "center" }} role="menubar">
            <div className="desktop-nav" style={{ display: "flex", gap: "20px", alignItems: "center" }}>
              <a href="/home" role="menuitem" className="nav-link" onClick={(e) => handleLinkClick(e, "/home")} target={isAdmin ? "_blank" : undefined} rel={isAdmin ? "noopener noreferrer" : undefined}>
                Home
              </a>
              <a href="/posts" role="menuitem" className="nav-link" onClick={(e) => handleLinkClick(e, "/posts")} target={isAdmin ? "_blank" : undefined} rel={isAdmin ? "noopener noreferrer" : undefined}>
                Articles
              </a>
              <a href="/downloads" role="menuitem" className="nav-link" onClick={(e) => handleLinkClick(e, "/downloads")} target={isAdmin ? "_blank" : undefined} rel={isAdmin ? "noopener noreferrer" : undefined}>
                Downloads
              </a>
              <a href="/videos" role="menuitem" className="nav-link" onClick={(e) => handleLinkClick(e, "/videos")} target={isAdmin ? "_blank" : undefined} rel={isAdmin ? "noopener noreferrer" : undefined}>
                Videos
              </a>
              <a 
                href="/demo" 
                role="menuitem" 
                style={{ color: "var(--foreground)", fontWeight: 500, fontSize: "0.95rem", padding: "6px 12px", background: "var(--primary-glow)", border: "1px solid var(--primary)", borderRadius: "20px", textDecoration: "none", transition: "all var(--transition-fast)" }} 
                onMouseOver={(e) => e.currentTarget.style.filter = "brightness(1.1)"} 
                onMouseOut={(e) => e.currentTarget.style.filter = "none"}
                onClick={(e) => handleLinkClick(e, "/demo")}
                target={isAdmin ? "_blank" : undefined}
                rel={isAdmin ? "noopener noreferrer" : undefined}
              >
                Try Demo
              </a>
            </div>

            <a 
              href="/" 
              role="menuitem" 
              className="nav-btn-mobile-icon"
              style={{ 
                padding: "8px 18px", 
                borderRadius: "20px", 
                background: "var(--primary)", 
                color: "white", 
                fontWeight: 600, 
                fontSize: "0.9rem",
                boxShadow: "0 4px 12px var(--primary-glow)",
                textDecoration: "none",
                transition: "all var(--transition-fast)",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
              onMouseOver={(e) => e.currentTarget.style.filter = "brightness(1.1)"}
              onMouseOut={(e) => e.currentTarget.style.filter = "none"}
              onClick={(e) => handleLinkClick(e, "/")}
              target={isAdmin ? "_blank" : undefined}
              rel={isAdmin ? "noopener noreferrer" : undefined}
            >
              🚀 <span className="button-text">Launch App</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown Panel */}
      {isMobileMenuOpen && (
        <div style={{
          position: "fixed",
          top: "72px",
          left: 0,
          right: 0,
          background: "var(--nav-bg)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid var(--glass-border)",
          padding: "1rem 2rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          zIndex: 99,
          boxShadow: "var(--shadow-md)"
        }} className="animate-slide-up">
          <a href="/home" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: "1rem", fontWeight: 600, padding: "0.5rem 0", borderBottom: "1px solid var(--glass-border)", color: "var(--foreground)", display: "flex", alignItems: "center", gap: "8px" }}>
            🏠 Home
          </a>
          <a href="/posts" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: "1rem", fontWeight: 600, padding: "0.5rem 0", borderBottom: "1px solid var(--glass-border)", color: "var(--foreground)", display: "flex", alignItems: "center", gap: "8px" }}>
            📰 Articles
          </a>
          <a href="/downloads" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: "1rem", fontWeight: 600, padding: "0.5rem 0", borderBottom: "1px solid var(--glass-border)", color: "var(--foreground)", display: "flex", alignItems: "center", gap: "8px" }}>
            📥 Downloads
          </a>
          <a href="/videos" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: "1rem", fontWeight: 600, padding: "0.5rem 0", borderBottom: "1px solid var(--glass-border)", color: "var(--foreground)", display: "flex", alignItems: "center", gap: "8px" }}>
            🎥 Videos
          </a>
          <a href="/demo" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: "1rem", fontWeight: 600, padding: "0.5rem 0", color: "var(--foreground)", display: "flex", alignItems: "center", gap: "8px" }}>
            🧪 Try Demo
          </a>
        </div>
      )}
    </>
  );
}
