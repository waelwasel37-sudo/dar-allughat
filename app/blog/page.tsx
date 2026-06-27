import Link from 'next/link';
import Image from 'next/image';
import { getPosts } from '../lib/data-server'; 
import { Post } from '../lib/types'; 
import styles from './Blog.module.css';

// 🚀 السطر السحري الحتمي: إجبار الصفحة على العمل بوضع ديناميكي لتخطي وقت البناء بنجاح
export const dynamic = 'force-dynamic';

export default async function BlogPage() {
    const posts: Post[] = await getPosts();

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>المدونة</h1>
                <p className={styles.subtitle}>آخر المقالات والنصائح والأخبار من خبراء دار اللغات</p>
            </header>

            <main className={styles.postsGrid}>
                {posts.length > 0 ? (
                    posts.map(post => (
                        <Link href={`/blog/${post.slug}`} key={post.id} className={styles.postCard}>
                            {post.imageUrl && (
                                <div className={styles.cardImageWrapper}>
                                    <Image
                                        src={post.imageUrl}
                                        alt={post.title}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className={styles.cardImage}
                                    />
                                </div>
                            )}
                            <div className={styles.cardContent}>
                                <h2 className={styles.cardTitle}>{post.title}</h2>
                                <p className={styles.cardExcerpt}>
                                    {post.description ? `${post.description.substring(0, 120)}...` : (post.content ? `${post.content.substring(0, 120)}...` : 'اقرأ المزيد عن هذا المقال المثير للاهتمام.')}
                                </p>
                                <div className={styles.readMore}>
                                    <span>اقرأ المزيد</span>
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className={styles.noPosts}>
                        <p>لا توجد مقالات لعرضها حالياً. يرجى المحاولة مرة أخرى لاحقاً.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
