"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { getUIPreference, setUIPreference } from "@/lib/storage";
import { cacheVerifiedDocument, getOfflineDocuments, saveInsight, saveDocumentEmbedding, getDocumentEmbeddings, cosineSimilarity } from "@/lib/indexeddb";
interface FilePreviewProps {
  file: File;
}

function FilePreview({ file }: FilePreviewProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    // Use Promise.resolve to avoid synchronous setState in effect warning
    Promise.resolve().then(() => setObjectUrl(url));
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!objectUrl) return null;

  const isAudio = file.type.startsWith('audio/');
  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf';
  const isWordDoc = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx');
  const isOdtDoc = file.type === 'application/vnd.oasis.opendocument.text' || file.name.endsWith('.odt');

  let fileIcon = "📄";
  if (isAudio) fileIcon = "🎙️";
  else if (isImage) fileIcon = "🖼️";
  else if (isPdf) fileIcon = "📄";
  else if (isWordDoc || isOdtDoc) fileIcon = "📝";

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      padding: "0.75rem 1rem",
      borderRadius: "12px",
      background: "rgba(255, 255, 255, 0.03)",
      border: "1px solid var(--glass-border)",
      marginTop: "0.5rem",
      width: "100%"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <span style={{ fontSize: "0.9rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: 0.9 }}>
          {fileIcon} {file.name}
        </span>
        
        <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
          {isAudio && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              style={{
                padding: "4px 12px",
                borderRadius: "12px",
                background: "var(--primary-glow)",
                border: "1px solid var(--primary)",
                color: "var(--primary)",
                fontWeight: 600,
                fontSize: "0.8rem",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {isOpen ? "Hide Player" : "Listen"}
            </button>
          )}

          {isImage && (
            <>
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                  padding: "4px 12px",
                  borderRadius: "12px",
                  background: "var(--primary-glow)",
                  border: "1px solid var(--primary)",
                  color: "var(--primary)",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {isOpen ? "Close Preview" : "View Image"}
              </button>
              <a
                href={objectUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: "4px 12px",
                  borderRadius: "12px",
                  background: "var(--surface)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--foreground)",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center"
                }}
              >
                Open ↗
              </a>
            </>
          )}

          {isPdf && (
            <a
              href={objectUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "4px 12px",
                borderRadius: "12px",
                background: "var(--primary-glow)",
                border: "1px solid var(--primary)",
                color: "var(--primary)",
                fontWeight: 600,
                fontSize: "0.8rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center"
              }}
            >
              View PDF ↗
            </a>
          )}

          {(isWordDoc || isOdtDoc) && (
            <a
              href={objectUrl}
              download={file.name}
              style={{
                padding: "4px 12px",
                borderRadius: "12px",
                background: "var(--primary-glow)",
                border: "1px solid var(--primary)",
                color: "var(--primary)",
                fontWeight: 600,
                fontSize: "0.8rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center"
              }}
            >
              Download ⬇️
            </a>
          )}
        </div>
      </div>

      {isOpen && isAudio && (
        <div style={{ marginTop: "0.5rem", display: "flex", justifyContent: "center" }} className="animate-slide-up">
          <audio controls src={objectUrl} style={{ width: "100%", borderRadius: "8px", outline: "none" }} />
        </div>
      )}

      {isOpen && isImage && (
        <div style={{ marginTop: "0.5rem", textAlign: "center" }} className="animate-slide-up">
          <img
            src={objectUrl}
            alt={file.name}
            style={{
              maxWidth: "100%",
              maxHeight: "300px",
              borderRadius: "8px",
              border: "1px solid var(--glass-border)",
              objectFit: "contain",
              boxShadow: "var(--shadow-sm)"
            }}
          />
        </div>
      )}
    </div>
  );
}

interface ExtractedDocument {
  fileName: string;
  files?: File[];
  assessmentName?: string;
  assessmentVersion?: string;
  behavioralInfo?: string;
  strengths?: string;
  needs?: string;
  takeaways?: string;
  accommodations?: string;
  rawTranscript?: string;
  uncertainties?: string;
}

interface UserData {
  id: string;
  email: string;
  subscriptionStatus: string;
  parentId?: string;
  twoFactorEnabled?: boolean;
  linkedAccounts?: Array<{ id: string, email: string }>;
  subscriptionExpiresAt?: string;
}

