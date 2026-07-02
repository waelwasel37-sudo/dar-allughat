import './globals.css';
import { Providers } from './providers';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import SlideOutCart from './components/SlideOutCart';
import { Noto_Kufi_Arabic, Cairo } from 'next/font/google';
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // تمرير جلسة افتراضية فارغة هنا لمنع انهيار الـ Static Pages
  const guestSession = { isLoggedIn: false, username: 'زائر' };

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
              'https://facebook.net');
              fbq('init', '930234381970984');
              fbq('track', 'PageView');
            `,
          }}
        />
      </head>
      <body>
        <Providers>
          {/* الـ Header العام يقرأ حالة الزائر الافتراضية بسلام */}
          <Header session={guestSession} />
          <main>{children}</main>
          <SlideOutCart />
          <Footer />
        </Providers>
      </body>
    </html>
  );
}