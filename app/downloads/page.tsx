"use client";
import React from "react";
import Navbar from "@/app/components/Navbar";

export default function DownloadsPage() {
  const handleDownloadTemplate = (fileName: string) => {
    // Generate text/markdown or basic template mock contents and download
    let content = "";
    if (fileName === "IEP_Evaluation_Request_Template.txt") {
      content = `To: [Principal Name]
School: [School Name]
Address: [School Address]

RE: Written Request for Special Education Evaluation / Section 54 eligibility
Student Name: [Child Name]
Date of Birth: [DOB]
Grade: [Grade]

Dear Principal,

I am writing to formally request a comprehensive educational evaluation for my child, [Child Name], to determine eligibility for special education services and related services under the Individuals with Disabilities Education Act (IDEA) and Hawaii Administrative Rules (HAR) Chapter 60.

I am requesting this evaluation because:
[List observations here, e.g. struggles with reading fluency, fine motor difficulties, speech delay, behavioral struggles]

I understand that under HAR Chapter 60, the Department of Education has exactly 60 calendar days from the date they receive my signed written consent to complete all evaluations and convene the eligibility determination meeting.

Please provide the Consent for Evaluation forms as soon as possible so we may proceed.

Sincerely,

_________________________________________
[Parent/Guardian Name]
Date: [Current Date]
Email: [Your Email]
Phone: [Your Phone]`;
    } else if (fileName === "IEP_Meeting_Checklist.txt") {
      content = `THE SPECIAL EDUCATION NAVIGATOR: IEP MEETING CHECKLIST
For Hawaii Parents (HAR Chapter 60 Compliant)

Before the Meeting:
[ ] Request all draft evaluation reports and draft IEP documents at least 3 days prior.
[ ] Identify your child's core strengths, needs, and areas of concern.
[ ] Formulate a list of requested accommodations and related services.
[ ] If audio-recording the meeting, notify the principal/administration in writing 24 hours in advance.

During the Meeting:
[ ] Ensure the PLEP (Present Levels of Educational Performance) contains objective baseline data.
[ ] Verify that every need identified in the evaluations has a matching annual goal.
[ ] Check that accommodations are Specific (e.g. "frequent breaks every 20 minutes" rather than "as needed").
[ ] Review the Related Services matrix: Verify therapist session duration, frequency, and location (General vs Special Ed).
[ ] Ask the coordinator to document any rejected accommodations in the PWN (Prior Written Notice).

After the Meeting:
[ ] Review the official meeting notes for accuracy.
[ ] Review the draft IEP document before signing consent.
[ ] Keep a copy of the final, signed IEP in your physical records vault.`;
    } else {
      content = `Hawaii Administrative Rules (HAR) Chapter 60 Reference Sheet
For Parents and Advocates

1. Zero-Reject Policy: Every child with a disability in the State of Hawaii is entitled to a free appropriate public education (FAPE).
2. Evaluation (HAR §8-60-36): Complete evaluations must occur within 60 days of written parent consent.
3. Parental Participation (HAR §8-60-45): Parents are equal partners in the IEP team. Meetings must be scheduled at mutually agreeable times.
4. Prior Written Notice (HAR §8-60-58): The school must give written explanation whenever they propose OR refuse to change the identification, evaluation, or educational placement of your child.`;
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main style={{ minHeight: "100vh" }}>
      <Navbar />

      <div className="container" style={{ marginTop: "4rem", paddingBottom: "6rem" }}>
        
        {/* App Download Call to Action */}
        <section className="glass-panel animate-slide-up" style={{ padding: "4rem 2rem", textAlign: "center", marginBottom: "4rem" }}>
          <h1 style={{ fontSize: "2.75rem", fontWeight: 800, marginBottom: "1rem" }}>
            The Special Education Navigator App
          </h1>
          <p style={{ fontSize: "1.2rem", opacity: 0.8, maxWidth: "600px", margin: "0 auto 3rem auto", lineHeight: 1.6 }}>
            Access the full document staging vault, record audio transcriptions, and run local semantic search on your Android or iOS device.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1.5rem" }}>
            <a 
              href="https://play.google.com/store" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                background: "#000",
                color: "#fff",
                padding: "14px 28px",
                borderRadius: "16px",
                fontWeight: 700,
                fontSize: "1.05rem",
                textDecoration: "none",
                boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.15)",
                transition: "transform 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <span style={{ fontSize: "1.75rem" }}>🤖</span>
              <div style={{ textAlign: "left" }}>
                <span style={{ fontSize: "0.75rem", display: "block", opacity: 0.6, fontWeight: 500 }}>GET IT ON</span>
                <span style={{ display: "block" }}>Google Play</span>
              </div>
            </a>

            <a 
              href="https://www.apple.com/app-store" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                background: "#000",
                color: "#fff",
                padding: "14px 28px",
                borderRadius: "16px",
                fontWeight: 700,
                fontSize: "1.05rem",
                textDecoration: "none",
                boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.15)",
                transition: "transform 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <span style={{ fontSize: "1.75rem" }}>🍏</span>
              <div style={{ textAlign: "left" }}>
                <span style={{ fontSize: "0.75rem", display: "block", opacity: 0.6, fontWeight: 500 }}>DOWNLOAD ON THE</span>
                <span style={{ display: "block" }}>App Store</span>
              </div>
            </a>
          </div>
        </section>

        {/* PDF Toolkit Section */}
        <section className="animate-slide-up animate-delay-1">
          <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "1rem", color: "var(--primary)" }}>
            Advocate Toolkit
          </h2>
          <p style={{ opacity: 0.8, marginBottom: "2.5rem", maxWidth: "600px" }}>
            Download ready-to-use text files and templates to formally document correspondence with school coordinators and principals.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
            <div className="glass-panel" style={{ padding: "2rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>✉️</div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>Evaluation Request Template</h3>
                <p style={{ opacity: 0.7, fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
                  A formal letter to request a comprehensive educational and psychological assessment under HAR Chapter 60.
                </p>
              </div>
              <button 
                onClick={() => handleDownloadTemplate("IEP_Evaluation_Request_Template.txt")}
                style={{
                  padding: "10px 18px",
                  borderRadius: "12px",
                  background: "var(--primary-glow)",
                  border: "1px solid var(--primary)",
                  color: "var(--primary)",
                  fontWeight: 600,
                  cursor: "pointer",
                  width: "100%"
                }}
              >
                Download Template
              </button>
            </div>

            <div className="glass-panel" style={{ padding: "2rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📋</div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>IEP Meeting Checklist</h3>
                <p style={{ opacity: 0.7, fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
                  Step-by-step checklist guide covering what to prepare before, verify during, and check after the meeting.
                </p>
              </div>
              <button 
                onClick={() => handleDownloadTemplate("IEP_Meeting_Checklist.txt")}
                style={{
                  padding: "10px 18px",
                  borderRadius: "12px",
                  background: "var(--primary-glow)",
                  border: "1px solid var(--primary)",
                  color: "var(--primary)",
                  fontWeight: 600,
                  cursor: "pointer",
                  width: "100%"
                }}
              >
                Download Checklist
              </button>
            </div>

            <div className="glass-panel" style={{ padding: "2rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📖</div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>HAR Chapter 60 Cheat Sheet</h3>
                <p style={{ opacity: 0.7, fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
                  Quick reference matrix outlining parent participation rights, zero-reject mandates, and procedural notices.
                </p>
              </div>
              <button 
                onClick={() => handleDownloadTemplate("HAR_Chapter_60_Cheat_Sheet.txt")}
                style={{
                  padding: "10px 18px",
                  borderRadius: "12px",
                  background: "var(--primary-glow)",
                  border: "1px solid var(--primary)",
                  color: "var(--primary)",
                  fontWeight: 600,
                  cursor: "pointer",
                  width: "100%"
                }}
              >
                Download Reference
              </button>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
