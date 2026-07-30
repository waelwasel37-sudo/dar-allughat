'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './BlogAdmin.module.css';

interface Post {
    id: string;
    title: string;
    slug: string;
    createdAt: string;
}

const BlogAdminPage = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Fetch all posts from the API
    const fetchPosts = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/posts');
            if (!response.ok) throw new Error('Failed to fetch posts');
            const data = await response.json();
            setPosts(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    // Handler for deleting a post
    const handleDelete = async (postId: string) => {
        if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا المقال؟ لا يمكن التراجع عن هذا الإجراء.')) {
            try {
                const response = await fetch('/api/posts', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: postId }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to delete post');
                }

                // Refresh the list of posts after deletion
                await fetchPosts(); 

            } catch (err: any) {
                setError(err.message);
            }
        }    
    };

    if (loading) {
        return <div className={styles.centered}>جاري التحميل...</div>;
    }

    if (error) {
        return <div className={`${styles.centered} ${styles.error}`}>خطأ: {error}</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>إدارة المدونة</h1>
                <Link href="/admin/blog/new" className={styles.newPostButton}>
                    إنشاء مقال جديد
                </Link>
            </div>

            {posts.length === 0 ? (
                <p className={styles.centered}>لم يتم العثور على أي مقالات. ابدأ بإنشاء واحد جديد!</p>
            ) : (
                <table className={styles.postsTable}>
                    <thead>
                        <tr>
                            <th>عنوان المقال</th>
                            <th>تاريخ النشر</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {posts.map((post) => (
                            <tr key={post.id}>
                                <td>{post.title}</td>
                                <td>{new Date(post.createdAt).toLocaleDateString('ar-EG')}</td>
                                <td>
                                    <Link href={`/admin/blog/edit/${post.id}`} className={`${styles.actionButton} ${styles.editButton}`}>
                                        تعديل
                                    </Link>
                                    <button 
                                        onClick={() => handleDelete(post.id)} 
                                        className={`${styles.actionButton} ${styles.deleteButton}`}>
                                        حذف
                                    </button>
                                    <Link href={`/blog/${post.slug}`} className={`${styles.actionButton} ${styles.viewButton}`} target="_blank" rel="noopener noreferrer">
                                        عرض
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default BlogAdminPage;