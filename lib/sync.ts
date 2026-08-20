import { getChildProfiles, getSavedInsights, getDB, getActiveUserEmail, setActiveUserEmail } from './indexeddb';

const getApiUrl = () => {
  const isNative = typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform?.();
  return isNative ? "https://www.thespecialeducationnavigator.app" : "";
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

export async function fullSync(userEmail?: string) {
  if (typeof window === 'undefined') return;
  const token = localStorage.getItem("spednav_auth_token");
  if (!token) return;

  const activeEmail = (userEmail || getActiveUserEmail() || "").toLowerCase().trim();
  if (activeEmail) {
    setActiveUserEmail(activeEmail);
  }

  try {
    // 1. Fetch server state first
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
        // Write child profiles with active userEmail tag
        const tx1 = db.transaction('child_profiles', 'readwrite');
        for (const p of data.childProfiles) {
          await tx1.objectStore('child_profiles').put({
            ...p,
            userEmail: activeEmail || undefined
          });
        }
        await tx1.done;

        // Write saved insights with active userEmail tag
        const tx2 = db.transaction('saved_insights', 'readwrite');
        for (const i of data.savedInsights) {
          await tx2.objectStore('saved_insights').put({
            ...i,
            userEmail: activeEmail || undefined
          });
        }
        await tx2.done;
      }
      return data;
    }
  } catch (err) {
    console.error("Full account sync failed:", err);
  }
}
