// 📋 Helper للإعدادات — server-side (firebase-admin)
// يقرأ ويحفظ من Firestore: settings/general

import { getDb } from './firebase-admin';

// الإعدادات الافتراضية
export const DEFAULT_SETTINGS = {
    storeName: 'مكتبة دار اللغات',
    address: 'محل 47 - دور أول - مول روضة العبور - الحي السادس - مدينة العبور',
    phone: '01220396597',
    commercialRegister: '100160',
    taxNumber: '769499732',
    taxRate: 14,
    invoicePrefix: 'INV',
};

export interface StoreSettings {
    storeName: string;
    address: string;
    phone: string;
    commercialRegister: string;
    taxNumber: string;
    taxRate: number;
    invoicePrefix: string;
}

/**
 * قراءة الإعدادات من Firestore
 */
export async function getSettings(): Promise<StoreSettings> {
    try {
        const db = getDb();
        const docRef = db.collection('settings').doc('general');
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            const data = docSnap.data() || {};
            return { ...DEFAULT_SETTINGS, ...data } as StoreSettings;
        }

        return DEFAULT_SETTINGS;
    } catch (error) {
        console.error('Error reading settings:', error);
        return DEFAULT_SETTINGS;
    }
}

/**
 * حفظ الإعدادات في Firestore
 */
export async function saveSettings(settings: Partial<StoreSettings>): Promise<void> {
    try {
        const db = getDb();
        const docRef = db.collection('settings').doc('general');
        await docRef.set(
            {
                ...settings,
                updatedAt: new Date().toISOString(),
            },
            { merge: true }
        );
    } catch (error) {
        console.error('Error saving settings:', error);
        throw error;
    }
}
