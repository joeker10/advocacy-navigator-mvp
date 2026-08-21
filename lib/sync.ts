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
    const db = await getDB();
    const localProfiles = await getChildProfiles(activeEmail);
    const localInsights = await getSavedInsights(activeEmail);

    // 1. Upload local data belonging to active user to server
    if (localProfiles.length > 0 || localInsights.length > 0) {
      try {
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
      } catch (postErr) {
        console.warn("Failed to upload local items during fullSync:", postErr);
      }
    }

    // 2. Fetch unified state from server
    const res = await fetch(`${getApiUrl()}/api/auth/sync`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (data.success && db) {
      const serverProfiles: any[] = data.childProfiles || [];
      const serverInsights: any[] = data.savedInsights || [];

      // Merge local and server profiles
      const profileMap = new Map<string, any>();
      for (const p of [...localProfiles, ...serverProfiles]) {
        if (p && p.id) {
          profileMap.set(p.id, {
            ...p,
            userEmail: activeEmail || undefined
          });
        }
      }
      const mergedProfiles = Array.from(profileMap.values());

      // Merge local and server insights
      const insightMap = new Map<string, any>();
      for (const i of [...localInsights, ...serverInsights]) {
        if (i && i.id) {
          insightMap.set(i.id, {
            ...i,
            userEmail: activeEmail || undefined
          });
        }
      }
      const mergedInsights = Array.from(insightMap.values());
      mergedInsights.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      // Persist merged profiles into IndexedDB
      const tx1 = db.transaction('child_profiles', 'readwrite');
      for (const p of mergedProfiles) {
        await tx1.objectStore('child_profiles').put(p);
      }
      await tx1.done;

      // Persist merged insights into IndexedDB
      const tx2 = db.transaction('saved_insights', 'readwrite');
      for (const i of mergedInsights) {
        await tx2.objectStore('saved_insights').put(i);
      }
      await tx2.done;

      // Persist to user-scoped LocalStorage
      if (activeEmail) {
        localStorage.setItem(`spednav_profiles_${activeEmail}`, JSON.stringify(mergedProfiles));
        localStorage.setItem(`spednav_insights_${activeEmail}`, JSON.stringify(mergedInsights));
      }

      return {
        success: true,
        childProfiles: mergedProfiles,
        savedInsights: mergedInsights
      };
    }
  } catch (err) {
    console.error("Full account sync failed:", err);
  }
}
