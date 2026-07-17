import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";


const DEFAULT_FAQS = [
  {
    question: "How do I use the AI Advocate to analyze my child's IEP documents?",
    answer: "Simply navigate to the dashboard, tap the upload area or camera button to select/photograph your document, choose your child's profile (or select 'General' analysis), and tap submit. The AI will review the document details against Hawaii regulations and generate an Advocacy Insight report."
  },
  {
    question: "What should I do if the system flags a document as a duplicate?",
    answer: "To save your storage space, the app automatically checks if an uploaded or photographed document matches one that has already been analyzed. You will see a warning dialogue offering you the choice to either discard the new upload or continue processing it."
  },
  {
    question: "Where can I find my child's saved insights, and how do I rename or print them?",
    answer: "Go to the 'Saved' vault tab from the navigation menu, select your child's profile to view all their saved reports. Click on any report to open the minimalist reader. Inside the reader, you can scale font sizes, switch to Dark Mode, download the text as a .txt file, or print/export as PDF using the print options."
  },
  {
    question: "Can I use the app for free without a subscription? What are the limitations?",
    answer: "Yes! Free tier accounts do not need to create profiles and can request up to 5 document insights per calendar month. To create unlimited child profiles, access family sharing, and run unlimited analyses, you can upgrade to a premium plan from the subscription menu."
  },
  {
    question: "How do I share document insights or add family members/advocates?",
    answer: "From the main menu drawer, open 'Settings' and navigate to the 'Family Sharing' panel. You can generate a shareable coupon code or invite advocates/family members to link their accounts and view your child's profile reports."
  }
];

// GET: Return all FAQs
export async function GET(req: NextRequest) {
  try {
    const seedMarker = path.join(process.cwd(), "prisma", ".seeded_app_faqs_v2");
    if (!fs.existsSync(seedMarker)) {
      // Clear out old default FAQs from DB
      await prisma.faq.deleteMany({});
      // Seed new ones
      await prisma.faq.createMany({
        data: DEFAULT_FAQS
      });
      try {
        fs.writeFileSync(seedMarker, "true");
        // Remove old marker
        const oldMarker = path.join(process.cwd(), "prisma", ".seeded_faqs");
        if (fs.existsSync(oldMarker)) {
          fs.unlinkSync(oldMarker);
        }
      } catch (err) {
        console.error("Failed to write new FAQ seed marker:", err);
      }
    }

    const faqs = await prisma.faq.findMany({
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, faqs });
  } catch (e: any) {
    console.error("Fetch FAQs error:", e);
    return NextResponse.json({ error: "Failed to fetch FAQs: " + e.message }, { status: 500 });
  }
}

// POST: Create a new FAQ (Admin-authorized via x-admin-passcode header)
export async function POST(req: NextRequest) {
  try {
    const passcodeHeader = req.headers.get("x-admin-passcode");
    if (!passcodeHeader || passcodeHeader !== process.env.ADMIN_PASSCODE) {
      return NextResponse.json({ error: "Unauthorized: Invalid admin passcode" }, { status: 401 });
    }

    const { question, answer } = await req.json();
    if (!question || !answer) {
      return NextResponse.json({ error: "Question and Answer are required." }, { status: 400 });
    }

    const faq = await prisma.faq.create({
      data: { question, answer }
    });

    return NextResponse.json({ success: true, faq });
  } catch (e: any) {
    console.error("Create FAQ error:", e);
    return NextResponse.json({ error: "Failed to create FAQ: " + e.message }, { status: 500 });
  }
}

// DELETE: Delete FAQ item (Admin-authorized via x-admin-passcode header)
export async function DELETE(req: NextRequest) {
  try {
    const passcodeHeader = req.headers.get("x-admin-passcode");
    if (!passcodeHeader || passcodeHeader !== process.env.ADMIN_PASSCODE) {
      return NextResponse.json({ error: "Unauthorized: Invalid admin passcode" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "FAQ ID parameter is required." }, { status: 400 });
    }

    await prisma.faq.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Delete FAQ error:", e);
    return NextResponse.json({ error: "Failed to delete FAQ: " + e.message }, { status: 500 });
  }
}
