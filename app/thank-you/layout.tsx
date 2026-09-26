import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'تم استلام طلبك بنجاح | مكتبة دار اللغات بالعبور',
    description: 'شكراً لثقتك بمكتبة دار اللغات. تم استلام طلبك بنجاح وسنتواصل معك في أقرب وقت.',
    alternates: { canonical: '/thank-you' },
    robots: {
        index: false,
        follow: false,
    },
    openGraph: {
        title: 'تم استلام طلبك بنجاح | مكتبة دار اللغات',
        description: 'شكراً لثقتك بنا',
        url: '/thank-you',
        siteName: 'مكتبة دار اللغات',
        type: 'website',
        locale: 'ar_EG',
    },
};

export default function ThankYouLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
