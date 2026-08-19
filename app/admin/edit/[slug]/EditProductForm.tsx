
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Product, Category } from '../../../lib/types';
import Image from 'next/image';
import { FaUpload, FaTimesCircle } from 'react-icons/fa';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from '../../../lib/firebase-client';

interface EditProductFormProps {
  initialProduct: Product;
  categories: Category[];
}

const generateSlug = (name: string) => {
    if (!name) return '';
    return name.trim().toLowerCase().replace(/[^\w\d\s\u0600-\u06FF]/g, '').replace(/\s+/g, '-');
};

const uploadFile = (file: File, path: string, setProgress: (progress: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on('state_changed',
            (snapshot) => setProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
            (error) => { console.error("Upload failed:", error); reject(error); },
            () => getDownloadURL(uploadTask.snapshot.ref).then(resolve)
        );
    });
};

export default function EditProductForm({ initialProduct, categories }: EditProductFormProps) {
    const router = useRouter();
    const { isAdmin, loading: authLoading, user } = useAuth(); // <-- تم إضافة user

    const [formData, setFormData] = useState<Partial<Product>>(initialProduct);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [newMainImage, setNewMainImage] = useState<File | null>(null);
    const [mainImgUpProgress, setMainImgUpProgress] = useState(0);
    const [newSecondaryImage, setNewSecondaryImage] = useState<File | null>(null);
    const [secondaryImgUpProgress, setSecondaryImgUpProgress] = useState(0);
    const [newVideo, setNewVideo] = useState<File | null>(null);
    const [videoUpProgress, setVideoUpProgress] = useState(0);

    const [mainImagePreview, setMainImagePreview] = useState<string | null>(initialProduct.imageUrl);
    const [secondaryImagePreview, setSecondaryImagePreview] = useState<string | null>(initialProduct.secondaryImageUrl || null);
    const [videoFileName, setVideoFileName] = useState<string | null>(initialProduct.videoUrl ? 'فيديو موجود' : null);


    useEffect(() => {
        if (!authLoading && !isAdmin) router.push('/login');
    }, [isAdmin, authLoading, router]);

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newState: Partial<Product> = { ...prev };
            if (['price', 'discount', 'stock', 'year'].includes(name)) {
                (newState as any)[name] = parseFloat(value) || 0;
            } else {
                (newState as any)[name] = value;
            }
            if (name === 'name' && value) newState.slug = generateSlug(value);
            return newState;
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'secondary' | 'video') => {
        const file = e.target.files?.[0];
        if (!file) return;

        switch (type) {
            case 'main':
                setNewMainImage(file);
                setMainImagePreview(URL.createObjectURL(file));
                break;
            case 'secondary':
                setNewSecondaryImage(file);
                setSecondaryImagePreview(URL.createObjectURL(file));
                break;
            case 'video':
                setNewVideo(file);
                setVideoFileName(file.name);
                break;
        }
    };

    const handleDeleteFile = async (type: 'secondary' | 'video') => {
        if (!confirm(`هل أنت متأكد أنك تريد حذف هذا ${type === 'video' ? 'الفيديو' : 'الصورة'}؟ لا يمكن التراجع عن هذا الإجراء.`)) return;

        const urlToDelete = type === 'video' ? formData.videoUrl : formData.secondaryImageUrl;
        if (urlToDelete) {
            try {
                const fileRef = ref(storage, urlToDelete);
                await deleteObject(fileRef);
                setFormData(prev => ({ ...prev, [type === 'video' ? 'videoUrl' : 'secondaryImageUrl']: undefined }));
                if (type === 'video') setVideoFileName(null);
                if (type === 'secondary') setSecondaryImagePreview(null);
                alert(`${type === 'video' ? 'الفيديو' : 'الصورة'} تم حذفه بنجاح.`);
            } catch (err) {
                console.error("Error deleting file:", err);
                alert("فشل حذف الملف. قد يكون الرابط غير صحيح.");
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const originalSlug = initialProduct.slug;
        if (!originalSlug) {
            setError("المعرّف الأصلي للمنتج مفقود.");
            return;
        }

        setUpdating(true);
        setError(null);

        try {
            const token = user ? await user.getIdToken() : null; // <-- إضافة التوكن
            if (!token) {
                throw new Error("لم يتم العثور على توكن المصادقة. الرجاء تسجيل الدخول مرة أخرى.");
            }

            let updatedData = { ...formData };
            const newSlug = generateSlug(formData.name || initialProduct.name);

            if (newMainImage) {
                updatedData.imageUrl = await uploadFile(newMainImage, `products/${newSlug}/main-${newMainImage.name}`, setMainImgUpProgress);
            }
            if (newSecondaryImage) {
                updatedData.secondaryImageUrl = await uploadFile(newSecondaryImage, `products/${newSlug}/secondary-${newSecondaryImage.name}`, setSecondaryImgUpProgress);
            }
            if (newVideo) {
                updatedData.videoUrl = await uploadFile(newVideo, `products/${newSlug}/video-${newVideo.name}`, setVideoUpProgress);
            }

            updatedData.updatedAt = new Date().toISOString();
            updatedData.slug = newSlug;

            const response = await fetch(`/api/products/${originalSlug}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // <-- إضافة التوكن للطلب
                },
                body: JSON.stringify(updatedData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `فشل تحديث المنتج (Status: ${response.status})`);
            }

            // --- بداية الكود المضاف لتحديث الكاش ---
            console.log('✅ تم تحديث المنتج، جاري إرسال إشارة لتحديث الكاش...');
            await fetch('/api/revalidate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_REVALIDATION_TOKEN}`
              },
              body: JSON.stringify({ 
                tags: ['products-list', `product-${originalSlug}`, `product-${newSlug}`]
              }), 
            });
            console.log('✅ تم تحديث كاش المنتجات بنجاح!');
            // --- نهاية الكود المضاف لتحديث الكاش ---

            alert('تم تحديث المنتج وتحديث الموقع فوراً للزوار وجوجل!');
            router.push('/admin/products');

        } catch (err: any) {
            console.error("Client-side error on update:", err);
            setError(err.message);
        } finally {
            setUpdating(false);
        }
    };
    
    return (
         <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">تعديل: <span className='text-blue-600'>{formData.name}</span></h2>
                 {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">اسم المنتج</label>
                            <input type="text" id="name" name="name" value={formData.name || ''} onChange={handleFieldChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                        </div>
                        <div className="md:col-span-2">
                           <label htmlFor="slug" className="block text-sm font-medium text-gray-700">رابط المنتج (يتم إنشاؤه تلقائيًا)</label>
                           <input type="text" id="slug" name="slug" value={formData.slug || ''} readOnly className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100" />
                        </div>
                        <div>
                           <label htmlFor="category" className="block text-sm font-medium text-gray-700">الفئة</label>
                            <select id="category" name="category" value={formData.category || ''} onChange={handleFieldChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white">
                                {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="sku" className="block text-sm font-medium text-gray-700">كود المنتج</label>
                            <input type="text" id="sku" name="sku" value={formData.sku || ''} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50" readOnly />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">الوصف</label>
                            <textarea id="description" name="description" value={formData.description || ''} onChange={handleFieldChange} rows={4} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"></textarea>
                        </div>
                        <div>
                           <label htmlFor="price" className="block text-sm font-medium text-gray-700">السعر الأصلي (جنيه)</label>
                           <input type="number" step="0.01" id="price" name="price" value={formData.price || ''} onChange={handleFieldChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                        </div>
                        <div>
                           <label htmlFor="discount" className="block text-sm font-medium text-gray-700">نسبة الخصم (%)</label>
                           <input type="number" step="1" id="discount" name="discount" value={formData.discount || ''} onChange={handleFieldChange} placeholder="مثال: 15" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                        </div>
                        <div>
                           <label htmlFor="stock" className="block text-sm font-medium text-gray-700">المخزون</label>
                           <input type="number" id="stock" name="stock" value={formData.stock || 0} onChange={handleFieldChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                        </div>
                        <div>
                           <label htmlFor="year" className="block text-sm font-medium text-gray-700">سنة الإصدار</label>
                           <input type="number" id="year" name="year" value={formData.year || ''} onChange={handleFieldChange} placeholder="مثال: 2024" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                        </div>
                    </div>

                    <div className="space-y-8 border-t pt-8 mt-8">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">صورة المنتج الرئيسية</label>
                            <div className="mt-2 flex items-center gap-4">
                                {mainImagePreview && <Image src={mainImagePreview} alt="معاينة" width={80} height={80} className="rounded-lg object-cover" />}
                                <input type="file" onChange={(e) => handleFileChange(e, 'main')} accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"/>
                            </div>
                            {mainImgUpProgress > 0 && <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2"><div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${mainImgUpProgress}%`}}></div></div>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">صورة ثانوية (اختياري)</label>
                             <div className="mt-2 flex items-center gap-4">
                                 {secondaryImagePreview && (
                                    <div className="relative">
                                        <Image src={secondaryImagePreview} alt="معاينة ثانوية" width={80} height={80} className="rounded-lg object-cover" />
                                        <button type="button" onClick={() => handleDeleteFile('secondary')} className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full shadow-lg hover:bg-red-700 transition-transform transform hover:scale-110"><FaTimesCircle size={18}/></button>
                                    </div>
                                 )}
                                <input type="file" onChange={(e) => handleFileChange(e, 'secondary')} accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"/>
                            </div>
                            {secondaryImgUpProgress > 0 && <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2"><div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${secondaryImgUpProgress}%`}}></div></div>}
                        </div>

                        <div>
                             <label className="block text-sm font-medium text-gray-700">فيديو المنتج (اختياري)</label>
                             <div className="mt-2 flex items-center gap-4">
                                 {videoFileName && (
                                    <div className="relative text-center p-3 border rounded-lg bg-gray-50">
                                        <p className="text-sm font-semibold text-gray-700">{videoFileName}</p>
                                         <button type="button" onClick={() => handleDeleteFile('video')} className="text-red-500 hover:text-red-700 text-xs font-semibold mt-1">حذف الفيديو الحالي</button>
                                    </div>
                                 )}
                                 <input type="file" onChange={(e) => handleFileChange(e, 'video')} accept="video/mp4,video/quicktime" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"/>
                            </div>
                            {videoUpProgress > 0 && <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2"><div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${videoUpProgress}%`}}></div></div>}
                        </div>
                    </div>

                     <div className="flex justify-end pt-8 gap-3 border-t mt-8">
                        <button type="button" onClick={() => router.push('/admin/products')} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">إلغاء</button>
                         <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400" disabled={updating}>{updating ? 'جاري التحديث...' : 'حفظ التعديلات'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
