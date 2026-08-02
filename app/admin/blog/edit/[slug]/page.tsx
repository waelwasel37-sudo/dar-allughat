import PostEditor from '../../PostEditor';
import styles from '../../BlogAdmin.module.css';

// 🎯 التصحيح الذهبي: إجبار الصفحة على العمل بشكل ديناميكي كامل لمنع فشل الـ Build وتخطي قفل الـ Secret Manager
export const dynamic = 'force-dynamic';

// FINAL FIX: V15 PROMISE COMPLIANCE
interface Post {
    id: string;
    title: string;
    slug: string;
    content: string;
    imageUrl?: string;
    videoUrl?: string;
}

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Fetch a single post by its slug from the API on the server
async function getPost(slug: string): Promise<Post | null> {
    const apiUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/posts/${slug}`;
    try {
        const res = await fetch(apiUrl, { cache: 'no-store' });
        if (!res.ok) {
            return null;
        }
        return await res.json();
    } catch (error) {
        console.error("Error fetching post on server:", error);
        return null;
    }
}

export default async function EditPostPage(props: PageProps) {
    const params = await props.params;
    const post = await getPost(params.slug);

    if (!post) {
        return <div className={styles.centered}>لم يتم العثور على المقال أو فشل في تحميله.</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>تعديل المقال</h1>
            </div>
            <PostEditor isNew={false} post={post} />
        </div>
    );
}