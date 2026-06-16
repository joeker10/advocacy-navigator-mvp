import zlib from 'zlib';

/**
 * Extracts a file from a ZIP archive buffer in pure JS.
 * Supports standard ZIP formats and handles files with data descriptors
 * by parsing the Central Directory first, with a signature-seeking fallback.
 */
export function extractTextFromZip(buffer: Buffer, targetFiles: string[]): string | null {
  // Attempt Central Directory parsing first (standard and highly robust)
  try {
    let eocdOffset = buffer.length - 22;
    // Scan backwards to find End of Central Directory signature (0x06054b50)
    while (eocdOffset >= 0) {
      if (buffer.readUInt32LE(eocdOffset) === 0x06054b50) {
        break;
      }
      eocdOffset--;
    }
    
    if (eocdOffset >= 0) {
      const cdRecords = buffer.readUInt16LE(eocdOffset + 10);
      const cdOffset = buffer.readUInt32LE(eocdOffset + 16);
      
      let offset = cdOffset;
      for (let i = 0; i < cdRecords; i++) {
        if (offset >= buffer.length - 46) break;
        const signature = buffer.readUInt32LE(offset);
        if (signature !== 0x02014b50) {
          // If the signature doesn't match, the CD offset might be shifted, break to trigger fallback
          break;
        }
        
        const compressionMethod = buffer.readUInt16LE(offset + 10);
        const compressedSize = buffer.readUInt32LE(offset + 20);
        const fileNameLength = buffer.readUInt16LE(offset + 28);
        const extraFieldLength = buffer.readUInt16LE(offset + 30);
        const fileCommentLength = buffer.readUInt16LE(offset + 32);
        const localHeaderOffset = buffer.readUInt32LE(offset + 42);
        
        const fileName = buffer.toString('utf8', offset + 46, offset + 46 + fileNameLength);
        
        if (targetFiles.includes(fileName)) {
          if (localHeaderOffset < buffer.length - 30) {
            const localSig = buffer.readUInt32LE(localHeaderOffset);
            if (localSig === 0x04034b50) {
              const localFileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
              const localExtraFieldLength = buffer.readUInt16LE(localHeaderOffset + 28);
              const dataOffset = localHeaderOffset + 30 + localFileNameLength + localExtraFieldLength;
              const compressedData = buffer.subarray(dataOffset, dataOffset + compressedSize);
              
              if (compressionMethod === 8) { // DEFLATE
                return zlib.inflateRawSync(compressedData).toString('utf8');
              } else if (compressionMethod === 0) { // STORED
                return compressedData.toString('utf8');
              }
            }
          }
        }
        offset += 46 + fileNameLength + extraFieldLength + fileCommentLength;
      }
    }
  } catch (cdErr) {
    console.warn("Central Directory parse failed, falling back to brute-force local header scan:", cdErr);
  }

  // Fallback: brute-force scan searching for local file headers (0x04034b50)
  try {
    let offset = 0;
    while (offset < buffer.length - 30) {
      const signature = buffer.readUInt32LE(offset);
      if (signature === 0x04034b50) {
        const compressionMethod = buffer.readUInt16LE(offset + 8);
        const compressedSize = buffer.readUInt32LE(offset + 18);
        const fileNameLength = buffer.readUInt16LE(offset + 26);
        const extraFieldLength = buffer.readUInt16LE(offset + 28);
        
        const fileName = buffer.toString('utf8', offset + 30, offset + 30 + fileNameLength);
        const dataOffset = offset + 30 + fileNameLength + extraFieldLength;
        
        if (targetFiles.includes(fileName)) {
          let actualCompressedSize = compressedSize;
          // If compressedSize is 0 (due to data descriptor), seek forward to find next signature
          if (actualCompressedSize === 0) {
            let scanOffset = dataOffset;
            while (scanOffset < buffer.length - 4) {
              const sig = buffer.readUInt32LE(scanOffset);
              if (sig === 0x04034b50 || sig === 0x02014b50 || sig === 0x08074b50) {
                break;
              }
              scanOffset++;
            }
            actualCompressedSize = scanOffset - dataOffset;
          }
          const compressedData = buffer.subarray(dataOffset, dataOffset + actualCompressedSize);
          
          if (compressionMethod === 8) {
            return zlib.inflateRawSync(compressedData).toString('utf8');
          } else if (compressionMethod === 0) {
            return compressedData.toString('utf8');
          }
        }
        offset = dataOffset + compressedSize;
      } else {
        offset++;
      }
    }
  } catch (fallbackErr) {
    console.error("Brute-force scan failed:", fallbackErr);
  }

  return null;
}

function decodeEntities(str: string): string {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Parses plain text from docx document.xml content.
 */
export function parseDocxText(xml: string): string {
  const matches = xml.match(/<w:t[^>]*>(.*?)<\/w:t>/g) || [];
  const text = matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
  return decodeEntities(text);
}

/**
 * Parses plain text from odt content.xml content.
 */
export function parseOdtText(xml: string): string {
  const text = xml
    .replace(/<\/text:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
  return decodeEntities(text);
}
