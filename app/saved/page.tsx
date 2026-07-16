"use client";
import React, { useEffect, useState, useMemo } from "react";
import { getSavedInsights, deleteInsight, getChildProfiles, ChildProfile } from "@/lib/indexeddb";
import Link from "next/link";
import ThemeToggle from "@/app/components/ThemeToggle";

interface SavedInsight {
  id: string;
  query: string;
  response: string;
  timestamp: number;
  childId?: string;
  name?: string;
}

export default function SavedInsightsPage() {
  const [insights, setInsights] = useState<SavedInsight[]>([]);
  const [childProfiles, setChildProfiles] = useState<ChildProfile[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>("all"); // "all" | "general" | childId
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("spednav_auth_token") : null;
      if (token) {
        try {
          const { fullSync } = await import("@/lib/sync");
          await fullSync();
        } catch (syncErr) {
          console.error("Failed to sync on vault load:", syncErr);
        }
      }

      // Load insights
      const savedData = await getSavedInsights();
      savedData.sort((a, b) => b.timestamp - a.timestamp);
      setInsights(savedData);

      // Load child profiles
      const profiles = await getChildProfiles();
      setChildProfiles(profiles);
    } catch (e) {
      console.error("Failed to load offline vault data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this insight?")) {
      await deleteInsight(id);
      try {
        const { deleteRemoteItem } = await import("@/lib/sync");
        await deleteRemoteItem('insight', id);
      } catch (e) {
        console.error("Failed to delete insight on server:", e);
      }
      loadData();
    }
  };

  // Filtered insights list
  const filteredInsights = useMemo(() => {
    return insights.filter((insight) => {
      if (selectedFilter === "all") return true;
      if (selectedFilter === "general") return !insight.childId;
      return insight.childId === selectedFilter;
    });
  }, [insights, selectedFilter]);

  return (
    <main style={{ minHeight: "100vh", position: "relative", zIndex: 1, paddingBottom: "6rem" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <ThemeToggle />
            <Link href="/" className="nav-btn-mobile-icon" style={{
              padding: "8px 16px", borderRadius: "20px", display: "flex", gap: "8px", alignItems: "center",
              background: "var(--surface)", border: "1px solid var(--glass-border)", color: "var(--foreground)",
              cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", textDecoration: "none",
              boxShadow: "var(--shadow-sm)"
            }}>
              👈 <span className="button-text">Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container" style={{ marginTop: "4rem", maxWidth: "800px" }}>
        <h2 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "1rem", color: "var(--primary)" }}>Offline Vault</h2>
        <p style={{ fontSize: "1.1rem", opacity: 0.7, marginBottom: "2.5rem" }}>
          Your safely stored advocacy responses and key insights. These are saved completely offline in your browser&apos;s IndexedDB.
        </p>

        {/* Profiles Manager Dashboard Link */}
        {!loading && childProfiles.length > 0 && (
          <div style={{ marginBottom: "3rem" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>👦 Child Profiles</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
              {childProfiles.map((child) => (
                <Link
                  key={child.id}
                  href={`/saved/profile?id=${child.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "1rem",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    textDecoration: "none",
                    color: "inherit",
                    boxShadow: "var(--shadow-sm)",
                    transition: "transform 0.2s, border-color 0.2s"
                  }}
                  className="profile-card-hover"
                >
                  <span style={{ fontSize: "2rem" }}>👦</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{child.name}</div>
                    <div style={{ fontSize: "0.8rem", opacity: 0.6 }}>View Profile Insights &rarr;</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Profile Filter Tabs */}
        {!loading && (childProfiles.length > 0 || insights.length > 0) && (
          <div style={{ 
            display: "flex", 
            gap: "0.75rem", 
            marginBottom: "2.5rem", 
            flexWrap: "wrap",
            borderBottom: "1px solid var(--glass-border)",
            paddingBottom: "1rem"
          }}>
            <button
              onClick={() => setSelectedFilter("all")}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "1px solid var(--border)",
                background: selectedFilter === "all" ? "var(--primary)" : "var(--surface)",
                color: selectedFilter === "all" ? "white" : "var(--foreground)",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              🌎 All Insights
            </button>
            
            <button
              onClick={() => setSelectedFilter("general")}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "1px solid var(--border)",
                background: selectedFilter === "general" ? "var(--primary)" : "var(--surface)",
                color: selectedFilter === "general" ? "white" : "var(--foreground)",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              📥 General Vault
            </button>

            {childProfiles.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedFilter(child.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border: "1px solid var(--border)",
                  background: selectedFilter === child.id ? "var(--primary)" : "var(--surface)",
                  color: selectedFilter === child.id ? "white" : "var(--foreground)",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                👦 {child.name}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="animate-pulse">Loading offline vault...</p>
        ) : filteredInsights.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: "center", padding: "4rem 2rem", opacity: 0.7 }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 600 }}>No Saved Insights Found</h3>
            <p>
              {selectedFilter === "all" 
                ? "Click \"⭐ Save Insight\" on any AI response in the dashboard to save it here."
                : "No insights are linked to this specific profile."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {filteredInsights.map((insight) => {
              const linkedChild = childProfiles.find(c => c.id === insight.childId);
              return (
                <div key={insight.id} className="glass-panel animate-slide-up" style={{ padding: "0", position: "relative", overflow: "hidden" }}>
                  <div style={{ padding: "1.5rem", background: "var(--primary-glow)", borderBottom: "1px solid var(--glass-border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700, color: "var(--primary)" }}>
                          {insight.name || "Saved Insight"}
                        </span>
                        {linkedChild && (
                          <Link href={`/saved/profile?id=${linkedChild.id}`} style={{ 
                            fontSize: "0.75rem", 
                            padding: "2px 8px", 
                            background: "rgba(2, 132, 199, 0.15)", 
                            border: "1px solid var(--primary)", 
                            color: "var(--primary)", 
                            borderRadius: "20px",
                            fontWeight: 700,
                            textDecoration: "none"
                          }}>
                            👦 {linkedChild.name}
                          </Link>
                        )}
                      </div>
                      <p style={{ fontWeight: 600, margin: 0, fontSize: "1.1rem" }}>&quot;{insight.query}&quot;</p>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <Link 
                        href={`/saved/insight?id=${insight.id}`}
                        style={{ 
                          background: "var(--primary)", 
                          color: "white", 
                          border: "none", 
                          padding: "6px 12px", 
                          borderRadius: "8px", 
                          cursor: "pointer", 
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          textDecoration: "none" 
                        }}
                      >
                        📖 Open Reader
                      </Link>
                      <button 
                        onClick={() => handleDelete(insight.id)}
                        style={{ background: "transparent", border: "1px solid var(--glass-border)", padding: "6px 12px", borderRadius: "8px", color: "var(--foreground)", cursor: "pointer", fontSize: "0.85rem" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div style={{ padding: "1.5rem", background: "var(--surface)" }}>
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700, color: "var(--success)" }}>Advocate Response Excerpt</span>
                    <p style={{ marginTop: "0.5rem", fontSize: "0.95rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", opacity: 0.8 }}>
                      {insight.response}
                    </p>
                  </div>
                  <div style={{ padding: "1rem 1.5rem", fontSize: "0.75rem", opacity: 0.5, borderTop: "1px solid var(--glass-border)" }}>
                    Saved on {new Date(insight.timestamp).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
