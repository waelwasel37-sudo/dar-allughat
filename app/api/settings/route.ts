// 📋 API الإعدادات — GET للقراءة، POST للحفظ
// يستخدم firebase-admin + getSession

import { NextRequest, NextResponse } from 'next/server';
import { getSettings, saveSettings, type StoreSettings } from '@/app/lib/settings';
import { getSession } from '@/app/lib/session';

export const dynamic = 'force-dynamic';

// =========================================================================
// 📖 GET — قراءة الإعدادات (متاح للكل — الكاشير محتاجها)
// =========================================================================
export async function GET() {
    try {
        const settings = await getSettings();
        return NextResponse.json({ success: true, data: settings });
    } catch (error: any) {
        console.error('GET /api/settings error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to read settings' },
            { status: 500 }
        );
    }
}

// =========================================================================
// 💾 POST — حفظ الإعدادات (للمشرفين بس)
// =========================================================================
export async function POST(req: NextRequest) {
    try {
        // 1. التحقق من الصلاحيات
        const session = await getSession();
        if (!session.isLoggedIn || !session.isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized — admin access required' },
                { status: 401 }
            );
        }

        // 2. قراءة البيانات
        const body = await req.json() as Partial<StoreSettings>;

        // 3. التحقق من الحقول
        if (body.taxRate !== undefined && (body.taxRate < 0 || body.taxRate > 100)) {
            return NextResponse.json(
                { success: false, error: 'taxRate must be between 0 and 100' },
                { status: 400 }
            );
        }

        // 4. الحفظ
        await saveSettings(body);

        // 5. إرجاع الإعدادات الجديدة
        const updated = await getSettings();
        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        console.error('POST /api/settings error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to save settings' },
            { status: 500 }
        );
    }
}
