import fs from 'fs';
import path from 'path';

export interface AppSettings {
  portalName: string;
  portalTagline: string;
  portalLogo: string;
}

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'app_settings.json');

const DEFAULT_SETTINGS: AppSettings = {
  portalName: 'LiveConnect Portal',
  portalTagline: 'Bebas & Tanpa Login',
  portalLogo: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/City_of_Surabaya_Logo.svg',
};

let cachedSettings: AppSettings = DEFAULT_SETTINGS;
let isLoaded = false;

export function getSettings(): AppSettings {
  if (isLoaded) return cachedSettings;
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const data = fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8');
      cachedSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } else {
      cachedSettings = { ...DEFAULT_SETTINGS };
      fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(cachedSettings, null, 2), 'utf-8');
    }
    isLoaded = true;
  } catch (error) {
    console.error('Failed to load settings:', error);
    cachedSettings = { ...DEFAULT_SETTINGS };
  }
  return cachedSettings;
}

export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  cachedSettings = {
    ...current,
    ...settings,
  };
  try {
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(cachedSettings, null, 2), 'utf-8');
    isLoaded = true;
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
  return cachedSettings;
}
