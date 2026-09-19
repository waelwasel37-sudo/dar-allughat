import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth } from '@/app/lib/firebase-admin'; // استيراد صلاحيات أدمن فايربيس
import { GoogleGenerativeAI } from '@google/generative-ai';

// قراءة مفتاح الذكاء الاصطناعي من المتغيرات السرية للسيرفر
const apiKey = process.env.GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | null = null;
if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
}

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // التحقق من وجود مفتاح الربط بجوجل
  if (!genAI) {
    console.error('Google AI API key is not configured.');
    return NextResponse.json({ error: 'API key is not configured. Please set GEMINI_API_KEY.' }, { status: 500 });
  }

  try {
    // 🛡️ حماية أمنية مشددة لمنع العامة وحماية رصيدك من الاستهلاك العشوائي
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;
    if (!sessionCookie) {
        return NextResponse.json({ error: 'Unauthorized - يرجى تسجيل الدخول أولاً' }, { status: 401 });
    }

    const firebaseAuth = getAdminAuth(); 
    const decodedToken = await firebaseAuth.verifySessionCookie(sessionCookie, false);
    
    // فحص صارم: لن يسمح السيرفر بتوليد النصوص إلا لإيميلك الشخصي كمسؤول المتجر
    if (decodedToken.email !== "waelwasel37@gmail.com") {
        return NextResponse.json({ error: 'Forbidden - لا تملك صلاحية استخدام الذكاء الاصطناعي' }, { status: 403 });
    }

    // 1. قراءة نص الطلب ونوعه بعد الاطمئنان على هوية الأدمن
    const { prompt, type } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    // 2. اختيار الموديل الحديث والمستقر من عائلة Gemini 3 كما هو في كودك الأصلي
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
    // 3. بناء أوامر سيو (SEO Prompts) تفصيلية واحترافية للمحتوى العربي
    let fullPrompt = '';
    if (type === 'product') {
        fullPrompt = `
        As an expert e-commerce copywriter specializing in SEO,
        write a compelling and descriptive product description for a product titled: "${prompt}".

        **Instructions:**
        1.  **Hook:** Start with a strong opening that grabs attention.
        2.  **Key Features & Benefits:** Detail the main features and, more importantly, the benefits for the customer.
        3.  **SEO Keywords:** Naturally weave in relevant keywords that a customer might use to search for this product.
        4.  **Formatting:** Use paragraphs and bullet points for readability.
        5.  **Tone:** The tone should be persuasive and professional, suitable for an online bookstore.
        6.  **Language:** The output must be in Arabic.
        `;
    } else { // الافتراضي: كتابة مقال للمدونة
        fullPrompt = `
        As an expert content writer and SEO specialist,
        write a comprehensive and engaging blog post based on the title: "${prompt}".

        **Instructions:**
        1.  **Introduction:** Write a captivating introduction that explains the topic's importance.
        2.  **Body:** Structure the post with clear headings. Cover the topic in-depth, providing valuable information.
        3.  **SEO Strategy:** Naturally include keywords related to the title. Ensure the content is structured for search engine crawlers (using headings, lists, etc.).
        4.  **Conclusion:** End with a strong summary and a call-to-action if applicable.
        5.  **Formatting:** Use paragraphs, headings (H2, H3), and lists to make the content easy to read and scan.
        6.  **Language:** The output must be in Arabic.
        `;
    }

    // 4. إرسال الطلب وإصدار المحتوى من نموذج Gemini
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    // 5. إرجاع النص المولد بنجاح إلى لوحة التحكم
    return NextResponse.json({ generatedText: text });

  } catch (error: any) {
    console.error('[API /generate] Error:', error);
    return NextResponse.json({ error: `Failed to generate content: ${error.message}` }, { status: 500 });
  }
}