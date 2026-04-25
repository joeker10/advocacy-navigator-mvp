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
}

let dbPromise: Promise<IDBPDatabase<AdvocacyDB>> | null = null;

export async function getDB() {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB<AdvocacyDB>('AdvocacyOfflineDB', 2, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('saved_insights')) {
          db.createObjectStore('saved_insights', { keyPath: 'id' });
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
