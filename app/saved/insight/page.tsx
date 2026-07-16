"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/app/components/ThemeToggle";
import { getInsightById, getChildProfileById, ChildProfile, getChildProfiles, updateInsightProfile } from "@/lib/indexeddb";

interface SavedInsight {
  id: string;
  query: string;
  response: string;
  timestamp: number;
  childId?: string;
  name?: string;
}

type FontSize = "small" | "medium" | "large" | "xlarge";

function SavedInsightReaderContent() {
  const searchParams = useSearchParams();
  const insightId = searchParams.get("id");

  const [insight, setInsight] = useState<SavedInsight | null>(null);
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [profilesList, setProfilesList] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings state
  const [fontSize, setFontSize] = useState<FontSize>("medium");
  const [localDarkMode, setLocalDarkMode] = useState<boolean>(false);

  useEffect(() => {
    const syncTheme = () => {
      const isGlobalDark = localStorage.getItem("spednav_pref_darkMode") === "true" ||
                           document.documentElement.getAttribute("data-theme") === "dark" ||
                           document.documentElement.classList.contains("dark");
      setLocalDarkMode(isGlobalDark);
    };
    syncTheme();
    window.addEventListener("theme-change", syncTheme);
    return () => {
      window.removeEventListener("theme-change", syncTheme);
    };
  }, []);

  const toggleGlobalTheme = () => {
    const newVal = !localDarkMode;
    setLocalDarkMode(newVal);
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

  useEffect(() => {
    if (insightId) {
      loadInsightData(insightId);
    } else {
      setLoading(false);
    }
  }, [insightId]);

  const loadInsightData = async (id: string) => {
    try {
      const data = await getInsightById(id);
      if (data) {
        setInsight(data);
        if (data.childId) {
          const childData = await getChildProfileById(data.childId);
          setProfile(childData || null);
        }
      }
      const profiles = await getChildProfiles();
      setProfilesList(profiles);
    } catch (e) {
      console.error("Error loading insight:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveProfile = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!insight) return;
    const value = e.target.value;
    const newChildId = value === "general" ? undefined : value;
    try {
      const updatedInsight = await updateInsightProfile(insight.id, newChildId);
      if (updatedInsight) {
        setInsight(updatedInsight as any);
        if (newChildId) {
          const childData = await getChildProfileById(newChildId);
          setProfile(childData || null);
        } else {
          setProfile(null);
        }
        const { syncItem } = await import("@/lib/sync");
        await syncItem('insight', updatedInsight);
      }
    } catch (err) {
      console.error("Failed to move insight profile:", err);
      alert("Failed to move insight profile.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTxt = () => {
    if (!insight) return;
    const dateStr = new Date(insight.timestamp).toLocaleString();
    const content = `==================================================
THE SPECIAL EDUCATION NAVIGATOR - INSIGHT REPORT
==================================================
Insight Name: ${insight.name || "Untitled Insight"}
Date Saved:   ${dateStr}
Target Profile: ${profile ? profile.name : "General Account"}

--------------------------------------------------
USER INQUIRY:
"${insight.query}"

--------------------------------------------------
ADVOCATE RESPONSE:
${insight.response}

==================================================
`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(insight.name || "insight").replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Font size configuration values
  const fontSizesMap: Record<FontSize, { label: string; text: string; heading: string }> = {
    small: { label: "Small", text: "0.9rem", heading: "1.25rem" },
    medium: { label: "Medium", text: "1.05rem", heading: "1.5rem" },
    large: { label: "Large", text: "1.25rem", heading: "1.75rem" },
    xlarge: { label: "X-Large", text: "1.45rem", heading: "2rem" },
  };

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <p className="animate-pulse" style={{ fontSize: "1.2rem", fontWeight: 600 }}>Loading saved insight...</p>
      </main>
    );
  }

  if (!insight) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "1rem" }}>
        <h2 style={{ fontSize: "1.8rem", fontWeight: 700 }}>Insight Not Found</h2>
        <p style={{ opacity: 0.7 }}>The requested advocacy insight could not be found offline.</p>
        <Link href="/saved" style={{ padding: "8px 16px", background: "var(--primary)", color: "white", borderRadius: "20px", textDecoration: "none", fontWeight: 600 }}>
          Back to Vault
        </Link>
      </main>
    );
  }

  // Set colors based on local dark mode
  const bgStyle = localDarkMode ? "#121212" : "#fafafa";
  const paperBgStyle = localDarkMode ? "#1e1e1e" : "#ffffff";
  const textStyle = localDarkMode ? "#e0e0e0" : "#2d3748";
  const titleColor = localDarkMode ? "#60a5fa" : "var(--primary)";
  const labelColor = localDarkMode ? "#a1a1aa" : "#718096";
  const borderStyle = localDarkMode ? "1px solid #2d2d2d" : "1px solid #e2e8f0";

  return (
    <main style={{ 
      minHeight: "100vh", 
      background: bgStyle, 
      color: textStyle,
      paddingBottom: "6rem",
      transition: "background 0.3s, color 0.3s"
    }}>
      {/* Top Navbar */}
      <nav className="no-print" style={{ 
        position: "sticky", top: 0, zIndex: 50,
        background: localDarkMode ? "rgba(30, 30, 30, 0.8)" : "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: borderStyle,
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
            <span style={{ fontSize: "1.1rem", fontWeight: 700, letterSpacing: "-0.01em" }}>Reader View</span>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <ThemeToggle />
            <Link 
              href={profile ? `/saved/profile?id=${profile.id}` : "/saved"} 
              style={{
                padding: "8px 16px", borderRadius: "20px", display: "flex", gap: "8px", alignItems: "center",
                background: localDarkMode ? "#2d2d2d" : "#edf2f7", border: borderStyle, color: textStyle,
                cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", textDecoration: "none",
              }}
            >
              👈 Back
            </Link>
          </div>
        </div>
      </nav>

      {/* Reader Setup Controls */}
      <div className="container no-print" style={{ marginTop: "2rem", maxWidth: "720px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", borderBottom: borderStyle, paddingBottom: "1.5rem" }}>
        {/* Style configurations */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: labelColor }}>FONT SIZE:</span>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value as FontSize)}
              style={{
                padding: "4px 8px",
                borderRadius: "6px",
                border: borderStyle,
                background: paperBgStyle,
                color: textStyle,
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                outline: "none"
              }}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="xlarge">Extra Large</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: labelColor }}>PROFILE:</span>
            <select
              value={insight.childId || "general"}
              onChange={handleMoveProfile}
              style={{
                padding: "4px 8px",
                borderRadius: "6px",
                border: borderStyle,
                background: paperBgStyle,
                color: textStyle,
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                outline: "none"
              }}
            >
              <option value="general">🌍 General Account</option>
              {profilesList.map((p) => (
                <option key={p.id} value={p.id}>👦 {p.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={toggleGlobalTheme}
            style={{
              padding: "4px 10px",
              borderRadius: "6px",
              border: borderStyle,
              background: paperBgStyle,
              color: textStyle,
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            {localDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>

        {/* Action triggers */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handlePrint}
            style={{
              padding: "6px 12px",
              borderRadius: "20px",
              border: borderStyle,
              background: paperBgStyle,
              color: textStyle,
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            🖨️ Print Report
          </button>
          
          <button
            onClick={handleDownloadTxt}
            style={{
              padding: "6px 12px",
              borderRadius: "20px",
              background: "var(--primary)",
              color: "white",
              border: "none",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            ⬇️ Download Text (.txt)
          </button>
        </div>
      </div>

      {/* Printable minimalist paper sheet */}
      <div className="container print-content" style={{ marginTop: "3rem", maxWidth: "720px" }}>
        <article style={{ 
          background: paperBgStyle, 
          padding: "2.5rem", 
          borderRadius: "12px", 
          border: borderStyle,
          boxShadow: localDarkMode ? "none" : "0 4px 20px rgba(0,0,0,0.03)",
          lineHeight: 1.6,
          transition: "background 0.3s"
        }}>
          {/* Header Metadata */}
          <header style={{ borderBottom: borderStyle, paddingBottom: "1.5rem", marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
              <span style={{ 
                fontSize: "0.75rem", 
                textTransform: "uppercase", 
                letterSpacing: "1px", 
                fontWeight: 700, 
                color: labelColor 
              }}>
                Advocacy Insight Report
              </span>
              <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>
                {new Date(insight.timestamp).toLocaleString()}
              </span>
            </div>
            
            <h1 style={{ 
              fontSize: fontSizesMap[fontSize].heading, 
              fontWeight: 800, 
              color: titleColor, 
              margin: "0.5rem 0 1rem 0",
              lineHeight: 1.2
            }}>
              {insight.name || "Untitled Insight"}
            </h1>

            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", opacity: 0.5 }}>Profile Association:</span>
              <span style={{ 
                fontSize: "0.8rem", 
                padding: "2px 8px", 
                background: localDarkMode ? "rgba(96,165,250,0.1)" : "rgba(2,132,199,0.05)", 
                border: localDarkMode ? "1px solid #60a5fa" : "1px solid var(--primary)",
                color: titleColor,
                borderRadius: "12px",
                fontWeight: 700 
              }}>
                👦 {profile ? profile.name : "General Account"}
              </span>
            </div>
          </header>

          {/* Section: inquiry */}
          <section style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700, color: labelColor, marginBottom: "0.5rem" }}>
              User Inquiry
            </h2>
            <blockquote style={{ 
              margin: 0, 
              paddingLeft: "1.25rem", 
              borderLeft: localDarkMode ? "3px solid #4a5568" : "3px solid #cbd5e0", 
              fontStyle: "italic",
              fontSize: fontSizesMap[fontSize].text,
              color: localDarkMode ? "#cbd5e0" : "#4a5568"
            }}>
              &quot;{insight.query}&quot;
            </blockquote>
          </section>

          {/* Section: response */}
          <section>
            <h2 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700, color: labelColor, marginBottom: "0.75rem" }}>
              Navigator Response Analysis
            </h2>
            <div style={{ 
              fontSize: fontSizesMap[fontSize].text, 
              whiteSpace: "pre-wrap",
              wordBreak: "break-word"
            }}>
              {insight.response}
            </div>
          </section>
        </article>
      </div>

      {/* Inject print-only stylesheet styling directly */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-content {
            margin: 0 !important;
            max-width: 100% !important;
            padding: 0 !important;
          }
          article {
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </main>
  );
}

export default function SavedInsightReaderPage() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <p className="animate-pulse" style={{ fontSize: "1.2rem", fontWeight: 600 }}>Loading saved insight...</p>
      </main>
    }>
      <SavedInsightReaderContent />
    </Suspense>
  );
}
