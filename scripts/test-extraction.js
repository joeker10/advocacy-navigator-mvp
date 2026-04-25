const fs = require('fs');
const path = require('path');

// Minimal base64 representation of a valid PDF containing mock HAR Chapter 60 IEP Data
const mockPdfBase64 = 
"JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjwwCiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSCj4+Cj4+CiAgL0NvbnRlbnRzIDUgMCBSCj4+CmVuZG9iagoKNCAwIG9iago8PAogIC9UeXBlIC9Gb250CiAgL1N1YnR5cGUgL1R5cGUxCiAgL0Jhc2VGb250IC9UaW1lcy1Sb21hbgo+PgplbmRvYmoKCjUgMCBvYmoKPDwKICAvTGVuZ3RoIDEyMwo+PgpzdHJlYW0KQlQKL0YxIDE4IFRmCjAgMCBUZAooUHJlc2VudCBMZXZlbHM6IFRoZSBzdHVkZW50IGRpc3BsYXlzIGFjYWRlbWljIGRlbGF5cy4gQW5udWFsIEdvYWxzOiBJbXByb3ZlIHJlYWRpbmcgYnkgMXlyLiBBY2NvbW1vZGF0aW9uczogRXh0cmEgdGltZSBhbmQgdmlzdWFsIGFpZHMuKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCgp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA2MCAwMDAwMCBuIAowMDAwMDAwMTcwIDAwMDAwIG4gCjAwMDAwMDAyNjAgMDAwMDAgbiAKMDAwMDAwMDM1MCAwMDAwMCBuIAp0cmFpbGVyCjw8CiAgL1NpemUgNgogIC9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo1MjQKJSVFT0YK";

async function testExtractionAPI() {
  console.log("🚀 Starting End-To-End Semantic OCR API Test...");
  
  // Convert the base64 mock to a Blob/File object
  const pdfBuffer = Buffer.from(mockPdfBase64, 'base64');
  const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
  
  const formData = new FormData();
  formData.append("file", blob, "mock_iep_document.pdf");

  try {
    const response = await fetch("http://localhost:3000/api/extract", {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log("✅ Success! Gemini natively parsed the IEP structure:");
      console.dir(data.extractedData, { depth: null, colors: true });
      console.log(`✅ Stateless Persistence Architecture Status: Successfully proxied payload DocumentID [${data.documentId}] for IndexedDB cache bridging!`);
    } else {
      console.error("❌ Failed API Request:", data);
      if (data.error && data.error.includes('GEMINI_API_KEY is missing')) {
        console.warn("⚠️ Friendly Reminder: You must add GEMINI_API_KEY to your .env file before running this test pipeline.");
      }
    }
  } catch (err) {
    console.error("Failed to execute. Is the Next.js development server running on port 3000?", err.message);
  }
}

testExtractionAPI();
