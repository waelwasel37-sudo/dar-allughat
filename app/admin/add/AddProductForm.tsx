'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Product, Category } from '../../lib/types';
import { FaUpload, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from '../../lib/firebase-client';

interface AddProductFormProps {
  categories: Category[];
}

type ProductFormData = Omit<Product, 'id' | 'updatedAt' | 'createdAt' | 'imageUrl' | 'imagePath' | 'categoryEmoji' | 'secondaryImageUrl' | 'videoUrl'>;

const generateSlug = (name: string) => {
    if (!name) return '';
    return name.trim().toLowerCase().replace(/[^\w\d\s\u0600-\u06FF]/g, '').replace(/\s+/g, '-');
};

const uploadFile = (file: File, path: string, setProgress: (progress: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setProgress(progress);
            },
            (error) => {
                console.error("Upload failed:", error);
                reject(error);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    resolve(downloadURL);
                });
            }
        );
    });
};

export default function AddProductForm({ categories }: AddProductFormProps) {
    const router = useRouter();
    const { isAdmin, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && !isAdmin) {
            router.push('/login');
        }
    }, [isAdmin, authLoading, router]);

    const [formData, setFormData] = useState<ProductFormData>(() => ({
        name: '',
        slug: '',
        sku: `CODE-${Date.now()}`,
        description: '',
        price: 0,
        discount: 0,
        stock: 1,
        category: '',
        year: new Date().getFullYear(),
    }));

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isGeneratingDesc, setIsGeneratingDesc] = useState(false); 
    
    const [mainImageFile, setMainImageFile] = useState<File | null>(null);
    const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
    const [mainImageUploadProgress, setMainImageUploadProgress] = useState(0);

    const [secondaryImageFile, setSecondaryImageFile] = useState<File | null>(null);
    const [secondaryImagePreview, setSecondaryImagePreview] = useState<string | null>(null);
    const [secondaryImageUploadProgress, setSecondaryImageUploadProgress] = useState(0);

    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoFileName, setVideoFileName] = useState('');
    const [videoUploadProgress, setVideoUploadProgress] = useState(0);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newState = { ...prev };
            const numericFields = ['price', 'discount', 'stock', 'year'];
            if (numericFields.includes(name)) {
                (newState as any)[name] = parseFloat(value) || 0;
            } else {
                (newState as any)[name] = value;
            }
            if (name === 'name') {
                newState.slug = generateSlug(value);
            }
            return newState;
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'main' | 'secondary' | 'video') => {
        const file = e.target.files?.[0];
        if (file) {
            switch (fileType) {
                case 'main':
                    setMainImageFile(file);
                    setMainImagePreview(URL.createObjectURL(file));
                    break;
                case 'secondary':
                    setSecondaryImageFile(file);
                    setSecondaryImagePreview(URL.createObjectURL(file));
                    break;
                case 'video':
                    setVideoFile(file);
                    setVideoFileName(file.name);
                    break;
            }
        }
    };
    
    const clearFile = (fileType: 'secondary' | 'video') => {
        switch (fileType) {
            case 'secondary':
                setSecondaryImageFile(null);
                setSecondaryImagePreview(null);
                setSecondaryImageUploadProgress(0);
                break;
            case 'video':
                setVideoFile(null);
                setVideoFileName('');
                setVideoUploadProgress(0);
                break;
        }
    };

    const handleGenerateDescription = async () => {
        if (!formData.name) {
            setError('الرجاء إدخال اسم المنتج أولاً لتوليد الوصف.');
            return;
        }
        setIsGeneratingDesc(true);
        setError(null);
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: formData.name, type: 'product' }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'فشل توليد الوصف.');
            }

            const data = await response.json();
            setFormData(prev => ({ ...prev, description: data.generatedText }));

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsGeneratingDesc(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mainImageFile) {
            setError('الرجاء اختيار صورة رئيسية للمنتج.');
            return;
        }
        if (!formData.category) {
            setError('الرجاء اختيار فئة للمنتج.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const slug = generateSlug(formData.name) || `product-${Date.now()}`;
            
            const mainExt = mainImageFile.name.split('.').pop();
            const mainImagePath = `products/${slug}/main-${slug}.${mainExt}`;
            const mainImageUrl = await uploadFile(mainImageFile, mainImagePath, setMainImageUploadProgress);
            
            let secondaryImageUrl: string | undefined = undefined;
            if (secondaryImageFile) {
                const secExt = secondaryImageFile.name.split('.').pop();
                const secondaryImagePath = `products/${slug}/secondary-${slug}.${secExt}`;
                secondaryImageUrl = await uploadFile(secondaryImageFile, secondaryImagePath, setSecondaryImageUploadProgress);
            }
            
            let videoUrl: string | undefined = undefined;
            if (videoFile) {
                const vidExt = videoFile.name.split('.').pop();
                const videoPath = `products/${slug}/video-${slug}.${vidExt}`;
                videoUrl = await uploadFile(videoFile, videoPath, setVideoUploadProgress);
            }

            const productData: Omit<Product, 'id'> & { id?: string } = {
                ...formData,
                slug,
                imageUrl: mainImageUrl,
                imagePath: mainImagePath, 
                ...(secondaryImageUrl && { secondaryImageUrl }),
                ...(videoUrl && { videoUrl }),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData),
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.error || `فشل إنشاء المنتج. (Status: ${response.status})`);
            }

            alert('تمت إضافة المنتج بنجاح!');
            router.push('/admin/products');
            router.refresh();

        } catch (err: any) {
            console.error("Client-side error during product submission:", err);
            setError(err.message || "حدث خطأ غير متوقع.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
           <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md">
               <h2 className="text-2xl font-bold text-gray-900 mb-6">إضافة منتج جديد</h2>
               <form onSubmit={handleSubmit} className="space-y-6">
                   {error &&
                       <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                           <strong className="font-bold">خطأ: </strong>
                           <span className="block sm:inline">{error}</span>
                       </div>
                   }
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                           <label htmlFor="name" className="block text-sm font-medium text-gray-700">اسم المنتج</label>
                           <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                       </div>
                        <div className="md:col-span-2">
                           <label htmlFor="slug" className="block text-sm font-medium text-gray-700">رابط المنتج (يتم إنشاؤه تلقائيًا)</label>
                           <input type="text" id="slug" name="slug" value={formData.slug} readOnly className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100" />
                       </div>
                       <div>
                          <label htmlFor="category" className="block text-sm font-medium text-gray-700">الفئة</label>
                           <select id="category" name="category" value={formData.category} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white">
                               <option value="" disabled>الرجاء اختيار فئة...</option>
                               {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                           </select>
                       </div>
                       <div>
                           <label htmlFor="sku" className="block text-sm font-medium text-gray-700">كود المنتج (تلقائي)</label>
                           <input type="text" id="sku" name="sku" value={formData.sku} readOnly className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100" />
                       </div>
                       <div className="md:col-span-2">
                           <div className="flex justify-between items-center">
                               <label htmlFor="description" className="block text-sm font-medium text-gray-700">الوصف</label>
                               <button type="button" onClick={handleGenerateDescription} disabled={isGeneratingDesc} className="text-sm font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
                                   {isGeneratingDesc ? <FaSpinner className="animate-spin" /> : '✨'}
                                   {isGeneratingDesc ? 'جاري التوليد...' : 'توليد وصف بالذكاء الاصطناعي'}
                               </button>
                           </div>
                           <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={6} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"></textarea>
                       </div>
                       <div>
                          <label htmlFor="price" className="block text-sm font-medium text-gray-700">السعر الأصلي (جنيه)</label>
                          <input type="number" step="0.01" id="price" name="price" value={formData.price} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                       </div>
                       <div>
                          <label htmlFor="discount" className="block text-sm font-medium text-gray-700">نسبة الخصم (%)</label>
                          <input type="number" step="1" id="discount" name="discount" value={formData.discount} onChange={handleChange} placeholder="مثال: 15" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                       </div>
                       <div>
                          <label htmlFor="stock" className="block text-sm font-medium text-gray-700">المخزون</label>
                          <input type="number" id="stock" name="stock" value={formData.stock} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                       </div>
                       <div>
                          <label htmlFor="year" className="block text-sm font-medium text-gray-700">سنة الإصدار</label>
                          <input type="number" id="year" name="year" value={formData.year} onChange={handleChange} placeholder="مثال: 2023" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                       </div>
                   </div>

                   <div className="md:col-span-2">
                       <label className="block text-sm font-medium text-gray-700">صورة المنتج الرئيسية</label>
                       <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                           <div className="space-y-1 text-center">
                               {mainImagePreview ? (
                                   <img src={mainImagePreview} alt="Preview" className="mx-auto h-48 w-auto rounded-md"/>
                               ) : (
                                   <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
                               )}
                               <div className="flex text-sm text-gray-600">
                                   <label htmlFor="main-image-file" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                                       <span>ارفع ملفًا</span>
                                       <input id="main-image-file" name="main-image-file" type="file" className="sr-only" onChange={(e) => handleFileChange(e, 'main')} required accept="image/*" />
                                   </label>
                               </div>
                               {mainImageUploadProgress > 0 && <div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${mainImageUploadProgress}%`}}></div></div>}
                           </div>
                       </div>
                   </div>
                   <div className="md:col-span-2">
                       <label className="block text-sm font-medium text-gray-700">صورة ثانوية (اختياري)</label>
                       <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                           <div className="space-y-1 text-center">
                               {secondaryImagePreview ? (
                                   <div className='relative mx-auto h-48 w-auto'>
                                     <img src={secondaryImagePreview} alt="Preview" className="h-full w-full object-contain rounded-md"/>
                                     <button type='button' onClick={() => clearFile('secondary')} className='absolute top-1 right-1 bg-red-500 text-white rounded-full p-1'><FaTimesCircle /></button>
                                   </div>
                               ) : (
                                   <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
                               )}
                               <div className="flex text-sm text-gray-600">
                                   <label htmlFor="secondary-image-file" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                                       <span>ارفع ملفًا</span>
                                       <input id="secondary-image-file" name="secondary-image-file" type="file" className="sr-only" onChange={(e) => handleFileChange(e, 'secondary')} accept="image/*" />
                                   </label>
                               </div>
                               {secondaryImageUploadProgress > 0 && <div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${secondaryImageUploadProgress}%`}}></div></div>}
                           </div>
                       </div>
                   </div>
                   <div className="md:col-span-2">
                       <label className="block text-sm font-medium text-gray-700">فيديو المنتج (اختياري)</label>
                       <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                           <div className="space-y-1 text-center">
                               {videoFileName ? (
                                   <div className='text-center'>
                                    <p className='text-sm text-gray-800'>{videoFileName}</p>
                                    <button type='button' onClick={() => clearFile('video')} className='mt-2 text-red-500 hover:text-red-700 text-xs font-semibold'>إزالة الفيديو</button>
                                   </div>
                               ) : (
                                   <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
                               )}
                               <div className="flex text-sm text-gray-600">
                                   <label htmlFor="video-file" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                                       <span>ارفع ملفًا</span>
                                       <input id="video-file" name="video-file" type="file" className="sr-only" onChange={(e) => handleFileChange(e, 'video')} accept="video/mp4,video/quicktime" />
                                   </label>
                               </div>
                               {videoUploadProgress > 0 && <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2"><div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${videoUploadProgress}%`}}></div></div>}
                           </div>
                       </div>
                   </div>

                   <div className="flex justify-end pt-4 gap-3">
                       <button type="button" onClick={() => router.back()} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                          إلغاء
                       </button>
                        <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                           {isLoading ? 'جاري الإضافة...' : 'إضافة المنتج'}
                       </button>
                   </div>
               </form>
           </div>
       </div>
   );
}
