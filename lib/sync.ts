import { getChildProfiles, getSavedInsights, getDB } from './indexeddb';

const getApiUrl = () => {
  const isNative = typeof window !== "undefined" && (window as any).Capacitor?.isNative;
  return isNative ? (process.env.NEXT_PUBLIC_API_URL || "") : "";
};

export async function syncItem(type: 'profile' | 'insight', item: any) {
  if (typeof window === 'undefined') return;
  const token = localStorage.getItem("spednav_auth_token");
  if (!token) return;

  try {
    const payload = type === 'profile' 
      ? { childProfiles: [item] } 
      : { savedInsights: [item] };

    await fetch(`${getApiUrl()}/api/auth/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error(`Failed to sync item (${type}):`, err);
  }
}

export async function deleteRemoteItem(type: 'profile' | 'insight', id: string) {
  if (typeof window === 'undefined') return;
  const token = localStorage.getItem("spednav_auth_token");
  if (!token) return;

  try {
    await fetch(`${getApiUrl()}/api/auth/sync?type=${type}&id=${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (err) {
    console.error(`Failed to delete remote item (${type}):`, err);
  }
}

export async function fullSync() {
  if (typeof window === 'undefined') return;
  const token = localStorage.getItem("spednav_auth_token");
  if (!token) return;

  try {
    const localProfiles = await getChildProfiles();
    const localInsights = await getSavedInsights();

    // 1. Upload local data
    if (localProfiles.length > 0 || localInsights.length > 0) {
      await fetch(`${getApiUrl()}/api/auth/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          childProfiles: localProfiles,
          savedInsights: localInsights
        })
      });
    }

    // 2. Fetch unified state
    const res = await fetch(`${getApiUrl()}/api/auth/sync`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (data.success) {
      const db = await getDB();
      if (db) {
        // Write child profiles
        const tx1 = db.transaction('child_profiles', 'readwrite');
        for (const p of data.childProfiles) {
          await tx1.objectStore('child_profiles').put(p);
        }
        await tx1.done;

        // Write saved insights
        const tx2 = db.transaction('saved_insights', 'readwrite');
        for (const i of data.savedInsights) {
          await tx2.objectStore('saved_insights').put(i);
        }
        await tx2.done;
      }
      return data;
    }
  } catch (err) {
    console.error("Full account sync failed:", err);
  }
}
