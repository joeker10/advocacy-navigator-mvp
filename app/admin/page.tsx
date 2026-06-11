"use client";
import React, { useState, useRef } from "react";
import Navbar from "@/app/components/Navbar";

export default function AdminPage() {
  const [passcode, setPasscode] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<"post" | "resource">("post");
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  // Post Form State
  const [postTitle, setPostTitle] = useState("");
  const [postCategory, setPostCategory] = useState("Legal Framework");
  const [postExcerpt, setPostExcerpt] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postDate, setPostDate] = useState(() => {
    const d = new Date();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  });

  // Resource Form State
  const [resTitle, setResTitle] = useState("");
  const [resDescription, setResDescription] = useState("");
  const [resFileName, setResFileName] = useState("");
  const [resFileContent, setResFileContent] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "NAVIGATE_ADMIN") {
      setIsAuthorized(true);
      setStatus({ type: "success", message: "Passcode verified. Welcome, Administrator." });
      setTimeout(() => setStatus(null), 3000);
    } else {
      setStatus({ type: "error", message: "Invalid admin passcode. Access denied." });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Autofill filename
    const sanitizedName = file.name.replace(/\s+/g, "_");
    setResFileName(sanitizedName);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setResFileContent(text);
      setStatus({ type: "success", message: `Successfully loaded content from ${file.name}` });
      setTimeout(() => setStatus(null), 3000);
    };
    reader.onerror = () => {
      setStatus({ type: "error", message: "Failed to read file contents." });
    };
    reader.readAsText(file);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!postTitle || !postExcerpt || !postContent || !postDate) {
      setStatus({ type: "error", message: "Please fill in all required fields." });
      return;
    }

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": passcode,
        },
        body: JSON.stringify({
          title: postTitle,
          category: postCategory,
          excerpt: postExcerpt,
          content: postContent,
          date: postDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload post");
      }

      setStatus({ type: "success", message: "Educational article published successfully!" });
      // Clear inputs
      setPostTitle("");
      setPostExcerpt("");
      setPostContent("");
    } catch (err: any) {
      console.error(err);
      setStatus({ type: "error", message: err.message || "Something went wrong." });
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!resTitle || !resDescription || !resFileName || !resFileContent) {
      setStatus({ type: "error", message: "Please fill in all required fields." });
      return;
    }

    // Ensure extension
    let finalFileName = resFileName;
    if (!finalFileName.includes(".")) {
      finalFileName += ".txt";
    }

    try {
      const res = await fetch("/api/downloads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": passcode,
        },
        body: JSON.stringify({
          title: resTitle,
          description: resDescription,
          fileName: finalFileName,
          fileContent: resFileContent,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload resource");
      }

      setStatus({ type: "success", message: "Downloadable resource published successfully!" });
      // Clear inputs
      setResTitle("");
      setResDescription("");
      setResFileName("");
      setResFileContent("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      console.error(err);
      setStatus({ type: "error", message: err.message || "Something went wrong." });
    }
  };

  return (
    <main style={{ minHeight: "100vh" }}>
      <Navbar />

      <div className="container" style={{ marginTop: "4rem", paddingBottom: "6rem", maxWidth: "800px" }}>
        <h1 style={{ fontSize: "2.75rem", fontWeight: 800, marginBottom: "1rem", color: "var(--primary)" }}>
          Admin Portal
        </h1>
        <p style={{ fontSize: "1.1rem", opacity: 0.8, marginBottom: "3rem" }}>
          Publish educational resources and downloadable templates dynamically to the portal.
        </p>

        {status && (
          <div 
            className="animate-slide-up"
            style={{
              padding: "1rem 1.5rem",
              borderRadius: "12px",
              background: status.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
              border: `1px solid ${status.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
              color: status.type === "success" ? "#34d399" : "#f87171",
              fontWeight: 600,
              marginBottom: "2rem",
            }}
          >
            {status.message}
          </div>
        )}

        {!isAuthorized ? (
          /* Passcode Gate */
          <div className="glass-panel animate-slide-up" style={{ padding: "3rem 2rem", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1.5rem" }}>🔒</div>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "1rem" }}>Administrator Verification</h2>
            <p style={{ opacity: 0.7, marginBottom: "2rem", fontSize: "0.95rem" }}>
              Enter the administrator passcode to access the resource publisher panel.
            </p>
            
            <form onSubmit={handleVerifyPasscode} style={{ maxWidth: "360px", margin: "0 auto" }}>
              <input 
                type="password"
                placeholder="Enter passcode (e.g. NAVIGATE_ADMIN)"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 18px",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "var(--foreground)",
                  fontSize: "1rem",
                  textAlign: "center",
                  outlineColor: "var(--primary)",
                  marginBottom: "1rem"
                }}
              />
              <button 
                type="submit"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  background: "var(--primary)",
                  color: "white",
                  fontSize: "1rem",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px var(--primary-glow)"
                }}
              >
                Verify & Grant Access
              </button>
            </form>
          </div>
        ) : (
          /* Upload Interface */
          <div className="glass-panel animate-slide-up" style={{ padding: "2.5rem" }}>
            
            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--glass-border)", marginBottom: "2.5rem" }}>
              <button
                onClick={() => { setActiveTab("post"); setStatus(null); }}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "transparent",
                  border: "none",
                  borderBottom: activeTab === "post" ? "3px solid var(--primary)" : "3px solid transparent",
                  color: activeTab === "post" ? "var(--primary)" : "var(--foreground)",
                  fontWeight: 700,
                  fontSize: "1.05rem",
                  cursor: "pointer",
                  opacity: activeTab === "post" ? 1 : 0.6,
                  transition: "all 0.2s"
                }}
              >
                📝 Publish Article
              </button>
              <button
                onClick={() => { setActiveTab("resource"); setStatus(null); }}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "transparent",
                  border: "none",
                  borderBottom: activeTab === "resource" ? "3px solid var(--primary)" : "3px solid transparent",
                  color: activeTab === "resource" ? "var(--primary)" : "var(--foreground)",
                  fontWeight: 700,
                  fontSize: "1.05rem",
                  cursor: "pointer",
                  opacity: activeTab === "resource" ? 1 : 0.6,
                  transition: "all 0.2s"
                }}
              >
                📥 Publish Toolkit Resource
              </button>
            </div>

            {/* Tab Panels */}
            {activeTab === "post" ? (
              /* Post Form */
              <form onSubmit={handleCreatePost}>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label htmlFor="post-title" style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", opacity: 0.8 }}>
                    Article Title *
                  </label>
                  <input 
                    id="post-title"
                    type="text" 
                    placeholder="e.g. Special Ed Evaluations: The IEP Timetable"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid var(--glass-border)",
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "white",
                      fontSize: "0.95rem"
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                  <div>
                    <label htmlFor="post-category" style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", opacity: 0.8 }}>
                      Category *
                    </label>
                    <select
                      id="post-category"
                      value={postCategory}
                      onChange={(e) => setPostCategory(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid var(--glass-border)",
                        background: "rgba(15, 23, 42, 0.95)",
                        color: "white",
                        fontSize: "0.95rem"
                      }}
                    >
                      <option value="Legal Framework">Legal Framework</option>
                      <option value="Advocacy Guide">Advocacy Guide</option>
                      <option value="Procedural Rights">Procedural Rights</option>
                      <option value="General Reference">General Reference</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="post-date" style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", opacity: 0.8 }}>
                      Publish Date *
                    </label>
                    <input 
                      id="post-date"
                      type="text" 
                      value={postDate}
                      onChange={(e) => setPostDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid var(--glass-border)",
                        background: "rgba(255, 255, 255, 0.05)",
                        color: "white",
                        fontSize: "0.95rem"
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label htmlFor="post-excerpt" style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", opacity: 0.8 }}>
                    Summary / Excerpt * (Brief overview shown on cards)
                  </label>
                  <input 
                    id="post-excerpt"
                    type="text" 
                    placeholder="Provide a concise one-sentence description..."
                    value={postExcerpt}
                    onChange={(e) => setPostExcerpt(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid var(--glass-border)",
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "white",
                      fontSize: "0.95rem"
                    }}
                  />
                </div>

                <div style={{ marginBottom: "2rem" }}>
                  <label htmlFor="post-content" style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", opacity: 0.8 }}>
                    Article Content *
                  </label>
                  <textarea 
                    id="post-content"
                    rows={10}
                    placeholder="Write or paste your article details here..."
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid var(--glass-border)",
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "white",
                      fontSize: "0.95rem",
                      fontFamily: "inherit",
                      lineHeight: 1.6
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "8px",
                    background: "var(--primary)",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "1rem",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px var(--primary-glow)"
                  }}
                >
                  Publish Article
                </button>
              </form>
            ) : (
              /* Resource Form */
              <form onSubmit={handleCreateResource}>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label htmlFor="res-title" style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", opacity: 0.8 }}>
                    Resource Title *
                  </label>
                  <input 
                    id="res-title"
                    type="text" 
                    placeholder="e.g. Section 504 Accommodation Matrix Template"
                    value={resTitle}
                    onChange={(e) => setResTitle(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid var(--glass-border)",
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "white",
                      fontSize: "0.95rem"
                    }}
                  />
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label htmlFor="res-desc" style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", opacity: 0.8 }}>
                    Description * (Summarizes what this resource helps with)
                  </label>
                  <input 
                    id="res-desc"
                    type="text" 
                    placeholder="e.g. Documenting physical accommodations during exams and tests."
                    value={resDescription}
                    onChange={(e) => setResDescription(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid var(--glass-border)",
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "white",
                      fontSize: "0.95rem"
                    }}
                  />
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label htmlFor="res-file-name" style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", opacity: 0.8 }}>
                    Download File Name * (Must end in `.txt` or `.md`)
                  </label>
                  <input 
                    id="res-file-name"
                    type="text" 
                    placeholder="e.g. IEP_Evaluation_Request_Template.txt"
                    value={resFileName}
                    onChange={(e) => setResFileName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid var(--glass-border)",
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "white",
                      fontSize: "0.95rem"
                    }}
                  />
                </div>

                {/* File Upload Parser */}
                <div style={{ marginBottom: "1.5rem", padding: "1.5rem", border: "2px dashed var(--glass-border)", borderRadius: "8px", background: "rgba(255,255,255,0.02)" }}>
                  <label htmlFor="res-file-upload" style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", opacity: 0.8 }}>
                    Quick Upload: Parse from local Text/Markdown file
                  </label>
                  <input 
                    id="res-file-upload"
                    type="file" 
                    accept=".txt,.md,.markdown"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--foreground)",
                      opacity: 0.8
                    }}
                  />
                  <p style={{ fontSize: "0.75rem", opacity: 0.5, marginTop: "0.5rem", marginBottom: 0 }}>
                    Select a local text/markdown file to auto-populate file name and content.
                  </p>
                </div>

                <div style={{ marginBottom: "2rem" }}>
                  <label htmlFor="res-file-content" style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", opacity: 0.8 }}>
                    Template Content *
                  </label>
                  <textarea 
                    id="res-file-content"
                    rows={10}
                    placeholder="Write or paste the downloadable guide/checklist/template here..."
                    value={resFileContent}
                    onChange={(e) => setResFileContent(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid var(--glass-border)",
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "white",
                      fontSize: "0.95rem",
                      fontFamily: "monospace",
                      lineHeight: 1.5
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "8px",
                    background: "var(--primary)",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "1rem",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px var(--primary-glow)"
                  }}
                >
                  Publish Toolkit Resource
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
