import './globals.css';
import { Providers } from './providers';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import SlideOutCart from './components/SlideOutCart';
import { Noto_Kufi_Arabic, Cairo } from 'next/font/google';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/app/lib/session';
import { cookies } from 'next/headers';
import Script from 'next/script';
import { Metadata } from 'next';

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

export const metadata: Metadata = {
    metadataBase: new URL('https://dar-allughat.com'),
    title: 'دار اللغات: كتب ومستلزمات مدرسية في مدينة العبور',
    description: 'اكتشف تشكيلة واسعة من الكتب العربية والأجنبية، ومستلزمات الدراسة والأدوات المكتبية.',
};

// 🎯 التصحيح الجذري: حماية الـ SessionFetcher وإعادة ربط الكوكيز الحية بالمتجر لظهور المنتجات
async function SessionFetcher({ children }: { children: (session: SessionData) => React.ReactNode }) {
  let session: SessionData = { isLoggedIn: false, username: 'زائر' };
  
  try {
    const cookieStore = await cookies();
    // جلب الجلسة الحية الحقيقية فوراً لفتح صلاحيات المنتجات والفئات
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
    <html lang="ar" dir="rtl" className={`${noto.variable} ${cairo.variable}`}>
      <head>
        <Script
          id="fb-pixel"
          strategy="afterInteractive"
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
              fbq('init', '930234381970984');
              fbq('track', 'PageView');
            `,
          }}
        />
      </head>
      <body>
        <Providers>
          <SessionFetcher>
            {(session) => (
              <>
                {/* إعادة تمرير الجلسة الحقيقية للـ Header لتنشيط أزرار الدخول والخروج */}
                <Header session={session} />
                <main>{children}</main>
                <SlideOutCart />
                <Footer />
              </>
            )}
          </SessionFetcher>
        </Providers>
      </body>
    </html>
  );
}