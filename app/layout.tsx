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
import dynamic from 'next/dynamic';

const SlideOutCart = dynamic(() => import('./components/SlideOutCart'), { ssr: false });

declare global {
  interface Window {
    dataLayer: any[];
    fbq: any;
    _fbq: any;
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
        {/* Facebook Pixel Code - Refactored for Next.js */}
        <Script
          id="fb-pixel-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];}(window, document,'script');
              
              fbq('init', '2031832027677972');
              fbq('track', 'PageView');
            `,
          }}
        />
        <Script
          id="fb-pixel-script"
          strategy="afterInteractive"
          src="https://connect.facebook.net/en_US/fbevents.js"
        />
        <noscript>
          <img 
            height="1" 
            width="1" 
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=2031832027677972&ev=PageView&noscript=1"
            alt="fb-pixel-noscript"
          />
        </noscript>

        {/* Google Tag Manager - Refactored for Next.js */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-5B1BGCLTM8"
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
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
