import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL parameter is required.' }, { status: 400 });
    }

    const trimmedUrl = url.trim();

    // Match Google Doc ID from various link formats
    let docId: string | null = null;
    const docMatch = trimmedUrl.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
    const driveMatch = trimmedUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    const idParamMatch = trimmedUrl.match(/[?&]id=([a-zA-Z0-9-_]+)/);

    if (docMatch && docMatch[1]) {
      docId = docMatch[1];
    } else if (driveMatch && driveMatch[1]) {
      docId = driveMatch[1];
    } else if (idParamMatch && idParamMatch[1]) {
      docId = idParamMatch[1];
    } else if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmedUrl)) {
      docId = trimmedUrl;
    }

    if (!docId) {
      return NextResponse.json({ 
        error: 'Invalid Google Doc URL format. Please ensure it follows docs.google.com/document/d/[ID] or drive.google.com/file/d/[ID]' 
      }, { status: 400 });
    }

    // Fetch public document HTML to extract title
    let title = 'Google_Doc';
    try {
      const pageRes = await fetch(`https://docs.google.com/document/d/${docId}/edit`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const html = await pageRes.text();
      const titleMatch = html.match(/<title>(.*?) - Google Docs<\/title>/);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].trim();
      }
    } catch (e) {
      console.warn('Failed to extract title, defaulting to ID:', e);
      title = `Google_Doc_${docId.substring(0, 8)}`;
    }

    // Fetch the text export of the document
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
    const exportRes = await fetch(exportUrl);
    
    if (!exportRes.ok) {
      return NextResponse.json({ 
        error: 'Unable to access the document content. Please ensure that link sharing is enabled ("Anyone with the link can view").' 
      }, { status: 403 });
    }

    const text = await exportRes.text();
    if (!text.trim()) {
      return NextResponse.json({ error: 'The Google Doc appears to be empty.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      title,
      text
    });

  } catch (error: any) {
    console.error('Google Doc import error:', error);
    return NextResponse.json({ error: 'Failed to import Google Doc: ' + error.message }, { status: 500 });
  }
}
