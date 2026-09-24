import { doc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';
import { MerchantSettings, ThemeSettings, SiteContent, MaintenanceSettings } from '../types';

const SETTINGS_COL = 'store_settings';
const GLOBAL_DOC = 'global';

export interface GlobalSettings {
  merchant?: MerchantSettings;
  theme?: ThemeSettings;
  siteContent?: SiteContent;
  maintenance?: MaintenanceSettings;
  lastUpdatedAt?: string;
}

/** Listen to real-time store settings (theme, merchant, content, maintenance). */
export const listenSettings = (onUpdate: (data: GlobalSettings) => void): Unsubscribe => {
  try {
    return onSnapshot(
      doc(db, SETTINGS_COL, GLOBAL_DOC),
      (snap) => {
        if (snap.exists()) onUpdate(snap.data() as GlobalSettings);
      },
      (err) => console.warn('[Firestore] Settings listener error:', err)
    );
  } catch (err) {
    console.warn('[Firestore] Failed to attach settings listener:', err);
    return () => { };
  }
};

/** Publish partial settings updates to Firestore. */
export const publishSettings = async (data: Partial<GlobalSettings>): Promise<void> => {
  try {
    await setDoc(
      doc(db, SETTINGS_COL, GLOBAL_DOC),
      { ...data, lastUpdatedAt: new Date().toISOString() },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Firestore] publishSettings failed:', err);
  }
};
