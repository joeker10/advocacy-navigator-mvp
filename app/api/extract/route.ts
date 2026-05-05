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
    const base64Pdf = buffer.toString('base64');

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
      Your task is to analyze the attached IEP or Educational PDF document and strictly extract the requested fields.
      Pay special attention to tabular data, matrices, and visual checkboxes.
      Ensure information is concise and exactly maps to the student's legal rights.
    `;

    const aiResult = await model.generateContent([
      promptText,
      {
        inlineData: {
          data: base64Pdf,
          mimeType: "application/pdf"
        }
      }
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
      
      // We fall back to embedding the generated structured text if the API rejects raw PDFs for the embedding endpoint
      textChunkForVector = `Document: ${file.name}\n${JSON.stringify(extracted)}`;
      
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
      fileName: file.name,
      extractedData: extracted,
      vector: vector,
      text_chunk: textChunkForVector
    });

  } catch (error: any) {
    console.error("Extraction API Error:", error);
    return NextResponse.json({ error: 'Failed to process document. ' + error.message }, { status: 500 });
  }
}
