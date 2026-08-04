import { notFound } from 'next/navigation';
import styles from './Post.module.css';
import VideoPlayer from '../VideoPlayer';
import Image from 'next/image';

// 🎯 إجبار صفحة المقال العام على العمل بنظام ديناميكي كامل
export const dynamic = 'force-dynamic';

interface Post {
    id: string;
    title: string;
    slug: string;
    content: string;
    imageUrl?: string;
    videoUrl?: string;
    createdAt: string;
}

async function getPost(slug: string): Promise<Post | null> {
    // 🛠️ تصحيح الـ Slug العربي: فك الترميز لضمان إرسال النص العربي الصافي للـ API ومنع تداخل المسارات
    const decodedSlug = decodeURIComponent(slug);
    const apiUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/posts?slug=${encodeURIComponent(decodedSlug)}`;
    
    try {
        const res = await fetch(apiUrl, { cache: 'no-store' });
        if (res.status === 404) return null;
        if (!res.ok) {
            console.error(`Failed to fetch post, status: ${res.status}`);
            return null;
        }
        return await res.json();
    } catch (error) {
        console.error("Error fetching post:", error);
        return null;
    }
}

interface PageProps {
  params: { slug: string };
}

export default async function PostPage({ params }: PageProps) {
    const { slug } = params;
    const post = await getPost(slug);

    if (!post) {
        notFound();
    }

    return (
        // تم إضافة كلاس مقترح للمساعدة في حل هوامش الجوال (w-full px-4)
        <article className={`${styles.container} post-responsive-wrapper`}>
            {post.imageUrl && (
                <div className={styles.imageContainer}>
                    <Image 
                        src={post.imageUrl} 
                        alt={post.title} 
                        className={styles.mainImage} 
                        width={800}
                        height={400}
                        unoptimized={true}
                    />
                </div>
            )}

            <header className={styles.header}>
                <h1 className={styles.title}>{post.title}</h1>
                <p className={styles.date}>تاريخ النشر: {new Date(post.createdAt).toLocaleDateString('ar-EG')}</p>
            </header>

            {/* 🎯 إجبار الروابط على التلوين بالأزرق والعمل التفاعلي ونزع الهوامش الجانبية الزائدة */}
            <div 
              className="prose prose-blue max-w-none text-right font-sans text-gray-800 article-links-fix"
              style={{
                  lineHeight: '1.8',
                  fontSize: '1.1rem'
              }}
              dangerouslySetInnerHTML={{ __html: post.content }} 
            />

            {post.videoUrl && (
                <div className={styles.videoSection}>
                    <h2 className={styles.videoTitle}>شاهد الفيديو</h2>
                    <VideoPlayer src={post.videoUrl} />
                </div>
            )}
        </article>
    );
};