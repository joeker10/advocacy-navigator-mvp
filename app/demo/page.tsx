"use client";
import React, { useState, useEffect, useRef } from "react";
import Navbar from "@/app/components/Navbar";

export default function DemoPage() {
  const [promptCount, setPromptCount] = useState(0);
  const [messages, setMessages] = useState<{ role: "user" | "model"; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load prompt count from local storage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("spednav_demo_prompts");
      const count = stored ? parseInt(stored, 10) : 0;
      setPromptCount(count);
      if (count >= 3) {
        setShowOverlay(true);
      }
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isLoading) return;

    if (promptCount >= 3) {
      setShowOverlay(true);
      return;
    }

    const currentQuery = chatInput.trim();
    setChatInput("");
    setMessages((prev) => [...prev, { role: "user", text: currentQuery }]);
    setIsLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: currentQuery,
          history: messages,
          context: null,
          rag_chunks: null
        })
      });

      const data = await res.json();
      
      const newCount = promptCount + 1;
      setPromptCount(newCount);
      localStorage.setItem("spednav_demo_prompts", newCount.toString());

      if (data.success) {
        setMessages((prev) => [...prev, { role: "model", text: data.response }]);
      } else {
        setMessages((prev) => [...prev, { role: "model", text: `Error: ${data.error}` }]);
      }

      if (newCount >= 3) {
        // Delay showing the overlay slightly so they can read the final response
        setTimeout(() => {
          setShowOverlay(true);
        }, 1000);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "model", text: "A network error occurred. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCoupon = () => {
    navigator.clipboard.writeText("NAVIGATE2026");
    alert("Coupon code NAVIGATE2026 copied to clipboard!");
  };

  const handleResetDemo = () => {
    if (confirm("Reset prompt limit for testing purposes?")) {
      localStorage.setItem("spednav_demo_prompts", "0");
      setPromptCount(0);
      setShowOverlay(false);
      setMessages([]);
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <div className="container" style={{ marginTop: "4rem", flex: 1, display: "flex", flexDirection: "column", paddingBottom: "4rem", maxWidth: "800px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--primary)" }}>Interactive Sandbox</h1>
            <p style={{ opacity: 0.8, marginTop: "0.25rem" }}>
              Test-drive the SpEd Advocate chatbot. Ask questions about Hawaii special education eligibility.
            </p>
          </div>
          <button 
            onClick={handleResetDemo}
            style={{
              background: "transparent",
              border: "1px dashed var(--glass-border)",
              color: "var(--foreground)",
              opacity: 0.5,
              fontSize: "0.85rem",
              padding: "4px 8px",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Reset Count
          </button>
        </div>

        {/* Dynamic Chat Wrapper Panel */}
        <div 
          className="glass-panel animate-slide-up"
          style={{ 
            flex: 1, 
            minHeight: "450px", 
            display: "flex", 
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
            marginTop: "1.5rem",
            padding: "2rem"
          }}
        >
          {/* Messages container */}
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem", paddingRight: "0.5rem" }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: "center", opacity: 0.5, marginTop: "4rem" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💬</div>
                <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>SpEd Advocate Active</p>
                <p style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
                  Try asking: &quot;What are eligibility requirements for autism under HAR Chapter 60?&quot;
                </p>
                <p style={{ fontSize: "0.8rem", color: "var(--primary)", marginTop: "1rem" }}>
                  Remaining free questions: {Math.max(0, 3 - promptCount)} of 3
                </p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div 
                  key={i} 
                  style={{ 
                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start", 
                    background: msg.role === "user" ? "var(--primary-glow)" : "var(--surface)", 
                    border: `1px solid ${msg.role === "user" ? "var(--primary)" : "var(--glass-border)"}`, 
                    padding: "1rem", 
                    borderRadius: "16px", 
                    maxWidth: "80%" 
                  }}
                >
                  <p style={{ 
                    fontWeight: 700, 
                    fontSize: "0.75rem", 
                    color: msg.role === "user" ? "var(--primary)" : "var(--secondary)", 
                    marginBottom: "0.25rem", 
                    textTransform: "uppercase" 
                  }}>
                    {msg.role === "user" ? "You" : "Advocate"}
                  </p>
                  <p style={{ fontSize: "0.95rem", whiteSpace: "pre-wrap" }}>{msg.text}</p>
                </div>
              ))
            )}
            {isLoading && (
              <div style={{ alignSelf: "flex-start", padding: "1rem", background: "var(--surface)", border: "1px solid var(--glass-border)", borderRadius: "16px" }}>
                <p style={{ fontSize: "0.95rem", animation: "pulse-glow 1.5s infinite" }}>Synthesizing Hawaii law...</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form input */}
          <form onSubmit={sendChatMessage} style={{ display: "flex", gap: "0.5rem" }}>
            <input 
              type="text" 
              value={chatInput} 
              onChange={(e) => setChatInput(e.target.value)} 
              disabled={showOverlay || isLoading}
              placeholder={showOverlay ? "Chat disabled" : "E.g., What is Prior Written Notice (PWN)?"}
              style={{ 
                flex: 1, 
                padding: "0.75rem 1.25rem", 
                borderRadius: "30px", 
                border: "1px solid var(--border)", 
                background: "var(--background)", 
                color: "var(--foreground)", 
                fontSize: "1rem", 
                outline: "none" 
              }}
            />
            <button 
              type="submit" 
              disabled={showOverlay || isLoading || !chatInput.trim()}
              style={{ 
                padding: "0 1.5rem", 
                borderRadius: "30px", 
                background: "var(--primary)", 
                color: "white", 
                fontWeight: 600, 
                border: "none", 
                cursor: (showOverlay || isLoading || !chatInput.trim()) ? "not-allowed" : "pointer", 
                opacity: (showOverlay || isLoading || !chatInput.trim()) ? 0.6 : 1, 
                boxShadow: "0 4px 12px var(--primary-glow)" 
              }}
            >
              Send
            </button>
          </form>

          {/* Locked Overlay */}
          {showOverlay && (
            <div 
              style={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                background: "rgba(10, 15, 30, 0.85)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "2rem",
                zIndex: 10
              }}
            >
              <div 
                style={{ 
                  width: "70px", height: "70px", borderRadius: "50%", 
                  background: "var(--primary-glow)", border: "2px solid var(--primary)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem",
                  marginBottom: "1.5rem", boxShadow: "0 0 20px var(--primary-glow)"
                }}
              >
                🔒
              </div>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.75rem" }}>
                Unlock Unlimited Access
              </h2>
              <p style={{ opacity: 0.8, fontSize: "0.95rem", maxWidth: "500px", lineHeight: 1.6, marginBottom: "2rem" }}>
                You have reached your 3-question free limit. Download our mobile app to gain unlimited document uploads, OCR scans, and chat support.
              </p>

              {/* Coupon Redeeming Incentive */}
              <div 
                style={{ 
                  background: "var(--surface)", 
                  border: "1px solid var(--glass-border)", 
                  padding: "1rem 2rem", 
                  borderRadius: "16px",
                  marginBottom: "2rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "1rem"
                }}
              >
                <div style={{ textAlign: "left" }}>
                  <span style={{ fontSize: "0.7rem", opacity: 0.5, display: "block", fontWeight: 700, textTransform: "uppercase" }}>Coupon Code</span>
                  <span style={{ fontFamily: "monospace", fontSize: "1.1rem", fontWeight: 700, color: "var(--success)" }}>NAVIGATE2026</span>
                </div>
                <button 
                  onClick={handleCopyCoupon}
                  style={{
                    background: "var(--primary)",
                    border: "none",
                    color: "white",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Copy
                </button>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <a 
                  href="/downloads" 
                  style={{ 
                    padding: "12px 28px", 
                    borderRadius: "30px", 
                    background: "var(--primary)", 
                    color: "white", 
                    fontWeight: 700, 
                    fontSize: "0.95rem",
                    boxShadow: "0 4px 12px var(--primary-glow)"
                  }}
                >
                  Download the App &rarr;
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