export default function Home() {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedDocuments, setExtractedDocuments] = useState<ExtractedDocument[]>([]);
  const [darkMode, setDarkMode] = useState(false);

  // Chat Interface State
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Media Capture & Staging State
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Camera Capture States
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraAspectRatio, setCameraAspectRatio] = useState<"letter" | "legal">("letter");

  // Document Editing & Correction States
  const [editingDocIdx, setEditingDocIdx] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<ExtractedDocument | null>(null);
  const [expandedTranscripts, setExpandedTranscripts] = useState<Record<number, boolean>>({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Phase 13 Auth & Subscription States
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isAuthModeLogin, setIsAuthModeLogin] = useState<boolean>(true);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [couponError, setCouponError] = useState("");
  const [familyEmail, setFamilyEmail] = useState("");
  const [familySuccess, setFamilySuccess] = useState("");
  const [familyError, setFamilyError] = useState("");
  const [appPromptCount, setAppPromptCount] = useState(0);
  const [show2FAInput, setShow2FAInput] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [temp2FAToken, setTemp2FAToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatLoading]);

  // Load theme and session on mount
  useEffect(() => {
    // Determine system theme preference
    const isDark = getUIPreference("darkMode", window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

    // Verify session token
    const savedToken = localStorage.getItem("spednav_auth_token");
    if (savedToken) {
      setToken(savedToken);
      fetchSession(savedToken);
    } else {
      setAuthLoading(false);
    }
  }, []);

  const fetchSession = async (authToken: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/session`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("spednav_auth_token");
        setToken(null);
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.error("Session fetch error:", e);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const endpoint = isAuthModeLogin ? "/api/auth/login" : "/api/auth/register";
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (data.success) {
        if (data.verificationRequired) {
          setVerificationEmail(data.email);
          setShowVerificationInput(true);
          setAuthError("");
        } else if (data.twoFactorRequired) {
          setTemp2FAToken(data.tempToken);
          setShow2FAInput(true);
          setAuthError("");
        } else if (data.token) {
          localStorage.setItem("spednav_auth_token", data.token);
          setToken(data.token);
          setUser(data.user);
          setIsAuthenticated(true);
          setAuthEmail("");
          setAuthPassword("");
          setShow2FAInput(false);
          setTwoFactorCode("");
        } else {
          setAuthError("Authentication failed: invalid token response.");
        }
      } else {
        setAuthError(data.error || "Authentication failed.");
      }
    } catch (err) {
      setAuthError("Failed to connect to authentication server.");
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError("");
    const isNative = typeof window !== "undefined" && (window as any).Capacitor?.isNative;
    
    if (isNative) {
      try {
        const { GoogleAuth } = require('@codetrix-studio/capacitor-google-auth');
        const userResult = await GoogleAuth.signIn();
        if (userResult && userResult.authentication.idToken) {
          const res = await fetch(`${API_URL}/api/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: userResult.authentication.idToken })
          });
          const data = await res.json();
          if (data.success && data.token) {
            localStorage.setItem("spednav_auth_token", data.token);
            setToken(data.token);
            setUser(data.user);
            setIsAuthenticated(true);
            setAuthEmail("");
            setAuthPassword("");
          } else {
            setAuthError(data.error || "Google authentication failed.");
          }
        } else {
          setAuthError("Google Sign-In was cancelled or failed to retrieve token.");
        }
      } catch (err: any) {
        setAuthError("Google Native Sign-In Error: " + (err.message || err));
      }
    } else {
      const testEmail = prompt("Enter email to mock Google Sign-In (Local Testing):", "testgoogle@example.com");
      if (!testEmail) return;
      if (!testEmail.includes("@")) {
        alert("Please enter a valid email address.");
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: `mock_token_${testEmail.toLowerCase().trim()}` })
        });
        const data = await res.json();
        if (data.success && data.token) {
          localStorage.setItem("spednav_auth_token", data.token);
          setToken(data.token);
          setUser(data.user);
          setIsAuthenticated(true);
          setAuthEmail("");
          setAuthPassword("");
        } else {
          setAuthError(data.error || "Mock Google login failed.");
        }
      } catch (err) {
        setAuthError("Failed to connect to authentication server for Mock Google login.");
      }
    }
  };

  const handleVerificationVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError("");
    setVerificationLoading(true);
    if (!verificationCode || verificationCode.trim().length !== 6) {
      setVerificationError("Please enter a valid 6-digit code.");
      setVerificationLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verificationEmail, code: verificationCode })
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem("spednav_auth_token", data.token);
        setToken(data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        setAuthEmail("");
        setAuthPassword("");
        setShowVerificationInput(false);
        setVerificationCode("");
        setVerificationEmail("");
      } else {
        setVerificationError(data.error || "Verification failed.");
      }
    } catch (err) {
      setVerificationError("Failed to connect to verification server.");
    } finally {
      setVerificationLoading(false);
    }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      setAuthError("Please enter a valid 6-digit code.");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken: temp2FAToken, code: twoFactorCode })
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem("spednav_auth_token", data.token);
        setToken(data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        setAuthEmail("");
        setAuthPassword("");
        setShow2FAInput(false);
        setTwoFactorCode("");
      } else {
        setAuthError(data.error || "Invalid 2FA verification code.");
      }
    } catch (err) {
      setAuthError("Failed to connect to verification server.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("spednav_auth_token");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setShowSettings(false);
    setMessages([]);
    setExtractedDocuments([]);
    setAppPromptCount(0);
    setShow2FAInput(false);
    setTwoFactorCode("");
    setTemp2FAToken("");
  };

  const handleRedeemCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponSuccess("");
    setCouponError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ code: couponCode })
      });
      const data = await res.json();
      if (data.success) {
        setCouponSuccess(data.message);
        setCouponCode("");
        // Refresh session to get updated subscriptionStatus
        if (token) fetchSession(token);
      } else {
        setCouponError(data.error || "Failed to redeem coupon.");
      }
    } catch (err) {
      setCouponError("Redemption network error.");
    }
  };

  const handleAddFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFamilySuccess("");
    setFamilyError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/family`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ email: familyEmail })
      });
      const data = await res.json();
      if (data.success) {
        setFamilySuccess(data.message);
        setFamilyEmail("");
        // Refresh session
        if (token) fetchSession(token);
      } else {
        setFamilyError(data.error || "Failed to link family account.");
      }
    } catch (err) {
      setFamilyError("Family link network error.");
    }
  };

  const handleRemoveFamilyMember = async (id: string) => {
    if (!confirm("Are you sure you want to remove this linked account?")) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/family`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        // Refresh session
        if (token) fetchSession(token);
      } else {
        alert(data.error || "Failed to remove family member.");
      }
    } catch (err) {
      alert("Network error unlinking member.");
    }
  };

  const toggleTheme = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    setUIPreference("darkMode", newVal);
    document.documentElement.style.colorScheme = newVal ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newVal ? 'dark' : 'light');
  };

  const sendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    
    // Gate prompts for unsubscribed users
    if (user && user.subscriptionStatus !== 'SUBSCRIBED' && appPromptCount >= 3) {
      alert("Free chat limit reached. Please upgrade to a Subscribed account or redeem a coupon code in Settings to continue.");
      return;
    }

    const userMsg = chatInput.trim();
    setChatInput("");
    setMessages(prev => [...prev, {role: 'user', text: userMsg}]);
    setIsChatLoading(true);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // 2. Vectorize the user's query against the new standalone embedding endpoint
      const embedRes = await fetch(`${API_URL}/api/embed`, {
        method: 'POST',
        headers,
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

      // Strip files key from extractedDocuments context for serialization
      const serializableContext = extractedDocuments.length > 0
        ? extractedDocuments.map(({ files, ...rest }) => rest)
        : null;

      // 4. Send query + vectors to the primary Chat Synthesis API
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: userMsg,
          history: messages,
          context: serializableContext, // Legacy Golden Truth array
          rag_chunks: ragChunks // Newly retrieved precise Multimodal evidence
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, {role: 'model', text: data.response}]);
        if (user && user.subscriptionStatus !== 'SUBSCRIBED') {
          setAppPromptCount(prev => prev + 1);
        }
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
    
    // Validate: Block mixing audio and visual media
    const isDocOrImage = (f: File) => 
      f.type.startsWith('image/') || 
      f.type === 'application/pdf' || 
      f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      f.type === 'application/vnd.oasis.opendocument.text' || 
      f.name.endsWith('.docx') || 
      f.name.endsWith('.odt');

    const incomingHasAudio = files.some(f => f.type.startsWith('audio/'));
    const incomingHasVisual = files.some(isDocOrImage);
    const existingHasAudio = stagedFiles.some(f => f.type.startsWith('audio/'));
    const existingHasVisual = stagedFiles.some(isDocOrImage);

    if ((incomingHasAudio && existingHasVisual) || (incomingHasVisual && existingHasAudio) || (incomingHasAudio && incomingHasVisual)) {
      alert("Validation Error: Please do not mix audio recordings with document photos/PDFs. Process them in separate batches.");
      return;
    }

    const processed: File[] = [];
    for (const droppedFile of files) {
      let processedFile = droppedFile;
      if (droppedFile.type.startsWith('image/')) {
        processedFile = await compressImage(droppedFile);
      }
      processed.push(processedFile);
    }
    
    setStagedFiles(prev => [...prev, ...processed]);
  };

  const processStagedBatch = async () => {
    if (stagedFiles.length === 0) return;
    
    // Check subscription status
    if (user && user.subscriptionStatus !== 'SUBSCRIBED') {
      alert("Document uploads are locked for free users. Please upgrade to a Subscribed account in Settings.");
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      stagedFiles.forEach(file => {
        formData.append('files', file);
      });

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/api/extract`, {
        method: 'POST',
        headers,
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
        setExtractedDocuments(prev => [...prev, { fileName: data.fileName, files: [...stagedFiles], ...data.extractedData }]);
        setStagedFiles([]); // Clear queue on success
      } else {
        alert(`Batch Analysis failed: ` + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert(`Upload failed due to network error.`);
    }
    
    setIsUploading(false);
  };

  const moveStagedFile = (index: number, direction: -1 | 1) => {
    setStagedFiles(prev => {
      const copy = [...prev];
      if (index + direction >= 0 && index + direction < copy.length) {
        const temp = copy[index];
        copy[index] = copy[index + direction];
        copy[index + direction] = temp;
      }
      return copy;
    });
  };

  const removeStagedFile = (index: number) => {
    setStagedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
      e.target.value = "";
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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Could not access camera. Please ensure camera permissions are enabled in your browser settings.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const targetRatio = cameraAspectRatio === "letter" ? 8.5 / 11 : 9 / 16;
      const nativeWidth = video.videoWidth || 640;
      const nativeHeight = video.videoHeight || 480;
      const nativeRatio = nativeWidth / nativeHeight;

      let sx = 0;
      let sy = 0;
      let sWidth = nativeWidth;
      let sHeight = nativeHeight;

      if (nativeRatio > targetRatio) {
        // Source is wider than the target aspect ratio, crop sides
        sWidth = nativeHeight * targetRatio;
        sx = (nativeWidth - sWidth) / 2;
      } else {
        // Source is taller than the target aspect ratio, crop top/bottom
        sHeight = nativeWidth / targetRatio;
        sy = (nativeHeight - sHeight) / 2;
      }

      const canvas = document.createElement('canvas');
      if (cameraAspectRatio === "letter") {
        canvas.width = 850;
        canvas.height = 1100;
      } else {
        canvas.width = 720;
        canvas.height = 1280;
      }
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `Camera_Capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
            handleFiles([file]);
          }
        }, 'image/jpeg', 0.85);
      }
      stopCamera();
    }
  };

  useEffect(() => {
    if (isCameraOpen && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [isCameraOpen, cameraStream]);

  const toggleTranscript = (idx: number) => {
    setExpandedTranscripts(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const startEditingDoc = (idx: number, doc: ExtractedDocument) => {
    setEditingDocIdx(idx);
    setEditFormData({ ...doc });
  };

  const handleEditFormChange = (key: string, value: string) => {
    setEditFormData((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  const saveDocumentEdits = async (idx: number) => {
    if (!editFormData) return;
    
    const updatedDocs = [...extractedDocuments];
    updatedDocs[idx] = { ...editFormData };
    
    setExtractedDocuments(updatedDocs);
    setEditingDocIdx(null);
    setEditFormData(null);

    try {
      const allOffline = await getOfflineDocuments();
      const matchedOffline = allOffline.find((d: any) => d.fileName === editFormData.fileName);
      const docId = matchedOffline ? matchedOffline.id : crypto.randomUUID();
      
      const { files, ...dbData } = editFormData;
      
      await cacheVerifiedDocument({
        id: docId,
        fileName: editFormData.fileName,
        extractedData: dbData
      });

      const textChunk = `Document: ${editFormData.fileName}\n${JSON.stringify(dbData)}`;
      const embedRes = await fetch(`${API_URL}/api/embed`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textChunk })
      });
      const embedData = await embedRes.json();
      if (embedData.success && embedData.vector) {
        await saveDocumentEmbedding(docId, embedData.vector, textChunk, 1);
      }
      alert("Document corrections saved and vector search synchronized successfully!");
    } catch (err) {
      console.error("Failed to save data corrections:", err);
      alert("Edits updated in memory, but offline cache sync failed.");
    }
  };

  // Loading indicator for session restore
  if (authLoading) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: "1.2rem", fontWeight: 600 }} className="animate-pulse">Loading Special Education Navigator...</p>
      </main>
    );
  }

  // Authentication View
  if (!isAuthenticated) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div className="glass-panel animate-slide-up" style={{ width: "100%", maxWidth: "440px", padding: "2.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <img 
              src="/navigator-logo.jpg" 
              alt="Logo" 
              style={{ width: "70px", height: "70px", borderRadius: "50%", border: "2px solid var(--glass-border)", marginBottom: "1rem", objectFit: "cover" }} 
            />
            <h2 style={{ fontSize: "1.75rem", fontWeight: 850 }}>SpEd Navigator</h2>
            <p style={{ opacity: 0.7, fontSize: "0.9rem", marginTop: "0.25rem" }}>
              {showVerificationInput ? "Email Verification Required" : show2FAInput ? "Two-Factor Verification Required" : isAuthModeLogin ? "Sign in to access your child's advocate portal" : "Create your private zero-trust advocate account"}
            </p>
          </div>

          {showVerificationInput ? (
            <form onSubmit={handleVerificationVerify} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <p style={{ fontSize: "0.9rem", opacity: 0.8, marginBottom: "1rem", textTransform: "none", textAlign: "center" }}>
                  A 6-digit verification code has been sent to <strong>{verificationEmail}</strong>. Enter the code below to verify your email.
                </p>
                <label htmlFor="auth-verification-code" style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.25rem", textTransform: "uppercase", opacity: 0.8, textAlign: "center" }}>Verification Code</label>
                <input 
                  id="auth-verification-code"
                  type="text" 
                  maxLength={6}
                  placeholder="123456"
                  value={verificationCode} 
                  onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))} 
                  required
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", fontSize: "1.5rem", letterSpacing: "8px", textAlign: "center" }} 
                />
              </div>

              {verificationError && (
                <p style={{ color: "hsl(0, 80%, 50%)", fontSize: "0.85rem", fontWeight: 600, textAlign: "center" }}>{verificationError}</p>
              )}

              <button 
                type="submit" 
                disabled={verificationLoading}
                style={{ width: "100%", padding: "0.85rem", borderRadius: "12px", background: "var(--primary)", color: "white", fontWeight: 700, border: "none", cursor: verificationLoading ? "not-allowed" : "pointer", boxShadow: "0 4px 12px var(--primary-glow)", opacity: verificationLoading ? 0.7 : 1 }}
              >
                {verificationLoading ? "Verifying..." : "Verify & Activate Account"}
              </button>

              <button 
                type="button" 
                onClick={() => { setShowVerificationInput(false); setVerificationCode(""); setVerificationError(""); }} 
                style={{ background: "transparent", border: "none", color: "var(--foreground)", opacity: 0.6, fontWeight: 600, cursor: "pointer", fontSize: "0.9rem", alignSelf: "center" }}
              >
                ← Back to Login / Register
              </button>
            </form>
          ) : show2FAInput ? (
            <form onSubmit={handle2FAVerify} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <p style={{ fontSize: "0.9rem", opacity: 0.8, marginBottom: "1rem", textTransform: "none", textAlign: "center" }}>
                  A 6-digit verification code has been sent to your email. Enter the code below to sign in.
                </p>
                <label htmlFor="auth-2fa-code" style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.25rem", textTransform: "uppercase", opacity: 0.8, textAlign: "center" }}>Verification Code</label>
                <input 
                  id="auth-2fa-code"
                  type="text" 
                  maxLength={6}
                  placeholder="123456"
                  value={twoFactorCode} 
                  onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, ''))} 
                  required
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", fontSize: "1.5rem", letterSpacing: "8px", textAlign: "center" }} 
                />
              </div>

              {authError && (
                <p style={{ color: "hsl(0, 80%, 50%)", fontSize: "0.85rem", fontWeight: 600, textAlign: "center" }}>{authError}</p>
              )}

              <button 
                type="submit" 
                style={{ width: "100%", padding: "0.85rem", borderRadius: "12px", background: "var(--primary)", color: "white", fontWeight: 700, border: "none", cursor: "pointer", boxShadow: "0 4px 12px var(--primary-glow)" }}
              >
                Verify & Sign In
              </button>

              <button 
                type="button" 
                onClick={() => { setShow2FAInput(false); setTwoFactorCode(""); setAuthError(""); }} 
                style={{ background: "transparent", border: "none", color: "var(--foreground)", opacity: 0.6, fontWeight: 600, cursor: "pointer", fontSize: "0.9rem", alignSelf: "center" }}
              >
                ← Back to Sign In
              </button>
            </form>
          ) : (
            <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label htmlFor="auth-email" style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.25rem", textTransform: "uppercase", opacity: 0.8 }}>Email Address</label>
                <input 
                  id="auth-email"
                  type="email" 
                  value={authEmail} 
                  onChange={e => setAuthEmail(e.target.value)} 
                  required
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} 
                />
              </div>
              
              <div>
                <label htmlFor="auth-password" style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.25rem", textTransform: "uppercase", opacity: 0.8 }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input 
                    id="auth-password"
                    type={showPassword ? "text" : "password"} 
                    value={authPassword} 
                    onChange={e => setAuthPassword(e.target.value)} 
                    required
                    autoComplete="new-password"
                    style={{ width: "100%", padding: "0.75rem 2.5rem 0.75rem 1rem", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--foreground)",
                      opacity: 0.6,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "4px"
                    }}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.2rem", height: "1.2rem" }}>
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                        <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                        <line x1="2" y1="2" x2="22" y2="22"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.2rem", height: "1.2rem" }}>
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {authError && (
                <p style={{ color: "hsl(0, 80%, 50%)", fontSize: "0.85rem", fontWeight: 600 }}>{authError}</p>
              )}

              <button 
                type="submit" 
                style={{ width: "100%", padding: "0.85rem", borderRadius: "12px", background: "var(--primary)", color: "white", fontWeight: 700, border: "none", cursor: "pointer", marginTop: "1rem", boxShadow: "0 4px 12px var(--primary-glow)" }}
              >
                {isAuthModeLogin ? "Sign In" : "Register Account"}
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "1rem 0 0.5rem 0", opacity: 0.4 }}>
                <div style={{ flex: 1, height: "1px", background: "var(--foreground)" }}></div>
                <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>OR</span>
                <div style={{ flex: 1, height: "1px", background: "var(--foreground)" }}></div>
              </div>

              <button 
                type="button" 
                onClick={handleGoogleLogin}
                style={{
                  width: "100%",
                  padding: "0.8rem",
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  transition: "all 0.2s"
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ width: "1.2rem", height: "1.2rem" }}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Sign In with Google
              </button>
            </form>
          )}

          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <button 
              disabled={show2FAInput || showVerificationInput}
              onClick={() => { setIsAuthModeLogin(!isAuthModeLogin); setAuthError(""); }} 
              style={{ background: "transparent", border: "none", color: "var(--primary)", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem", opacity: (show2FAInput || showVerificationInput) ? 0.5 : 1 }}
            >
              {isAuthModeLogin ? "Create an Account" : "Already have an account? Sign In"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", position: "relative", zIndex: 1, paddingBottom: "4rem" }}>
      {/* Top Navbar */}
      <nav style={{ 
        position: "sticky", top: 0, zIndex: 50,
        background: "var(--nav-bg)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--glass-border)",
      }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: "72px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            {/* Hamburger menu button for mobile screens */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mobile-menu-btn"
              style={{
                background: "transparent", border: "none", fontSize: "1.5rem", color: "var(--foreground)",
                cursor: "pointer", display: "none", padding: "4px 8px"
              }}
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? "✕" : "☰"}
            </button>

            <a href="/home" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", color: "var(--foreground)" }} aria-label="Special Education Navigator Home">
              <img 
                src="/navigator-logo.jpg" 
                alt="" 
                className="nav-logo"
                style={{ 
                  width: "40px", height: "40px", borderRadius: "50%", 
                  boxShadow: "0 4px 12px var(--primary-glow)", border: "1px solid var(--glass-border)", objectFit: "cover"
                }} 
              />
              <span className="nav-title" style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.01em", color: "var(--foreground)" }}>
                SpEd Navigator
              </span>
            </a>
            
            <div style={{ display: "flex", gap: "16px", marginLeft: "12px" }} role="navigation" aria-label="Public Pages Menu" className="desktop-nav">
              <a href="/home" target="_blank" rel="noopener noreferrer" style={{ color: "var(--foreground)", opacity: 0.8, textDecoration: "none", fontSize: "0.9rem", fontWeight: 500, transition: "opacity 0.2s" }} onMouseOver={(e) => e.currentTarget.style.opacity = "1"} onMouseOut={(e) => e.currentTarget.style.opacity = "0.8"}>
                Home
              </a>
              <a href="/posts" target="_blank" rel="noopener noreferrer" style={{ color: "var(--foreground)", opacity: 0.8, textDecoration: "none", fontSize: "0.9rem", fontWeight: 500, transition: "opacity 0.2s" }} onMouseOver={(e) => e.currentTarget.style.opacity = "1"} onMouseOut={(e) => e.currentTarget.style.opacity = "0.8"}>
                Articles
              </a>
              <a href="/downloads" target="_blank" rel="noopener noreferrer" style={{ color: "var(--foreground)", opacity: 0.8, textDecoration: "none", fontSize: "0.9rem", fontWeight: 500, transition: "opacity 0.2s" }} onMouseOver={(e) => e.currentTarget.style.opacity = "1"} onMouseOut={(e) => e.currentTarget.style.opacity = "0.8"}>
                Downloads
              </a>
              <a href="/videos" target="_blank" rel="noopener noreferrer" style={{ color: "var(--foreground)", opacity: 0.8, textDecoration: "none", fontSize: "0.9rem", fontWeight: 500, transition: "opacity 0.2s" }} onMouseOver={(e) => e.currentTarget.style.opacity = "1"} onMouseOut={(e) => e.currentTarget.style.opacity = "0.8"}>
                Videos
              </a>
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <a href="/saved" className="nav-btn-mobile-icon" style={{
              padding: "8px 16px", borderRadius: "20px", display: "flex", gap: "8px", alignItems: "center",
              background: "var(--primary-glow)", border: "1px solid var(--primary)", color: "var(--primary)",
              cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", textDecoration: "none",
              boxShadow: "var(--shadow-sm)"
            }}>⭐ <span className="button-text">Saved Insights</span></a>
            
            <button 
              onClick={() => setShowSettings(true)}
              className="nav-btn-mobile-icon"
              style={{
                padding: "8px 16px", borderRadius: "20px", display: "flex", gap: "8px", alignItems: "center",
                background: "var(--surface)", border: "1px solid var(--glass-border)", color: "var(--foreground)",
                cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", transition: "all var(--transition-normal)",
                boxShadow: "var(--shadow-sm)"
              }}
            >
              ⚙️ <span className="button-text">Settings</span>
            </button>

            <button 
              onClick={toggleTheme}
              className="nav-btn-mobile-icon"
              style={{
                padding: "8px 16px", borderRadius: "20px", display: "flex", gap: "8px", alignItems: "center",
                background: "var(--surface)", border: "1px solid var(--glass-border)", color: "var(--foreground)",
                cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", transition: "all var(--transition-normal)",
                boxShadow: "var(--shadow-sm)"
              }}
            >
              {darkMode ? "☀️" : "🌙"} <span className="button-text">{darkMode ? "Light" : "Dark"}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown Panel */}
      {isMobileMenuOpen && (
        <div style={{
          position: "fixed",
          top: "72px",
          left: 0,
          right: 0,
          background: "var(--nav-bg)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid var(--glass-border)",
          padding: "1rem 2rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          zIndex: 49,
          boxShadow: "var(--shadow-md)"
        }} className="animate-slide-up">
          <a href="/home" target="_blank" rel="noopener noreferrer" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: "1rem", fontWeight: 600, padding: "0.5rem 0", borderBottom: "1px solid var(--glass-border)", color: "var(--foreground)", display: "flex", alignItems: "center", gap: "8px" }}>
            🏠 Home
          </a>
          <a href="/posts" target="_blank" rel="noopener noreferrer" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: "1rem", fontWeight: 600, padding: "0.5rem 0", borderBottom: "1px solid var(--glass-border)", color: "var(--foreground)", display: "flex", alignItems: "center", gap: "8px" }}>
            📰 Articles
          </a>
          <a href="/downloads" target="_blank" rel="noopener noreferrer" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: "1rem", fontWeight: 600, padding: "0.5rem 0", borderBottom: "1px solid var(--glass-border)", color: "var(--foreground)", display: "flex", alignItems: "center", gap: "8px" }}>
            📥 Downloads
          </a>
          <a href="/videos" target="_blank" rel="noopener noreferrer" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: "1rem", fontWeight: 600, padding: "0.5rem 0", color: "var(--foreground)", display: "flex", alignItems: "center", gap: "8px" }}>
            🎥 Videos
          </a>
        </div>
      )}

      {/* Settings Drawer / Modal */}
      {showSettings && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", justifyContent: "flex-end" }} onClick={() => { setShowSettings(false); setCouponSuccess(""); setCouponError(""); setFamilySuccess(""); setFamilyError(""); }}>
          <div className="glass-panel animate-slide-up" style={{ width: "100%", maxWidth: "450px", height: "100%", borderRadius: "0", background: "var(--background-end)", borderLeft: "1px solid var(--glass-border)", padding: "2.5rem", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1.75rem", fontWeight: 800 }}>Account & Settings</h2>
              <button onClick={() => { setShowSettings(false); setCouponSuccess(""); setCouponError(""); setFamilySuccess(""); setFamilyError(""); }} style={{ background: "transparent", border: "none", fontSize: "1.5rem", color: "var(--foreground)", cursor: "pointer" }}>&times;</button>
            </div>

            <div style={{ marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--glass-border)" }}>
              <p style={{ fontSize: "0.85rem", opacity: 0.5, fontWeight: 700, textTransform: "uppercase" }}>Logged In As</p>
              <p style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: "0.25rem" }}>{user?.email}</p>
              
              <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "0.85rem", padding: "4px 12px", borderRadius: "20px", fontWeight: 700, background: user?.subscriptionStatus === "SUBSCRIBED" ? "var(--success-glow)" : "rgba(255,255,255,0.05)", border: user?.subscriptionStatus === "SUBSCRIBED" ? "1px solid var(--success)" : "1px solid var(--border)", color: user?.subscriptionStatus === "SUBSCRIBED" ? "var(--success)" : "var(--foreground)" }}>
                    {user?.subscriptionStatus === "SUBSCRIBED" ? "👑 Subscribed (Unlimited)" : "Free Trial (Limited)"}
                  </span>
                  {user?.parentId && (
                    <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>Linked Family Account</span>
                  )}
                </div>
                {user?.subscriptionStatus === "SUBSCRIBED" ? (
                  user?.subscriptionExpiresAt && (
                    <p style={{ fontSize: "0.85rem", margin: 0, opacity: 0.8 }}>
                      Subscription ends: <strong>{new Date(user.subscriptionExpiresAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                    </p>
                  )
                ) : (
                  <div style={{ fontSize: "0.85rem", opacity: 0.8, display: "flex", flexDirection: "column", gap: "4px" }}>
                    <p style={{ margin: 0 }}>
                      Usage Limit: <strong>{appPromptCount} / 3</strong> Free Prompts used
                    </p>
                    <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.7 }}>
                      Redeem a coupon below or link a family account to unlock unlimited access.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Coupon Redemption Section */}
            {user?.subscriptionStatus !== "SUBSCRIBED" && (
              <div style={{ marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--glass-border)" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.75rem" }}>Redeem Promo Coupon</h3>
                <p style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "1rem" }}>Have a coupon code? Enter it below to unlock unlimited document analysis.</p>
                
                <form onSubmit={handleRedeemCoupon} style={{ display: "flex", gap: "0.5rem" }}>
                  <input 
                    type="text" 
                    placeholder="Enter Coupon Code" 
                    value={couponCode} 
                    onChange={e => setCouponCode(e.target.value)} 
                    style={{ flex: 1, padding: "0.6rem 1rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", textTransform: "uppercase" }} 
                  />
                  <button type="submit" style={{ padding: "0.6rem 1.2rem", borderRadius: "8px", background: "var(--primary)", color: "white", fontWeight: 600, border: "none", cursor: "pointer" }}>Apply</button>
                </form>
                {couponSuccess && <p style={{ color: "var(--success)", fontSize: "0.85rem", marginTop: "0.5rem", fontWeight: 600 }}>{couponSuccess}</p>}
                {couponError && <p style={{ color: "hsl(0, 80%, 50%)", fontSize: "0.85rem", marginTop: "0.5rem", fontWeight: 600 }}>{couponError}</p>}
              </div>
            )}

            {/* Family Discount Tier Section */}
            {user?.subscriptionStatus === "SUBSCRIBED" && !user?.parentId && (
              <div style={{ marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--glass-border)" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Family Discount Links</h3>
                <p style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "1rem" }}>Share your subscription benefits with up to 4 additional family email accounts.</p>
                
                <form onSubmit={handleAddFamilyMember} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                  <input 
                    type="email" 
                    placeholder="family@email.com" 
                    value={familyEmail} 
                    onChange={e => setFamilyEmail(e.target.value)} 
                    style={{ flex: 1, padding: "0.6rem 1rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} 
                  />
                  <button type="submit" style={{ padding: "0.6rem 1.2rem", borderRadius: "8px", background: "var(--primary)", color: "white", fontWeight: 600, border: "none", cursor: "pointer" }}>Link</button>
                </form>
                {familySuccess && <p style={{ color: "var(--success)", fontSize: "0.85rem", marginTop: "0.5rem", fontWeight: 600 }}>{familySuccess}</p>}
                {familyError && <p style={{ color: "hsl(0, 80%, 50%)", fontSize: "0.85rem", marginTop: "0.5rem", fontWeight: 600 }}>{familyError}</p>}

                {user?.linkedAccounts && user.linkedAccounts.length > 0 && (
                  <div style={{ marginTop: "1rem" }}>
                    <p style={{ fontSize: "0.75rem", fontWeight: 700, opacity: 0.5, textTransform: "uppercase", marginBottom: "0.5rem" }}>Linked Accounts</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {user.linkedAccounts.map((member: any) => (
                        <div key={member.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--glass-border)", borderRadius: "8px" }}>
                          <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>{member.email}</span>
                          <button onClick={() => handleRemoveFamilyMember(member.id)} style={{ background: "transparent", border: "none", color: "hsl(0, 80%, 50%)", fontSize: "0.8rem", cursor: "pointer" }}>Unlink</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Security Settings Section (2FA Toggle) */}
            <div style={{ marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--glass-border)" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Security Settings</h3>
              <p style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "1rem" }}>Enhance your account safety by enabling 2-Factor Authentication (Email OTP).</p>
              
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--glass-border)", borderRadius: "8px" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>Enable 2FA (Email OTP)</span>
                <input 
                  type="checkbox"
                  checked={!!user?.twoFactorEnabled}
                  onChange={async (e) => {
                    const enabled = e.target.checked;
                    try {
                      const res = await fetch(`${API_URL}/api/auth/toggle-2fa`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ enabled })
                      });
                      const data = await res.json();
                      if (data.success) {
                        setUser((prev: any) => ({ ...prev, twoFactorEnabled: data.twoFactorEnabled }));
                      } else {
                        alert(data.error || "Failed to update 2FA settings.");
                      }
                    } catch (err) {
                      alert("Network error updating 2FA settings.");
                    }
                  }}
                  style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "var(--primary)" }}
                />
              </div>
            </div>

            {/* Help & Support Section */}
            <div style={{ marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--glass-border)" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Help & Support</h3>
              <p style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "1rem" }}>
                Encountered an issue or have feedback? Let us know to help improve the Navigator.
              </p>
              
              <div style={{ fontSize: "0.85rem", padding: "0.75rem 1rem", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ opacity: 0.6, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>Email Support</span>
                <a href="mailto:support@thespecialeducationnavigator.app" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
                  support@thespecialeducationnavigator.app
                </a>
              </div>

              <a 
                href="https://docs.google.com/forms/d/e/1FAIpQLSdDSAJHvlrEJ5JYra7vokzqDoNJT4SKQaRcvak7YDN3F3kIkQ/viewform"
                target="_blank" 
                rel="noreferrer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  width: "100%", padding: "0.75rem", borderRadius: "12px",
                  background: "var(--primary-glow)", border: "1px solid var(--primary)",
                  color: "var(--primary)", fontWeight: 700, textDecoration: "none",
                  fontSize: "0.95rem", textAlign: "center", cursor: "pointer", transition: "all 0.2s"
                }}
              >
                🐛 Report a Bug / Feedback
              </a>
            </div>

            <button 
              onClick={handleLogout}
              style={{ width: "100%", padding: "0.8rem", borderRadius: "12px", background: "hsla(0, 80%, 50%, 0.1)", border: "1px solid hsla(0, 80%, 50%, 0.3)", color: "hsl(0, 80%, 60%)", fontWeight: 700, cursor: "pointer", marginTop: "2rem" }}
            >
              Log Out
            </button>
          </div>
        </div>
      )}

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
            Simply drop the student&apos;s legal documents. We extract HAR Chapter 60 compliance mappings statelessly using edge AI, locking the results exclusively into your physical device.
          </p>
        </section>

        {/* Core Workspace Area */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", transition: "all var(--transition-normal)" }}>
          
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
              onDragOver={user?.subscriptionStatus === 'SUBSCRIBED' ? onDragOver : undefined}
              onDragLeave={user?.subscriptionStatus === 'SUBSCRIBED' ? onDragLeave : undefined}
              onDrop={user?.subscriptionStatus === 'SUBSCRIBED' ? onDrop : undefined}
              onClick={user?.subscriptionStatus === 'SUBSCRIBED' ? () => fileInputRef.current?.click() : undefined}
            >
              {/* Free Tier Upload Lock Overlay */}
              {user?.subscriptionStatus !== 'SUBSCRIBED' && (
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  background: "var(--nav-bg)", backdropFilter: "blur(12px)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  padding: "2rem", zIndex: 20
                }}>
                  <span style={{ fontSize: "2rem", marginBottom: "0.50rem" }}>🔒</span>
                  <h4 style={{ fontWeight: 800, fontSize: "1.25rem", marginBottom: "0.5rem", color: "var(--foreground)" }}>Document Scanning Locked</h4>
                  <p style={{ fontSize: "0.9rem", opacity: 0.8, maxWidth: "340px", margin: "0 auto", lineHeight: 1.5 }}>
                    Uploading and extracting multi-document IEPs requires an active subscription. Open Settings to upgrade or redeem a coupon code.
                  </p>
                </div>
              )}

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
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", alignItems: "flex-start" }}>
              <button 
                onClick={startCamera}
                disabled={isUploading || user?.subscriptionStatus !== 'SUBSCRIBED'}
                style={{
                  flex: "1 1 180px", padding: "1rem", borderRadius: "16px",
                  background: "var(--surface)", border: "1px solid var(--border)",
                  color: "var(--foreground)", fontSize: "1rem", fontWeight: 600,
                  cursor: (isUploading || user?.subscriptionStatus !== 'SUBSCRIBED') ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  transition: "all 0.2s",
                  opacity: user?.subscriptionStatus !== 'SUBSCRIBED' ? 0.5 : 1
                }}
              >
                📸 Take Photo
              </button>

              <div style={{ flex: "1 1 180px", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <input 
                  type="file" 
                  multiple
                  accept="image/*,application/pdf,audio/*,.docx,.odt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.oasis.opendocument.text" 
                  ref={fileInputRef} 
                  style={{ display: "none" }} 
                  onChange={handleFileInputChange} 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || user?.subscriptionStatus !== 'SUBSCRIBED'}
                  style={{
                    width: "100%", padding: "1rem", borderRadius: "16px",
                    background: "var(--surface)", border: "1px solid var(--border)",
                    color: "var(--foreground)", fontSize: "1rem", fontWeight: 600,
                    cursor: (isUploading || user?.subscriptionStatus !== 'SUBSCRIBED') ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                    transition: "all 0.2s",
                    opacity: user?.subscriptionStatus !== 'SUBSCRIBED' ? 0.5 : 1
                  }}
                >
                  📤 Upload Files
                </button>
                <span style={{ fontSize: "0.75rem", opacity: 0.6, textAlign: "center" }}>
                  PDF, DOCX, ODT, JPEG, PNG, WEBP, MP3, WAV, WebM
                </span>
              </div>

              <button 
                onClick={isRecording ? stopRecording : startRecording}
                disabled={(isUploading && !isRecording) || user?.subscriptionStatus !== 'SUBSCRIBED'}
                style={{
                  flex: "1 1 180px", padding: "1rem", borderRadius: "16px",
                  background: isRecording ? "hsl(0, 80%, 50%)" : "var(--surface)", 
                  border: isRecording ? "none" : "1px solid var(--border)",
                  color: isRecording ? "white" : "var(--foreground)", 
                  fontSize: "1rem", fontWeight: 600,
                  cursor: ((isUploading && !isRecording) || user?.subscriptionStatus !== 'SUBSCRIBED') ? "not-allowed" : "pointer", 
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  animation: isRecording ? "pulse-glow 1.5s infinite" : "none",
                  boxShadow: isRecording ? "0 0 20px hsla(0, 80%, 50%, 0.5)" : "none",
                  transition: "all 0.2s",
                  opacity: (!isRecording && user?.subscriptionStatus !== 'SUBSCRIBED') ? 0.5 : 1
                }}
              >
                {isRecording ? "⏹ Stop Recording" : "🎙️ Record Audio"}
              </button>
            </div>
            
            <div style={{ padding: "1rem", borderRadius: "12px", background: "hsla(0, 0%, 50%, 0.1)", border: "1px solid var(--border)" }}>
              <p style={{ fontSize: "0.8rem", opacity: 0.8, display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.2rem" }}>⚠️</span>
                <span><strong>Legal Note:</strong> While Hawaii is a one-party consent state, best advocacy practices strongly recommend formally informing the school administration prior to recording any IEP or 504 meeting.</span>
              </p>
            </div>
            
            {/* Staging Queue */}
            {stagedFiles.length > 0 && (
              <div className="glass-panel animate-slide-up" style={{ padding: "1.5rem", marginTop: "1rem" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ background: "var(--primary-glow)", color: "var(--primary)", padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.9rem" }}>{stagedFiles.length}</span>
                  Documents Staged for Batch Processing
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  {stagedFiles.map((file, idx) => (
                    <div key={idx} style={{ display: "flex", flexDirection: "column", padding: "1rem", background: "var(--background)", border: "1px solid var(--glass-border)", borderRadius: "12px", boxShadow: "var(--shadow-sm)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.95rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: "1rem" }}>
                          <span style={{ opacity: 0.5, marginRight: "0.5rem" }}>{idx + 1}.</span> {file.name}
                        </span>
                        <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0 }}>
                          <button onClick={() => moveStagedFile(idx, -1)} disabled={idx === 0 || isUploading} style={{ padding: "0.25rem", borderRadius: "4px", background: "var(--surface)", border: "1px solid var(--border)", cursor: idx === 0 || isUploading ? "not-allowed" : "pointer", opacity: idx === 0 ? 0.3 : 1 }}>⬆️</button>
                          <button onClick={() => moveStagedFile(idx, 1)} disabled={idx === stagedFiles.length - 1 || isUploading} style={{ padding: "0.25rem", borderRadius: "4px", background: "var(--surface)", border: "1px solid var(--border)", cursor: idx === stagedFiles.length - 1 || isUploading ? "not-allowed" : "pointer", opacity: idx === stagedFiles.length - 1 ? 0.3 : 1 }}>⬇️</button>
                          <button onClick={() => removeStagedFile(idx)} disabled={isUploading} style={{ padding: "0.25rem", borderRadius: "4px", background: "hsla(0, 80%, 50%, 0.1)", border: "1px solid hsla(0, 80%, 50%, 0.3)", cursor: isUploading ? "not-allowed" : "pointer" }}>❌</button>
                        </div>
                      </div>
                      <FilePreview file={file} />
                    </div>
                  ))}
                </div>
                <button 
                  onClick={processStagedBatch}
                  disabled={isUploading}
                  style={{ width: "100%", padding: "1rem", borderRadius: "12px", background: "var(--primary)", border: "none", color: "var(--background)", fontSize: "1.1rem", fontWeight: 700, cursor: isUploading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", boxShadow: "0 4px 12px var(--primary-glow)", transition: "all 0.2s" }}
                >
                  {isUploading ? "⚙️ Processing Batch..." : "✨ Extract Context from Batch"}
                </button>
              </div>
            )}
          </div>
          </div>

          {/* Staggered Results Stack */}
          {extractedDocuments.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxHeight: "800px", overflowY: "auto", paddingRight: "1rem" }}>
              {extractedDocuments.map((doc, idx) => (
                <div key={idx} className="glass-panel animate-slide-up" style={{ padding: "0" }}>
                  <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--glass-border)", background: "hsla(150, 70%, 40%, 0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.1rem", fontWeight: 700, color: "var(--success)" }}>
                      <span style={{ display: "inline-block", width: "10px", height: "10px", background: "var(--success)", borderRadius: "50%", boxShadow: "0 0 10px var(--success)" }}></span>
                      {doc.fileName || "Golden Truth Mapped"}
                    </h3>
                    {editingDocIdx !== idx && (
                      <button
                        type="button"
                        onClick={() => startEditingDoc(idx, doc)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "12px",
                          background: "var(--primary-glow)",
                          border: "1px solid var(--primary)",
                          color: "var(--primary)",
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        ✏️ Edit Mapped Data
                      </button>
                    )}
                  </div>
                  
                  <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {/* Source File Previews */}
                    {doc.files && doc.files.length > 0 && (
                      <div style={{ marginBottom: "0.5rem" }} className="animate-slide-up">
                        <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--primary)", marginBottom: "0.5rem", fontWeight: 700, opacity: 0.8 }}>Source Media (Active Session)</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {doc.files.map((file: File, fIdx: number) => (
                            <FilePreview key={fIdx} file={file} />
                          ))}
                        </div>
                      </div>
                    )}

                    {editingDocIdx === idx && editFormData ? (
                      /* Edit Mode Form fields */
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }} className="animate-slide-up">
                        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                          <div style={{ flex: 2, minWidth: "200px" }}>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.25rem", textTransform: "uppercase", opacity: 0.8 }}>Assessment Name</label>
                            <input
                              type="text"
                              value={editFormData.assessmentName || ''}
                              onChange={e => handleEditFormChange('assessmentName', e.target.value)}
                              style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }}
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: "100px" }}>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.25rem", textTransform: "uppercase", opacity: 0.8 }}>Version</label>
                            <input
                              type="text"
                              value={editFormData.assessmentVersion || ''}
                              onChange={e => handleEditFormChange('assessmentVersion', e.target.value)}
                              style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.25rem", textTransform: "uppercase", opacity: 0.8 }}>Behavioral Info</label>
                          <textarea
                            value={editFormData.behavioralInfo || ''}
                            onChange={e => handleEditFormChange('behavioralInfo', e.target.value)}
                            rows={3}
                            style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", resize: "vertical" }}
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.25rem", textTransform: "uppercase", opacity: 0.8 }}>Identified Strengths</label>
                          <textarea
                            value={editFormData.strengths || ''}
                            onChange={e => handleEditFormChange('strengths', e.target.value)}
                            rows={3}
                            style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", resize: "vertical" }}
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.25rem", textTransform: "uppercase", opacity: 0.8 }}>Core Needs & Deficits</label>
                          <textarea
                            value={editFormData.needs || ''}
                            onChange={e => handleEditFormChange('needs', e.target.value)}
                            rows={3}
                            style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", resize: "vertical" }}
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.25rem", textTransform: "uppercase", opacity: 0.8 }}>Key Takeaways</label>
                          <textarea
                            value={editFormData.takeaways || ''}
                            onChange={e => handleEditFormChange('takeaways', e.target.value)}
                            rows={3}
                            style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", resize: "vertical" }}
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.25rem", textTransform: "uppercase", opacity: 0.8 }}>Accommodations</label>
                          <textarea
                            value={editFormData.accommodations || ''}
                            onChange={e => handleEditFormChange('accommodations', e.target.value)}
                            rows={3}
                            style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", resize: "vertical" }}
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.25rem", textTransform: "uppercase", opacity: 0.8 }}>Uncertainties / Ambiguities</label>
                          <textarea
                            value={editFormData.uncertainties || ''}
                            onChange={e => handleEditFormChange('uncertainties', e.target.value)}
                            rows={2}
                            style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", resize: "vertical" }}
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.25rem", textTransform: "uppercase", opacity: 0.8 }}>Raw AI Interpretation Transcript</label>
                          <textarea
                            value={editFormData.rawTranscript || ''}
                            onChange={e => handleEditFormChange('rawTranscript', e.target.value)}
                            rows={4}
                            style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", resize: "vertical", fontFamily: "monospace", fontSize: "0.85rem" }}
                          />
                        </div>

                        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                          <button
                            type="button"
                            onClick={() => saveDocumentEdits(idx)}
                            style={{
                              flex: 1, padding: "0.75rem", borderRadius: "12px",
                              background: "var(--success)", border: "none", color: "white",
                              fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center",
                              justifyContent: "center", gap: "0.5rem", boxShadow: "0 4px 12px var(--success-glow)"
                            }}
                          >
                            💾 Save Corrections
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditingDocIdx(null); setEditFormData(null); }}
                            style={{
                              padding: "0.75rem 1.5rem", borderRadius: "12px",
                              background: "var(--surface)", border: "1px solid var(--border)",
                              color: "var(--foreground)", fontWeight: 650, cursor: "pointer"
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* View Mode */
                      <>
                        {doc.uncertainties && doc.uncertainties.toLowerCase() !== 'none' && (
                          <div style={{
                            padding: "1rem",
                            borderRadius: "12px",
                            background: "hsla(35, 100%, 50%, 0.1)",
                            border: "1px solid hsla(35, 100%, 50%, 0.3)",
                            color: "hsl(35, 100%, 45%)",
                            fontSize: "0.875rem",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "0.75rem",
                            marginBottom: "0.5rem"
                          }} className="animate-slide-up">
                            <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>⚠️</span>
                            <div>
                              <strong style={{ display: "block", marginBottom: "0.25rem" }}>AI Uncertainty / Ambiguity Note</strong>
                              <span style={{ opacity: 0.9 }}>{doc.uncertainties}</span>
                            </div>
                          </div>
                        )}

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

                        {doc.rawTranscript && (
                          <div className="animate-slide-up animate-delay-7" style={{ marginTop: "0.5rem" }}>
                            <button
                              type="button"
                              onClick={() => toggleTranscript(idx)}
                              style={{
                                padding: "6px 12px",
                                borderRadius: "12px",
                                background: "var(--surface)",
                                border: "1px solid var(--glass-border)",
                                color: "var(--foreground)",
                                fontWeight: 600,
                                fontSize: "0.8rem",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem"
                              }}
                            >
                              {expandedTranscripts[idx] ? "🔽 Hide Raw AI Interpretation Transcript" : "▶️ Show Raw AI Interpretation Transcript"}
                            </button>
                            
                            {expandedTranscripts[idx] && (
                              <div style={{
                                marginTop: "0.5rem",
                                padding: "1rem",
                                borderRadius: "12px",
                                background: "var(--background)",
                                border: "1px solid var(--border)",
                                fontSize: "0.85rem",
                                whiteSpace: "pre-wrap",
                                maxHeight: "300px",
                                overflowY: "auto",
                                fontFamily: "monospace",
                                color: "var(--foreground)",
                                opacity: 0.9
                              }} className="animate-slide-up">
                                {doc.rawTranscript}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
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
              disabled={isChatLoading || (user?.subscriptionStatus !== 'SUBSCRIBED' && appPromptCount >= 3)}
              placeholder={
                user?.subscriptionStatus !== 'SUBSCRIBED' && appPromptCount >= 3 
                  ? "Prompt limit reached (3/3). Upgrade in Settings to unlock unlimited messaging." 
                  : (extractedDocuments.length > 0 ? "E.g., Does the Assessment contradict the IEP's Needs?" : "E.g., What is an IEP timeline in Hawaii?")
              }
              style={{ flex: 1, minWidth: 0, padding: "0.75rem 1rem", borderRadius: "30px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", fontSize: "1rem", outline: "none", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)" }}
            />
            <button 
              type="submit" 
              disabled={isChatLoading || !chatInput.trim() || (user?.subscriptionStatus !== 'SUBSCRIBED' && appPromptCount >= 3)}
              style={{ flexShrink: 0, padding: "0 1.5rem", borderRadius: "30px", background: "var(--primary)", color: "white", fontWeight: 600, border: "none", cursor: (isChatLoading || !chatInput.trim() || (user?.subscriptionStatus !== 'SUBSCRIBED' && appPromptCount >= 3)) ? "not-allowed" : "pointer", opacity: (isChatLoading || !chatInput.trim() || (user?.subscriptionStatus !== 'SUBSCRIBED' && appPromptCount >= 3)) ? 0.7 : 1, transition: "all var(--transition-fast)", boxShadow: "0 4px 12px var(--primary-glow)" }}
            >
              Send
            </button>
          </form>
        </section>
      </div>
      
      {/* Footer Nav */}
      <footer style={{ position: "absolute", bottom: "1rem", width: "100%", textAlign: "center", opacity: 0.6, fontSize: "0.875rem" }}>
         <a href="/help" style={{ color: "var(--primary)", textDecoration: "underline", fontWeight: 600 }}>Access Resource Directory (HDRC/LDAH) &rarr;</a>
      </footer>

      {/* Camera Capture Modal Overlay */}
      {isCameraOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)",
          zIndex: 200, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: "2rem"
        }} onClick={stopCamera}>
          <div className="glass-panel animate-slide-up" style={{
            width: "100%", maxWidth: "640px", padding: "1.5rem",
            display: "flex", flexDirection: "column", gap: "1.5rem",
            background: "var(--surface)", border: "1px solid var(--glass-border)"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Live Camera Capture</h3>
              <button 
                onClick={stopCamera} 
                style={{ background: "transparent", border: "none", fontSize: "1.5rem", color: "var(--foreground)", cursor: "pointer" }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
              <button
                type="button"
                onClick={() => setCameraAspectRatio("letter")}
                style={{
                  padding: "6px 16px",
                  borderRadius: "20px",
                  background: cameraAspectRatio === "letter" ? "var(--primary)" : "var(--surface)",
                  border: "1px solid var(--border)",
                  color: cameraAspectRatio === "letter" ? "white" : "var(--foreground)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                📄 Letter (8.5&quot; x 11&quot;)
              </button>
              <button
                type="button"
                onClick={() => setCameraAspectRatio("legal")}
                style={{
                  padding: "6px 16px",
                  borderRadius: "20px",
                  background: cameraAspectRatio === "legal" ? "var(--primary)" : "var(--surface)",
                  border: "1px solid var(--border)",
                  color: cameraAspectRatio === "legal" ? "white" : "var(--foreground)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                📋 Legal (9:16)
              </button>
            </div>

            <div style={{
              position: "relative",
              width: "100%",
              maxWidth: "360px",
              margin: "0 auto",
              aspectRatio: cameraAspectRatio === "letter" ? "8.5/11" : "9/16",
              background: "#000",
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid var(--glass-border)",
              transition: "aspect-ratio 0.3s ease"
            }}>
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted 
                style={{ width: "100%", height: "100%", objectFit: "cover" }} 
              />
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                onClick={capturePhoto}
                style={{
                  flex: 2, padding: "1rem", borderRadius: "12px",
                  background: "var(--primary)", border: "none",
                  color: "white", fontWeight: 700, fontSize: "1rem",
                  cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: "0.5rem",
                  boxShadow: "0 4px 12px var(--primary-glow)"
                }}
              >
                📸 Capture Photo
              </button>
              <button
                onClick={stopCamera}
                style={{
                  flex: 1, padding: "1rem", borderRadius: "12px",
                  background: "var(--surface)", border: "1px solid var(--border)",
                  color: "var(--foreground)", fontWeight: 650, fontSize: "1rem",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
