import { ref, get, set } from 'firebase/database';
import { db } from './firebaseServer';

export interface AppSettings {
  portalName: string;
  portalTagline: string;
  portalLogo: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  portalName: 'LiveConnect Portal',
  portalTagline: 'Bebas & Tanpa Login',
  portalLogo: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/City_of_Surabaya_Logo.svg',
};

export async function getSettings(): Promise<AppSettings> {
  try {
    const settingsRef = ref(db, 'settings/portal_config');
    const snapshot = await get(settingsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return {
        portalName: data.portalName || DEFAULT_SETTINGS.portalName,
        portalTagline: data.portalTagline || DEFAULT_SETTINGS.portalTagline,
        portalLogo: data.portalLogo || DEFAULT_SETTINGS.portalLogo,
      };
    } else {
      await set(settingsRef, DEFAULT_SETTINGS);
      return { ...DEFAULT_SETTINGS };
    }
  } catch (error) {
    console.error('Failed to load settings from Realtime Database:', error);
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  try {
    const current = await getSettings();
    const updated = {
      portalName: settings.portalName !== undefined ? settings.portalName : current.portalName,
      portalTagline: settings.portalTagline !== undefined ? settings.portalTagline : current.portalTagline,
      portalLogo: settings.portalLogo !== undefined ? settings.portalLogo : current.portalLogo,
    };
    const settingsRef = ref(db, 'settings/portal_config');
    await set(settingsRef, updated);
    return updated;
  } catch (error) {
    console.error('Failed to save settings to Realtime Database:', error);
    return {
      portalName: settings.portalName || DEFAULT_SETTINGS.portalName,
      portalTagline: settings.portalTagline || DEFAULT_SETTINGS.portalTagline,
      portalLogo: settings.portalLogo || DEFAULT_SETTINGS.portalLogo,
    };
  }
}
