"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/app/components/Navbar";

interface Article {
  id: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  content: string;
}

export default function PostsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    async function loadArticles() {
      try {
        const res = await fetch("/api/posts");
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.statusText}`);
        }
        const data = await res.json();
        if (data.success) {
          setArticles(data.posts);
        } else {
          throw new Error(data.error || "Unknown error");
        }
      } catch (err: any) {
        console.error("Error loading articles:", err);
        setError(err.message || "Failed to load educational posts");
      } finally {
        setLoading(false);
      }
    }
    loadArticles();
  }, []);

  return (
    <main style={{ minHeight: "100vh" }}>
      <Navbar />

      <div className="container" style={{ marginTop: "4rem", paddingBottom: "6rem" }}>
        <h1 style={{ fontSize: "2.75rem", fontWeight: 800, marginBottom: "1rem", color: "var(--primary)" }}>
          Educational Resources
        </h1>
        <p style={{ fontSize: "1.1rem", opacity: 0.8, marginBottom: "3rem", maxWidth: "700px" }}>
          Empower yourself with legal guides, procedural guides, and practical checklist matrices mapping to special education laws in Hawaii.
        </p>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
            {[1, 2, 3].map((n) => (
              <div 
                key={n} 
                className="glass-panel"
                style={{ 
                  padding: "2rem", 
                  minHeight: "260px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  opacity: 0.5,
                  animation: "pulse 1.5s infinite ease-in-out"
                }}
              >
                <div>
                  <div style={{ width: "40%", height: "18px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "4px", marginBottom: "1rem" }}></div>
                  <div style={{ width: "80%", height: "24px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "4px", marginBottom: "1rem" }}></div>
                  <div style={{ width: "100%", height: "60px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "4px" }}></div>
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
          /* Article Cards Grid */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
            {articles.map((article) => (
              <div 
                key={article.id} 
                className="glass-panel animate-slide-up"
                style={{ 
                  padding: "2rem", 
                  display: "flex", 
                  flexDirection: "column", 
                  justifyContent: "space-between",
                  minHeight: "260px"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <span style={{ fontSize: "0.75rem", padding: "4px 10px", background: "var(--primary-glow)", color: "var(--primary)", borderRadius: "12px", fontWeight: 700, textTransform: "uppercase" }}>
                      {article.category}
                    </span>
                    <span style={{ fontSize: "0.8rem", opacity: 0.5 }}>{article.date}</span>
                  </div>
                  <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "1rem" }}>
                    {article.title}
                  </h2>
                  <p style={{ opacity: 0.7, fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                    {article.excerpt}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedArticle(article)}
                  style={{ 
                    alignSelf: "flex-start",
                    background: "transparent",
                    border: "1px solid var(--primary)",
                    color: "var(--primary)",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all var(--transition-fast)"
                  }}
                >
                  Read Article &rarr;
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Article Reader Modal */}
        {selectedArticle && (
          <div 
            style={{
              position: "fixed",
              top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(8px)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 200,
              padding: "2rem"
            }}
            onClick={() => setSelectedArticle(null)}
          >
            <div 
              className="glass-panel animate-slide-up"
              style={{
                width: "100%",
                maxWidth: "700px",
                maxHeight: "80vh",
                overflowY: "auto",
                padding: "2.5rem",
                background: "var(--background-end)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-md)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <span style={{ fontSize: "0.75rem", padding: "4px 10px", background: "var(--primary-glow)", color: "var(--primary)", borderRadius: "12px", fontWeight: 700 }}>
                  {selectedArticle.category}
                </span>
                <button 
                  onClick={() => setSelectedArticle(null)}
                  style={{ background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--foreground)", opacity: 0.6 }}
                >
                  &times;
                </button>
              </div>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "1rem" }}>{selectedArticle.title}</h2>
              <p style={{ fontSize: "0.85rem", opacity: 0.5, marginBottom: "2rem" }}>Published: {selectedArticle.date}</p>
              
              <div style={{ 
                fontSize: "1rem", 
                lineHeight: 1.7, 
                opacity: 0.9, 
                whiteSpace: "pre-wrap", 
                color: "var(--foreground)" 
              }}>
                {selectedArticle.content}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
