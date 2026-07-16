"use client";
import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/app/components/ThemeToggle";
import { getSavedInsights, getChildProfileById, renameInsight, deleteInsight, ChildProfile } from "@/lib/indexeddb";

interface SavedInsight {
  id: string;
  query: string;
  response: string;
  timestamp: number;
  childId?: string;
  name?: string;
}

function ChildProfileContent() {
  const searchParams = useSearchParams();
  const childId = searchParams.get("id");

  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [insights, setInsights] = useState<SavedInsight[]>([]);
  const [loading, setLoading] = useState(true);

  // Sorting state
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (childId) {
      loadProfileData(childId);
    } else {
      setLoading(false);
    }
  }, [childId]);

  const loadProfileData = async (id: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("spednav_auth_token") : null;
      if (token) {
        try {
          const { fullSync } = await import("@/lib/sync");
          await fullSync();
        } catch (syncErr) {
          console.error("Failed to sync on profile load:", syncErr);
        }
      }

      const childData = await getChildProfileById(id);
      setProfile(childData || null);

      const allInsights = await getSavedInsights();
      const childInsights = allInsights.filter((insight) => insight.childId === id);
      setInsights(childInsights);
    } catch (e) {
      console.error("Error loading profile or insights:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async (id: string, currentName: string) => {
    const newName = window.prompt("Enter new name for this saved insight:", currentName);
    if (newName === null) return; // User cancelled
    const trimmed = newName.trim();
    if (!trimmed) {
      alert("Name cannot be empty.");
      return;
    }
    try {
      const updatedItem = await renameInsight(id, trimmed);
      if (updatedItem) {
        const { syncItem } = await import("@/lib/sync");
        await syncItem('insight', updatedItem);
      }
      if (childId) loadProfileData(childId);
    } catch (e) {
      alert("Failed to rename saved insight.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this insight?")) {
      try {
        await deleteInsight(id);
        const { deleteRemoteItem } = await import("@/lib/sync");
        await deleteRemoteItem('insight', id);
        if (childId) loadProfileData(childId);
      } catch (e) {
        alert("Failed to delete insight.");
      }
    }
  };

  // Sort insights dynamically
  const sortedInsights = useMemo(() => {
    const sorted = [...insights];
    sorted.sort((a, b) => {
      if (sortBy === "name") {
        const nameA = a.name || a.query;
        const nameB = b.name || b.query;
        return sortOrder === "asc"
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      } else {
        // Sort by date/timestamp
        return sortOrder === "asc"
          ? a.timestamp - b.timestamp
          : b.timestamp - a.timestamp;
      }
    });
    return sorted;
  }, [insights, sortBy, sortOrder]);

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <p className="animate-pulse" style={{ fontSize: "1.2rem", fontWeight: 600 }}>Loading profile details...</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "1rem" }}>
        <h2 style={{ fontSize: "1.8rem", fontWeight: 700 }}>Profile Not Found</h2>
        <p style={{ opacity: 0.7 }}>The child profile you requested could not be retrieved from local storage.</p>
        <Link href="/saved" style={{ padding: "8px 16px", background: "var(--primary)", color: "white", borderRadius: "20px", textDecoration: "none", fontWeight: 600 }}>
          Back to Vault
        </Link>
      </main>
    );
  }

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
            <h1 className="nav-title" style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.01em" }}>👦 {profile.name}&apos;s Profile</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <ThemeToggle />
            <Link href="/saved" className="nav-btn-mobile-icon" style={{
              padding: "8px 16px", borderRadius: "20px", display: "flex", gap: "8px", alignItems: "center",
              background: "var(--surface)", border: "1px solid var(--glass-border)", color: "var(--foreground)",
              cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", textDecoration: "none",
              boxShadow: "var(--shadow-sm)"
            }}>
              👈 <span className="button-text">Back to Vault</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container" style={{ marginTop: "4rem", maxWidth: "800px" }}>
        {/* Child Profile Banner */}
        <div className="glass-panel" style={{ padding: "2rem", marginBottom: "3rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "3rem" }}>👦</span>
            <div>
              <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, color: "var(--primary)" }}>{profile.name}</h2>
              <p style={{ margin: "4px 0 0 0", opacity: 0.7, fontSize: "0.95rem" }}>
                Created on {new Date(profile.timestamp).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Saved Advocacy Insights ({insights.length})</h3>
          
          {/* Sorting controls */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center", background: "var(--surface)", border: "1px solid var(--border)", padding: "6px 12px", borderRadius: "20px" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, opacity: 0.6 }}>SORT BY:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "name" | "date")}
              style={{ background: "transparent", border: "none", color: "var(--foreground)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", outline: "none" }}
            >
              <option value="date" style={{ background: "var(--surface)" }}>📅 Date</option>
              <option value="name" style={{ background: "var(--surface)" }}>🔤 Name</option>
            </select>
            <span style={{ opacity: 0.3 }}>|</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              style={{ background: "transparent", border: "none", color: "var(--foreground)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", outline: "none" }}
            >
              <option value="desc" style={{ background: "var(--surface)" }}>⬇️ Descending</option>
              <option value="asc" style={{ background: "var(--surface)" }}>⬆️ Ascending</option>
            </select>
          </div>
        </div>

        {/* List of Insights */}
        {sortedInsights.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: "center", padding: "4rem 2rem", opacity: 0.7 }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
            <h4 style={{ fontSize: "1.1rem", fontWeight: 600 }}>No insights saved under this profile</h4>
            <p style={{ fontSize: "0.9rem", marginTop: "4px" }}>
              Select <strong>👦 {profile.name}</strong> as the profile inside the dashboard when chatting, then click &quot;⭐ Save Insight&quot;.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {sortedInsights.map((insight) => (
              <div 
                key={insight.id} 
                className="glass-panel animate-slide-up"
                style={{ 
                  padding: "1.2rem", 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  transition: "transform 0.2s, border-color 0.2s",
                }}
              >
                <div style={{ flex: 1, minWidth: 0, paddingRight: "1rem" }}>
                  <Link 
                    href={`/saved/insight?id=${insight.id}`}
                    style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", gap: "4px" }}
                  >
                    <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      📄 {insight.name || `Insight - ${new Date(insight.timestamp).toLocaleDateString()}`}
                    </span>
                    <span style={{ fontSize: "0.85rem", opacity: 0.7, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      Inquiry: &quot;{insight.query}&quot;
                    </span>
                    <span style={{ fontSize: "0.75rem", opacity: 0.4 }}>
                      Saved on {new Date(insight.timestamp).toLocaleString()}
                    </span>
                  </Link>
                </div>
                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleRename(insight.id, insight.name || "");
                    }}
                    style={{
                      padding: "6px 12px", borderRadius: "12px", border: "1px solid var(--border)",
                      background: "rgba(255,255,255,0.02)", color: "var(--foreground)", cursor: "pointer",
                      fontSize: "0.8rem", fontWeight: 600
                    }}
                  >
                    ✏️ Rename
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleDelete(insight.id);
                    }}
                    style={{
                      padding: "6px 12px", borderRadius: "12px", border: "1px solid var(--border)",
                      background: "rgba(255,255,255,0.02)", color: "hsl(0, 80%, 50%)", cursor: "pointer",
                      fontSize: "0.8rem", fontWeight: 600
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function ChildProfilePage() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <p className="animate-pulse" style={{ fontSize: "1.2rem", fontWeight: 600 }}>Loading profile details...</p>
      </main>
    }>
      <ChildProfileContent />
    </Suspense>
  );
}
