import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, history, context } = body;

    if (!query) {
      return NextResponse.json({ error: 'No query provided' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing from environment variables.");
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Assemble dynamic system prompt mapping HAR Chapter 60 limits natively
    let systemPrompt = `You are a highly knowledgeable Special Education Advocate specializing in Hawaii's HAR Chapter 60 regulations. Your primary goal is to empower parents, provide legally sound contextual advice, and remain empathetic. Never give formal legal advice, but DO offer strong strategic advocacy guidance regarding IEPs, 504s, FAPE, LRE, and procedural safeguards in Hawaii.

CRITICAL ROUTING INSTRUCTIONS - YOU MUST OBEY THESE TRIGGERS STRICTLY:
1. SERIOUS CONCERNS (e.g., "missing speech services", severe violations, denial of FAPE): You MUST explicitly refer the parent to "LDAH (Leadership in Disabilities & Achievement of Hawaii)" for direct advocacy assistance. Include their website (www.ldahawaii.org) and phone (808-536-9684).
2. NETWORKING/COMMUNITY: If the parent wishes to connect with other parents, direct them to BOTH "LDAH" and "S.P.I.N. (Special Parent Information Network)". Provide S.P.I.N.'s website (www.spinhawaii.org) and phone (808-586-8126).
3. TRANSITION TO ADULTHOOD (e.g., Ages 16-22, graduation issues): You MUST refer them to the "Hawaii State Division of Vocational Rehabilitation (DVR)" (https://humanservices.hawaii.gov/vr/ | 808-586-9729) and mention Hawaii non-profit agency sites catering to young adult transition.
4. EARLY INTERVENTION (e.g., Ages 0-4, preschool transitions): You MUST explicitly suggest contacting the "Hawaii Department of Health (DOH) Early Intervention Section (EIS)" (https://health.hawaii.gov/eis/ | 808-594-0066).

When referencing any of these resources, ALWAYS proactively provide their website link and phone number directly in the chat response so the user can click it immediately without visiting the Resource Directory. Do not make up fake URLs.

ANTI-HALLUCINATION RULE: 
You are fundamentally integrated into an extraction pipeline. If the parent references uploading a document, viewing an IEP, or sharing a report, DO NOT APOLOGIZE AND DO NOT CLAIM YOU CANNOT VIEW IT. You ALREADY have the successfully extracted contents of their document injected into your "CURRENT STUDENT CONTEXT" memory block below. Read the data provided below and respond directly to their query based on that data!`;

    // Strictly append the extracted Zero-Trust payload if the user has an active document
    if (context && Object.keys(context).length > 0) {
      systemPrompt += `\n\n--- CURRENT STUDENT CONTEXT ---\nThe parent is referencing verified documents with the following extracted markers:\n${JSON.stringify(context, null, 2)}\nUse this exact student context to formulate highly specific answers instead of generic advice. Cross-reference the documents to form holistic answers.`;
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt 
    });

    // Convert previous front-end user history into Gemini Chat format
    const formattedHistory: { role: string; parts: { text: string }[] }[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((msg) => {
        formattedHistory.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      });
    }

    // Initialize stateful API bridge
    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        temperature: 0.1, // Near zero temperature enforces rigid instruction adherence
        maxOutputTokens: 4096,
      }
    });

    // Execute Stateless Query
    const result = await chat.sendMessage(query);
    const responseText = result.response.text();

    return NextResponse.json({
      success: true,
      response: responseText
    });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: 'Failed to process inquiry. ' + error.message }, { status: 500 });
  }
}
