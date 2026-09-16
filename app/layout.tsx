import { Suspense } from 'react';
import './globals.css';
import { Providers } from './providers';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import RelatedProductsBar from './components/RelatedProductsBar'; 
import { Noto_Kufi_Arabic, Cairo } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/app/lib/session';
import { cookies } from 'next/headers';
import Script from 'next/script';
import { Metadata } from 'next';
import { cn } from "@/lib/utils";

// 🎯 التصحيح الذهبي: استيراد dynamic بالشكل القياسي الصحيح من next/dynamic لمنع الخطأ #130
import dynamic from 'next/dynamic';

// 🎯 تحميل السلة بشكل ديناميكي آمن (Lazy Loading) للتخلص من ثقل الملفات وتسريع المتجر
const SlideOutCart = dynamic(() => import('./components/SlideOutCart'), { ssr: false });

// تعريف نوع dataLayer عالمياً لمنع خطأ TypeScript
declare global {
  interface Window {
    dataLayer: any[];
  }
}

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
    metadataBase: new URL('https://hosted.app'),
    title: 'مكتبة دار اللغات بالعبور - المنصة الأولى للكتب والمستلزمات التعليمية',
    description: 'مرحباً بكم في مكتبة دار اللغات في مدينة العبور. نوفر لأبنائكم تشكيلة متكاملة من كتب خارجية، كتب مدرسية، كتب أزهري، كتب تأسيس، وقصص أطفال وألعاب تنمية مهارات أطفال منتسوري بأسعار تنافسية.',
    icons: {
      icon: '/images/logo-circular.png1.png', 
      apple: '/images/logo-circular.png1.png', 
    },
    openGraph: {
      title: 'مكتبة دار اللغات بالعبور - المنصة الأولى للكتب والمستلزمات التعليمية',
      description: 'مرحباً بكم في مكتبة دار اللغات في مدينة العبور. نوفر لأبنائكم تشكيلة متكاملة من كتب خارجية، كتب مدرسية، كتب أزهري، كتب تأسيس، وقصص أطفال.',
      siteName: 'مكتبة دار اللغات',
      type: 'website',
      locale: 'ar_EG',
    }
};

async function getSessionData(): Promise<SessionData> {
  let session: SessionData = { isLoggedIn: false, username: 'زائر' };
  try {
    const cookieStore = cookies(); 
    const ironSession = await getIronSession<SessionData>(cookieStore, sessionOptions);
    if (ironSession) {
      session = ironSession;
    }
  } catch (e) {
    console.error("Session fetch caught safely:", e);
  }
  return session;
}

async function SessionWrapper({ children }: { children: (session: SessionData) => React.ReactNode }) {
  const session = await getSessionData();
  return <>{children(session)}</>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cn(noto.variable, cairo.variable, "font-sans", GeistSans.variable)}>
      <head>
        {/* Facebook Pixel Script */}
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
              t.src=v;s=b.getElementsByTagName(e);
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://facebook.net');
              fbq('init', '2031832027677972'); 
              fbq('track', 'PageView');
            `,
          }}
        />
        {/* Google tag (gtag.js) */}
        <Script
          strategy="lazyOnload"
          src="https://googletagmanager.com"
        />
        <Script
          id="gtag-init"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){window.dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-5B1BGCLTM8');
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <Providers>
          <Suspense fallback={<Header session={{ isLoggedIn: false, username: 'زائر' }} />}>
            <SessionWrapper>
              {(session) => (
                <>
                  <Header session={session} />
                  <main>{children}</main>
                  <SlideOutCart />
                  <RelatedProductsBar /> 
                  <Footer />
                </>
              )}
            </SessionWrapper>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}