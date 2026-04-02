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
}

let dbPromise: Promise<IDBPDatabase<AdvocacyDB>> | null = null;

export async function getDB() {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB<AdvocacyDB>('AdvocacyOfflineDB', 1, {
      upgrade(db) {
        db.createObjectStore('documents', { keyPath: 'id' });
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
