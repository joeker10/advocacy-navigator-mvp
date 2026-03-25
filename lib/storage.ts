/**
 * Hybrid State Management
 * - LocalStorage for UI preferences
 * - Mock Database for Verified Document States
 */

export const getUIPreference = (key: string, defaultValue: boolean): boolean => {
  if (typeof window === 'undefined') return defaultValue;
  const stored = localStorage.getItem(key);
  return stored !== null ? JSON.parse(stored) : defaultValue;
};

export const setUIPreference = (key: string, value: boolean): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

// Mock Server-Side DB interaction for "Verified Document First"
export const saveVerifiedDocumentState = async (documentId: string, state: any) => {
  // In a real app this would be an API call storing to the database.
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Saved verified state to DB for document: ${documentId}`, state);
      resolve(true);
    }, 1500);
  });
};
