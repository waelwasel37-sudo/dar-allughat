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

// Define fbq on the window object for TypeScript safety
declare global {
  interface Window {
    dataLayer: any[];
    fbq: (...args: any[]) => void;
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
    // Using the site URL from environment variables for accuracy
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://dar-allughat.com'),
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
  const gaId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <html lang="ar" dir="rtl" className={cn(noto.variable, cairo.variable, "font-sans", GeistSans.variable)}>
      <head>
        {/* Google Tag Manager - Final Version using Environment Variable */}
        {gaId && (
            <>
                <Script
                    strategy="afterInteractive"
                    src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
                />
                <Script
                    id="gtag-init"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                    __html: `
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){window.dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', '${gaId}');
                    `,
                    }}
                />
            </>
        )}

        {/* Facebook Pixel - Final, Perfected Version using onLoad and Environment Variable */}
        {pixelId && (
            <>
                <Script
                    id="fb-pixel"
                    strategy="afterInteractive"
                    src="https://connect.facebook.net/en_US/fbevents.js"
                    onLoad={() => {
                        if (window.fbq) {
                            window.fbq('init', pixelId);
                            window.fbq('track', 'PageView');
                        }
                    }}
                />
                <noscript>
                    <img 
                        height="1" 
                        width="1" 
                        style={{ display: 'none' }}
                        src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
                        alt="fb-pixel-noscript"
                    />
                </noscript>
            </>
        )}
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
