"use client";
import React from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isAdmin) {
      e.preventDefault();
      window.open(href, "_blank", "noopener,noreferrer");
    }
  };

  return (
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
              boxShadow: "0 4px 12px var(--primary-glow)",
              textDecoration: "none",
              transition: "all var(--transition-fast)"
            }}
            onMouseOver={(e) => e.currentTarget.style.filter = "brightness(1.1)"}
            onMouseOut={(e) => e.currentTarget.style.filter = "none"}
            onClick={(e) => handleLinkClick(e, "/")}
            target={isAdmin ? "_blank" : undefined}
            rel={isAdmin ? "noopener noreferrer" : undefined}
          >
            Launch App
          </a>
        </div>
      </div>
    </nav>
  );
}
