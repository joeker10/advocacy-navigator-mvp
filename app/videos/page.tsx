"use client";
import React, { useState, useMemo, useEffect } from "react";
import Navbar from "@/app/components/Navbar";

interface Video {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  type: "short" | "video";
  category: string;
  duration: string;
  releasedAt: string;
}

const TOPICS = ["All Topics", "IEP Timelines", "HAR Chapter 60", "SMART Goals", "PWNs", "Parent Rights"];

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("All Topics");
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Video[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    async function fetchVideos() {
      try {
        const res = await fetch("/api/videos");
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch videos");
        }
        setVideos(data.videos || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "An error occurred while loading videos.");
      } finally {
        setLoading(false);
      }
    }
    fetchVideos();
  }, []);

  // The most recent 3 releases chronologically (sorted with most recent first)
  const recentReleases = useMemo(() => {
    return videos.slice(0, 3);
  }, [videos]);

  // Filter videos based on topic chips
  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      return selectedTopic === "All Topics" || video.category === selectedTopic;
    });
  }, [videos, selectedTopic]);

  const handleTopicClick = (topic: string) => {
    setSelectedTopic(topic);
    setSearchQuery("");
    setSearchResults(null);
    setPlayingVideoId(null);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    setPlayingVideoId(null);
    try {
      const res = await fetch(`/api/videos/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (res.ok) {
        setSearchResults(data.videos || []);
      } else {
        console.error("Search failed:", data.error);
        setSearchResults([]);
      }
    } catch (err) {
      console.error(err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const displayVideos = searchResults !== null ? searchResults : filteredVideos;

  return (
    <main style={{ minHeight: "100vh" }}>
      <Navbar />

      <div className="container" style={{ marginTop: "4rem", paddingBottom: "6rem" }}>
        
        {/* Portal Header */}
        <section style={{ marginBottom: "3rem" }}>
          <h1 style={{ fontSize: "2.75rem", fontWeight: 800, marginBottom: "1rem", color: "var(--primary)" }}>
            Advocacy Video Portal
          </h1>
          <p style={{ fontSize: "1.1rem", opacity: 0.8, maxWidth: "700px", lineHeight: 1.6 }}>
            Watch quick explainers, tutorials, and deep dives detailing special education law in Hawaii. 
            If you have questions or want to request a video topic, reach out to us at{" "}
            <a 
              href="mailto:support@thespecialeducationnavigator.app" 
              className="responsive-email"
              style={{ fontWeight: 600 }}
            >
              support@thespecialeducationnavigator.app
            </a>.
          </p>
        </section>

        {loading ? (
          <div className="glass-panel" style={{ padding: "4rem 2rem", textAlign: "center", opacity: 0.8 }}>
            <div className="spinner" style={{ border: "4px solid rgba(255,255,255,0.1)", borderLeftColor: "var(--primary)", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite", margin: "0 auto 1.5rem" }}></div>
            <p style={{ fontSize: "1.1rem" }}>Loading our video library...</p>
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}} />
          </div>
        ) : error ? (
          <div className="glass-panel" style={{ padding: "3rem 2rem", textAlign: "center", border: "1px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.05)" }}>
            <span style={{ fontSize: "3rem", display: "block", marginBottom: "1rem" }}>⚠️</span>
            <p style={{ fontSize: "1.1rem", color: "#f87171" }}>{error}</p>
          </div>
        ) : (
          <>
            {/* Most Recent Releases */}
            {selectedTopic === "All Topics" && searchResults === null && recentReleases.length > 0 && (
              <section style={{ marginBottom: "4rem" }}>
                <h2 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--secondary)" }}>
                  🎬 Most Recent Releases
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
                  {recentReleases.map((video) => {
                    const uniqueKey = `recent-${video.id}`;
                    const isPlaying = playingVideoId === uniqueKey;
                    return (
                      <div 
                        key={video.id} 
                        className="glass-panel"
                        style={{ 
                          padding: "1.5rem", 
                          display: "flex", 
                          flexDirection: "column", 
                          justifyContent: "space-between",
                          transition: "transform 0.2s"
                        }}
                        onMouseOver={(e) => {
                          if (!isPlaying) e.currentTarget.style.transform = "translateY(-4px)";
                        }}
                        onMouseOut={(e) => {
                          if (!isPlaying) e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <div>
                          <div style={{ position: "relative", width: "100%", aspectRatio: video.type === "short" ? "9/16" : "16/9", maxHeight: video.type === "short" ? "540px" : "auto", background: "#000", borderRadius: "12px", overflow: "hidden", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {isPlaying ? (
                              <iframe 
                                width="100%" 
                                height="100%" 
                                src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
                                title={video.title}
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                allowFullScreen
                                style={{ width: "100%", height: "100%", border: "none" }}
                              ></iframe>
                            ) : (
                              <div 
                                style={{ width: "100%", height: "100%", cursor: "pointer", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
                                onClick={() => setPlayingVideoId(uniqueKey)}
                              >
                                <img 
                                  src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`} 
                                  alt={video.title} 
                                  style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }}
                                />
                                <div style={{ position: "absolute", top: "12px", left: "12px", padding: "4px 8px", borderRadius: "8px", background: video.type === "short" ? "red" : "var(--primary)", color: "white", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>
                                  {video.type === "short" ? "⚡ Short" : "📹 Video"}
                                </div>
                                <div style={{ position: "absolute", bottom: "12px", right: "12px", padding: "2px 6px", borderRadius: "4px", background: "rgba(0,0,0,0.8)", color: "white", fontSize: "0.75rem" }}>
                                  {video.duration}
                                </div>
                                <div style={{ position: "absolute", width: "50px", height: "50px", borderRadius: "50%", background: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(0,0,0,0.3)" }}>
                                  <span style={{ fontSize: "1.5rem", color: "#000", marginLeft: "4px" }}>▶</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>{video.title}</h3>
                          <p style={{ fontSize: "0.85rem", opacity: 0.6, marginBottom: "1rem" }}>Released: {video.releasedAt}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

        {/* Search and Filters Section */}
        <section style={{ marginBottom: "3rem" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 700 }}>🔍 Search YouTube Channel</h2>
            <form 
              onSubmit={handleSearchSubmit}
              style={{ display: "flex", gap: "0.75rem", width: "100%", maxWidth: "480px" }}
            >
              <input 
                type="text" 
                placeholder="Search all videos on our YouTube channel..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!e.target.value.trim()) {
                    setSearchResults(null);
                  }
                }}
                style={{
                  padding: "10px 18px",
                  borderRadius: "30px",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--foreground)",
                  fontSize: "1rem",
                  flex: 1,
                  outline: "none"
                }}
              />
              <button 
                type="submit"
                style={{
                  padding: "10px 22px",
                  borderRadius: "30px",
                  border: "none",
                  background: "var(--primary)",
                  color: "white",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px var(--primary-glow)",
                  transition: "transform 0.15s, opacity 0.15s",
                  whiteSpace: "nowrap"
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
                onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                Search My YouTube Channel
              </button>
            </form>
          </div>

          {/* Topic Chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "2.5rem" }}>
            {TOPICS.map((topic) => (
              <button
                key={topic}
                onClick={() => handleTopicClick(topic)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border: "1px solid",
                  borderColor: selectedTopic === topic ? "var(--primary)" : "var(--glass-border)",
                  background: selectedTopic === topic ? "var(--primary)" : "var(--surface)",
                  color: selectedTopic === topic ? "white" : "var(--foreground)",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all var(--transition-fast)"
                }}
              >
                {topic}
              </button>
            ))}
          </div>

          {/* Search Results Grid */}
          {searching ? (
            <div className="glass-panel" style={{ padding: "4rem 2rem", textAlign: "center", opacity: 0.8 }}>
              <div className="spinner" style={{ border: "4px solid rgba(255,255,255,0.1)", borderLeftColor: "var(--primary)", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite", margin: "0 auto 1.5rem" }}></div>
              <p style={{ fontSize: "1.1rem" }}>Searching YouTube channel...</p>
              <style dangerouslySetInnerHTML={{ __html: `
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}} />
            </div>
          ) : displayVideos.length === 0 ? (
            <div className="glass-panel" style={{ padding: "4rem 2rem", textAlign: "center", opacity: 0.6 }}>
              <span style={{ fontSize: "3rem", display: "block", marginBottom: "1rem" }}>📭</span>
              <p style={{ fontSize: "1.1rem" }}>No videos found. Try another keyword.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
              {displayVideos.map((video) => {
                const uniqueKey = `search-${video.id}`;
                const isPlaying = playingVideoId === uniqueKey;
                return (
                  <div 
                    key={video.id} 
                    className="glass-panel"
                    style={{ 
                      padding: "1.5rem", 
                      display: "flex", 
                      flexDirection: "column", 
                      justifyContent: "space-between",
                      transition: "transform 0.2s"
                    }}
                    onMouseOver={(e) => {
                      if (!isPlaying) e.currentTarget.style.transform = "translateY(-4px)";
                    }}
                    onMouseOut={(e) => {
                      if (!isPlaying) e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div>
                      <div style={{ position: "relative", width: "100%", aspectRatio: video.type === "short" ? "9/16" : "16/9", maxHeight: video.type === "short" ? "540px" : "auto", background: "#000", borderRadius: "12px", overflow: "hidden", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {isPlaying ? (
                          <iframe 
                            width="100%" 
                            height="100%" 
                            src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
                            title={video.title}
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                            allowFullScreen
                            style={{ width: "100%", height: "100%", border: "none" }}
                          ></iframe>
                        ) : (
                          <div 
                            style={{ width: "100%", height: "100%", cursor: "pointer", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
                            onClick={() => setPlayingVideoId(uniqueKey)}
                          >
                            <img 
                              src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`} 
                              alt={video.title} 
                              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }}
                            />
                            <div style={{ position: "absolute", top: "12px", left: "12px", padding: "4px 8px", borderRadius: "8px", background: video.type === "short" ? "red" : "var(--primary)", color: "white", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>
                              {video.type === "short" ? "⚡ Short" : "📹 Video"}
                            </div>
                            <div style={{ position: "absolute", bottom: "12px", right: "12px", padding: "2px 6px", borderRadius: "4px", background: "rgba(0,0,0,0.8)", color: "white", fontSize: "0.75rem" }}>
                              {video.duration}
                            </div>
                            <div style={{ position: "absolute", width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(0,0,0,0.3)" }}>
                              <span style={{ fontSize: "1.2rem", color: "#000", marginLeft: "2px" }}>▶</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: "0.75rem", padding: "3px 8px", background: "var(--primary-glow)", color: "var(--primary)", borderRadius: "8px", fontWeight: 700, textTransform: "uppercase", display: "inline-block", marginBottom: "0.75rem" }}>
                        {video.category}
                      </span>
                      <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>{video.title}</h3>
                      <p style={{ fontSize: "0.9rem", opacity: 0.7, lineHeight: 1.5, marginBottom: "1rem" }}>{video.description}</p>
                    </div>
                    <p style={{ fontSize: "0.8rem", opacity: 0.5 }}>Released: {video.releasedAt}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        </>
        )}
      </div>
    </main>
  );
}
