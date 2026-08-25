import { redirect } from 'next/navigation';
import { getProductById } from '../../lib/data-server';

interface PageProps {
    params: { id: string }; // النوع بسيط ومباشر
}

export default async function ShortLinkRedirectPage({ params }: PageProps) {
    const { id } = params; // بدون await

    if (!id) {
        redirect('/');
    }

    const product = await getProductById(id);

    if (!product || !product.slug) {
        redirect('/');
    }

    // نحتفظ بهذا التحسين الرائع!
    redirect(`/products/${encodeURIComponent(product.slug)}`);
}
