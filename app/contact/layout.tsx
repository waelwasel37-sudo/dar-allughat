import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'اتصل بنا | مكتبة دار اللغات بالعبور',
    description: 'تواصل مع مكتبة دار اللغات بالعبور - عبر الواتساب أو الاتصال المباشر. نحن هنا لخدمتك والإجابة على استفساراتك.',
    keywords: ['اتصل بنا', 'مكتبة دار اللغات', 'العبور', 'تواصل', 'واتساب'],
    alternates: {
        canonical: '/contact',
    },
    openGraph: {
        title: 'اتصل بنا | مكتبة دار اللغات بالعبور',
        description: 'تواصل معنا عبر الواتساب أو الاتصال المباشر',
        url: '/contact',
        siteName: 'مكتبة دار اللغات',
        type: 'website',
        locale: 'ar_EG',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'اتصل بنا | مكتبة دار اللغات',
        description: 'تواصل معنا - نخدمك بكل سرور',
    },
};

export default function ContactLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
