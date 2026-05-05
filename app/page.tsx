"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { getUIPreference, setUIPreference } from "@/lib/storage";
import { cacheVerifiedDocument, saveInsight, saveDocumentEmbedding, getDocumentEmbeddings, cosineSimilarity } from "@/lib/indexeddb";

export default function Home() {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedDocuments, setExtractedDocuments] = useState<any[]>([]);
  const [darkMode, setDarkMode] = useState(false);

  // Chat Interface State
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Media Capture State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatLoading]);

  useEffect(() => {
    // Determine system theme preference or strict local configuration
    const isDark = getUIPreference("darkMode", window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    setUIPreference("darkMode", newVal);
    // Force explicit CSS override via data attribute
    document.documentElement.style.colorScheme = newVal ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newVal ? 'dark' : 'light');
  };

  const sendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMsg = chatInput.trim();
    setChatInput("");
    setMessages(prev => [...prev, {role: 'user', text: userMsg}]);
    setIsChatLoading(true);

    try {
      // 1. Generate 768-D embedding for the user's query
      const embedRes = await fetch('/api/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userMsg })
      });
      const embedData = await embedRes.json();
      
      let ragChunks: string[] = [];
      if (embedData.success && embedData.vector) {
        // 2. Perform local client-side Vector Similarity Search against IndexedDB
        const allEmbeddings = await getDocumentEmbeddings();
        const scoredChunks = allEmbeddings.map(docEmb => ({
          chunk: docEmb.text_chunk,
          score: cosineSimilarity(embedData.vector, docEmb.vector)
        }));
        
        // 3. Filter by semantic threshold and take top K chunks
        ragChunks = scoredChunks
          .filter(c => c.score > 0.5) // Minimum confidence gating
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map(c => c.chunk);
      }

      // 4. Send aggregated multimodal evidence set to the synthesizer
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMsg,
          history: messages,
          context: extractedDocuments.length > 0 ? extractedDocuments : null, // Legacy Golden Truth array
          rag_chunks: ragChunks // Newly retrieved precise Multimodal evidence
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, {role: 'model', text: data.response}]);
      } else {
        setMessages(prev => [...prev, {role: 'model', text: `Error: ${data.error}` }]);
      }
    } catch(err) {
      console.error(err);
      setMessages(prev => [...prev, {role: 'model', text: "A network error occurred connecting to the Advocate."}]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSaveInsight = async (query: string, response: string) => {
    try {
      await saveInsight(query, response);
      alert("Insight saved securely to your offline vault!");
    } catch (e) {
      alert("Failed to save insight offline.");
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  // Client-side image compression to bypass Next.js 4MB / Vercel 4.5MB payload limits
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        // Target max dimension for OCR while staying under 2-3MB
        const MAX_DIMENSION = 2048;
        let width = img.width;
        let height = img.height;
        
        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file); // fallback
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with 0.8 quality
        canvas.toBlob((blob) => {
          if (!blob) return resolve(file);
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        }, 'image/jpeg', 0.8);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file); // fallback to original on error
      };
      
      img.src = url;
    });
  };

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setIsUploading(true);
    
    const newlyExtracted: any[] = [];
    for (const droppedFile of files) {
      try {
        let processedFile = droppedFile;
        // Compress high-res camera photos to prevent 413 Payload Too Large network errors
        if (droppedFile.type.startsWith('image/')) {
          processedFile = await compressImage(droppedFile);
        }

        const formData = new FormData();
        formData.append('file', processedFile);

        const res = await fetch('/api/extract', {
          method: 'POST',
          body: formData,
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        if (data.success) {
          await cacheVerifiedDocument({
            id: data.documentId,
            fileName: data.fileName,
            extractedData: data.extractedData
          });
          if (data.vector && data.vector.length > 0) {
            await saveDocumentEmbedding(data.documentId, data.vector, data.text_chunk, 1);
          }
          newlyExtracted.push({ fileName: data.fileName, ...data.extractedData });
        } else {
          alert(`Analysis failed for ${droppedFile.name}: ` + (data.error || 'Unknown error'));
        }
      } catch (err) {
        console.error(err);
        alert(`Upload failed for ${droppedFile.name} due to network error.`);
      }
    }
    
    setExtractedDocuments(prev => [...prev, ...newlyExtracted]);
    setIsUploading(false);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    }
  }, []);

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `IEP_Meeting_Recording_${new Date().toISOString()}.webm`, { type: 'audio/webm' });
        handleFiles([audioFile]);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start audio recording", err);
      alert("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <main style={{ minHeight: "100vh", position: "relative", zIndex: 1, paddingBottom: "4rem" }}>
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
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.01em" }}>The Special Education Navigator</h1>
          </div>
          <div style={{ display: "flex", gap: "16px" }}>
            <a href="/saved" style={{
              padding: "8px 16px", borderRadius: "20px", display: "flex", gap: "8px", alignItems: "center",
              background: "var(--primary-glow)", border: "1px solid var(--primary)", color: "var(--primary)",
              cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", textDecoration: "none",
              boxShadow: "var(--shadow-sm)"
            }}>⭐ Saved Insights</a>
            <button 
              onClick={toggleTheme}
              style={{
                padding: "8px 16px", borderRadius: "20px", display: "flex", gap: "8px", alignItems: "center",
                background: "var(--surface)", border: "1px solid var(--glass-border)", color: "var(--foreground)",
                cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", transition: "all var(--transition-normal)",
                boxShadow: "var(--shadow-sm)"
              }}
            >
              {darkMode ? "☀️ Light" : "🌙 Dark"}
            </button>
          </div>
        </div>
      </nav>

      <div className="container" style={{ marginTop: "4rem" }}>
        
        {/* Dynamic Hero Section */}
        <section style={{ textAlign: "center", marginBottom: "4rem", maxWidth: "800px", margin: "0 auto 4rem auto" }} className="animate-slide-up">
          <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "center" }}>
            <img 
              src="/navigator-logo.jpg" 
              alt="The Special Education Navigator" 
              style={{ 
                width: "180px", 
                height: "180px", 
                objectFit: "cover",
                borderRadius: "50%", 
                boxShadow: "0 0 30px var(--primary-glow)",
                border: "2px solid var(--glass-border)"
              }} 
            />
          </div>
          <h2 style={{ fontSize: "3.5rem", fontWeight: 800, lineHeight: 1.1, marginBottom: "1.5rem", background: "linear-gradient(135deg, var(--foreground), var(--primary))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Seamless IEP Extraction. <br/> Absolute Data Privacy.
          </h2>
          <p style={{ fontSize: "1.2rem", color: "var(--foreground)", opacity: 0.7, maxWidth: "600px", margin: "0 auto" }}>
            Simply drop the student's legal documents. We extract HAR Chapter 60 compliance mappings statelessly using edge AI, locking the results exclusively into your physical device.
          </p>
        </section>

        {/* Core Workspace Area */}
        <div style={{ display: "grid", gridTemplateColumns: extractedDocuments.length > 0 ? "1fr 1fr" : "1fr", gap: "2rem", transition: "all var(--transition-normal)" }}>
          
          {/* Input Controls Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Animated Glass Dropzone */}
            <div 
              className="glass-panel"
            style={{
              padding: "4rem 2rem", textAlign: "center",
              border: isDragActive ? "2px solid var(--primary)" : "1px solid var(--glass-border)",
              boxShadow: isDragActive ? "0 0 40px var(--primary-glow)" : "var(--shadow-md)",
              animation: isDragActive ? "pulse-glow 2s infinite" : "none",
              transition: "all var(--transition-normal)", cursor: "pointer", position: "relative",
              overflow: "hidden"
            }}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            {/* Visual Indicator Background */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              background: "linear-gradient(45deg, transparent, var(--primary-glow), transparent)",
              opacity: isUploading ? 0.5 : 0, transition: "opacity 0.5s ease",
              animation: isUploading ? "slide-up 2s infinite alternate" : "none", pointerEvents: "none"
            }}/>

            {!isUploading && extractedDocuments.length === 0 ? (
              <div className="animate-slide-up">
                <div style={{ 
                  width: "80px", height: "80px", margin: "0 auto 1.5rem auto", borderRadius: "50%",
                  background: "hsla(220, 20%, 50%, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem"
                }}>
                  📄
                </div>
                <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", fontWeight: 700 }}>
                  Drag & Drop Document(s)
                </h3>
                <p style={{ opacity: 0.6, fontSize: "0.95rem" }}>
                  Upload multiple PDFs (IEPs, Assessments) to cross-reference Context.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 10 }}>
                <div style={{ 
                  width: "80px", height: "80px", margin: "0 auto 1.5rem auto", borderRadius: "50%",
                  background: extractedDocuments.length > 0 && !isUploading ? "var(--success-glow)" : "var(--primary-glow)",
                  border: extractedDocuments.length > 0 && !isUploading ? "2px solid var(--success)" : "2px solid var(--primary)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem",
                  boxShadow: extractedDocuments.length > 0 && !isUploading ? "0 0 20px var(--success-glow)" : "var(--shadow-glow)"
                }}>
                  {isUploading ? "⚙️" : "✅"}
                </div>
                <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", fontWeight: 700 }}>
                  {isUploading ? "Securely Tunneling to Gemini..." : "Multi-Document Context Active"}
                </h3>
                {extractedDocuments.length > 0 && (
                  <p style={{ color: "var(--success)", fontWeight: 600, fontSize: "1rem", marginTop: "1rem" }}>
                    {extractedDocuments.length} Document(s) Secured Offline
                  </p>
                )}
                {extractedDocuments.length > 0 && !isUploading && (
                  <p style={{ opacity: 0.7, fontSize: "0.85rem", marginTop: "1rem" }}>
                    Drop more files to add to current Context.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Media Capture Controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                ref={cameraInputRef} 
                style={{ display: "none" }} 
                onChange={handleCameraCapture} 
              />
              <button 
                onClick={() => cameraInputRef.current?.click()}
                disabled={isUploading}
                style={{
                  flex: 1, padding: "1rem", borderRadius: "16px",
                  background: "var(--surface)", border: "1px solid var(--border)",
                  color: "var(--foreground)", fontSize: "1rem", fontWeight: 600,
                  cursor: isUploading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  transition: "all 0.2s"
                }}
              >
                📸 Take Photo (OCR)
              </button>

              <button 
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isUploading && !isRecording}
                style={{
                  flex: 1, padding: "1rem", borderRadius: "16px",
                  background: isRecording ? "hsl(0, 80%, 50%)" : "var(--surface)", 
                  border: isRecording ? "none" : "1px solid var(--border)",
                  color: isRecording ? "white" : "var(--foreground)", 
                  fontSize: "1rem", fontWeight: 600,
                  cursor: isUploading && !isRecording ? "not-allowed" : "pointer", 
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  animation: isRecording ? "pulse-glow 1.5s infinite" : "none",
                  boxShadow: isRecording ? "0 0 20px hsla(0, 80%, 50%, 0.5)" : "none",
                  transition: "all 0.2s"
                }}
              >
                {isRecording ? "⏹ Stop Recording" : "🎙️ Record Meeting"}
              </button>
            </div>
            
            <div style={{ padding: "1rem", borderRadius: "12px", background: "hsla(0, 0%, 50%, 0.1)", border: "1px solid var(--border)" }}>
              <p style={{ fontSize: "0.8rem", opacity: 0.8, display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.2rem" }}>⚠️</span>
                <span><strong>Legal Note:</strong> While Hawaii is a one-party consent state, best advocacy practices strongly recommend formally informing the school administration prior to recording any IEP or 504 meeting.</span>
              </p>
            </div>
          </div>
          </div>

          {/* Staggered Results Stack */}
          {extractedDocuments.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxHeight: "800px", overflowY: "auto", paddingRight: "1rem" }}>
              {extractedDocuments.map((doc, idx) => (
                <div key={idx} className="glass-panel animate-slide-up" style={{ padding: "0" }}>
                  <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--glass-border)", background: "hsla(150, 70%, 40%, 0.05)" }}>
                    <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.1rem", fontWeight: 700, color: "var(--success)" }}>
                      <span style={{ display: "inline-block", width: "10px", height: "10px", background: "var(--success)", borderRadius: "50%", boxShadow: "0 0 10px var(--success)" }}></span>
                      {doc.fileName || "Golden Truth Mapped"}
                    </h3>
                  </div>
                  
                  <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {doc.assessmentName && doc.assessmentName !== "Unknown" && (
                      <div className="animate-slide-up animate-delay-1" style={{ padding: "1rem", borderRadius: "12px", background: "var(--background)", border: "1px solid var(--border)" }}>
                        <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--primary)", marginBottom: "0.25rem", fontWeight: 700 }}>Assessment Overview</h4>
                        <p style={{ fontSize: "0.85rem", fontWeight: 500 }}><strong>Name:</strong> {doc.assessmentName} | <strong>Version:</strong> {doc.assessmentVersion}</p>
                      </div>
                    )}

                    {doc.behavioralInfo && doc.behavioralInfo !== "Error decoding" && (
                      <div className="animate-slide-up animate-delay-2" style={{ padding: "1rem", borderRadius: "12px", background: "var(--background)", border: "1px solid var(--border)" }}>
                        <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--secondary)", marginBottom: "0.25rem", fontWeight: 700 }}>Behavioral Info</h4>
                        <p style={{ fontSize: "0.85rem", fontWeight: 500 }}>{doc.behavioralInfo}</p>
                      </div>
                    )}

                    <div className="animate-slide-up animate-delay-3" style={{ padding: "1rem", borderRadius: "12px", background: "var(--background)", border: "1px solid var(--border)" }}>
                      <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--primary)", marginBottom: "0.25rem", fontWeight: 700 }}>Identified Strengths</h4>
                      <p style={{ fontSize: "0.85rem", fontWeight: 500 }}>{doc.strengths}</p>
                    </div>
                    
                    <div className="animate-slide-up animate-delay-4" style={{ padding: "1rem", borderRadius: "12px", background: "var(--background)", border: "1px solid var(--border)" }}>
                      <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--secondary)", marginBottom: "0.25rem", fontWeight: 700 }}>Core Needs & Deficits</h4>
                      <p style={{ fontSize: "0.85rem", fontWeight: 500 }}>{doc.needs}</p>
                    </div>

                    <div className="animate-slide-up animate-delay-5" style={{ padding: "1rem", borderRadius: "12px", background: "var(--background)", border: "1px solid var(--border)" }}>
                      <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--warning)", marginBottom: "0.25rem", fontWeight: 700 }}>Key Takeaways</h4>
                      <p style={{ fontSize: "0.85rem", fontWeight: 500 }}>{doc.takeaways}</p>
                    </div>

                    <div className="animate-slide-up animate-delay-6" style={{ padding: "1rem", borderRadius: "12px", background: "var(--background)", border: "1px solid var(--border)" }}>
                      <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--success)", marginBottom: "0.25rem", fontWeight: 700 }}>Accommodations</h4>
                      <p style={{ fontSize: "0.85rem", fontWeight: 500 }}>{doc.accommodations}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Interactive Advocate Chat Panel */}
        <section className="glass-panel animate-slide-up animate-delay-2" style={{ marginTop: "4rem", padding: "2rem", display: "flex", flexDirection: "column", minHeight: "400px" }}>
          <div style={{ paddingBottom: "1.5rem", borderBottom: "1px solid var(--glass-border)", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--primary)" }}>Ask an Advocate</h3>
            {extractedDocuments.length > 0 ? (
              <span style={{ fontSize: "0.85rem", padding: "4px 12px", background: "var(--success-glow)", border: "1px solid var(--success)", color: "var(--success)", borderRadius: "20px", fontWeight: 600 }}>Multi-Doc Context Mode</span>
            ) : (
              <span style={{ fontSize: "0.85rem", padding: "4px 12px", background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--foreground)", borderRadius: "20px", fontWeight: 600 }}>General Knowledge Mode</span>
            )}
          </div>
          
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem", maxHeight: "400px" }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: "center", opacity: 0.5, marginTop: "2rem" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem", opacity: 0.8 }}>💬</div>
                <p>Have questions about Chapter 60 regulations? Ask below!</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', background: msg.role === 'user' ? 'var(--primary-glow)' : 'var(--surface)', border: `1px solid ${msg.role === 'user' ? 'var(--primary)' : 'var(--glass-border)'}`, padding: "1rem", borderRadius: "16px", maxWidth: "80%" }}>
                  <p style={{ fontWeight: 600, fontSize: "0.8rem", color: msg.role === 'user' ? 'var(--primary)' : 'var(--secondary)', marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>{msg.role === 'user' ? 'You' : 'Advocate'}</p>
                  <p style={{ fontSize: "0.95rem", whiteSpace: "pre-wrap" }}>{msg.text}</p>
                  
                  {msg.role === 'model' && (
                    <button 
                      onClick={() => {
                        const previousQuery = i > 0 && messages[i-1].role === 'user' ? messages[i-1].text : "General Inquiry";
                        handleSaveInsight(previousQuery, msg.text);
                      }}
                      style={{
                        marginTop: "1rem", padding: "6px 12px", fontSize: "0.75rem", fontWeight: 600, 
                        background: "var(--background)", color: "var(--foreground)", border: "1px solid var(--border)",
                        borderRadius: "12px", cursor: "pointer", transition: "all var(--transition-fast)", opacity: 0.8
                      }}>
                      ⭐ Save Insight
                    </button>
                  )}
                </div>
              ))
            )}
            {isChatLoading && (
              <div style={{ alignSelf: 'flex-start', padding: "1rem", background: "var(--surface)", border: "1px solid var(--glass-border)", borderRadius: "16px", opacity: 0.7 }}>
                <p style={{ fontSize: "0.95rem", animation: "pulse-glow 1.5s infinite" }}>Typing...</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendChatMessage} style={{ display: "flex", gap: "0.5rem", width: "100%", flexWrap: "nowrap" }}>
            <input 
              type="text" 
              value={chatInput} 
              onChange={e => setChatInput(e.target.value)} 
              placeholder={extractedDocuments.length > 0 ? "E.g., Does the Assessment contradict the IEP's Needs?" : "E.g., What is an IEP timeline in Hawaii?"}
              style={{ flex: 1, minWidth: 0, padding: "0.75rem 1rem", borderRadius: "30px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", fontSize: "1rem", outline: "none", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)" }}
            />
            <button 
              type="submit" 
              disabled={isChatLoading || !chatInput.trim()}
              style={{ flexShrink: 0, padding: "0 1.5rem", borderRadius: "30px", background: "var(--primary)", color: "white", fontWeight: 600, border: "none", cursor: (isChatLoading || !chatInput.trim()) ? "not-allowed" : "pointer", opacity: (isChatLoading || !chatInput.trim()) ? 0.7 : 1, transition: "all var(--transition-fast)", boxShadow: "0 4px 12px var(--primary-glow)" }}
            >
              Send
            </button>
          </form>
        </section>
      </div>
      
      {/* Footer Nav */}
      <footer style={{ position: "absolute", bottom: "1rem", width: "100%", textAlign: "center", opacity: 0.6, fontSize: "0.875rem" }}>
         <a href="/help" style={{ color: "var(--primary)", textDecoration: "underline", fontWeight: 600 }}>Access Resource Directory (SPIN/LDAH) &rarr;</a>
      </footer>
    </main>
  );
}
