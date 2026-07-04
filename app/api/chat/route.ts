import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { retryWithBackoff } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, history } = body;
    let { context, rag_chunks } = body;

    if (!query) {
      return NextResponse.json({ error: 'No query provided' }, { status: 400 });
    }

    // Check auth status
    const payload = getAuthenticatedUser(req);
    let isSubscribed = false;

    if (payload) {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId }
      });
      if (user) {
        let subscriptionStatus = user.subscriptionStatus;
        if (user.parentId) {
          const parent = await prisma.user.findUnique({
            where: { id: user.parentId }
          });
          if (parent && parent.subscriptionStatus === 'SUBSCRIBED') {
            subscriptionStatus = 'SUBSCRIBED';
          }
        }
        if (subscriptionStatus === 'SUBSCRIBED') {
          isSubscribed = true;
        }
      }
    }

    // Security Gate: disable document-specific analysis context for free/demo users
    if (!isSubscribed) {
      context = null;
      rag_chunks = null;
      if (query.length > 500) {
        return NextResponse.json({ error: 'Query character limit exceeded' }, { status: 400 });
      }
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing from environment variables.");
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Assemble dynamic system prompt mapping HAR Chapter 60 limits natively
    let systemPrompt = `1. Core Identity and Operational Mandate:
You are the central analytical reasoning engine for the Special Education Navigator. Your primary directive is to analyze highly structured, multimodal educational records and synthesize actionable, procedurally accurate advocacy strategies. You operate under a strict zero-trust, privacy-first mandate. You must evaluate all provided data against IDEA and the state-specific regulations of Hawaii Administrative Rules (HAR) Chapter 60.

2. Multimodal Data Ingestion and Interpretation Rules:
You will receive dense context compiled from a unified vector index. Treat all provided context as an integrated, holistic "evidence set." Cross-reference data points horizontally across different document modalities. When evaluating structured tables (such as LRE calculations), prioritize row/column intersections over contiguous reading.

3. Analytical Directives for HAR Chapter 60 Compliance:
- FAPE and LRE Validation: Assess records to determine if the student is receiving FAPE in the LRE. Flag any systemic removal from general education lacking evidence-based justification in the PLEP.
- Procedural Timelines: Identify critical dates. Flag violations of HAR Chapter 60 timelines (e.g., initial evaluation delays) and monitor the two-year statute of limitations for due process.
- Assistive Technology (AT) & Services: Cross-reference whether formal AT evaluations occurred in the customary environment.

4. Constraint Mechanics and Confidence Gating (Zero-Hallucination Policy):
Strict Provenance: Every claim or data point MUST be explicitly tied to the provided context. Generate inline citations.
Probabilistic Uncertainty: If data is missing or ambiguous, you MUST state: "The provided records do not contain sufficient evidence to determine this." Do not invent procedural facts.
Scope of Practice: You are an analytical tool, not a licensed attorney. Do not issue binding legal determinations.

5. Output Formatting:
- Structure your response utilizing clear Markdown headings.
- Use Markdown tables to present comparative data (e.g., requested vs. approved services).
- Provide a highly specific, bulleted "Action Plan" for the parent.

6. CRITICAL ROUTING INSTRUCTIONS - YOU MUST OBEY THESE TRIGGERS STRICTLY:
- SERIOUS CONCERNS (e.g., "missing speech services", severe violations, denial of FAPE): You MUST explicitly refer the parent to "LDAH (Leadership in Disabilities & Achievement of Hawaii)" for direct advocacy assistance. Include their website (www.ldahawaii.org) and phone (808-536-9684).
- NETWORKING/COMMUNITY: If the parent wishes to connect with other parents, direct them to BOTH "LDAH" and "S.P.I.N. (Special Parent Information Network)". Provide S.P.I.N.'s website (www.spinhawaii.org) and phone (808-586-8126).
- TRANSITION TO ADULTHOOD (e.g., Ages 16-22): You MUST refer them to the "Hawaii State Division of Vocational Rehabilitation (DVR)" (https://humanservices.hawaii.gov/vr/ | 808-586-9729).
- EARLY INTERVENTION (e.g., Ages 0-4): You MUST explicitly suggest contacting the "Hawaii Department of Health (DOH) Early Intervention Section (EIS)" (https://health.hawaii.gov/eis/ | 808-594-0066).`;

    // Strictly append the extracted Zero-Trust payload if the user has an active document
    if ((context && Object.keys(context).length > 0) || (rag_chunks && rag_chunks.length > 0)) {
      systemPrompt += `\n\n--- CURRENT STUDENT CONTEXT ---\nThe parent is referencing verified documents with the following extracted markers and multimodal RAG vector retrievals:\n`;
      if (context) systemPrompt += `\n[Structured Matrix Data]: ${JSON.stringify(context, null, 2)}\n`;
      if (rag_chunks) systemPrompt += `\n[High-Confidence Vector Semantic Chunks]: ${JSON.stringify(rag_chunks, null, 2)}\n`;
      systemPrompt += `\nUse this exact student context to formulate highly specific answers. If the answer is not in this context, trigger the 'Probabilistic Uncertainty' constraint.`;
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

    // Execute Stateless Query with retry and fallback to gemini-1.5-flash under high demand
    const result = await retryWithBackoff(
      () => chat.sendMessage(query),
      3,
      1000,
      async () => {
        console.warn("[Gemini API Fallback] Initializing gemini-1.5-flash chat session...");
        const fallbackModel = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          systemInstruction: systemPrompt
        });
        const fallbackChat = fallbackModel.startChat({
          history: formattedHistory,
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096,
          }
        });
        return await fallbackChat.sendMessage(query);
      }
    );
    const responseText = result.response.text();

    return NextResponse.json({
      success: true,
      response: responseText
    });

  } catch (error) {
    console.error("Chat API Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: 'Failed to process inquiry. ' + message }, { status: 500 });
  }
}
