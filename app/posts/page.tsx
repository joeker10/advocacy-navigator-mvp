"use client";
import React, { useState } from "react";
import Navbar from "@/app/components/Navbar";

interface Article {
  id: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  content: string;
}

const ARTICLES: Article[] = [
  {
    id: "1",
    title: "Hawaii IEP Timelines: Enforcing HAR Chapter 60",
    category: "Legal Framework",
    date: "June 2026",
    excerpt: "Under Hawaii administrative rules, the Department of Education has strict timeline mandates for evaluations and IEP reviews. Learn how to identify and flag delays.",
    content: `Under Hawaii Administrative Rules (HAR) Chapter 60, parents have explicit procedural protections. 

Key Timelines to Monitor:
1. **Initial Evaluation Timeline:** Once you provide written consent for evaluation, the school has exactly 60 calendar days to complete all assessments and hold the eligibility determination meeting.
2. **Reevaluations:** Must occur at least once every three years, unless the parent and the school agree it is unnecessary. It cannot occur more than once a year unless agreed.
3. **IEP Development:** Once eligibility is established, the team must meet to formulate the IEP within 30 calendar days.
4. **IEP Annual Review:** The IEP must be reviewed and updated at least once every 12 months.

If a school fails to meet these dates, it constitutes a procedural violation of the Individuals with Disabilities Education Act (IDEA) and HAR Chapter 60. Keep a detailed log of all written request submissions to document compliance timelines.`
  },
  {
    id: "2",
    title: "SMART IEP Goals: A Parent's Practical Guide",
    category: "Advocacy Guide",
    date: "May 2026",
    excerpt: "Make sure your child's annual IEP goals are Specific, Measurable, Achievable, Relevant, and Time-Bound. Use these checklist markers in your review.",
    content: `Ensure your child's educational targets are clear and enforceable. Avoid ambiguous phrasing like 'will improve reading skills.'

Use the SMART Framework:
*   **Specific:** Name the exact skill area (e.g., 'decoding multi-syllabic words' rather than 'reading').
*   **Measurable:** Establish how progress is evaluated (e.g., 'with 80% accuracy in 4 out of 5 trials').
*   **Achievable:** The goal must challenge the student but remain realistic given their present levels of performance (PLEP).
*   **Relevant:** Directly address needs identified in evaluation reports.
*   **Time-bound:** State the date by which the goal will be met (typically 1 year).

*Example Goal:* 'By June 2027, when given a grade-level list of 20 multi-syllabic words, the student will decode them with 85% accuracy in 3 consecutive weekly probes as measured by teacher-kept records.'`
  },
  {
    id: "3",
    title: "Recording Meetings in Hawaii: Consent Regulations",
    category: "Procedural Rights",
    date: "April 2026",
    excerpt: "Hawaii operates under a 'one-party consent' rule for recording. Learn the best practices for recording your next IEP or 504 meeting to keep clean records.",
    content: `In Hawaii, under state wiretapping laws, recording audio is permissible if at least one party consents. Since you, the parent, consent to the recording, you have a legal right to record.

However, from an advocacy standpoint, best practices recommend:
1.  **Written Notification:** Inform the school team in writing 24-48 hours before the meeting that you intend to audio-record. This keeps relationships constructive.
2.  **Reciprocity:** If you record, the school will likely set up their own recording device. This ensures both parties have access to identical audio logs.
3.  **Meeting Minutes Integration:** Transcripts or recordings do not replace the official meeting notes. Use your recordings to verify that all verbal accommodations and service minutes agreed to are accurately reflected in the final written IEP document before signing.`
  }
];

export default function PostsPage() {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

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

        {/* Article Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
          {ARTICLES.map((article) => (
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
