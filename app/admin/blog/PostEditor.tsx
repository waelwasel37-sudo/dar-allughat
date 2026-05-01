
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './PostEditor.module.css';
import { FaSpinner } from 'react-icons/fa';

interface Post {
    id?: string;
    title: string;
    slug: string;
    content: string;
    imageUrl?: string;
    videoUrl?: string;
}

interface PostEditorProps {
    post?: Post;
    isNew: boolean;
}

// UPDATED: Correctly handles Arabic characters for slug generation
const generateSlug = (title: string) => {
    if (!title) return '';
    return title
        .trim()
        .replace(/[^\w\d\s\u0600-\u06FF-]/g, '') // Allow Arabic, letters, numbers, spaces, hyphens
        .replace(/\s+/g, '-')       // Replace spaces with hyphens
        .replace(/--+/g, '-')        // Replace multiple hyphens with a single one
        .toLowerCase(); // Keep toLowerCase for consistency, it won't affect Arabic
};

const PostEditor = ({ post: initialPost, isNew }: PostEditorProps) => {
    const [post, setPost] = useState<Post>(initialPost || { title: '', slug: '', content: '' });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingContent, setIsGeneratingContent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (initialPost) {
            setPost(initialPost);
        }
    }, [initialPost]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setPost(prev => ({ ...prev, title: newTitle, slug: generateSlug(newTitle) }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPost(prev => ({ ...prev, [name]: value }));
    };

    const uploadFile = async (file: File, postId: string): Promise<string> => {
        setIsUploading(true);
        setUploadProgress(0);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('postId', postId);
        try {
            const response = await fetch('/api/upload', { method: 'POST', body: formData });
            setUploadProgress(50);
            if (!response.ok) throw new Error('File upload failed.');
            const result = await response.json();
            setUploadProgress(100);
            return result.url;
        } catch (err: any) {
            setError(err.message);
            return '';
        } finally {
            setIsUploading(false);
        }
    };

    const handleGenerateContent = async () => {
        if (!post.title) {
            setError('الرجاء إدخال عنوان المقال أولاً لتوليد المحتوى.');
            return;
        }
        setIsGeneratingContent(true);
        setError(null);
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: post.title, type: 'blog' }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'فشل توليد محتوى المقال.');
            }

            const data = await response.json();
            setPost(prev => ({ ...prev, content: data.generatedText }));

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsGeneratingContent(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);
        try {
            let imageUrl = post.imageUrl;
            let videoUrl = post.videoUrl;
            let currentPostId = post.id;

            // Ensure the slug is up-to-date before saving
            const finalPost = { ...post, slug: generateSlug(post.title) };

            if (isNew && !currentPostId) {
                const createResponse = await fetch('/api/posts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...finalPost, createdAt: new Date().toISOString() }),
                });
                const createResult = await createResponse.json();
                if (!createResponse.ok) throw new Error(createResult.error || 'Failed to create post.');
                currentPostId = createResult.postId;
            }

            if (!currentPostId) throw new Error('Post ID is missing.');

            if (imageFile) imageUrl = await uploadFile(imageFile, currentPostId);
            if (videoFile) videoUrl = await uploadFile(videoFile, currentPostId);

            const finalPostData = { id: currentPostId, ...finalPost, imageUrl, videoUrl };

            const saveResponse = await fetch('/api/posts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalPostData),
            });

            if (!saveResponse.ok) {
                const result = await saveResponse.json();
                throw new Error(result.error || 'Failed to save post.');
            }
            
            alert('تم حفظ المقال بنجاح!');
            router.push('/admin/blog');
            router.refresh();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            {error && <div className={styles.errorBanner}>{error}</div>}

            <div className={styles.formGroup}>
                <label htmlFor="title">عنوان المقال</label>
                <input type="text" id="title" name="title" value={post.title} onChange={handleTitleChange} required />
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="slug">الرابط (Slug)</label>
                <input type="text" id="slug" name="slug" value={post.slug} onChange={handleChange} required readOnly />
                 <small>يتم إنشاء الرابط تلقائياً بناءً على العنوان.</small>
            </div>

            <div className={styles.formGroup}>
                 <div className={styles.labelContainer}>
                    <label htmlFor="content">محتوى المقال</label>
                    <button type="button" onClick={handleGenerateContent} disabled={isGeneratingContent} className={styles.aiButton}>
                        {isGeneratingContent ? <FaSpinner className={styles.spinner} /> : '✨'}
                        {isGeneratingContent ? 'جاري التوليد...' : 'توليد محتوى بالذكاء الاصطناعي'}
                    </button>
                </div>
                <textarea id="content" name="content" rows={20} value={post.content} onChange={handleChange} required></textarea>
            </div>
            
            <div className={`${styles.formGroup} ${styles.fileUploadGroup}`}>
                <label htmlFor="image">صورة المقال</label>
                <input type="file" id="image" accept="image/*" onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} />
                {post.imageUrl && !imageFile && <img src={post.imageUrl} alt="Preview" className={styles.previewImage} />}
            </div>

            <div className={`${styles.formGroup} ${styles.fileUploadGroup}`}>
                <label htmlFor="video">فيديو المقال (اختياري)</label>
                <input type="file" id="video" accept="video/*" onChange={(e) => setVideoFile(e.target.files ? e.target.files[0] : null)} />
                {post.videoUrl && !videoFile && <video src={post.videoUrl} controls className={styles.previewImage}></video>}
            </div>

            {isUploading && (
                <div className={styles.progressContainer}>
                    <p>جاري رفع الملفات...</p>
                    <progress value={uploadProgress} max="100" className={styles.progressBar}></progress>
                </div>
            )}
            
            <div className={styles.actions}>
                <button type="submit" disabled={isSaving || isUploading || isGeneratingContent} className={styles.saveButton}>
                    {isSaving ? 'جاري الحفظ...' : 'حفظ المقال'}
                </button>
                 <button type="button" onClick={() => router.back()} className={styles.cancelButton}>
                    إلغاء
                </button>
            </div>
        </form>
    );
};

export default PostEditor;
