// 📋 Helper للمبيعات — server-side (firebase-admin)
// Firestore: sales/{invoiceNumber}

import { getDb } from './firebase-admin';
import { getSettings } from './settings';

// ─── 1. أنواع البيانات ───
export interface SaleItem {
    productId?: string;
    name: string;
    quantity: number;
    originalPrice: number;
    discountPercentage?: number;
    finalPrice: number;
    barcode?: string;
}

export interface Sale {
    invoiceNumber: string;
    type: 'POS' | 'ONLINE';
    date: string;
    timestamp: number;

    // الموظف
    employeeEmail: string;
    employeeName: string;

    // العميل (POS)
    customerName?: string;
    customerPhone?: string;

    // العميل (ONLINE)
    shippingAddress?: {
        recipientName: string;
        phone: string;
        governorate: string;
        city: string;
        streetAddress: string;
    };

    // المنتجات
    items: SaleItem[];

    // المبالغ
    subtotal: number;
    discountTotal: number;
    totalAfterDiscount: number;
    taxRate: number;
    taxAmount: number;
    amountWithoutTax: number;
    amountWithTax: number;
    shipping: number;
    grandTotal: number;

    // الدفع
    amountPaid: number;
    change: number;
    paymentMethod: 'CASH' | 'ONLINE' | 'CARD';

    // الحالة
    status: 'completed' | 'cancelled';
}

// ─── 2. توليد رقم البون ───
// الصيغة: INV-YYYYMMDD-####
// التسلسل يومي (كل يوم يبدأ من 0001)
export async function generateInvoiceNumber(): Promise<string> {
    const db = getDb();
    const settings = await getSettings();
    const prefix = settings.invoicePrefix || 'INV';

    // تاريخ اليوم (توقيت القاهرة)
    const now = new Date();
    const cairoDate = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Cairo' }));
    const year = cairoDate.getFullYear();
    const month = String(cairoDate.getMonth() + 1).padStart(2, '0');
    const day = String(cairoDate.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    // نعد من آخر فاتورة في اليوم ده
    const startOfDay = `${year}-${month}-${day}T00:00:00.000Z`;
    const endOfDay = `${year}-${month}-${day}T23:59:59.999Z`;

    const snapshot = await db
        .collection('sales')
        .where('date', '>=', startOfDay)
        .where('date', '<=', endOfDay)
        .orderBy('date', 'desc')
        .limit(1)
        .get();

    let nextNumber = 1;
    if (!snapshot.empty) {
        const lastInvoice = snapshot.docs[0].data().invoiceNumber as string;
        // استخرج الرقم التسلسلي من آخر فاتورة
        const match = lastInvoice.match(/(\d+)$/);
        if (match) {
            nextNumber = parseInt(match[1], 10) + 1;
        }
    }

    const sequence = String(nextNumber).padStart(4, '0');
    return `${prefix}-${dateStr}-${sequence}`;
}

// ─── 3. حفظ البيع ───
export async function saveSale(sale: Sale): Promise<void> {
    const db = getDb();
    await db.collection('sales').doc(sale.invoiceNumber).set(sale);
}

// ─── 4. قراءة المبيعات (للتقارير) ───
export interface SalesFilter {
    startDate?: string;
    endDate?: string;
    employeeEmail?: string;
    type?: 'POS' | 'ONLINE';
    limit?: number;
}

export async function getSales(filter: SalesFilter = {}): Promise<Sale[]> {
    const db = getDb();
    let query: any = db.collection('sales');

    if (filter.startDate) {
        query = query.where('date', '>=', filter.startDate);
    }
    if (filter.endDate) {
        query = query.where('date', '<=', filter.endDate);
    }
    if (filter.employeeEmail) {
        query = query.where('employeeEmail', '==', filter.employeeEmail);
    }
    if (filter.type) {
        query = query.where('type', '==', filter.type);
    }

    query = query.orderBy('date', 'desc');

    if (filter.limit) {
        query = query.limit(filter.limit);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => doc.data() as Sale);
}
