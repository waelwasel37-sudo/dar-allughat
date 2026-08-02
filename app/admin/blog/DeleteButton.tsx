'use client';

import { useRouter } from 'next/navigation';
import styles from './BlogAdmin.module.css';

interface DeleteButtonProps {
    postSlug: string; // 🎯 استلام الـ slug وليس الـ ID
}

export default function DeleteButton({ postSlug }: DeleteButtonProps) {
    const router = useRouter();

    const handleDelete = async () => {
        if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا المقال؟ لا يمكن التراجع عن هذا الإجراء.')) {
            try {
                // 🎯 تمرير الـ slug في الرابط متوافقاً مع السيرفر أعلاه
                const response = await fetch(`/api/posts?slug=${encodeURIComponent(postSlug)}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.message || 'Failed to delete post');
                }

                // تحديث قائمة المقالات فوراً في المتصفح
                router.refresh();

            } catch (err: any) {
                alert(`حدث خطأ أثناء الحذف: ${err.message}`);
            }
        }
    };

    return (
        <button 
            onClick={handleDelete} 
            className={`${styles.actionButton} ${styles.deleteButton}`}>
            حذف
        </button>
    );
}