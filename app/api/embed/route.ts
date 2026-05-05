import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing from environment variables.");
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use the native text-embedding-004 model capable of MRL
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    
    // Explicitly define task_type if needed for better query embeddings, though the prompt asked for basic embeddings
    const embedResult = await embeddingModel.embedContent(text);
    const fullVector = embedResult.embedding.values;
    
    // Truncate to 768 dimensions per Matryoshka learning principles to match IndexedDB layout
    const vector = fullVector.slice(0, 768);

    return NextResponse.json({ success: true, vector });
  } catch (error: any) {
    console.error("Embedding API Error:", error);
    return NextResponse.json({ error: 'Failed to generate embedding. ' + error.message }, { status: 500 });
  }
}
