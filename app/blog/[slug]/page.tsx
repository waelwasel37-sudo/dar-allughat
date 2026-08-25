import { notFound } from 'next/navigation';
import styles from './Post.module.css';
import VideoPlayer from '../VideoPlayer';
import Image from 'next/image';
import { marked } from 'marked';

export const dynamic = 'force-dynamic';

interface Post {
    id: string;
    title: string;
    slug: string;
    content: string;
    imageUrl?: string;
    videoUrl?: string;
    createdAt: string | { seconds: number; nanoseconds: number };
}

async function getPost(slug: string): Promise<Post | null> {
    const decodedSlug = decodeURIComponent(slug);
    const apiUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/posts/${encodeURIComponent(decodedSlug)}`;
    
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

    // 🎯 الحل الأضمن: تفعيل ميزة تحويل الروابط النصية الخام تلقائياً عبر إعدادات marked
    const parsedContent = await marked.parse(post.content || '', {
        gfm: true,        // تفعيل GitHub Flavored Markdown للتعرف على الروابط الخام
        breaks: true      // تحويل السطور الجديدة إلى <br> تلقائياً لضبط التنسيق العربي
    });

    return (
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
                <p className={styles.date}>
                    تاريخ النشر: {(() => {
                        if (!post.createdAt) return 'غير محدد';
                        
                        if (typeof post.createdAt === 'object' && 'seconds' in post.createdAt) {
                            return new Date((post.createdAt as any).seconds * 1000).toLocaleDateString('ar-EG');
                        }
                        
                        return new Date(post.createdAt).toLocaleDateString('ar-EG');
                    })()}
                </p>
            </header>

            {/* 🎯 عرض المحتوى بعد معالجة الروابط بأمان وثبات */}
            <div 
              className="prose prose-blue max-w-none text-right font-sans text-gray-800 article-links-fix"
              style={{
                  lineHeight: '1.8',
                  fontSize: '1.1rem'
              }}
              dangerouslySetInnerHTML={{ __html: parsedContent }} 
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