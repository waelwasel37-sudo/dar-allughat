'use client';

// 🎯 التصحيح الجذري والنهائي: إجبار صفحة الإعدادات على العمل ديناميكياً
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';

interface StoreSettings {
    storeName: string;
    address: string;
    phone: string;
    commercialRegister: string;
    taxNumber: string;
    taxRate: number;
    invoicePrefix: string;
}

const AdminSettingsPage = () => {
    const { isAdmin, user } = useAuth();

    // 🛡️ المالك فقط — الإعدادات حساسة
    const OWNER_EMAIL = 'waelwasel37@gmail.com';
    const isOwner = user?.email === OWNER_EMAIL;

    // حالة تحديث Slugs
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // حالة إعدادات المتجر
    const [settings, setSettings] = useState<StoreSettings | null>(null);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [settingsMessage, setSettingsMessage] = useState('');
    const [settingsError, setSettingsError] = useState('');

    // ─── 1. تحميل الإعدادات أول ما الصفحة تفتح ───
    useEffect(() => {
        const loadSettings = async () => {
            try {
                setLoadingSettings(true);
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data.success) {
                    setSettings(data.data);
                } else {
                    setSettingsError('فشل في تحميل الإعدادات');
                }
            } catch (err: any) {
                setSettingsError('خطأ في الاتصال بالسيرفر');
            } finally {
                setLoadingSettings(false);
            }
        };
        loadSettings();
    }, []);

    // ─── 2. حفظ الإعدادات ───
    const handleSaveSettings = async () => {
        if (!settings) return;
        setSavingSettings(true);
        setSettingsMessage('');
        setSettingsError('');

        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            const data = await res.json();

            if (data.success) {
                setSettings(data.data);
                setSettingsMessage('✅ تم حفظ الإعدادات بنجاح');
                setTimeout(() => setSettingsMessage(''), 3000);
            } else {
                setSettingsError(data.error || 'فشل في الحفظ');
            }
        } catch (err: any) {
            setSettingsError('خطأ في الاتصال بالسيرفر');
        } finally {
            setSavingSettings(false);
        }
    };

    // ─── 3. تحديث Slugs ───
    const handleUpdateSlugs = async () => {
        setIsLoading(true);
        setMessage('');
        setError('');

        try {
            const response = await fetch('/api/admin/update-slugs');
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'An unknown error occurred.');
            }
            setMessage(result.message);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAdmin) {
        return <p className="p-6 text-center text-red-500 font-bold">You do not have permission to view this page.</p>;
    }

    // 🛡️ المالك فقط
    if (!isOwner) {
        return (
            <div className="max-w-4xl mx-auto p-6 text-center" dir="rtl">
                <h1 className="text-2xl font-bold text-red-600 mb-4">🔒 الوصول مرفوض</h1>
                <p className="text-gray-600">هذه الإعدادات متاحة للمالك فقط</p>
                <p className="text-gray-400 text-xs mt-2">{user?.email || 'غير معروف'}</p>
            </div>
        );
    }

    // ─── حقل إدخال مع label ───
    const Field = ({ label, value, onChange, type = 'text' }: any) => (
        <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">{label}</label>
            <input
                type={type}
                value={value || ''}
                onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10" dir="rtl">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">إعدادات إدارية</h1>
            <p className="text-gray-600 mb-6">إعدادات المتجر العامة وأدوات الصيانة.</p>

            {/* ============================================================ */}
            {/* ⚙️ قسم إعدادات المتجر                                          */}
            {/* ============================================================ */}
            <div className="border-t pt-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">⚙️ إعدادات المتجر</h2>
                <p className="text-sm text-gray-500 mb-4">
                    هذه الإعدادات تظهر في الفواتير وبوليصات الشحن، ويتم استخدام نسبة الضريبة في حساب الفاتورة تلقائياً.
                </p>

                {loadingSettings ? (
                    <p className="text-gray-500">جاري تحميل الإعدادات...</p>
                ) : settings ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field
                            label="اسم المتجر"
                            value={settings.storeName}
                            onChange={(v: string) => setSettings({ ...settings, storeName: v })}
                        />
                        <Field
                            label="التليفون"
                            value={settings.phone}
                            onChange={(v: string) => setSettings({ ...settings, phone: v })}
                        />
                        <div className="md:col-span-2">
                            <Field
                                label="العنوان"
                                value={settings.address}
                                onChange={(v: string) => setSettings({ ...settings, address: v })}
                            />
                        </div>
                        <Field
                            label="السجل التجاري"
                            value={settings.commercialRegister}
                            onChange={(v: string) => setSettings({ ...settings, commercialRegister: v })}
                        />
                        <Field
                            label="الرقم الضريبي"
                            value={settings.taxNumber}
                            onChange={(v: string) => setSettings({ ...settings, taxNumber: v })}
                        />
                        <Field
                            label="نسبة الضريبة (%)"
                            type="number"
                            value={settings.taxRate}
                            onChange={(v: number) => setSettings({ ...settings, taxRate: v })}
                        />
                        <Field
                            label="بادئة رقم الفاتورة"
                            value={settings.invoicePrefix}
                            onChange={(v: string) => setSettings({ ...settings, invoicePrefix: v })}
                        />

                        <div className="md:col-span-2 mt-2">
                            <button
                                onClick={handleSaveSettings}
                                disabled={savingSettings}
                                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors font-semibold"
                            >
                                {savingSettings ? 'جاري الحفظ...' : '�� حفظ الإعدادات'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-red-500">{settingsError || 'فشل تحميل الإعدادات'}</p>
                )}

                {settingsMessage && <p className="mt-4 text-green-700 bg-green-100 p-3 rounded-md">{settingsMessage}</p>}
                {settingsError && <p className="mt-4 text-red-700 bg-red-100 p-3 rounded-md">{settingsError}</p>}
            </div>

            {/* ============================================================ */}
            {/* 🔗 قسم تحديث Slugs (الموجود)                                  */}
            {/* ============================================================ */}
            <div className="border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-700">🔗 تحديث روابط المنتجات (Slugs)</h2>
                <p className="text-sm text-gray-500 mt-2 mb-4">
                    انقر على هذا الزر للمرور على جميع المنتجات في قاعدة البيانات وتحديث المنتجات التي لا تحتوي على رابط ودود (slug).
                    هذه العملية آمنة ويمكن تشغيلها أكثر من مرة.
                </p>

                <button
                    onClick={handleUpdateSlugs}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                    disabled={isLoading}
                >
                    {isLoading ? 'جاري التحديث...' : 'بدء تحديث الروابط'}
                </button>

                {message && <p className="mt-4 text-green-600 bg-green-100 p-3 rounded-md">{message}</p>}
                {error && <p className="mt-4 text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
            </div>
        </div>
    );
};

export default AdminSettingsPage;
