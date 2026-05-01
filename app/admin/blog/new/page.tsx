
import PostEditor from '../PostEditor';
import styles from '../BlogAdmin.module.css'; // Reusing some styles

const NewPostPage = () => {
  return (
    <div className={styles.container}>
        <div className={styles.header}>
            <h1>إنشاء مقال جديد</h1>
        </div>
        <PostEditor isNew={true} />
    </div>
  );
};

export default NewPostPage;
