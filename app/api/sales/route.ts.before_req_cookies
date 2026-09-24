// 📋 API المبيعات
// POST — حفظ بيع (Admin + Editor)
// GET — قراءة المبيعات (Owner فقط — للتقرير المحاسبي)

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
    generateInvoiceNumber,
    saveSale,
    getSales,
    type Sale,
    type SalesFilter,
} from '@/app/lib/sales';
import { getAdminAuth } from '@/app/lib/firebase-admin';

export const dynamic = 'force-dynamic';

// 🎯 الإيميلات المسموح لها:
const ALLOWED_EMAILS = [
    'waelwasel37@gmail.com',  // Owner — كل الصلاحيات
    'dallughat@gmail.com',    // Editor — حفظ فقط
    'bondka111@gmail.com',    // Editor — حفظ فقط
];

// 🎯 المالك فقط (للقراءة والتقارير)
const OWNER_ONLY = [
    'waelwasel37@gmail.com',
];

// 🔐 دالة مساعدة: التحقق من الجلسة
async function verifySession(): Promise<{ email: string } | null> {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('__session')?.value;
        if (!sessionCookie) return null;

        const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
        if (!decoded.email) return null;

        return { email: decoded.email };
    } catch (e) {
        console.error('Session verification error:', e);
        return null;
    }
}

// =========================================================================
// 📖 GET — قراءة المبيعات (Owner فقط — للتقرير المحاسبي)
// =========================================================================
export async function GET(req: NextRequest) {
    try {
        const session = await verifySession();
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // 🛡️ المالك فقط يقدر يقرأ المبيعات (حماية للخزينة)
        if (!OWNER_ONLY.includes(session.email)) {
            return NextResponse.json(
                { success: false, error: 'Forbidden — Admin only' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(req.url);
        const filter: SalesFilter = {
            startDate: searchParams.get('startDate') || undefined,
            endDate: searchParams.get('endDate') || undefined,
            employeeEmail: searchParams.get('employeeEmail') || undefined,
            type: (searchParams.get('type') as 'POS' | 'ONLINE') || undefined,
            limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
        };

        const sales = await getSales(filter);
        return NextResponse.json({ success: true, data: sales });
    } catch (error: any) {
        console.error('GET /api/sales error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to read sales' },
            { status: 500 }
        );
    }
}

// =========================================================================
// 💾 POST — حفظ بيع جديد (Admin + Editor)
// =========================================================================
export async function POST(req: NextRequest) {
    try {
        // 🔐 التحقق من الجلسة
        const session = await verifySession();
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // 🛡️ المسموح لهم بالحفظ (Admin + Editor)
        if (!ALLOWED_EMAILS.includes(session.email)) {
            return NextResponse.json(
                { success: false, error: 'Forbidden — not authorized' },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { type, items, amounts, payment, shippingAddress, customerName, customerPhone } = body;

        // التحقق من البيانات
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ success: false, error: 'items are required' }, { status: 400 });
        }
        if (!amounts || typeof amounts.grandTotal !== 'number') {
            return NextResponse.json({ success: false, error: 'amounts.grandTotal is required' }, { status: 400 });
        }
        if (!type || !['POS', 'ONLINE'].includes(type)) {
            return NextResponse.json({ success: false, error: 'type must be POS or ONLINE' }, { status: 400 });
        }

        // توليد رقم البون
        const invoiceNumber = await generateInvoiceNumber();

        // استخدام إيميل الموظف من الجلسة (مش من body — للأمان)
        const employeeEmail = session.email;
        const employeeName = employeeEmail.split('@')[0];

        const sale: Sale = {
            invoiceNumber,
            type,
            date: new Date().toISOString(),
            timestamp: Date.now(),

            employeeEmail,
            employeeName,

            customerName: customerName || undefined,
            customerPhone: customerPhone || undefined,
            shippingAddress: shippingAddress || undefined,

            items,
            subtotal: amounts.subtotal || 0,
            discountTotal: amounts.discountTotal || 0,
            totalAfterDiscount: amounts.totalAfterDiscount || 0,
            taxRate: amounts.taxRate || 0,
            taxAmount: amounts.taxAmount || 0,
            amountWithoutTax: amounts.amountWithoutTax || 0,
            amountWithTax: amounts.amountWithTax || 0,
            shipping: amounts.shipping || 0,
            grandTotal: amounts.grandTotal,

            amountPaid: payment?.amountPaid || 0,
            change: payment?.change || 0,
            paymentMethod: payment?.method || 'CASH',

            status: 'completed',
        };

        await saveSale(sale);

        return NextResponse.json({
            success: true,
            data: { invoiceNumber: sale.invoiceNumber, sale },
        });
    } catch (error: any) {
        console.error('POST /api/sales error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to save sale' },
            { status: 500 }
        );
    }
}
