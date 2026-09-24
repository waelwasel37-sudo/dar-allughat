// 📋 API المبيعات — POST لحفظ بيع، GET لقراءة المبيعات

import { NextRequest, NextResponse } from 'next/server';
import {
    generateInvoiceNumber,
    saveSale,
    getSales,
    type Sale,
    type SalesFilter,
} from '@/app/lib/sales';
import { getSession } from '@/app/lib/session';

export const dynamic = 'force-dynamic';

// =========================================================================
// 📖 GET — قراءة المبيعات (للتقارير — للمشرفين بس)
// =========================================================================
export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session.isLoggedIn || !session.isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
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
// 💾 POST — حفظ بيع جديد (من الكاشير أو الأونلاين)
// =========================================================================
export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session.isLoggedIn) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized — login required' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { type, items, amounts, payment, shippingAddress, customerName, customerPhone } = body;

        // التحقق من البيانات
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { success: false, error: 'items are required' },
                { status: 400 }
            );
        }
        if (!amounts || typeof amounts.grandTotal !== 'number') {
            return NextResponse.json(
                { success: false, error: 'amounts.grandTotal is required' },
                { status: 400 }
            );
        }
        if (!type || !['POS', 'ONLINE'].includes(type)) {
            return NextResponse.json(
                { success: false, error: 'type must be POS or ONLINE' },
                { status: 400 }
            );
        }

        // توليد رقم البون
        const invoiceNumber = await generateInvoiceNumber();

        // تجهيز بيانات البيع
        const sale: Sale = {
            invoiceNumber,
            type,
            date: new Date().toISOString(),
            timestamp: Date.now(),

            employeeEmail: session.email || '',
            employeeName: session.username || session.email || 'Unknown',

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

        // حفظ في Firestore
        await saveSale(sale);

        return NextResponse.json({
            success: true,
            data: {
                invoiceNumber: sale.invoiceNumber,
                sale,
            },
        });
    } catch (error: any) {
        console.error('POST /api/sales error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to save sale' },
            { status: 500 }
        );
    }
}
