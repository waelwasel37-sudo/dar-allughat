// 🎯 السطر السحري: إجبار الموقع كاملاً على الرندرة الديناميكية لحل تعارض الـ Cookies أثناء الـ Build
export const dynamic = 'force-dynamic';

import './globals.css';
import { Providers } from './providers';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import SlideOutCart from './components/SlideOutCart';
import RelatedProductsBar from './components/RelatedProductsBar'; // ✅ مستورد بنجاح ويفصل التوصيات عن السلة تلقائياً
import { Noto_Kufi_Arabic, Cairo } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/app/lib/session';
import { cookies } from 'next/headers';
import Script from 'next/script';
import { Metadata } from 'next';
import { cn } from "@/lib/utils";

const noto = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  variable: '--font-noto-kufi-arabic',
  display: 'swap',
});

const cairo = Cairo({
  subsets: ['arabic'],
  variable: '--font-cairo',
  display: 'swap',
});

// 🎯 أرشفة المتجر الرسمية برابط النطاق الفعلي لدار اللغات بالعبور المعتمد على استضافة فايربيز
export const metadata: Metadata = {
    metadataBase: new URL('https://dar-allughat-com--dar-allughat-97483992-fc6c5.us-central1.hosted.app'),
    title: 'دار اللغات: كتب ومستلزمات مدرسية في مدينة العبور',
    description: 'اكتشف تشكيلة واسعة من الكتب العربية والأجنبية، ومستلزمات الدراسة والأدوات المكتبية.',
};

async function SessionFetcher({ children }: { children: (session: SessionData) => React.ReactNode }) {
  let session: SessionData = { isLoggedIn: false, username: 'زائر' };
  
  try {
    // 🎯 متوافق مع Next.js 14 كـ synchronous call يمنع توقف البناء سحابياً
    const cookieStore = cookies(); 
    const ironSession = await getIronSession<SessionData>(cookieStore, sessionOptions);
    if (ironSession) {
      session = ironSession;
    }
  } catch (e) {
    console.error("Session fetch caught safely:", e);
  }

  return <>{children(session)}</>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cn(noto.variable, cairo.variable, "font-sans", GeistSans.variable)}>
      <head>
        {/* Facebook Pixel Script - 🚀 مطابق ومعتمد بالرقم الفعلي للبيكسل الخاص بك */}
        <Script
          id="fb-pixel"
          strategy="lazyOnload" 
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '2031832027677972'); 
              fbq('track', 'PageView');
            `,
          }}
        />
        {/* Google tag (gtag.js) - 🚀 معرّف التتبع الصحيح والرابط الكامل لمتجرك */}
        <Script
          strategy="lazyOnload"
          src="https://www.googletagmanager.com/gtag/js?id=G-5B1BGCLTM8"
        />
        <Script
          id="gtag-init"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-5B1BGCLTM8');
            `,
          }}
        />
      </head>
      <body>
        <Providers>
          <SessionFetcher>
            {(session) => (
              <>
                <Header session={session} />
                <main>{children}</main>
                <SlideOutCart />
                <RelatedProductsBar /> {/* ✅ سيقوم الشريط تلقائياً بالاختفاء بمجرد تعبئة بيانات الشحن لعدم تغطية السلة */}
                <Footer />
              </>
            )}
          </SessionFetcher>
        </Providers>
      </body>
    </html>
  );
}