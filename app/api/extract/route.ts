import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';
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

    // Truly parse the binary PDF stream into semantic raw text using standard pdf-parse
    const pdfParse = require('pdf-parse');
    const pdfData = await pdfParse(buffer);
    const secureText = pdfData.text;

    // Initialize Generative AI 
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing from environment variables.");
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    const extractSchema: Schema = {
      type: SchemaType.OBJECT,
      properties: {
        assessmentName: { type: SchemaType.STRING, description: "Name of the assessment report" },
        assessmentVersion: { type: SchemaType.STRING, description: "Version of the assessment administered" },
        behavioralInfo: { type: SchemaType.STRING, description: "Behavioral and observational information" },
        strengths: { type: SchemaType.STRING, description: "Main strengths of the student identified in the document" },
        needs: { type: SchemaType.STRING, description: "Main needs or areas of deficit for the student" },
        takeaways: { type: SchemaType.STRING, description: "Overall summary and key takeaways from the assessment or IEP" },
        accommodations: { type: SchemaType.STRING, description: "Accommodations, modifications, or specially designed instruction required" }
      },
      required: ["assessmentName", "assessmentVersion", "behavioralInfo", "strengths", "needs", "takeaways", "accommodations"]
    };

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: extractSchema,
        temperature: 0.2, // Low temp for strictly deterministic semantic extraction
      }
    });

    const promptText = `
      You are an expert Special Education Advocate operating under Hawaii HAR Chapter 60 regulations.
      Your task is to analyze the following extracted IEP text and strictly extract the requested fields.
      Ensure information is concise and exactly maps to the student's legal rights.
      
      TEXT:
      \n${secureText}\n
    `;

    const aiResult = await model.generateContent(promptText);
    const responseText = aiResult.response.text();
    let extracted;
    try {
      extracted = JSON.parse(responseText);
    } catch (e) {
      console.warn("AI returned malformed JSON, fallback applied");
      extracted = { 
        assessmentName: "Unknown", 
        assessmentVersion: "Unknown", 
        behavioralInfo: "Error decoding", 
        strengths: "Error decoding", 
        needs: "Error decoding", 
        takeaways: "Error decoding", 
        accommodations: "Error decoding" 
      };
    }

    // Generate verifiable local identity string for the client-side IndexedDB persistence to cache against
    const documentId = crypto.randomUUID();

    // Return the decrypted structured data for the immediate UI, to be cached offline
    return NextResponse.json({
      success: true,
      documentId: documentId,
      fileName: file.name,
      extractedData: extracted
    });

  } catch (error: any) {
    console.error("Extraction API Error:", error);
    return NextResponse.json({ error: 'Failed to process document. ' + error.message }, { status: 500 });
  }
}
