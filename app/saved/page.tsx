"use client";
import { useEffect, useState } from "react";
import { getSavedInsights, deleteInsight } from "@/lib/indexeddb";

export default function SavedInsightsPage() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const data = await getSavedInsights();
      // Sort by newest first
      data.sort((a, b) => b.timestamp - a.timestamp);
      setInsights(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this insight?")) {
      await deleteInsight(id);
      loadInsights();
    }
  };

  return (
    <main style={{ minHeight: "100vh", position: "relative", zIndex: 1, paddingBottom: "4rem" }}>
      {/* Top Navbar */}
      <nav style={{ 
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--glass-border)",
      }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: "72px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <img 
              src="/navigator-logo.jpg" 
              alt="Logo" 
              style={{ 
                width: "40px", height: "40px", borderRadius: "50%", 
                boxShadow: "0 4px 12px var(--primary-glow)", border: "1px solid var(--glass-border)", objectFit: "cover"
              }} 
            />
            <h1 className="nav-title" style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.01em" }}>Saved Insights</h1>
          </div>
          <a href="/" className="nav-btn-mobile-icon" style={{
            padding: "8px 16px", borderRadius: "20px", display: "flex", gap: "8px", alignItems: "center",
            background: "var(--surface)", border: "1px solid var(--glass-border)", color: "var(--foreground)",
            cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", textDecoration: "none",
            boxShadow: "var(--shadow-sm)"
          }}>
            👈 <span className="button-text">Back to Dashboard</span>
          </a>
        </div>
      </nav>

      <div className="container" style={{ marginTop: "4rem", maxWidth: "800px" }}>
        <h2 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "1rem", color: "var(--primary)" }}>Offline Vault</h2>
        <p style={{ fontSize: "1.1rem", opacity: 0.7, marginBottom: "3rem" }}>
          Your safely stored advocacy responses and key insights. These are saved completely offline in your browser's IndexedDB.
        </p>

        {loading ? (
          <p className="animate-pulse">Loading offline vault...</p>
        ) : insights.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: "center", padding: "4rem 2rem", opacity: 0.7 }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 600 }}>Your Vault is Empty</h3>
            <p>Click "⭐ Save Insight" on any AI response in the dashboard to save it here.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {insights.map((insight) => (
              <div key={insight.id} className="glass-panel animate-slide-up" style={{ padding: "0", position: "relative", overflow: "hidden" }}>
                <div style={{ padding: "1.5rem", background: "var(--primary-glow)", borderBottom: "1px solid var(--glass-border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700, color: "var(--primary)" }}>Your Inquiry</span>
                    <p style={{ fontWeight: 600, marginTop: "0.25rem", fontSize: "1.1rem" }}>"{insight.query}"</p>
                  </div>
                  <button 
                    onClick={() => handleDelete(insight.id)}
                    style={{ background: "transparent", border: "1px solid var(--glass-border)", padding: "4px 8px", borderRadius: "8px", color: "var(--foreground)", cursor: "pointer", fontSize: "0.85rem" }}
                  >
                    Delete
                  </button>
                </div>
                <div style={{ padding: "1.5rem", background: "var(--surface)" }}>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700, color: "var(--success)" }}>Advocate Response</span>
                  <p style={{ marginTop: "0.5rem", fontSize: "0.95rem", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{insight.response}</p>
                </div>
                <div style={{ padding: "1rem 1.5rem", fontSize: "0.75rem", opacity: 0.5, borderTop: "1px solid var(--glass-border)" }}>
                  Saved on {new Date(insight.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
