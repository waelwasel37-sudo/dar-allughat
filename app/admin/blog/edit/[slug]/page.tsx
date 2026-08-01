
import PostEditor from '../../PostEditor';
import styles from '../../BlogAdmin.module.css';

// FINAL FIX: V15 PROMISE COMPLIANCE
// The type for PageProps MUST treat `params` as a Promise to satisfy the
// Next.js 15 build system for server components.

interface Post {
    id: string;
    title: string;
    slug: string;
    content: string;
    imageUrl?: string;
    videoUrl?: string;
}

// Define props where `params` is explicitly a Promise.
type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Fetch a single post by its slug from the API on the server
async function getPost(slug: string): Promise<Post | null> {
    // 🎯 الإصلاح النهائي: استخدام متغير البيئة الصحيح
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
    // Await the params promise to get the actual slug value
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
