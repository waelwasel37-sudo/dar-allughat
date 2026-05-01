'use client';

import { useState, useEffect } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase-client';
import { trackFbqEvent } from '../lib/fpixel'; // Import the tracking function
import { FaUpload, FaTimesCircle, FaTimes } from 'react-icons/fa';

interface SchoolListFormProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SchoolListForm({ isOpen, onClose }: SchoolListFormProps) {
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [listImage, setListImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            // --- META PIXEL EVENT ---
            // Track when a user shows interest by opening the form.
            trackFbqEvent('ViewContent', { 
                content_name: 'School List Form',
                content_category: 'Lead Generation'
            });
            // ------------------------
        } else {
            // Reset form state when closing
            setFullName('');
            setPhone('');
            setAddress('');
            clearFile();
            setError(null);
            setSuccess(null);
            setIsLoading(false);
            setUploadProgress(0);
        }
    }, [isOpen]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('حجم الصورة يجب أن يكون أقل من 5 ميجابايت.');
                return;
            }
            setListImage(file);
            setImagePreview(URL.createObjectURL(file));
            setError(null);
        }
    };

    const clearFile = () => {
        setListImage(null);
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName || !phone || !address || !listImage) {
            setError('الرجاء ملء جميع الحقول وإرفاق صورة القائمة.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const filePath = `school-lists/${Date.now()}-${listImage.name}`;
            const storageRef = ref(storage, filePath);
            const uploadTask = uploadBytesResumable(storageRef, listImage);

            uploadTask.on('state_changed', (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            });

            await uploadTask;
            const imageUrl = await getDownloadURL(uploadTask.snapshot.ref);

            const response = await fetch('/api/school-list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, phone, address, imageUrl, imagePath: filePath }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'حدث خطأ أثناء حفظ البيانات.' }));
                throw new Error(errorData.error);
            }
            
            // Track the 'Lead' event after the form is successfully submitted.
            trackFbqEvent('Lead', { content_name: 'School List Submission' });

            setSuccess('تم استلام طلبك! جاري تحويلك إلى واتساب...');

            const whatsappNumber = '201220396597';
            const message = `*طلب قائمة مدرسية جديد* 📝\n\n*الاسم:* ${fullName}\n*الهاتف:* ${phone}\n*العنوان:* ${address}\n\n*رابط القائمة:* ${imageUrl}`;
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

            setTimeout(() => {
                window.open(whatsappUrl, '_blank');
                onClose();
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'حدث خطأ غير متوقع.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
                <button onClick={onClose} className="absolute top-4 left-4 text-gray-500 hover:text-gray-800 z-10">
                    <FaTimes size={24} />
                </button>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <h2 className="text-2xl font-bold text-center text-gray-800">ارفع قائمة مدرستك</h2>
                    
                    {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">{error}</div>}
                    {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md">{success}</div>}

                    {!success && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <input type="text" placeholder="الاسم الكامل" value={fullName} onChange={(e) => setFullName(e.target.value)} required disabled={isLoading} className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                                <input type="tel" placeholder="رقم الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} required disabled={isLoading} className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                            </div>
                            <textarea placeholder="العنوان بالتفصيل" value={address} onChange={(e) => setAddress(e.target.value)} required rows={3} disabled={isLoading} className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"></textarea>

                            <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    {imagePreview ? (
                                        <div className='relative mx-auto h-32 w-auto'>
                                            <img src={imagePreview} alt="Preview" className="h-full w-full object-contain rounded-md"/>
                                            {!isLoading && <button type='button' onClick={clearFile} className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md'><FaTimesCircle /></button>}
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer">
                                            <FaUpload className="mx-auto h-10 w-10 text-gray-400" />
                                            <span className="text-blue-600 block mt-2">اختر صورة القائمة</span>
                                            <input type="file" className="hidden" onChange={handleFileChange} required disabled={isLoading} accept="image/png, image/jpeg, image/webp" />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {isLoading && uploadProgress > 0 && (
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                                    <div className="bg-blue-600 h-2.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
                                </div>
                            )}

                            <button type="submit" disabled={isLoading} className={`w-full py-3 rounded-md text-white font-bold ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                {isLoading ? 'جاري المعالجة...' : 'إرسال الطلب الآن'}
                            </button>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}
