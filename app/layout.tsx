
import type { Metadata, Viewport } from "next";
import { Inter, Cairo } from "next/font/google";
import Script from 'next/script';
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from './context/AuthContext';
import SlideOutCart from "./components/SlideOutCart";

// Initialize Firebase and Analytics for client-side
import 'app/lib/firebase-client.ts';

const cairo = Cairo({ subsets: ['arabic', 'latin'], weight: ['400', '700'] });

export const metadata: Metadata = {
  title: "مكتبات دار اللغات | كتب وأدوات مكتبية ومدرسية",
  description: "متجر دار اللغات هو وجهتك الأولى لشراء الكتب العربية والأدوات المدرسية والمكتبية. نوفر تسويقًا إلكترونيًا لمنتجاتنا مع توصيل سريع.",
  openGraph: {
    title: "متجر مكتبات دار اللغات",
    description: "تسوق أفضل الكتب والأدوات المدرسية والمكتبية أونلاين.",
    type: "website",
    locale: "ar_EG",
  }
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cairo.className}>
        <AuthProvider>
          <CartProvider>
            <Header />
            <SlideOutCart />
            <main className="min-h-screen">{children}</main>
            <Footer />
          </CartProvider>
        </AuthProvider>

        {/* Meta Pixel Code */}
        <Script id="meta-pixel-script" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img 
            height="1" 
            width="1" 
            style={{display: 'none'}}
            src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_META_PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>
        {/* End Meta Pixel Code */}
      </body>
    </html>
  );
}
