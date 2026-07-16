"use client";
import React, { useState, useRef, useEffect } from "react";
import Navbar from "@/app/components/Navbar";

interface Video {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  type: string;
  category: string;
  duration: string;
  releasedAt: string;
}

interface Post {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  date: string;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  fileName: string;
}

interface Coupon {
  id: string;
  code: string;
  isActive: boolean;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  applicablePlan: string;
  isOneTimeUse: boolean;
  deployedTo: string;
}

export default function AdminPage() {
  const [passcode, setPasscode] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<"post" | "resource" | "video" | "coupon" | "faq">("post");
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

  // Video Form State
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoUrlOrId, setVideoUrlOrId] = useState("");
  const [videoType, setVideoType] = useState<"video" | "short">("video");
  const [videoCategory, setVideoCategory] = useState("Parent Rights"); // default to Parent Rights
  const [videoDuration, setVideoDuration] = useState("10:00");
  const [videoReleasedAt, setVideoReleasedAt] = useState(() => {
    const d = new Date();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  });
  const [showAdvancedVideo, setShowAdvancedVideo] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);

  // Tutorial Video Form State
  const [tutVideoTitle, setTutVideoTitle] = useState("");
  const [tutVideoDescription, setTutVideoDescription] = useState("");
  const [tutVideoUrlOrId, setTutVideoUrlOrId] = useState("");
  const [tutVideoType, setTutVideoType] = useState<"video" | "short">("video");

  // FAQ Form State
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [faqs, setFaqs] = useState<any[]>([]);

  // Coupon Form State
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscountType, setCouponDiscountType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [couponDiscountValue, setCouponDiscountValue] = useState(100);
  const [selectedCouponPlans, setSelectedCouponPlans] = useState<string[]>([]);
  const [couponIsOneTimeUse, setCouponIsOneTimeUse] = useState(true);
  const [couponDeployedTo, setCouponDeployedTo] = useState("");
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchVideos = async () => {
    try {
      const res = await fetch("/api/videos");
      const data = await res.json();
      if (res.ok) {
        setVideos(data.videos || []);
      }
    } catch (err) {
      console.error("Failed to fetch videos in admin panel:", err);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/posts");
      const data = await res.json();
      if (res.ok) {
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error("Failed to fetch posts in admin panel:", err);
    }
  };

  const fetchResources = async () => {
    try {
      const res = await fetch("/api/downloads");
      const data = await res.json();
      if (res.ok) {
        setResources(data.resources || []);
      }
    } catch (err) {
      console.error("Failed to fetch resources in admin panel:", err);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/coupons");
      const data = await res.json();
      if (res.ok) {
        setCoupons(data.coupons || []);
      }
    } catch (err) {
      console.error("Failed to fetch coupons in admin panel:", err);
    }
  };
  const fetchFaqs = async () => {
    try {
      const res = await fetch("/api/faqs");
      const data = await res.json();
      if (res.ok) {
        setFaqs(data.faqs || []);
      }
    } catch (err) {
      console.error("Failed to fetch FAQs in admin panel:", err);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchVideos();
      fetchPosts();
      fetchResources();
      fetchCoupons();
      fetchFaqs();
    }
  }, [isAuthorized]);

  const handleCreateTutorialVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!tutVideoTitle || !tutVideoDescription || !tutVideoUrlOrId) {
      setStatus({ type: "error", message: "Please fill in all required fields." });
      return;
    }

    // Dynamic release date month
    const d = new Date();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const releasedAt = `${months[d.getMonth()]} ${d.getFullYear()}`;

    // Extract youtube video ID if URL is provided
    let finalVideoId = tutVideoUrlOrId.trim();
    if (finalVideoId.includes("youtube.com") || finalVideoId.includes("youtu.be")) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = finalVideoId.match(regExp);
      if (match && match[2].length === 11) {
        finalVideoId = match[2];
      }
    }

    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": passcode,
        },
        body: JSON.stringify({
          title: tutVideoTitle,
          description: tutVideoDescription,
          youtubeUrlOrId: finalVideoId,
          type: tutVideoType,
          category: "Tutorials",
          duration: "10:00", // Default duration placeholder
          releasedAt,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to publish video tutorial");
      }

      setStatus({ type: "success", message: "Video tutorial published successfully!" });
      // Clear inputs
      setTutVideoTitle("");
      setTutVideoDescription("");
      setTutVideoUrlOrId("");
      fetchVideos();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to publish video tutorial.";
      setStatus({ type: "error", message });
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this video?")) return;
    try {
      const res = await fetch(`/api/videos?id=${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-passcode": passcode,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete video");
      }
      setStatus({ type: "success", message: "Video deleted successfully." });
      setTimeout(() => setStatus(null), 3000);
      fetchVideos();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to delete video.";
      setStatus({ type: "error", message });
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this educational article?")) return;
    try {
      const res = await fetch(`/api/posts?id=${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-passcode": passcode,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete article");
      }
      setStatus({ type: "success", message: "Educational article deleted successfully." });
      setTimeout(() => setStatus(null), 3000);
      fetchPosts();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to delete article.";
      setStatus({ type: "error", message });
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this toolkit resource?")) return;
    try {
      const res = await fetch(`/api/downloads?id=${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-passcode": passcode,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete resource");
      }
      setStatus({ type: "success", message: "Downloadable resource deleted successfully." });
      setTimeout(() => setStatus(null), 3000);
      fetchResources();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to delete resource.";
      setStatus({ type: "error", message });
    }
  };

  const handleCreateFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (!faqQuestion || !faqAnswer) {
      setStatus({ type: "error", message: "Question and Answer are required." });
      return;
    }
    try {
      const res = await fetch("/api/faqs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": passcode,
        },
        body: JSON.stringify({ question: faqQuestion, answer: faqAnswer })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create FAQ");
      }
      setStatus({ type: "success", message: "FAQ published successfully!" });
      setFaqQuestion("");
      setFaqAnswer("");
      fetchFaqs();
    } catch (err: any) {
      setStatus({ type: "error", message: err.message || "Failed to create FAQ." });
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      const res = await fetch(`/api/faqs?id=${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-passcode": passcode,
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete FAQ");
      }
      setStatus({ type: "success", message: "FAQ deleted successfully." });
      fetchFaqs();
    } catch (err: any) {
      setStatus({ type: "error", message: err.message || "Failed to delete FAQ." });
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!couponCode) {
      setStatus({ type: "error", message: "Please enter a coupon code." });
      return;
    }

    try {
      const planValue = selectedCouponPlans.length > 0 ? selectedCouponPlans.join(",") : "ALL";
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": passcode,
        },
        body: JSON.stringify({
          code: couponCode,
          discountType: couponDiscountType,
          discountValue: Number(couponDiscountValue),
          applicablePlan: planValue,
          isOneTimeUse: couponIsOneTimeUse,
          deployedTo: couponDeployedTo,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create coupon");
      }

      setStatus({ type: "success", message: `Coupon ${couponCode.toUpperCase()} created successfully!` });
      setCouponCode("");
      setCouponDiscountType("PERCENT");
      setCouponDiscountValue(100);
      setSelectedCouponPlans([]);
      setCouponIsOneTimeUse(true);
      setCouponDeployedTo("");
      fetchCoupons();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to create coupon.";
      setStatus({ type: "error", message });
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      const res = await fetch(`/api/coupons?id=${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-passcode": passcode,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete coupon");
      }
      setStatus({ type: "success", message: "Coupon deleted successfully." });
      setTimeout(() => setStatus(null), 3000);
      fetchCoupons();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to delete coupon.";
      setStatus({ type: "error", message });
    }
  };

  const handleToggleCouponStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/coupons", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": passcode,
        },
        body: JSON.stringify({
          id,
          isActive: !currentStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update coupon status");
      }
      setStatus({ type: "success", message: "Coupon status updated." });
      setTimeout(() => setStatus(null), 3000);
      fetchCoupons();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to update status.";
      setStatus({ type: "error", message });
    }
  };

  const handleUpdateCouponDiscount = async (id: string, currentType: "PERCENT" | "FIXED", currentValue: number) => {
    const newTypeStr = window.prompt("Enter discount type (PERCENT or FIXED):", currentType);
    if (newTypeStr === null) return;
    const cleanType = newTypeStr.trim().toUpperCase();
    if (cleanType !== "PERCENT" && cleanType !== "FIXED") {
      alert("Invalid type. Must be PERCENT or FIXED.");
      return;
    }

    const newValueStr = window.prompt(`Enter new discount amount/percentage for ${cleanType}:`, currentValue.toString());
    if (newValueStr === null) return;
    const newValue = parseFloat(newValueStr);
    if (isNaN(newValue) || newValue < 0 || (cleanType === "PERCENT" && newValue > 100)) {
      alert("Please enter a valid non-negative number (0-100 for PERCENT).");
      return;
    }

    try {
      const res = await fetch("/api/coupons", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": passcode,
        },
        body: JSON.stringify({
          id,
          discountType: cleanType,
          discountValue: newValue,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update discount");
      }
      setStatus({ type: "success", message: "Coupon discount updated." });
      setTimeout(() => setStatus(null), 3000);
      fetchCoupons();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to update discount.";
      setStatus({ type: "error", message });
    }
  };

  const handleUpdateCouponPlan = async (id: string, currentPlan: string) => {
    const newPlanStr = window.prompt("Enter applicable plan(s) (ALL, MONTHLY, THREE_MONTH, or ANNUAL; separate multiple with commas):", currentPlan);
    if (newPlanStr === null) return;
    const cleanPlan = newPlanStr.trim().toUpperCase();
    const VALID_PLANS = ["ALL", "MONTHLY", "THREE_MONTH", "ANNUAL"];
    const inputPlans = cleanPlan.split(",").map(p => p.trim());
    const allValid = inputPlans.every(p => VALID_PLANS.includes(p));
    if (!allValid) {
      alert("Invalid plan list. Allowed plans are: ALL, MONTHLY, THREE_MONTH, and ANNUAL.");
      return;
    }

    try {
      const res = await fetch("/api/coupons", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": passcode,
        },
        body: JSON.stringify({
          id,
          applicablePlan: cleanPlan,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update applicable plan");
      }
      setStatus({ type: "success", message: "Coupon applicable plan updated." });
      setTimeout(() => setStatus(null), 3000);
      fetchCoupons();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to update plan.";
      setStatus({ type: "error", message });
    }
  };

  const handleUpdateCouponDeployment = async (id: string, currentDeployment: string) => {
    const newDeployment = window.prompt("Update where/how this coupon is deployed:", currentDeployment);
    if (newDeployment === null) return;
    try {
      const res = await fetch("/api/coupons", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": passcode,
        },
        body: JSON.stringify({
          id,
          deployedTo: newDeployment.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update deployment info");
      }
      setStatus({ type: "success", message: "Coupon deployment info updated." });
      setTimeout(() => setStatus(null), 3000);
      fetchCoupons();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to update deployment.";
      setStatus({ type: "error", message });
    }
  };

  const handleVideoUrlChange = (val: string) => {
    setVideoUrlOrId(val);
    if (val.toLowerCase().includes("shorts")) {
      setVideoType("short");
      setVideoDuration("0:59");
    } else {
      setVideoType("video");
      setVideoDuration("10:00");
    }
  };

  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "graditide" || passcode === "gratitude") {
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
      fetchPosts();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setStatus({ type: "error", message });
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
      fetchResources();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setStatus({ type: "error", message });
    }
  };

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!videoTitle || !videoDescription || !videoUrlOrId || !videoCategory || !videoDuration || !videoReleasedAt) {
      setStatus({ type: "error", message: "Please fill in all required fields." });
      return;
    }

    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": passcode,
        },
        body: JSON.stringify({
          title: videoTitle,
          description: videoDescription,
          youtubeUrlOrId: videoUrlOrId,
          type: videoType,
          category: videoCategory,
          duration: videoDuration,
          releasedAt: videoReleasedAt,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload video");
      }

      setStatus({ type: "success", message: "Advocacy video published successfully!" });
      // Clear inputs
      setVideoTitle("");
      setVideoDescription("");
      setVideoUrlOrId("");
      setVideoDuration("10:00");
      fetchVideos();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setStatus({ type: "error", message });
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
                placeholder="Enter passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 18px",
                  borderRadius: "8px",
                  border: "1px solid rgba(0, 0, 0, 0.25)",
                  background: "#ffffff",
                  color: "#000000",
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
              <button
                onClick={() => { setActiveTab("video"); setStatus(null); }}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "transparent",
                  border: "none",
                  borderBottom: activeTab === "video" ? "3px solid var(--primary)" : "3px solid transparent",
                  color: activeTab === "video" ? "var(--primary)" : "var(--foreground)",
                  fontWeight: 700,
                  fontSize: "1.05rem",
                  cursor: "pointer",
                  opacity: activeTab === "video" ? 1 : 0.6,
                  transition: "all 0.2s"
                }}
              >
                🎬 Publish Video
              </button>
              <button
                onClick={() => { setActiveTab("faq"); setStatus(null); }}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "transparent",
                  border: "none",
                  borderBottom: activeTab === "faq" ? "3px solid var(--primary)" : "3px solid transparent",
                  color: activeTab === "faq" ? "var(--primary)" : "var(--foreground)",
                  fontWeight: 700,
                  fontSize: "1.05rem",
                  cursor: "pointer",
                  opacity: activeTab === "faq" ? 1 : 0.6,
                  transition: "all 0.2s"
                }}
              >
                📋 Publish Tutorials & FAQs
              </button>
              <button
                onClick={() => { setActiveTab("coupon"); setStatus(null); }}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "transparent",
                  border: "none",
                  borderBottom: activeTab === "coupon" ? "3px solid var(--primary)" : "3px solid transparent",
                  color: activeTab === "coupon" ? "var(--primary)" : "var(--foreground)",
                  fontWeight: 700,
                  fontSize: "1.05rem",
                  cursor: "pointer",
                  opacity: activeTab === "coupon" ? 1 : 0.6,
                  transition: "all 0.2s"
                }}
              >
                🎟️ Coupons
              </button>
            </div>

            {/* Tab Panels */}
            {activeTab === "post" ? (
              <div>
                {/* Post Form */}
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
                        border: "1px solid rgba(0, 0, 0, 0.25)",
                        background: "#ffffff",
                        color: "#000000",
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
                          border: "1px solid rgba(0, 0, 0, 0.25)",
                          background: "#ffffff",
                          color: "#000000",
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
                          border: "1px solid rgba(0, 0, 0, 0.25)",
                          background: "#ffffff",
                          color: "#000000",
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
                        border: "1px solid rgba(0, 0, 0, 0.25)",
                        background: "#ffffff",
                        color: "#000000",
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
                        border: "1px solid rgba(0, 0, 0, 0.25)",
                        background: "#ffffff",
                        color: "#000000",
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

                <hr style={{ border: "none", borderTop: "1px solid var(--glass-border)", margin: "3rem 0" }} />

                <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--secondary)" }}>
                  📋 Manage Published Articles
                </h3>
                {posts.length === 0 ? (
                  <p style={{ opacity: 0.6, fontStyle: "italic" }}>No educational articles found in the database.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {posts.map((post) => (
                      <div 
                        key={post.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "1rem",
                          borderRadius: "8px",
                          background: "rgba(255, 255, 255, 0.02)",
                          border: "1px solid var(--glass-border)",
                          gap: "1.5rem"
                        }}
                      >
                        <div>
                          <h4 style={{ fontWeight: 600, margin: 0, fontSize: "1rem" }}>{post.title}</h4>
                          <p style={{ fontSize: "0.8rem", opacity: 0.6, margin: "2px 0 0" }}>
                            Category: {post.category} | Date: {post.date}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          style={{
                            padding: "6px 14px",
                            borderRadius: "20px",
                            border: "1px solid rgba(239, 68, 68, 0.4)",
                            background: "rgba(239, 68, 68, 0.1)",
                            color: "#f87171",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            transition: "all 0.2s",
                            flexShrink: 0
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = "#ef4444";
                            e.currentTarget.style.color = "white";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                            e.currentTarget.style.color = "#f87171";
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === "resource" ? (
              <div>
                {/* Resource Form */}
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
                        border: "1px solid rgba(0, 0, 0, 0.25)",
                        background: "#ffffff",
                        color: "#000000",
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
                        border: "1px solid rgba(0, 0, 0, 0.25)",
                        background: "#ffffff",
                        color: "#000000",
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
                        border: "1px solid rgba(0, 0, 0, 0.25)",
                        background: "#ffffff",
                        color: "#000000",
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
                        border: "1px solid rgba(0, 0, 0, 0.25)",
                        background: "#ffffff",
                        color: "#000000",
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

                <hr style={{ border: "none", borderTop: "1px solid var(--glass-border)", margin: "3rem 0" }} />

                <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--secondary)" }}>
                  📋 Manage Published Toolkit Resources
                </h3>
                {resources.length === 0 ? (
                  <p style={{ opacity: 0.6, fontStyle: "italic" }}>No toolkit resources found in the database.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {resources.map((res) => (
                      <div 
                        key={res.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "1rem",
                          borderRadius: "8px",
                          background: "rgba(255, 255, 255, 0.02)",
                          border: "1px solid var(--glass-border)",
                          gap: "1.5rem"
                        }}
                      >
                        <div>
                          <h4 style={{ fontWeight: 600, margin: 0, fontSize: "1rem" }}>{res.title}</h4>
                          <p style={{ fontSize: "0.8rem", opacity: 0.6, margin: "2px 0 0" }}>
                            File Name: <code style={{ background: "rgba(0,0,0,0.2)", padding: "2px 4px", borderRadius: "4px" }}>{res.fileName}</code>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteResource(res.id)}
                          style={{
                            padding: "6px 14px",
                            borderRadius: "20px",
                            border: "1px solid rgba(239, 68, 68, 0.4)",
                            background: "rgba(239, 68, 68, 0.1)",
                            color: "#f87171",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            transition: "all 0.2s",
                            flexShrink: 0
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = "#ef4444";
                            e.currentTarget.style.color = "white";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                            e.currentTarget.style.color = "#f87171";
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === "video" ? (
              <div>
                {/* Video Form */}
                <form onSubmit={handleCreateVideo}>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label htmlFor="video-title" style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", opacity: 0.8 }}>
                    Video Title *
                  </label>
                  <input 
                    id="video-title"
                    type="text" 
                    placeholder="e.g. Prior Written Notice (PWN) Proposal Examples"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(0, 0, 0, 0.25)",
                      background: "#ffffff",
                      color: "#000000",
                      fontSize: "0.95rem"
                    }}
                  />
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label htmlFor="video-desc" style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", opacity: 0.8 }}>
                    Description * (Brief summary of what is covered in the video)
                  </label>
                  <input 
                    id="video-desc"
                    type="text" 
                    placeholder="e.g. How to use a PWN proposal to lock in promised services at the IEP table."
                    value={videoDescription}
                    onChange={(e) => setVideoDescription(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(0, 0, 0, 0.25)",
                      background: "#ffffff",
                      color: "#000000",
                      fontSize: "0.95rem"
                    }}
                  />
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label htmlFor="video-url" style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", opacity: 0.8 }}>
                    YouTube Video URL or ID * (e.g., https://youtu.be/ysz5S6PUM-U or just ysz5S6PUM-U)
                  </label>
                  <input 
                    id="video-url"
                    type="text" 
                    placeholder="e.g. https://www.youtube.com/watch?v=ysz5S6PUM-U"
                    value={videoUrlOrId}
                    onChange={(e) => handleVideoUrlChange(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(0, 0, 0, 0.25)",
                      background: "#ffffff",
                      color: "#000000",
                      fontSize: "0.95rem"
                    }}
                  />
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label htmlFor="video-type" style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", opacity: 0.8 }}>
                    Video Orientation / Format *
                  </label>
                  <select
                    id="video-type"
                    value={videoType}
                    onChange={(e) => setVideoType(e.target.value as "video" | "short")}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(0, 0, 0, 0.25)",
                      background: "#ffffff",
                      color: "#000000",
                      fontSize: "0.95rem"
                    }}
                  >
                    <option value="video">Landscape Format (16:9)</option>
                    <option value="short">Portrait Format (9:16 Short)</option>
                  </select>
                </div>

                {/* Collapsible Advanced Settings (Optional) */}
                <button
                  type="button"
                  onClick={() => setShowAdvancedVideo(!showAdvancedVideo)}
                  style={{
                    display: "block",
                    background: "transparent",
                    border: "none",
                    color: "var(--primary)",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    marginBottom: "1.5rem",
                    textDecoration: "underline",
                    padding: 0
                  }}
                >
                  {showAdvancedVideo ? "⚙️ Hide Advanced Settings (Optional)" : "⚙️ Show Advanced Settings (Optional)"}
                </button>

                {showAdvancedVideo && (
                  <div className="animate-slide-up" style={{ padding: "1.5rem", borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px dashed var(--glass-border)", marginBottom: "2rem" }}>
                    <div style={{ marginBottom: "1.5rem" }}>
                      <div>
                        <label htmlFor="video-category" style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", opacity: 0.8 }}>
                          Topic Category *
                        </label>
                        <select
                          id="video-category"
                          value={videoCategory}
                          onChange={(e) => setVideoCategory(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "8px",
                            border: "1px solid rgba(0, 0, 0, 0.25)",
                            background: "#ffffff",
                            color: "#000000",
                            fontSize: "0.95rem"
                          }}
                        >
                          <option value="IEP Timelines">IEP Timelines</option>
                          <option value="HAR Chapter 60">HAR Chapter 60</option>
                          <option value="SMART Goals">SMART Goals</option>
                          <option value="PWNs">PWNs</option>
                          <option value="Parent Rights">Parent Rights</option>
                          <option value="Tutorials">Tutorials</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                      <div>
                        <label htmlFor="video-duration" style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", opacity: 0.8 }}>
                          Duration * (e.g., 0:58 or 12:30)
                        </label>
                        <input 
                          id="video-duration"
                          type="text" 
                          placeholder="e.g. 10:15"
                          value={videoDuration}
                          onChange={(e) => setVideoDuration(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "8px",
                            border: "1px solid rgba(0, 0, 0, 0.25)",
                            background: "#ffffff",
                            color: "#000000",
                            fontSize: "0.95rem"
                          }}
                        />
                      </div>
                      <div>
                        <label htmlFor="video-released-at" style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", opacity: 0.8 }}>
                          Release Date * (e.g., June 12, 2026)
                        </label>
                        <input 
                          id="video-released-at"
                          type="text" 
                          value={videoReleasedAt}
                          onChange={(e) => setVideoReleasedAt(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "8px",
                            border: "1px solid rgba(0, 0, 0, 0.25)",
                            background: "#ffffff",
                            color: "#000000",
                            fontSize: "0.95rem"
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

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
                  Publish Video
                </button>
              </form>

              <hr style={{ border: "none", borderTop: "1px solid var(--glass-border)", margin: "3rem 0" }} />

              <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--secondary)" }}>
                📋 Manage Published Videos
              </h3>
              {videos.length === 0 ? (
                <p style={{ opacity: 0.6, fontStyle: "italic" }}>No videos found in the database.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {videos.map((vid) => (
                    <div 
                      key={vid.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "1rem",
                        borderRadius: "8px",
                        background: "rgba(255, 255, 255, 0.02)",
                        border: "1px solid var(--glass-border)",
                        gap: "1.5rem"
                      }}
                    >
                      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                        <div style={{ position: "relative", width: "80px", height: "45px", background: "#000", borderRadius: "4px", overflow: "hidden", flexShrink: 0 }}>
                          <img 
                            src={`https://img.youtube.com/vi/${vid.youtubeId}/mqdefault.jpg`} 
                            alt={vid.title} 
                            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }}
                          />
                        </div>
                        <div>
                          <h4 style={{ fontWeight: 600, margin: 0, fontSize: "1rem" }}>{vid.title}</h4>
                          <p style={{ fontSize: "0.8rem", opacity: 0.6, margin: "2px 0 0" }}>
                            ID: <code style={{ background: "rgba(0,0,0,0.2)", padding: "2px 4px", borderRadius: "4px" }}>{vid.youtubeId}</code> | Type: <span style={{ textTransform: "capitalize" }}>{vid.type}</span> | Topic: {vid.category}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteVideo(vid.id)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "20px",
                          border: "1px solid rgba(239, 68, 68, 0.4)",
                          background: "rgba(239, 68, 68, 0.1)",
                          color: "#f87171",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          transition: "all 0.2s",
                          flexShrink: 0
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = "#ef4444";
                          e.currentTarget.style.color = "white";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                          e.currentTarget.style.color = "#f87171";
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
             </div>
          ) : activeTab === "faq" ? (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "3rem" }}>
                {/* Tutorial Video Form */}
                <div style={{ background: "rgba(255, 255, 255, 0.01)", border: "1px solid var(--glass-border)", padding: "1.5rem", borderRadius: "12px" }}>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--primary)" }}>🎬 Publish Video Tutorial</h3>
                  <form onSubmit={handleCreateTutorialVideo}>
                    <div style={{ marginBottom: "1rem" }}>
                      <label htmlFor="tut-video-title" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", opacity: 0.8 }}>
                        Video Title *
                      </label>
                      <input 
                        id="tut-video-title"
                        type="text" 
                        placeholder="e.g. Chapter 60 IEP Timeline Walkthrough"
                        value={tutVideoTitle}
                        onChange={(e) => setTutVideoTitle(e.target.value)}
                        style={{
                          width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid rgba(0, 0, 0, 0.25)",
                          background: "#ffffff", color: "#000000", fontSize: "0.9rem"
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: "1rem" }}>
                      <label htmlFor="tut-video-desc" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", opacity: 0.8 }}>
                        Description *
                      </label>
                      <input 
                        id="tut-video-desc"
                        type="text" 
                        placeholder="e.g. A visual walkthrough of the 60-day evaluation timeline rule in Hawaii."
                        value={tutVideoDescription}
                        onChange={(e) => setTutVideoDescription(e.target.value)}
                        style={{
                          width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid rgba(0, 0, 0, 0.25)",
                          background: "#ffffff", color: "#000000", fontSize: "0.9rem"
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: "1rem" }}>
                      <label htmlFor="tut-video-url" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", opacity: 0.8 }}>
                        YouTube URL or ID *
                      </label>
                      <input 
                        id="tut-video-url"
                        type="text" 
                        placeholder="e.g. https://youtu.be/ysz5S6PUM-U"
                        value={tutVideoUrlOrId}
                        onChange={(e) => setTutVideoUrlOrId(e.target.value)}
                        style={{
                          width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid rgba(0, 0, 0, 0.25)",
                          background: "#ffffff", color: "#000000", fontSize: "0.9rem"
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: "1.5rem" }}>
                      <label htmlFor="tut-video-type" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", opacity: 0.8 }}>
                        Video Orientation / Format *
                      </label>
                      <select
                        id="tut-video-type"
                        value={tutVideoType}
                        onChange={(e) => setTutVideoType(e.target.value as "video" | "short")}
                        style={{
                          width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid rgba(0, 0, 0, 0.25)",
                          background: "#ffffff", color: "#000000", fontSize: "0.9rem", cursor: "pointer"
                        }}
                      >
                        <option value="video">Landscape Format (16:9)</option>
                        <option value="short">Portrait Format (9:16 Shorts)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      style={{
                        width: "100%", padding: "12px", borderRadius: "6px", background: "var(--primary)",
                        color: "white", fontWeight: 700, fontSize: "0.95rem", border: "none", cursor: "pointer"
                      }}
                    >
                      Publish Video Tutorial
                    </button>
                  </form>
                </div>

                {/* FAQ Form */}
                <div style={{ background: "rgba(255, 255, 255, 0.01)", border: "1px solid var(--glass-border)", padding: "1.5rem", borderRadius: "12px" }}>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--primary)" }}>📋 Publish FAQ Item</h3>
                  <form onSubmit={handleCreateFaq}>
                    <div style={{ marginBottom: "1rem" }}>
                      <label htmlFor="faq-question" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", opacity: 0.8 }}>
                        FAQ Question *
                      </label>
                      <input 
                        id="faq-question"
                        type="text" 
                        placeholder="e.g. What is stay-put under HAR Chapter 60?"
                        value={faqQuestion}
                        onChange={(e) => setFaqQuestion(e.target.value)}
                        style={{
                          width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid rgba(0, 0, 0, 0.25)",
                          background: "#ffffff", color: "#000000", fontSize: "0.9rem"
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: "2.35rem" }}>
                      <label htmlFor="faq-answer" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", opacity: 0.8 }}>
                        FAQ Answer *
                      </label>
                      <textarea 
                        id="faq-answer"
                        placeholder="e.g. Stay-put is a legal safeguard that prevents the school from changing services..."
                        value={faqAnswer}
                        onChange={(e) => setFaqAnswer(e.target.value)}
                        rows={6}
                        style={{
                          width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid rgba(0, 0, 0, 0.25)",
                          background: "#ffffff", color: "#000000", fontSize: "0.9rem", resize: "vertical"
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      style={{
                        width: "100%", padding: "12px", borderRadius: "6px", background: "var(--primary)",
                        color: "white", fontWeight: 700, fontSize: "0.95rem", border: "none", cursor: "pointer"
                      }}
                    >
                      Publish FAQ Item
                    </button>
                  </form>
                </div>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid var(--glass-border)", margin: "3rem 0" }} />

              {/* Manage Section */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                {/* List of Video Tutorials */}
                <div>
                  <h3 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--secondary)" }}>
                    🎬 Published Video Tutorials
                  </h3>
                  {videos.filter(v => v.category === "Tutorials").length === 0 ? (
                    <p style={{ opacity: 0.6, fontStyle: "italic" }}>No video tutorials found in the database.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {videos.filter(v => v.category === "Tutorials").map((video) => (
                        <div 
                          key={video.id}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "1rem", borderRadius: "8px", background: "rgba(255, 255, 255, 0.02)",
                            border: "1px solid var(--glass-border)", gap: "1rem"
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ fontWeight: 700, margin: 0, fontSize: "1rem", color: "var(--primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {video.title}
                            </h4>
                            <p style={{ margin: "2px 0 0", fontSize: "0.8rem", opacity: 0.6 }}>
                              Format: {video.type === "short" ? "Portrait (9:16 Short)" : "Landscape (16:9 Video)"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteVideo(video.id)}
                            style={{
                              padding: "4px 10px", borderRadius: "12px", border: "1px solid rgba(239, 68, 68, 0.4)",
                              background: "rgba(239, 68, 68, 0.1)", color: "#f87171", cursor: "pointer",
                              fontSize: "0.75rem", fontWeight: 600, flexShrink: 0
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* List of FAQs */}
                <div>
                  <h3 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--secondary)" }}>
                    📋 Published FAQs
                  </h3>
                  {faqs.length === 0 ? (
                    <p style={{ opacity: 0.6, fontStyle: "italic" }}>No FAQs found in the database.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {faqs.map((faq) => (
                        <div 
                          key={faq.id}
                          style={{
                            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                            padding: "1rem", borderRadius: "8px", background: "rgba(255, 255, 255, 0.02)",
                            border: "1px solid var(--glass-border)", gap: "1rem"
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <h4 style={{ fontWeight: 700, margin: 0, fontSize: "1rem", color: "var(--primary)" }}>Q: {faq.question}</h4>
                            <p style={{ margin: "4px 0 0", fontSize: "0.85rem", opacity: 0.7, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              A: {faq.answer}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteFaq(faq.id)}
                            style={{
                              padding: "4px 10px", borderRadius: "12px", border: "1px solid rgba(239, 68, 68, 0.4)",
                              background: "rgba(239, 68, 68, 0.1)", color: "#f87171", cursor: "pointer",
                              fontSize: "0.75rem", fontWeight: 600, flexShrink: 0
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Coupon Form */}
              <form onSubmit={handleCreateCoupon}>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label htmlFor="coupon-code" style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", opacity: 0.8 }}>
                    Coupon Code * (e.g. ALOHA_50)
                  </label>
                  <input 
                    id="coupon-code"
                    type="text" 
                    placeholder="e.g. STICKER_QR_20"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(0, 0, 0, 0.25)",
                      background: "#ffffff",
                      color: "#000000",
                      fontSize: "0.95rem"
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                  <div>
                    <label htmlFor="coupon-discount-type" style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", opacity: 0.8 }}>
                      Discount Type *
                    </label>
                    <select
                      id="coupon-discount-type"
                      value={couponDiscountType}
                      onChange={(e) => setCouponDiscountType(e.target.value as "PERCENT" | "FIXED")}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid rgba(0, 0, 0, 0.25)",
                        background: "#ffffff",
                        color: "#000000",
                        fontSize: "0.95rem"
                      }}
                    >
                      <option value="PERCENT">Percentage Off (%)</option>
                      <option value="FIXED">Fixed Amount ($)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="coupon-discount-value" style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", opacity: 0.8 }}>
                      Discount Value * ({couponDiscountType === "PERCENT" ? "0-100%" : "Dollar Amount"})
                    </label>
                    <input 
                      id="coupon-discount-value"
                      type="number" 
                      min="0"
                      max={couponDiscountType === "PERCENT" ? "100" : undefined}
                      step="any"
                      value={couponDiscountValue}
                      onChange={(e) => setCouponDiscountValue(Number(e.target.value))}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid rgba(0, 0, 0, 0.25)",
                        background: "#ffffff",
                        color: "#000000",
                        fontSize: "0.95rem"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", opacity: 0.8 }}>
                      Applicable Plan(s) * (Select one or more; none implies ALL)
                    </label>
                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", padding: "8px 0" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.9rem", cursor: "pointer", color: "#000000" }}>
                        <input
                          type="checkbox"
                          checked={selectedCouponPlans.includes("MONTHLY")}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCouponPlans(prev => [...prev, "MONTHLY"]);
                            } else {
                              setSelectedCouponPlans(prev => prev.filter(x => x !== "MONTHLY"));
                            }
                          }}
                        />
                        Monthly
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.9rem", cursor: "pointer", color: "#000000" }}>
                        <input
                          type="checkbox"
                          checked={selectedCouponPlans.includes("THREE_MONTH")}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCouponPlans(prev => [...prev, "THREE_MONTH"]);
                            } else {
                              setSelectedCouponPlans(prev => prev.filter(x => x !== "THREE_MONTH"));
                            }
                          }}
                        />
                        3-Month
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.9rem", cursor: "pointer", color: "#000000" }}>
                        <input
                          type="checkbox"
                          checked={selectedCouponPlans.includes("ANNUAL")}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCouponPlans(prev => [...prev, "ANNUAL"]);
                            } else {
                              setSelectedCouponPlans(prev => prev.filter(x => x !== "ANNUAL"));
                            }
                          }}
                        />
                        Annual
                      </label>
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                  <div>
                    <label htmlFor="coupon-deployment" style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", opacity: 0.8 }}>
                      Deployed To (e.g. sticker, flyer)
                    </label>
                    <input 
                      id="coupon-deployment"
                      type="text" 
                      placeholder="e.g. Sticker QR Code"
                      value={couponDeployedTo}
                      onChange={(e) => setCouponDeployedTo(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid rgba(0, 0, 0, 0.25)",
                        background: "#ffffff",
                        color: "#000000",
                        fontSize: "0.95rem"
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", paddingTop: "1.5rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", color: "#000000" }}>
                      <input 
                        type="checkbox"
                        checked={couponIsOneTimeUse}
                        onChange={(e) => setCouponIsOneTimeUse(e.target.checked)}
                        style={{ width: "16px", height: "16px" }}
                      />
                      One-Time Use Only
                    </label>
                  </div>
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
                    boxShadow: "0 4px 14px var(--primary-glow)",
                    marginBottom: "2rem"
                  }}
                >
                  Create Coupon Code
                </button>
              </form>

              <hr style={{ border: "none", borderTop: "1px solid var(--glass-border)", margin: "3rem 0" }} />

              <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--secondary)" }}>
                🎟️ Manage Coupon Codes
              </h3>
              {coupons.length === 0 ? (
                <p style={{ opacity: 0.6, fontStyle: "italic" }}>No coupon codes found in the database.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                  {coupons.map((coupon) => (
                    <div 
                      key={coupon.id}
                      style={{
                        padding: "1.25rem",
                        borderRadius: "12px",
                        background: "rgba(255, 255, 255, 0.02)",
                        border: "1px solid var(--glass-border)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <span style={{ 
                              fontWeight: 800, 
                              fontSize: "1.2rem", 
                              color: coupon.isActive ? "var(--primary)" : "var(--foreground)", 
                              textDecoration: coupon.isActive ? "none" : "line-through",
                              fontFamily: "monospace" 
                            }}>
                              {coupon.code}
                            </span>
                            <span style={{ 
                              fontSize: "0.75rem", 
                              padding: "2px 8px", 
                              borderRadius: "12px", 
                              fontWeight: 700, 
                              background: coupon.isActive ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.08)",
                              color: coupon.isActive ? "#34d399" : "var(--foreground)",
                              opacity: coupon.isActive ? 1 : 0.5
                            }}>
                              {coupon.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          
                          <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "1rem", fontSize: "0.85rem", opacity: 0.8 }}>
                            <span>
                              💰 Discount: <strong style={{ color: "var(--secondary)", cursor: "pointer", textDecoration: "underline" }} onClick={() => handleUpdateCouponDiscount(coupon.id, coupon.discountType, coupon.discountValue)}>
                                {coupon.discountType === "PERCENT" ? `${coupon.discountValue}%` : `$${coupon.discountValue.toFixed(2)}`} off
                              </strong>
                            </span>
                            <span>
                              📋 Plan: <strong style={{ color: "var(--primary)", cursor: "pointer", textDecoration: "underline" }} onClick={() => handleUpdateCouponPlan(coupon.id, coupon.applicablePlan)}>
                                {coupon.applicablePlan.split(",").map(p => p === "ALL" ? "All Plans" : p === "MONTHLY" ? "Monthly" : p === "THREE_MONTH" ? "3-Month" : "Annual").join(", ")}
                              </strong>
                            </span>
                            <span>
                              🔄 Type: <strong>{coupon.isOneTimeUse ? "One-Time Use" : "General/Multi-Use"}</strong>
                            </span>
                            <span>
                              📍 Deployed to: <span style={{ fontStyle: "italic", cursor: "pointer", textDecoration: "underline" }} onClick={() => handleUpdateCouponDeployment(coupon.id, coupon.deployedTo)}>{coupon.deployedTo || "Not specified (click to edit)"}</span>
                            </span>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            type="button"
                            onClick={() => handleToggleCouponStatus(coupon.id, coupon.isActive)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              border: "1px solid rgba(255, 255, 255, 0.15)",
                              background: "rgba(255, 255, 255, 0.05)",
                              color: "var(--foreground)",
                              cursor: "pointer",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              transition: "all 0.2s"
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"}
                            onMouseOut={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"}
                          >
                            {coupon.isActive ? "Deactivate" : "Activate"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(coupon.id)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              background: "rgba(239, 68, 68, 0.08)",
                              color: "#f87171",
                              cursor: "pointer",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              transition: "all 0.2s"
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = "#ef4444";
                              e.currentTarget.style.color = "white";
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
                              e.currentTarget.style.color = "#f87171";
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
        )}
      </div>
    </main>
  );
}
