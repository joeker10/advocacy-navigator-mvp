"use client";
import { useState, useCallback, useEffect } from "react";
import { getUIPreference, setUIPreference } from "@/lib/storage";
import { cacheVerifiedDocument } from "@/lib/indexeddb";

export default function Home() {
  const [isDragActive, setIsDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    setHighContrast(getUIPreference("highContrast", false));
  }, []);

  const toggleContrast = () => {
    const newVal = !highContrast;
    setHighContrast(newVal);
    setUIPreference("highContrast", newVal);
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
        setIsUploading(true);
        
        try {
          const formData = new FormData();
          formData.append('file', droppedFile);

          const res = await fetch('/api/extract', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          if (data.success) {
            await cacheVerifiedDocument({
              id: data.documentId,
              fileName: data.fileName,
              extractedData: data.extractedData
            });
            setIsVerified(true);
          } else {
            alert('Analysis failed: ' + (data.error || 'Unknown error'));
          }
        } catch (err) {
          console.error(err);
          alert('Upload failed due to network error.');
        } finally {
          setIsUploading(false);
        }
      } else {
        alert("Please upload a valid PDF document to adhere to the Zero Trust architecture.");
      }
    }
  }, []);

  return (
    <main className={`container ${highContrast ? 'high-contrast' : ''}`} style={{ padding: "4rem 2rem", minHeight: "100vh" }}>
      <header style={{ marginBottom: "3rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--primary)" }}>IEP Upload & Analyze</h1>
          <p style={{ color: "var(--foreground)", opacity: 0.8, marginTop: "0.5rem" }}>
            Verified Document-First Architecture. Strict FERPA & HIPAA Compliance.
          </p>
        </div>
        <button 
          onClick={toggleContrast}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--foreground)",
            cursor: "pointer",
            fontWeight: 500,
            transition: "all var(--transition-normal)"
          }}
        >
          {highContrast ? "Normal View" : "High Contrast"}
        </button>
      </header>

      <div 
        className="glass-panel"
        style={{
          padding: "4rem",
          textAlign: "center",
          border: isDragActive ? "2px dashed var(--primary)" : "2px dashed var(--border)",
          backgroundColor: isDragActive ? "var(--primary-light)" : "var(--glass-bg)",
          transition: "all var(--transition-normal)",
          cursor: "pointer",
          position: "relative"
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {!file ? (
          <div>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📄</div>
            <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", fontWeight: 600 }}>
              Drag & Drop your IEP PDF here
            </h3>
            <p style={{ opacity: 0.7, maxWidth: "400px", margin: "0 auto" }}>
              Secure, Zero-Trust Multi-step OCR & NLP Analysis Pipeline linked directly to the immutable source document.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem", animation: isUploading ? "pulse 1.5s infinite" : "none" }}>
              {isUploading ? "⏳" : "✅"}
            </div>
            <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", fontWeight: 600 }}>
              {isUploading ? "Verifying & Analyzing Document..." : "Document Verified and Extracted"}
            </h3>
            <p style={{ color: isVerified ? "var(--success)" : "inherit", fontWeight: 500 }}>
              {file.name}
            </p>
            {isVerified && (
              <div style={{ marginTop: "2rem", display: "inline-block", textAlign: "left", background: "var(--surface)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--success)", boxShadow: "var(--shadow-md)" }}>
                <h4 style={{ color: "var(--success)", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.1rem" }}>
                  <span style={{ display: "inline-block", width: "10px", height: "10px", background: "var(--success)", borderRadius: "50%", boxShadow: "0 0 8px var(--success)" }}></span>
                  Golden Source of Truth Maintained
                </h4>
                <ul style={{ marginTop: "1rem", fontSize: "0.95rem", listStyle: "inside", opacity: 0.9 }}>
                  <li style={{ marginBottom: "0.5rem" }}>Semantic Fields Mapped (HAR Chapter 60)</li>
                  <li style={{ marginBottom: "0.5rem" }}>Data persists to secure database</li>
                  <li>Linked to immutable source PDF</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <footer style={{ marginTop: "4rem", textAlign: "center", opacity: 0.6, fontSize: "0.875rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <p>Complete Mediation · Immutable Infrastructure · Least Privilege</p>
        <div>
          <a href="/help" style={{ color: "var(--primary)", textDecoration: "underline", fontWeight: 600, fontSize: "1rem" }}>View Resource Directory (Help) &rarr;</a>
        </div>
      </footer>
    </main>
  );
}
