import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';
import { encryptPHI, pseudonymize } from '@/lib/security';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const payload = getAuthenticatedUser(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required for document extraction' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    let subscriptionStatus = user.subscriptionStatus;
    if (user.parentId) {
      const parent = await prisma.user.findUnique({
        where: { id: user.parentId }
      });
      if (parent && parent.subscriptionStatus === 'SUBSCRIBED') {
        subscriptionStatus = 'SUBSCRIBED';
      }
    }

    if (subscriptionStatus !== 'SUBSCRIBED') {
      return NextResponse.json({ error: 'Forbidden: Document extraction requires an active subscription' }, { status: 403 });
    }

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No media files uploaded' }, { status: 400 });
    }

    const inlineDataParts: any[] = [];
    let primaryMimeType = files[0].type;
    let combinedFileName = files.length > 1 ? `Batch_${files.length}_Documents` : files[0].name;

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      inlineDataParts.push({
        inlineData: {
          data: buffer.toString('base64'),
          mimeType: file.type
        }
      });
    }

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

    let promptText = `
      You are an expert Special Education Advocate operating under Hawaii HAR Chapter 60 regulations.
      Your task is to analyze the attached IEP or Educational PDF document(s) and strictly extract the requested fields.
      If there are multiple pages or documents attached, synthesize them together into a single unified extraction.
      Pay special attention to tabular data, matrices, and visual checkboxes.
      Ensure information is concise and exactly maps to the student's legal rights.
    `;

    if (primaryMimeType.startsWith('image/')) {
      promptText = `
        You are an expert Special Education Advocate. Your task is to analyze the attached image(s), performing strong OCR to read handwritten notes, behavioral logs, or IEP matrices. 
        If multiple images are attached, they represent sequential pages of a single document. Synthesize them into a single extraction. Strictly extract the requested fields. Ensure information is concise.
      `;
    } else if (primaryMimeType.startsWith('audio/')) {
      promptText = `
        You are an expert Special Education Advocate. Your task is to analyze the attached audio recording of an IEP or 504 meeting. Transcribe the relevant conversation and extract the requested fields based on the verbal commitments made by school staff.
      `;
    }

    const aiResult = await model.generateContent([
      promptText,
      ...inlineDataParts
    ]);
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

    // Generate 768-Dimensional Matryoshka Vector Embedding using Gemini Embedding 2
    let vector: number[] = [];
    let textChunkForVector = "Document Content";
    try {
      // In the current SDK, text-embedding-004 is the public identifier for Gemini Embedding models that support MRL
      const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
      
      // We fall back to embedding the generated structured text
      textChunkForVector = `Document: ${combinedFileName}\n${JSON.stringify(extracted)}`;
      
      const embedResult = await embeddingModel.embedContent(textChunkForVector);
      const fullVector = embedResult.embedding.values;
      // Truncate to 768 dimensions per Matryoshka learning principles
      vector = fullVector.slice(0, 768);
    } catch (embErr) {
      console.warn("Failed to generate embedding", embErr);
    }

    // Return the decrypted structured data for the immediate UI, to be cached offline
    return NextResponse.json({
      success: true,
      documentId: documentId,
      fileName: combinedFileName,
      extractedData: extracted,
      vector: vector,
      text_chunk: textChunkForVector
    });

  } catch (error: any) {
    console.error("Extraction API Error:", error);
    return NextResponse.json({ error: 'Failed to process document. ' + error.message }, { status: 500 });
  }
}
