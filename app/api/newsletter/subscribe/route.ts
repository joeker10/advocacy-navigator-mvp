import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address." }, { status: 400 });
    }

    const emailNormalized = email.trim().toLowerCase();

    // Check if already subscribed in database
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: emailNormalized }
    });

    if (existing) {
      return NextResponse.json({ success: true, message: "You are already subscribed!" });
    }

    // Save to database
    await prisma.newsletterSubscriber.create({
      data: { email: emailNormalized }
    });

    // Option: If Resend API Key is set, trigger an email or add them to contact list
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        
        // Send a welcome email from joe@thespecialeducationnavigator.app
        await resend.emails.send({
          from: "Special Education Navigator <joe@thespecialeducationnavigator.app>",
          to: emailNormalized,
          subject: "Welcome to the Special Education Navigator newsletter!",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #2d3748;">
              <h2 style="color: #0284c7; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">📬 Welcome to Special Education Navigator!</h2>
              <p>Hello,</p>
              <p>Thank you for subscribing to our advocacy updates and compliant special education tips. We are thrilled to support your journey in leveling the playing field for your student.</p>
              <p>You will receive periodic newsletters with:</p>
              <ul>
                <li>Hawaii Administrative Rules (HAR) Chapter 60 compliance tips and timelines.</li>
                <li>IEP/504 advocacy checklists and guides.</li>
                <li>Important announcements regarding feature updates to our mobile and web applications.</li>
              </ul>
              <p>If you have any questions or feedback, feel free to reply directly to this email at any time.</p>
              <p style="margin-top: 30px; font-size: 0.90rem; opacity: 0.8; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                Aloha,<br />
                <strong>Joe</strong><br />
                Founder, Special Education Navigator<br />
                <a href="https://thespecialeducationnavigator.app" style="color: #0284c7;">thespecialeducationnavigator.app</a>
              </p>
            </div>
          `
        });
      } catch (err) {
        console.error("Resend API failed to trigger welcome email:", err);
      }
    }

    return NextResponse.json({ success: true, message: "Successfully subscribed!" });
  } catch (err) {
    console.error("Newsletter subscription error:", err);
    return NextResponse.json({ success: false, error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}
