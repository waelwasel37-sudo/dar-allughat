
import PostEditor from '../PostEditor';
import styles from '../BlogAdmin.module.css'; // Reusing some styles

export const dynamic = 'force-dynamic';

const NewPostPage = () => {
  const initialPost = {
    title: '',
    slug: '',
    content: '',
    imageUrl: '',
    videoUrl: '',
  };

  return (
    <div className={styles.container}>
        <div className={styles.header}>
            <h1>إنشاء مقال جديد</h1>
        </div>
        <PostEditor post={initialPost} isNew={true} />
    </div>
  );
};

export default NewPostPage;
