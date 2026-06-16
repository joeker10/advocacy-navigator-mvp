"use client";
import React from "react";
import Navbar from "@/app/components/Navbar";

export default function HomePage() {
  return (
    <main style={{ minHeight: "100vh" }}>
      <Navbar />

      <div className="container" style={{ marginTop: "4rem", paddingBottom: "6rem" }}>
        {/* Hero Banner Section */}
        <section style={{ textAlign: "center", marginBottom: "5rem", maxWidth: "900px", margin: "0 auto 5rem auto" }} className="animate-slide-up">
          <div style={{ marginBottom: "2.5rem", display: "flex", justifyContent: "center" }}>
            <img 
              src="/navigator-logo.jpg" 
              alt="The Special Education Navigator Logo" 
              style={{ 
                width: "150px", 
                height: "150px", 
                objectFit: "cover",
                borderRadius: "50%", 
                boxShadow: "0 0 40px var(--primary-glow)",
                border: "2px solid var(--glass-border)"
              }} 
            />
          </div>
          <h1 style={{ 
            fontSize: "3.5rem", 
            fontWeight: 800, 
            lineHeight: 1.15, 
            marginBottom: "1.5rem", 
            background: "linear-gradient(135deg, var(--foreground), var(--primary))", 
            WebkitBackgroundClip: "text", 
            WebkitTextFillColor: "transparent" 
          }}>
            Equalizing the Balance of Power <br/> in Special Education Advocacy.
          </h1>
          <p style={{ fontSize: "1.25rem", color: "var(--foreground)", opacity: 0.8, maxWidth: "700px", margin: "0 auto", lineHeight: 1.6 }}>
            Democratizing legal analysis of IEPs, 504 plans, and evaluations for parents in Hawaii. 
            Powered by secure, offline edge analytics that put privacy first.
          </p>
          <div style={{ marginTop: "2.5rem", display: "flex", gap: "16px", justifyContent: "center" }}>
            <a 
              href="/demo" 
              style={{ 
                padding: "12px 28px", 
                borderRadius: "30px", 
                background: "var(--primary)", 
                color: "white", 
                fontWeight: 700, 
                fontSize: "1rem", 
                boxShadow: "0 4px 14px var(--primary-glow)" 
              }}
            >
              Try Interactive Demo
            </a>
            <a 
              href="/downloads" 
              style={{ 
                padding: "12px 28px", 
                borderRadius: "30px", 
                background: "var(--surface)", 
                border: "1px solid var(--glass-border)", 
                color: "var(--foreground)", 
                fontWeight: 600, 
                fontSize: "1rem" 
              }}
            >
              Download Mobile App
            </a>
          </div>
        </section>

        {/* Pillars / Features Grid */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem", marginTop: "4rem" }}>
          
          <div className="glass-panel animate-slide-up animate-delay-1" style={{ padding: "2rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔒</div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--primary)" }}>
              Zero-Trust Local Privacy
            </h2>
            <p style={{ opacity: 0.7, fontSize: "0.95rem", lineHeight: 1.6 }}>
              educational and medical records are stored strictly on your physical device via client-side IndexedDB. We maintain no cloud database, ensuring full HIPAA and FERPA compliance.
            </p>
          </div>

          <div className="glass-panel animate-slide-up animate-delay-2" style={{ padding: "2rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📸</div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--secondary)" }}>
              Multimodal Page Staging
            </h2>
            <p style={{ opacity: 0.7, fontSize: "0.95rem", lineHeight: 1.6 }}>
              Drop PDF reports or upload sequential photos of physical pages. Our client-side compression enables fast, batch processing of complex layouts directly into AI analysis.
            </p>
          </div>

          <div className="glass-panel animate-slide-up animate-delay-3" style={{ padding: "2rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚡</div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--primary)" }}>
              Local Vector Search
            </h2>
            <p style={{ opacity: 0.7, fontSize: "0.95rem", lineHeight: 1.6 }}>
              We translate document features into semantic vector math processed directly in JavaScript. Instantly cross-reference historical IEP goals against current evaluations.
            </p>
          </div>

          <div className="glass-panel animate-slide-up animate-delay-3" style={{ padding: "2rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚖️</div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--success)" }}>
              Hawaii HAR Chapter 60
            </h2>
            <p style={{ opacity: 0.7, fontSize: "0.95rem", lineHeight: 1.6 }}>
              The Advocate’s reasoning is explicitly grounded in Hawaii State administrative rules, flagging procedural timeline delays or missing accommodation adjustments.
            </p>
          </div>

        </section>

        {/* Help Directory Integration */}
        <section className="glass-panel animate-slide-up animate-delay-3" style={{ marginTop: "5rem", padding: "3rem 2rem", textAlign: "center" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "1rem" }}>Need Direct Advocacy Support?</h2>
          <p style={{ maxWidth: "700px", margin: "0 auto 2rem auto", opacity: 0.8, lineHeight: 1.6 }}>
            If you need to escalate, reach out to the Special Education Navigator at <a href="mailto:thespecialeducationnavigator@gmail.com" style={{ color: "var(--primary)", textDecoration: "underline" }}>thespecialeducationnavigator@gmail.com</a>. Or contact one of Hawaii's official parent support networks directly.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "2rem" }}>
            <div style={{ padding: "1.5rem", borderRadius: "16px", background: "var(--background)", border: "1px solid var(--border)", minWidth: "250px" }}>
              <h3 style={{ fontWeight: 700, color: "var(--primary)" }}>LDAH</h3>
              <p style={{ fontSize: "0.85rem", opacity: 0.6, margin: "0.25rem 0" }}>Learning Disabilities Association of Hawaii</p>
              <p style={{ fontWeight: 600, fontSize: "1.1rem", marginTop: "0.5rem" }}>(808) 536-9684</p>
              <a href="https://www.ldahawaii.org" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", textDecoration: "underline", fontSize: "0.85rem", display: "block", marginTop: "0.25rem" }}>www.ldahawaii.org</a>
            </div>
            
            <div style={{ padding: "1.5rem", borderRadius: "16px", background: "var(--background)", border: "1px solid var(--border)", minWidth: "250px" }}>
              <h3 style={{ fontWeight: 700, color: "var(--secondary)" }}>HDRC</h3>
              <p style={{ fontSize: "0.85rem", opacity: 0.6, margin: "0.25rem 0" }}>Hawaii Disability Rights Center</p>
              <p style={{ fontWeight: 600, fontSize: "1.1rem", marginTop: "0.5rem" }}>(808) 949-2922</p>
              <a href="https://hawaiidisabilityrights.org/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--secondary)", textDecoration: "underline", fontSize: "0.85rem", display: "block", marginTop: "0.25rem" }}>hawaiidisabilityrights.org</a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
