"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/app/components/Navbar";

interface FAQItem {
  id?: string;
  question: string;
  answer: string;
}

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

const DEFAULT_FAQS: FAQItem[] = [
  {
    question: "How do I use the AI Advocate to analyze my child's IEP documents?",
    answer: "Simply navigate to the dashboard, tap the upload area or camera button to select/photograph your document, choose your child's profile (or select 'General' analysis), and tap submit. The AI will review the document details against Hawaii regulations and generate an Advocacy Insight report."
  },
  {
    question: "What should I do if the system flags a document as a duplicate?",
    answer: "To save your storage space, the app automatically checks if an uploaded or photographed document matches one that has already been analyzed. You will see a warning dialogue offering you the choice to either discard the new upload or continue processing it."
  },
  {
    question: "Where can I find my child's saved insights, and how do I rename or print them?",
    answer: "Go to the 'Saved' vault tab from the navigation menu, select your child's profile to view all their saved reports. Click on any report to open the minimalist reader. Inside the reader, you can scale font sizes, switch to Dark Mode, download the text as a .txt file, or print/export as PDF using the print options."
  },
  {
    question: "Can I use the app for free without a subscription? What are the limitations?",
    answer: "Yes! Free tier accounts do not need to create profiles and can request up to 5 document insights per calendar month. To create unlimited child profiles, access family sharing, and run unlimited analyses, you can upgrade to a premium plan from the subscription menu."
  },
  {
    question: "How do I share document insights or add family members/advocates?",
    answer: "From the main menu drawer, open 'Settings' and navigate to the 'Family Sharing' panel. You can generate a shareable coupon code or invite advocates/family members to link their accounts and view your child's profile reports."
  }
];

export default function TutorialsPage() {
  const [activeTab, setActiveTab] = useState<"faqs" | "tutorials">("faqs");
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch FAQs
        const faqRes = await fetch("/api/faqs");
        const faqData = await faqRes.json();
        if (faqData.success && faqData.faqs) {
          setFaqs(faqData.faqs);
        } else {
          setFaqs(DEFAULT_FAQS);
        }

        // Fetch Videos
        const videoRes = await fetch("/api/videos");
        const videoData = await videoRes.json();
        if (videoData.success || videoData.videos) {
          // Filter only videos under "Tutorials" category
          const tutorialVideos = (videoData.videos || []).filter(
            (v: Video) => v.category === "Tutorials" || v.category === "Tutorials & FAQs"
          );
          setVideos(tutorialVideos);
        }
      } catch (e) {
        console.error("Failed to load tutorials data:", e);
        setFaqs(DEFAULT_FAQS);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <main style={{ minHeight: "100vh", position: "relative", zIndex: 1, paddingBottom: "6rem" }}>
      {/* Complete Top Menu */}
      <Navbar />

      <div className="container" style={{ marginTop: "4rem", maxWidth: "1000px" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "0.5rem", color: "var(--primary)" }}>Navigator Academy</h2>
          <p style={{ fontSize: "1.1rem", opacity: 0.8 }}>
            Master the Special Education Navigator app and be your child's best advocate!
          </p>
        </div>

        {/* Tab Controls */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "2.5rem", justifyContent: "center" }}>
          <button 
            onClick={() => setActiveTab("faqs")}
            className="gadget-btn"
            style={{
              padding: "10px 24px",
              background: activeTab === "faqs" ? "var(--primary)" : "var(--surface)",
              color: activeTab === "faqs" ? "white" : "var(--foreground)",
              border: "1px solid var(--border)",
              fontSize: "1rem"
            }}
          >
            📋 Frequently Asked Questions
          </button>
          <button 
            onClick={() => setActiveTab("tutorials")}
            className="gadget-btn"
            style={{
              padding: "10px 24px",
              background: activeTab === "tutorials" ? "var(--primary)" : "var(--surface)",
              color: activeTab === "tutorials" ? "white" : "var(--foreground)",
              border: "1px solid var(--border)",
              fontSize: "1rem"
            }}
          >
            🎥 Video Tutorials
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: "center" }} className="animate-pulse">Loading Academy resources...</p>
        ) : activeTab === "faqs" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {faqs.map((faq, index) => (
              <div key={faq.id || index} className="glass-panel" style={{ padding: "2rem" }}>
                <h3 style={{ fontSize: "1.25rem", color: "var(--primary)", fontWeight: 700, marginBottom: "0.75rem" }}>
                  Q: {faq.question}
                </h3>
                <p style={{ fontSize: "0.95rem", lineHeight: "1.6", opacity: 0.9 }}>
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {videos.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: "center", padding: "4rem 2rem", opacity: 0.7 }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📽️</div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 600 }}>No Video Tutorials Available</h3>
                <p>Add YouTube tutorials in the Admin dashboard categorized under &quot;Tutorials&quot; to see them here.</p>
              </div>
            ) : (
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
                gap: "2rem" 
              }}>
                {videos.map((video) => {
                  const isPlaying = playingVideoId === video.id;
                  return (
                    <div key={video.id} className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        {/* Embed Player */}
                        <div style={{ position: "relative", width: "100%", aspectRatio: video.type === "short" ? "9/16" : "16/9", maxHeight: video.type === "short" ? "400px" : "auto", background: "#000", borderRadius: "12px", overflow: "hidden", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
                              onClick={() => setPlayingVideoId(video.id)}
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
                        <p style={{ fontSize: "0.9rem", opacity: 0.8, marginBottom: "1rem", lineHeight: "1.4" }}>{video.description}</p>
                      </div>
                      <div style={{ fontSize: "0.8rem", opacity: 0.5, borderTop: "1px solid var(--glass-border)", paddingTop: "0.75rem", marginTop: "0.5rem" }}>
                        Released: {video.releasedAt}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
