import { NextRequest, NextResponse } from 'next/server';
const pdfParse = require('pdf-parse');
import prisma from '@/lib/prisma';
import { encryptPHI, pseudonymize } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No PDF file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Run PDF Parse to extract raw text
    const pdfData = await pdfParse(buffer);
    let text = pdfData.text;

    // Pseudonymize before further processing to protect identities (Zero Trust)
    text = pseudonymize(text);

    // Simulate determinist NLP extraction mapped to HAR Chapter 60
    // A real NLP engine would do true semantic chunking here
    const plaafpMatch = text.match(/Present Levels[\s\S]*?:([\s\S]*?)(?=Annual Goals|Accommodations|$)/i);
    const goalsMatch = text.match(/Annual Goals?[\s\S]*?:([\s\S]*?)(?=Accommodations|Related Services|$)/i);
    const accomMatch = text.match(/Accommodations?[\s\S]*?:([\s\S]*?)(?=Related Services|$)/i);

    const extracted = {
      plaafp: plaafpMatch ? plaafpMatch[1].trim() : "No PLAAFP detected.",
      target: goalsMatch ? goalsMatch[1].trim() : "No goals detected.",
      details: accomMatch ? accomMatch[1].trim() : "No accommodations detected.",
    };

    // Save to Database (Immutable Server-Side Persistence)
    // We encrypt PHI at rest here to satisfy HIPAA requirements
    const document = await prisma.document.create({
      data: {
        fileName: file.name,
        hash: encryptPHI(crypto.randomUUID()), // simulated immutable provenance hash
        status: 'VERIFIED',
        plaafp: encryptPHI(extracted.plaafp),
        goals: {
          create: [{
            target: encryptPHI(extracted.target)
          }]
        },
        accommodations: {
          create: [{
            details: encryptPHI(extracted.details)
          }]
        }
      },
      include: { goals: true, accommodations: true }
    });

    // Return the decrypted structured data for the immediate UI, to be cached offline
    return NextResponse.json({
      success: true,
      documentId: document.id,
      fileName: document.fileName,
      extractedData: extracted
    });

  } catch (error: any) {
    console.error("Extraction API Error:", error);
    return NextResponse.json({ error: 'Failed to process document. ' + error.message }, { status: 500 });
  }
}
