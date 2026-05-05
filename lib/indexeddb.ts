import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AdvocacyDB extends DBSchema {
  documents: {
    key: string;
    value: {
      id: string;
      fileName: string;
      extractedData: string; // JSON string cached locally
      timestamp: number;
    };
  };
  saved_insights: {
    key: string;
    value: {
      id: string;
      query: string;
      response: string;
      timestamp: number;
    };
  };
  document_embeddings: {
    key: string;
    value: {
      id: string;
      documentId: string;
      vector: number[]; // 768-dimensional Matryoshka vector
      text_chunk: string; // The textual representation/page content
      page_number: number;
      timestamp: number;
    };
    indexes: { 'documentId': string };
  };
}

let dbPromise: Promise<IDBPDatabase<AdvocacyDB>> | null = null;

export async function getDB() {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB<AdvocacyDB>('AdvocacyOfflineDB', 3, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('saved_insights')) {
          db.createObjectStore('saved_insights', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('document_embeddings')) {
          const store = db.createObjectStore('document_embeddings', { keyPath: 'id' });
          store.createIndex('documentId', 'documentId');
        }
      },
    });
  }
  return dbPromise;
}

export async function cacheVerifiedDocument(doc: { id: string, fileName: string, extractedData: any }) {
  const db = await getDB();
  if (!db) return;
  await db.put('documents', {
    id: doc.id,
    fileName: doc.fileName,
    extractedData: JSON.stringify(doc.extractedData),
    timestamp: Date.now(),
  });
}

export async function getOfflineDocuments() {
  const db = await getDB();
  if (!db) return [];
  return await db.getAll('documents');
}

export async function saveInsight(query: string, response: string) {
  const db = await getDB();
  if (!db) return;
  const id = crypto.randomUUID();
  await db.put('saved_insights', {
    id,
    query,
    response,
    timestamp: Date.now(),
  });
}

export async function getSavedInsights() {
  const db = await getDB();
  if (!db) return [];
  return await db.getAll('saved_insights');
}

export async function deleteInsight(id: string) {
  const db = await getDB();
  if (!db) return;
  await db.delete('saved_insights', id);
}

// ==========================================
// Multimodal RAG: Embedding & Vector Utilities
// ==========================================

export async function saveDocumentEmbedding(documentId: string, vector: number[], text_chunk: string, page_number: number) {
  const db = await getDB();
  if (!db) return;
  const id = crypto.randomUUID();
  await db.put('document_embeddings', {
    id,
    documentId,
    vector,
    text_chunk,
    page_number,
    timestamp: Date.now(),
  });
}

export async function getDocumentEmbeddings(documentId?: string) {
  const db = await getDB();
  if (!db) return [];
  if (documentId) {
    const tx = db.transaction('document_embeddings', 'readonly');
    const index = tx.store.index('documentId');
    return await index.getAll(documentId);
  }
  return await db.getAll('document_embeddings');
}

/**
 * Calculates the cosine similarity between two high-dimensional vectors.
 * Returns a value between -1 and 1, where 1 indicates identical direction.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
