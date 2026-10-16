import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';
import { encryptPHI, pseudonymize } from '@/lib/security';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { retryWithBackoff } from '@/lib/gemini';
import { extractTextFromZip, parseDocxText, parseOdtText } from '@/lib/documentParser';

export const maxDuration = 300;

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

    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds the maximum allowed size of 25MB.` },
          { status: 400 }
        );
      }
    }

    const parts: any[] = [];
    const combinedFileName = files.length > 1 ? `Batch_${files.length}_Documents` : files[0].name;
    let hasAudio = false;
    let hasImage = false;
    let hasPdfOrDoc = false;

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileNameLower = (file.name || '').toLowerCase();
      const mime = (file.type || '').trim().toLowerCase();

      // Check magic numbers for common binary formats
      const isPdfMagic = buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46; // %PDF
      const isJpegMagic = buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
      const isPngMagic = buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
      const isWebpMagic = buffer.length >= 12 && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
      const isZipMagic = buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;

      const isDocx = mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileNameLower.endsWith('.docx') || (isZipMagic && fileNameLower.endsWith('.docx'));
      const isDoc = mime === 'application/msword' || fileNameLower.endsWith('.doc');
      const isOdt = mime === 'application/vnd.oasis.opendocument.text' || fileNameLower.endsWith('.odt');
      const isText = mime.startsWith('text/') || fileNameLower.endsWith('.txt') || fileNameLower.endsWith('.csv') || fileNameLower.endsWith('.tsv') || fileNameLower.endsWith('.rtf') || fileNameLower.endsWith('.md');
      const isPdf = mime === 'application/pdf' || fileNameLower.endsWith('.pdf') || isPdfMagic;
      const isImage = mime.startsWith('image/') || isJpegMagic || isPngMagic || isWebpMagic || fileNameLower.endsWith('.jpg') || fileNameLower.endsWith('.jpeg') || fileNameLower.endsWith('.png') || fileNameLower.endsWith('.webp') || fileNameLower.endsWith('.heic') || fileNameLower.endsWith('.heif');
      const isAudio = mime.startsWith('audio/') || fileNameLower.endsWith('.mp3') || fileNameLower.endsWith('.wav') || fileNameLower.endsWith('.m4a') || fileNameLower.endsWith('.aac') || fileNameLower.endsWith('.ogg') || fileNameLower.endsWith('.flac');

      if (isDocx) {
        hasPdfOrDoc = true;
        const xml = extractTextFromZip(buffer, ['word/document.xml']);
        const text = xml ? parseDocxText(xml) : '';
        parts.push({
          text: `Document Name: ${file.name}\nDocument Plain Text Content:\n${text || '[Empty or unreadable DOCX]'}\n`
        });
      } else if (isOdt) {
        hasPdfOrDoc = true;
        const xml = extractTextFromZip(buffer, ['content.xml']);
        const text = xml ? parseOdtText(xml) : '';
        parts.push({
          text: `Document Name: ${file.name}\nDocument Plain Text Content:\n${text || '[Empty or unreadable ODT]'}\n`
        });
      } else if (isDoc) {
        hasPdfOrDoc = true;
        // Legacy .doc is binary; extract printable text strings
        const raw = buffer.toString('utf-8').replace(/[^\x20-\x7E\r\n\t]/g, ' ');
        const cleaned = raw.split(/\n+/).map(l => l.trim()).filter(l => l.length > 3).join('\n');
        parts.push({
          text: `Document Name: ${file.name}\nDocument Plain Text Content (Legacy DOC):\n${cleaned || '[Unable to parse binary DOC text]'}\n`
        });
      } else if (isText) {
        hasPdfOrDoc = true;
        const text = buffer.toString('utf-8');
        parts.push({
          text: `Document Name: ${file.name}\nDocument Plain Text Content:\n${text}\n`
        });
      } else if (isPdf) {
        hasPdfOrDoc = true;
        parts.push({
          inlineData: {
            data: buffer.toString('base64'),
            mimeType: 'application/pdf'
          }
        });
      } else if (isImage) {
        hasImage = true;
        let imageMime = 'image/jpeg';
        if (isPngMagic || fileNameLower.endsWith('.png') || mime === 'image/png') imageMime = 'image/png';
        else if (isWebpMagic || fileNameLower.endsWith('.webp') || mime === 'image/webp') imageMime = 'image/webp';
        else if (fileNameLower.endsWith('.heic') || mime === 'image/heic') imageMime = 'image/heic';
        else if (fileNameLower.endsWith('.heif') || mime === 'image/heif') imageMime = 'image/heif';

        parts.push({
          inlineData: {
            data: buffer.toString('base64'),
            mimeType: imageMime
          }
        });
      } else if (isAudio) {
        hasAudio = true;
        let audioMime = 'audio/mp3';
        if (fileNameLower.endsWith('.wav') || mime === 'audio/wav') audioMime = 'audio/wav';
        else if (fileNameLower.endsWith('.aac') || fileNameLower.endsWith('.m4a') || mime === 'audio/aac') audioMime = 'audio/aac';
        else if (fileNameLower.endsWith('.ogg') || mime === 'audio/ogg') audioMime = 'audio/ogg';
        else if (fileNameLower.endsWith('.flac') || mime === 'audio/flac') audioMime = 'audio/flac';
        else if (mime.startsWith('audio/')) audioMime = mime;

        parts.push({
          inlineData: {
            data: buffer.toString('base64'),
            mimeType: audioMime
          }
        });
      } else {
        // Unknown format: check if it's UTF-8 valid text
        const asUtf8 = buffer.toString('utf-8');
        const isPrintable = /^[\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]*$/.test(asUtf8.slice(0, 1000));
        if (isPrintable && asUtf8.length > 0) {
          hasPdfOrDoc = true;
          parts.push({
            text: `Document Name: ${file.name}\nDocument Plain Text Content:\n${asUtf8}\n`
          });
        } else {
          return NextResponse.json({
            error: `Unsupported file format for "${file.name}". Please upload PDF, Word (DOCX), image (JPEG/PNG), or text documents.`
          }, { status: 400 });
        }
      }
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
        accommodations: { type: SchemaType.STRING, description: "Accommodations, modifications, or specially designed instruction required" },
        rawTranscript: { type: SchemaType.STRING, description: "A comprehensive raw text transcript or OCR text reconstructed from the audio, image, or document" },
        uncertainties: { type: SchemaType.STRING, description: "List specific sections, words, or data points where you are uncertain, handwriting is illegible, or fields are ambiguous. If none, write 'None'." }
      },
      required: ["assessmentName", "assessmentVersion", "behavioralInfo", "strengths", "needs", "takeaways", "accommodations", "rawTranscript", "uncertainties"]
    };

    const primaryModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: extractSchema,
        temperature: 0.2, // Low temp for strictly deterministic semantic extraction
      }
    });

    const fallbackModel20 = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: extractSchema,
        temperature: 0.2,
      }
    });

    const fallbackModelLite = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: extractSchema,
        temperature: 0.2,
      }
    });

    let promptText = `
      You are an expert Special Education Advocate operating under Hawaii HAR Chapter 60 regulations.
      Your task is to analyze the attached IEP or Educational PDF/document(s) and strictly extract the requested fields.
      If there are multiple pages or documents attached, synthesize them together into a single unified extraction.
      Pay special attention to tabular data, matrices, and visual checkboxes.
      Ensure information is concise and exactly maps to the student's legal rights.

      For 'rawTranscript', perform strict OCR or text synthesis to reconstruct the comprehensive textual content of the document(s).
      For 'uncertainties', identify any fields or sections where you are uncertain, information was illegible/ambiguous, or draft fields were incomplete. If none, write 'None'.
    `;

    if (hasAudio && !hasPdfOrDoc && !hasImage) {
      promptText = `
        You are an expert Special Education Advocate. Your task is to analyze the attached audio recording of an IEP or 504 meeting. Transcribe the relevant conversation and extract the requested fields based on the verbal commitments made by school staff.

        For 'rawTranscript', provide a comprehensive transcription of the dialogue in the audio recording.
        For 'uncertainties', identify any inaudible words, speech overlap, or ambiguity in verbal commitments. If none, write 'None'.
      `;
    } else if (hasImage && !hasPdfOrDoc) {
      promptText = `
        You are an expert Special Education Advocate. Your task is to analyze the attached image(s), performing strong OCR to read handwritten notes, behavioral logs, or IEP matrices. 
        If multiple images are attached, they represent sequential pages of a single document. Synthesize them into a single extraction. Strictly extract the requested fields. Ensure information is concise.

        For 'rawTranscript', perform strict OCR to reconstruct the full textual content of the image(s).
        For 'uncertainties', identify any areas of handwritten notes or illegible sections where you have uncertainty. If none, write 'None'.
      `;
    }

    const aiResult = await retryWithBackoff(
      () => primaryModel.generateContent([promptText, ...parts]),
      3,
      1000,
      [
        () => {
          console.warn("[Gemini API Fallback] Invoking gemini-2.0-flash for document extraction...");
          return fallbackModel20.generateContent([promptText, ...parts]);
        },
        () => {
          console.warn("[Gemini API Fallback] Invoking gemini-2.0-flash-lite for document extraction...");
          return fallbackModelLite.generateContent([promptText, ...parts]);
        }
      ]
    );
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

  } catch (error) {
    console.error("Extraction API Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: 'Failed to process document. ' + message }, { status: 500 });
  }
}
