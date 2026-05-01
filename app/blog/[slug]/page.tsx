
import { notFound } from 'next/navigation';
import styles from './Post.module.css';
import VideoPlayer from '../VideoPlayer';

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
    const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/posts?slug=${slug}`;
    try {
        const res = await fetch(apiUrl, { cache: 'no-store' });
        if (res.status === 404) {
            return null;
        }
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

// Define PageProps for clarity, following the new Next.js 15 pattern
interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PostPage({ params }: PageProps) {
    const { slug } = await params; // Await the promise to get the slug
    const post = await getPost(slug);

    if (!post) {
        notFound();
    }

    return (
        <article className={styles.container}>
            {post.imageUrl && (
                <div className={styles.imageContainer}>
                    <img src={post.imageUrl} alt={post.title} className={styles.mainImage} />
                </div>
            )}

            <header className={styles.header}>
                <h1 className={styles.title}>{post.title}</h1>
                <p className={styles.date}>تاريخ النشر: {new Date(post.createdAt).toLocaleDateString('ar-EG')}</p>
            </header>

            <div className={styles.content}>
                <p>{post.content}</p>
            </div>

            {post.videoUrl && (
                <div className={styles.videoSection}>
                    <h2 className={styles.videoTitle}>شاهد الفيديو</h2>
                    <VideoPlayer src={post.videoUrl} />
                </div>
            )}
        </article>
    );
};
