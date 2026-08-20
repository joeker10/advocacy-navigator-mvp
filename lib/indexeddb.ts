import { openDB, DBSchema, IDBPDatabase } from 'idb';

const safeUUID = () => {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export interface ChildProfile {
  id: string;
  name: string;
  school?: string;
  grade?: string;
  dob?: string;
  timestamp: number;
}

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
      childId?: string; // Optional link to child profile
      name?: string; // Custom/default name
    };
  };
  child_profiles: {
    key: string;
    value: ChildProfile;
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
  staged_files: {
    key: string;
    value: {
      name: string;
      file: File;
      timestamp: number;
    };
  };
  extracted_docs: {
    key: string;
    value: {
      fileName: string;
      extractedData: string; // stringified JSON
      timestamp: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<AdvocacyDB>> | null = null;

export async function getDB() {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    try {
      dbPromise = openDB<AdvocacyDB>('AdvocacyOfflineDB', 5, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('documents')) {
            db.createObjectStore('documents', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('saved_insights')) {
            db.createObjectStore('saved_insights', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('child_profiles')) {
            db.createObjectStore('child_profiles', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('document_embeddings')) {
            const store = db.createObjectStore('document_embeddings', { keyPath: 'id' });
            store.createIndex('documentId', 'documentId');
          }
          if (!db.objectStoreNames.contains('staged_files')) {
            db.createObjectStore('staged_files', { keyPath: 'name' });
          }
          if (!db.objectStoreNames.contains('extracted_docs')) {
            db.createObjectStore('extracted_docs', { keyPath: 'fileName' });
          }
        },
      });
    } catch (err) {
      console.warn("Failed to initialize IndexedDB offline database:", err);
      return null;
    }
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

export function getActiveUserEmail(): string | null {
  if (typeof window === 'undefined') return null;
  const email = localStorage.getItem("spednav_active_user_email");
  return email ? email.toLowerCase().trim() : null;
}

export function setActiveUserEmail(email: string | null) {
  if (typeof window === 'undefined') return;
  if (email) {
    localStorage.setItem("spednav_active_user_email", email.toLowerCase().trim());
  } else {
    localStorage.removeItem("spednav_active_user_email");
  }
}

export async function saveInsight(query: string, response: string, childId?: string, name?: string, userEmail?: string) {
  const id = safeUUID();
  const timestampStr = new Date().toLocaleString();
  const activeEmail = (userEmail || getActiveUserEmail() || "").toLowerCase().trim();
  let resolvedName = name;
  let savedItem: any = null;

  try {
    const db = await getDB();
    if (db) {
      if (!resolvedName) {
        const child = childId ? await db.get('child_profiles', childId) : null;
        const childName = child ? child.name : "Child";
        resolvedName = childId ? `${childName} - ${timestampStr}` : `General - ${timestampStr}`;
      }
      savedItem = {
        id,
        query,
        response,
        timestamp: Date.now(),
        childId,
        name: resolvedName,
        userEmail: activeEmail || undefined,
      };
      await db.put('saved_insights', savedItem);
    }
  } catch (err) {
    console.warn("IndexedDB saveInsight failed, falling back to LocalStorage:", err);
  }

  // Always persist to User-Scoped LocalStorage backup
  try {
    const storageKey = activeEmail ? `spednav_insights_${activeEmail}` : "spednav_insights_fallback";
    const existingStr = localStorage.getItem(storageKey) || "[]";
    const existing: any[] = JSON.parse(existingStr);
    const filtered = existing.filter((item: any) => item.id !== savedItem.id);
    filtered.push(savedItem);
    localStorage.setItem(storageKey, JSON.stringify(filtered));
  } catch (e) {
    console.error("LocalStorage backup write failed:", e);
  }

  // Trigger sync in background if logged in
  try {
    const { syncItem } = await import('./sync');
    await syncItem('insight', savedItem);
  } catch (sErr) {
    console.warn("Failed to sync insight to cloud server:", sErr);
  }

  return savedItem;
}

export async function getSavedInsights(userEmail?: string) {
  const activeEmail = (userEmail || getActiveUserEmail() || "").toLowerCase().trim();
  let dbInsights: any[] = [];
  try {
    const db = await getDB();
    if (db) {
      const all: any[] = await db.getAll('saved_insights');
      if (activeEmail) {
        dbInsights = all.filter(item => {
          const itemEmail = (item.userEmail || "").toLowerCase().trim();
          return itemEmail === activeEmail || !itemEmail;
        });
      } else {
        dbInsights = all.filter(item => !item.userEmail);
      }
    }
  } catch (err) {
    console.warn("IndexedDB getSavedInsights failed, reading from LocalStorage:", err);
  }

  // Load from User-Scoped LocalStorage fallback
  let localInsights: any[] = [];
  try {
    const storageKey = activeEmail ? `spednav_insights_${activeEmail}` : "spednav_insights_fallback";
    const localStr = localStorage.getItem(storageKey);
    if (localStr) {
      localInsights = JSON.parse(localStr);
    }
  } catch (e) {
    console.error("Failed to read LocalStorage fallback:", e);
  }

  const map = new Map<string, any>();
  for (const item of [...dbInsights, ...localInsights]) {
    if (item && item.id) {
      map.set(item.id, item);
    }
  }
  const combined = Array.from(map.values());
  combined.sort((a, b) => b.timestamp - a.timestamp);
  return combined;
}

export async function getInsightById(id: string) {
  const activeEmail = getActiveUserEmail();
  try {
    const db = await getDB();
    if (db) {
      const match = await db.get('saved_insights', id);
      if (match) return match;
    }
  } catch (err) {
    console.warn("IndexedDB getInsightById failed, searching LocalStorage:", err);
  }

  try {
    const storageKey = activeEmail ? `spednav_insights_${activeEmail}` : "spednav_insights_fallback";
    const localStr = localStorage.getItem(storageKey);
    if (localStr) {
      const local = JSON.parse(localStr);
      return local.find((item: any) => item.id === id) || null;
    }
  } catch (e) {
    console.error("Failed to search LocalStorage fallback by ID:", e);
  }
  return null;
}

export async function getChildProfileById(id: string) {
  const db = await getDB();
  if (!db) return null;
  return await db.get('child_profiles', id);
}

export async function deleteInsight(id: string) {
  const activeEmail = getActiveUserEmail();
  try {
    const db = await getDB();
    if (db) {
      await db.delete('saved_insights', id);
    }
  } catch (err) {
    console.warn("IndexedDB deleteInsight failed, updating LocalStorage:", err);
  }

  try {
    const storageKey = activeEmail ? `spednav_insights_${activeEmail}` : "spednav_insights_fallback";
    const localStr = localStorage.getItem(storageKey);
    if (localStr) {
      const local = JSON.parse(localStr);
      const filtered = local.filter((item: any) => item.id !== id);
      localStorage.setItem(storageKey, JSON.stringify(filtered));
    }
  } catch (e) {
    console.error("Failed to delete from LocalStorage fallback:", e);
  }
}

export async function renameInsight(id: string, newName: string) {
  const activeEmail = getActiveUserEmail();
  try {
    const db = await getDB();
    if (db) {
      const tx = db.transaction('saved_insights', 'readwrite');
      const store = tx.objectStore('saved_insights');
      const record = await store.get(id);
      if (record) {
        record.name = newName;
        await store.put(record);
        await tx.done;
        return record;
      }
    }
  } catch (err) {
    console.warn("IndexedDB renameInsight failed, trying LocalStorage fallback:", err);
  }

  // LocalStorage fallback rename
  try {
    const storageKey = activeEmail ? `spednav_insights_${activeEmail}` : "spednav_insights_fallback";
    const existingStr = localStorage.getItem(storageKey) || "[]";
    const existing = JSON.parse(existingStr);
    const index = existing.findIndex((item: any) => item.id === id);
    if (index !== -1) {
      existing[index].name = newName;
      localStorage.setItem(storageKey, JSON.stringify(existing));
      return existing[index];
    }
  } catch (e) {
    console.error("LocalStorage fallback rename failed:", e);
  }
  return null;
}

export async function updateInsightProfile(id: string, childId?: string) {
  const activeEmail = getActiveUserEmail();
  const normalizedChildId = childId && childId !== 'general' ? childId : undefined;
  let updatedRecord: any = null;

  try {
    const db = await getDB();
    if (db) {
      const tx = db.transaction('saved_insights', 'readwrite');
      const store = tx.objectStore('saved_insights');
      const record = await store.get(id);
      if (record) {
        record.childId = normalizedChildId;
        if (normalizedChildId) {
          const child = await db.get('child_profiles', normalizedChildId);
          const childName = child ? child.name : "Child";
          const timeStr = new Date(record.timestamp || Date.now()).toLocaleString();
          record.name = `${childName} - ${timeStr}`;
        } else {
          const timeStr = new Date(record.timestamp || Date.now()).toLocaleString();
          record.name = `General - ${timeStr}`;
        }
        await store.put(record);
        await tx.done;
        updatedRecord = record;
      }
    }
  } catch (err) {
    console.warn("IndexedDB updateInsightProfile failed, trying LocalStorage fallback:", err);
  }

  // Always update LocalStorage fallback
  try {
    const storageKey = activeEmail ? `spednav_insights_${activeEmail}` : "spednav_insights_fallback";
    const existingStr = localStorage.getItem(storageKey) || "[]";
    const existing = JSON.parse(existingStr);
    const index = existing.findIndex((item: any) => item.id === id);
    if (index !== -1) {
      existing[index].childId = normalizedChildId;
      const timeStr = new Date(existing[index].timestamp || Date.now()).toLocaleString();
      existing[index].name = normalizedChildId ? `Child - ${timeStr}` : `General - ${timeStr}`;
      localStorage.setItem(storageKey, JSON.stringify(existing));
      if (!updatedRecord) updatedRecord = existing[index];
    }
  } catch (e) {
    console.error("LocalStorage fallback update failed:", e);
  }

  // Trigger sync in background
  if (updatedRecord) {
    try {
      const { syncItem } = await import('./sync');
      await syncItem('insight', updatedRecord);
    } catch (sErr) {
      console.warn("Failed to sync updated insight to server:", sErr);
    }
  }

  return updatedRecord;
}

// Child Profiles Management API with User Isolation
export async function getChildProfiles(userEmail?: string): Promise<ChildProfile[]> {
  const activeEmail = (userEmail || getActiveUserEmail() || "").toLowerCase().trim();
  const db = await getDB();
  if (!db) return [];
  const all: any[] = await db.getAll('child_profiles');
  if (activeEmail) {
    return all.filter(p => {
      const pEmail = (p.userEmail || "").toLowerCase().trim();
      return pEmail === activeEmail || !pEmail;
    });
  }
  return all.filter(p => !p.userEmail);
}

export async function saveChildProfile(profile: ChildProfile, userEmail?: string) {
  const activeEmail = (userEmail || getActiveUserEmail() || "").toLowerCase().trim();
  const db = await getDB();
  if (!db) return;
  const profileWithUser = {
    ...profile,
    userEmail: activeEmail || (profile as any).userEmail || undefined
  };
  await db.put('child_profiles', profileWithUser);
}

export async function deleteChildProfile(id: string) {
  const db = await getDB();
  if (!db) return;
  
  // Start a transaction to delete the child profile and un-link associated insights
  const tx = db.transaction(['child_profiles', 'saved_insights'], 'readwrite');
  await tx.objectStore('child_profiles').delete(id);
  
  const insightsStore = tx.objectStore('saved_insights');
  const insights = await insightsStore.getAll();
  for (const insight of insights) {
    if (insight.childId === id) {
      delete insight.childId; // Unlink, keeping the insight in general
      await insightsStore.put(insight);
    }
  }
  await tx.done;
}

// ==========================================
// Multimodal RAG: Embedding & Vector Utilities
// ==========================================

export async function saveDocumentEmbedding(documentId: string, vector: number[], text_chunk: string, page_number: number) {
  const db = await getDB();
  if (!db) return;
  const id = safeUUID();
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

export async function saveStagedFileOffline(file: File) {
  const db = await getDB();
  if (!db) return;
  await db.put('staged_files', {
    name: file.name,
    file,
    timestamp: Date.now()
  });
}

export async function getStagedFilesOffline() {
  const db = await getDB();
  if (!db) return [];
  const records = await db.getAll('staged_files');
  records.sort((a: any, b: any) => a.timestamp - b.timestamp);
  return records.map((r: any) => r.file);
}

export async function clearStagedFilesOffline() {
  const db = await getDB();
  if (!db) return;
  const tx = db.transaction('staged_files', 'readwrite');
  await tx.objectStore('staged_files').clear();
  await tx.done;
}

export async function deleteStagedFileOffline(name: string) {
  const db = await getDB();
  if (!db) return;
  await db.delete('staged_files', name);
}

export async function saveExtractedDocOffline(doc: any) {
  const db = await getDB();
  if (!db) return;
  await db.put('extracted_docs', {
    fileName: doc.fileName,
    extractedData: JSON.stringify(doc),
    timestamp: Date.now()
  });
}

export async function getExtractedDocsOffline() {
  const db = await getDB();
  if (!db) return [];
  const records = await db.getAll('extracted_docs');
  records.sort((a: any, b: any) => a.timestamp - b.timestamp);
  return records.map((r: any) => JSON.parse(r.extractedData));
}

export async function clearExtractedDocsOffline() {
  const db = await getDB();
  if (!db) return;
  const tx = db.transaction('extracted_docs', 'readwrite');
  await tx.objectStore('extracted_docs').clear();
  await tx.done;
}
