'use client';

import { useRouter } from 'next/navigation';
import styles from './BlogAdmin.module.css';

interface DeleteButtonProps {
    postId: string;
}

export default function DeleteButton({ postId }: DeleteButtonProps) {
    const router = useRouter();

    const handleDelete = async () => {
        if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا المقال؟ لا يمكن التراجع عن هذا الإجراء.')) {
            try {
                const response = await fetch(`/api/posts/${postId}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to delete post');
                }

                // Refresh the server component to show the updated list
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
