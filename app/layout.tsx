
import './globals.css';
import { Providers } from './providers';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import SlideOutCart from './components/SlideOutCart';
import { Noto_Kufi_Arabic, Cairo } from 'next/font/google';
import { getIronSession } from 'iron-session';
import { sessionOptions, IronSessionData } from '@/app/lib/session';
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
    metadataBase: new URL('https://www.dar-allughat.com'),
    title: 'دار اللغات: كتب ومستلزمات مدرسية في مدينة العبور',
    description: 'اكتشف تشكيلة واسعة من الكتب العربية والأجنبية، ومستلزمات الدراسة والأدوات المكتبية. دار اللغات، وجهتك الأولى للمعرفة في مدينة العبور.',
    openGraph: {
        title: 'مكتبات دار اللغات - كتب وأدوات مدرسية',
        description: 'أفضل مكان لشراء الكتب والمستلزمات المدرسية في العبور. نوفر كل ما يحتاجه الطالب من الحضانة حتى الجامعة.',
        url: 'https://www.dar-allughat.com',
        siteName: 'دار اللغات',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'مكتبات دار اللغات',
            },
        ],
        locale: 'ar_EG',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'دار اللغات | كتب ومستلزمات مدرسية',
        description: 'تصفح مجموعتنا الكاملة من الكتب والأدوات المكتبية. خدمة توصيل سريعة في مدينة العبور والمناطق المجاورة.',
        images: ['/og-image.png'],
    },
    verification: {
        google: 'YOUR_GOOGLE_VERIFICATION_CODE', // Add your Google verification code here
    },
};

// 1. Create a new async Server Component to fetch the session
async function SessionFetcher({ children }: { children: (session: IronSessionData) => React.ReactNode }) {
  const session = await getIronSession<IronSessionData>(cookies(), sessionOptions);
  return <>{children(session)}</>;
}

// 2. Make RootLayout a regular, non-async component
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
          {/* 3. Use the SessionFetcher to get the session and pass it down */}
          <SessionFetcher>
            {(session) => (
              <>
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
