import Link from "next/link";

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
    org: "SPIN",
    address: "1010 Richards St., Room 118, Honolulu, HI 96813",
    phone: "(808) 586-8126",
    email: "spin@doh.hawaii.gov",
    website: "www.spinhawaii.org",
    services: "Info & Referral, SEAC Support, Newsletters"
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
    <main className="container" style={{ padding: "4rem 2rem", minHeight: "100vh" }}>
      <header style={{ marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--primary)" }}>Resource Directory</h1>
        <p style={{ color: "var(--foreground)", opacity: 0.8, marginTop: "0.5rem" }}>
          Official contacts and support networks for Hawaii Administrative Rules (HAR) Chapter 60 compliance.
        </p>
      </header>

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

      <footer style={{ marginTop: "4rem", textAlign: "center" }}>
        <Link href="/" style={{ color: "var(--primary)", textDecoration: "underline", fontWeight: 600, padding: "0.5rem 1rem", border: "1px solid var(--primary)", borderRadius: "8px", display: "inline-block", transition: "all var(--transition-fast)" }}>
          &larr; Back to Dashboard
        </Link>
      </footer>
    </main>
  );
}
