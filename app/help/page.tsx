"use client";
import React from "react";
import Link from "next/link";
import ThemeToggle from "@/app/components/ThemeToggle";

const contacts = [
  {
    org: "LDAH (Honolulu)",
    address: "245 N. Kukui St., Suite 205, Honolulu, HI 96817",
    phone: "(808) 536-9684",
    email: "info@ldahawaii.org",
    website: "www.ldahawaii.org",
    services: "Parent Training, Advocacy, Keiki Screening"
  },
  {
    org: "LDAH (Waianae)",
    address: "87-790 Kulauku St., Waianae, HI",
    phone: "(808) 696-5361",
    email: "info@ldahawaii.org",
    services: "Community Outreach, Localized Mentoring"
  },
  {
    org: "Hawaii Disability Rights Center (HDRC)",
    address: "1001 Bishop St, Ste 1110, Honolulu, HI 96813",
    phone: "(808) 949-2922",
    email: "info@hawaiidisabilityrights.org",
    website: "hawaiidisabilityrights.org",
    services: "Protection & Advocacy, Legal Representation, Disability Rights Advocacy"
  },
  {
    org: "DCAB",
    address: "919 Ala Moana Blvd, Room 101, Honolulu, HI 96814",
    phone: "(808) 586-8121",
    email: "dcab@doh.hawaii.gov",
    services: "Communication Access, Policy Oversight"
  },
  {
    org: "Division of Vocational Rehabilitation (DVR)",
    address: "1010 Richards Street, Suite 217, Honolulu, HI 96813",
    phone: "(808) 586-9729",
    email: "Contact via Website",
    website: "https://humanservices.hawaii.gov/vr/",
    services: "Transition Services, Employment Prep, Young Adult Support"
  },
  {
    org: "Early Intervention Section (DOH EIS)",
    address: "1010 Richards Street, Suite 811, Honolulu, HI 96813",
    phone: "(808) 594-0066",
    email: "Contact via Website",
    website: "https://health.hawaii.gov/eis/",
    services: "Ages 0-3 Support, IFSP Development, Preschool Transitions"
  }
];

export default function HelpPage() {
  return (
    <main style={{ minHeight: "100vh", position: "relative", zIndex: 1, paddingBottom: "6rem" }}>
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
            <h1 className="nav-title" style={{ fontSize: "1.1rem", fontWeight: 700, letterSpacing: "-0.01em", textDecoration: "none" }}>Special Education Navigator</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <ThemeToggle />
            <Link href="/" className="nav-btn-mobile-icon" style={{
              padding: "8px 16px", borderRadius: "20px", display: "flex", gap: "8px", alignItems: "center",
              background: "var(--surface)", border: "1px solid var(--glass-border)", color: "var(--foreground)",
              cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", textDecoration: "none",
              boxShadow: "var(--shadow-sm)"
            }}>
              👈 <span className="button-text">Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container" style={{ marginTop: "4rem" }}>
        <header style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "1rem", color: "var(--primary)" }}>Resource Directory</h2>
          <p style={{ color: "var(--foreground)", opacity: 0.8, marginTop: "0.5rem" }}>
            Official contacts and support networks for Hawaii Administrative Rules (HAR) Chapter 60 compliance.
          </p>
        </header>

        {/* Newsletter Opt-In Container */}
        <div className="glass-panel animate-slide-up" style={{ padding: "2rem", marginBottom: "3rem", border: "1px solid var(--glass-border)", background: "rgba(255, 255, 255, 0.02)", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--primary)", display: "flex", alignItems: "center", gap: "8px" }}>📬 Get Free Advocacy Tips & Updates</h3>
            <p style={{ margin: "4px 0 0", fontSize: "0.9rem", opacity: 0.8 }}>Subscribe to receive Hawaii special education legal compliance tips and app feature updates from <strong>joe@<wbr />thespecialeducationnavigator.app</strong>.</p>
          </div>
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const emailInput = form.elements.namedItem("email") as HTMLInputElement;
              const email = emailInput.value.trim();
              if (!email) return;
              
              try {
                const res = await fetch("/api/newsletter/subscribe", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email })
                });
                const data = await res.json();
                if (data.success) {
                  alert("Thank you! You have been successfully subscribed to our newsletter.");
                  emailInput.value = "";
                } else {
                  alert(data.error || "Subscription failed. Please try again.");
                }
              } catch (err) {
                console.error("Newsletter subscription failed:", err);
                alert("Subscription failed. Please check your internet connection and try again.");
              }
            }}
            style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", width: "100%" }}
          >
            <input 
              type="email" 
              name="email"
              placeholder="Enter your email address" 
              required
              style={{ flex: 1, minWidth: "240px", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", fontSize: "0.95rem", outline: "none" }}
            />
            <button 
              type="submit" 
              style={{ padding: "0.75rem 1.5rem", borderRadius: "10px", background: "var(--primary)", color: "white", border: "none", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", transition: "filter 0.2s" }}
              onMouseOver={(e) => e.currentTarget.style.filter = "brightness(1.1)"}
              onMouseOut={(e) => e.currentTarget.style.filter = "none"}
            >
              Subscribe
            </button>
          </form>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "2rem" }}>
          {contacts.map((contact, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: "2rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", color: "var(--secondary)", marginBottom: "1rem", fontWeight: 600 }}>{contact.org}</h2>
                <div style={{ fontSize: "0.95rem", lineHeight: "1.6", opacity: 0.9 }}>
                  <p style={{ marginBottom: "0.5rem", display: "flex", gap: "0.5rem" }}>
                    <span title="Address">📍</span> 
                    <span>{contact.address}</span>
                  </p>
                  <p style={{ marginBottom: "0.5rem", display: "flex", gap: "0.5rem" }}>
                    <span title="Phone">📞</span>
                    <span>{contact.phone}</span>
                  </p>
                  <p style={{ marginBottom: "0.5rem", display: "flex", gap: "0.5rem" }}>
                    <span title="Email">✉️</span>
                    <span>{contact.email}</span>
                  </p>
                  {contact.website && (
                    <p style={{ marginBottom: "0.5rem", display: "flex", gap: "0.5rem" }}>
                      <span title="Website">🌐</span>
                      <span>{contact.website}</span>
                    </p>
                  )}
                </div>
              </div>
              
              <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)" }}>
                <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--primary)", fontWeight: 700 }}>Key Services</span>
                <p style={{ fontSize: "0.9rem", marginTop: "0.5rem", fontStyle: "italic", opacity: 0.8 }}>{contact.services}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
