import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Advocacy Platform | Premium IEP Analyzer",
  description: "Zero-Trust Document Verification and Special Education Analytics (HAR Chapter 60 Compliant)",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Advocacy Platform"
  }
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />
      <body className="antialiased" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div style={{ flex: 1 }}>{children}</div>
        <footer className="app-footer" style={{ 
          width: "100%", 
          padding: "2rem 1rem", 
          textAlign: "center", 
          background: "rgba(10, 15, 30, 0.4)",
          borderTop: "1px solid var(--glass-border)",
          fontSize: "0.85rem",
          color: "var(--foreground)",
          opacity: 0.8,
          marginTop: "auto"
        }}>
          <div className="container">
            <p style={{ maxWidth: "800px", margin: "0 auto", lineHeight: 1.5 }}>
              The Special Education Navigator provides informational guidance based on existing law; it does not constitute legal advice or create an attorney-client relationship.
            </p>
            <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", opacity: 0.5 }}>
              &copy; 2026 The Special Education Navigator. Hawaii HAR Chapter 60 Compliant.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
