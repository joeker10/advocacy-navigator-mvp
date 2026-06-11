"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/app/components/Navbar";

interface Resource {
  id: string;
  title: string;
  description: string;
  fileName: string;
  fileContent: string;
}

export default function DownloadsPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadResources() {
      try {
        const res = await fetch("/api/downloads");
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.statusText}`);
        }
        const data = await res.json();
        if (data.success) {
          setResources(data.resources);
        } else {
          throw new Error(data.error || "Unknown error");
        }
      } catch (err: any) {
        console.error("Error loading resources:", err);
        setError(err.message || "Failed to load downloadable resources");
      } finally {
        setLoading(false);
      }
    }
    loadResources();
  }, []);

  const handleDownload = (fileName: string, fileContent: string) => {
    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main style={{ minHeight: "100vh" }}>
      <Navbar />

      <div className="container" style={{ marginTop: "4rem", paddingBottom: "6rem" }}>
        
        {/* App Download Call to Action */}
        <section className="glass-panel animate-slide-up" style={{ padding: "4rem 2rem", textAlign: "center", marginBottom: "4rem" }}>
          <h1 style={{ fontSize: "2.75rem", fontWeight: 800, marginBottom: "1rem" }}>
            The Special Education Navigator App
          </h1>
          <p style={{ fontSize: "1.2rem", opacity: 0.8, maxWidth: "600px", margin: "0 auto 3rem auto", lineHeight: 1.6 }}>
            Access the full document staging vault, record audio transcriptions, and run local semantic search on your Android or iOS device.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1.5rem" }}>
            <a 
              href="https://play.google.com/store" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                background: "#000",
                color: "#fff",
                padding: "14px 28px",
                borderRadius: "16px",
                fontWeight: 700,
                fontSize: "1.05rem",
                textDecoration: "none",
                boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.15)",
                transition: "transform 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <span style={{ fontSize: "1.75rem" }}>🤖</span>
              <div style={{ textAlign: "left" }}>
                <span style={{ fontSize: "0.75rem", display: "block", opacity: 0.6, fontWeight: 500 }}>GET IT ON</span>
                <span style={{ display: "block" }}>Google Play</span>
              </div>
            </a>

            <a 
              href="https://www.apple.com/app-store" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                background: "#000",
                color: "#fff",
                padding: "14px 28px",
                borderRadius: "16px",
                fontWeight: 700,
                fontSize: "1.05rem",
                textDecoration: "none",
                boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.15)",
                transition: "transform 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <span style={{ fontSize: "1.75rem" }}>🍏</span>
              <div style={{ textAlign: "left" }}>
                <span style={{ fontSize: "0.75rem", display: "block", opacity: 0.6, fontWeight: 500 }}>DOWNLOAD ON THE</span>
                <span style={{ display: "block" }}>App Store</span>
              </div>
            </a>
          </div>
        </section>

        {/* PDF Toolkit Section */}
        <section className="animate-slide-up animate-delay-1">
          <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "1rem", color: "var(--primary)" }}>
            Advocate Toolkit
          </h2>
          <p style={{ opacity: 0.8, marginBottom: "2.5rem", maxWidth: "600px" }}>
            Download ready-to-use text files and templates to formally document correspondence with school coordinators and principals.
          </p>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
              {[1, 2, 3].map((n) => (
                <div 
                  key={n} 
                  className="glass-panel"
                  style={{ 
                    padding: "2rem", 
                    minHeight: "220px", 
                    display: "flex", 
                    flexDirection: "column", 
                    justifyContent: "space-between",
                    opacity: 0.5,
                    animation: "pulse 1.5s infinite ease-in-out"
                  }}
                >
                  <div>
                    <div style={{ width: "50px", height: "50px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "12px", marginBottom: "1rem" }}></div>
                    <div style={{ width: "70%", height: "20px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "4px", marginBottom: "0.5rem" }}></div>
                    <div style={{ width: "100%", height: "40px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "4px" }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="glass-panel" style={{ padding: "2rem", textAlign: "center", border: "1px solid var(--error-glow)" }}>
              <p style={{ color: "red", fontWeight: 600 }}>{error}</p>
              <button 
                onClick={() => { setLoading(true); setError(null); }}
                style={{
                  marginTop: "1rem",
                  background: "var(--primary)",
                  border: "none",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
              >
                Retry
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
              {resources.map((resource) => {
                let icon = "📖";
                const titleLower = resource.title.toLowerCase();
                if (titleLower.includes("checklist")) icon = "📋";
                if (titleLower.includes("request") || titleLower.includes("template")) icon = "✉️";

                return (
                  <div key={resource.id} className="glass-panel animate-slide-up" style={{ padding: "2rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>{icon}</div>
                      <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>{resource.title}</h3>
                      <p style={{ opacity: 0.7, fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
                        {resource.description}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDownload(resource.fileName, resource.fileContent)}
                      style={{
                        padding: "10px 18px",
                        borderRadius: "12px",
                        background: "var(--primary-glow)",
                        border: "1px solid var(--primary)",
                        color: "var(--primary)",
                        fontWeight: 600,
                        cursor: "pointer",
                        width: "100%",
                        transition: "all var(--transition-fast)"
                      }}
                    >
                      Download {resource.fileName.split('.').pop()?.toUpperCase() || "File"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
