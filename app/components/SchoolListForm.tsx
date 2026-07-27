'use client';

import { useState, useEffect } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase-client';
import { trackFbqEvent } from '../lib/fpixel'; 
import { FaUpload, FaTimesCircle } from 'react-icons/fa';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

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
            trackFbqEvent('ViewContent', { 
                content_name: 'School List Form',
                content_category: 'Lead Generation'
            });
        } else {
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
            if (file.size > 5 * 1024 * 1024) { 
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
        if (imagePreview) { URL.revokeObjectURL(imagePreview); }
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
            
            trackFbqEvent('Lead', { content_name: 'School List Submission' });
            setSuccess('تم استلام طلبك بنجاح! جاري تحويلك لواتساب دار اللغات...');

            const whatsappNumber = '201220396597';
            const message = `*طلب قائمة مدرسية جديد* 🎒\n\n*الاسم:* ${fullName}\n*الهاتف:* ${phone}\n*العنوان:* ${address}\n\n*رابط القائمة:* ${imageUrl}`;
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

    return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
            {/* 🎯 توحيد التصميم: استخدام w-[75vw] مع max-w-sm لمطابقة النموذج الآخر */}
            <DialogContent className="w-[75vw] max-w-sm rounded-2xl p-6 bg-white direction-rtl text-right sm:rounded-2xl border-none shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black text-center text-gray-900 flex items-center justify-center gap-2">
                        🎒 ارفع قائمة مدرستك
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-2">
                    {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-semibold">{error}</div>}
                    {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-semibold">{success}</div>}

                    {!success && (
                        <>
                            <div className="flex flex-col gap-4">
                                <Input type="text" placeholder="الاسم الكامل" value={fullName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)} required disabled={isLoading} className="h-12 text-[1.05rem] rounded-xl border-gray-300 focus-visible:ring-blue-600 bg-white" />
                                <Input type="tel" placeholder="رقم الهاتف" value={phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)} required disabled={isLoading} className="h-12 text-[1.05rem] rounded-xl border-gray-300 focus-visible:ring-blue-600 bg-white" />
                            </div>
                            <Textarea placeholder="العنوان بالتفصيل (المدينة، الحي، الشارع)" value={address} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAddress(e.target.value)} required rows={3} disabled={isLoading} className="text-[1.05rem] rounded-xl border-gray-300 focus-visible:ring-blue-600 bg-white p-3" />

                            <div className="border-2 border-gray-300 border-dashed rounded-xl p-5 bg-gray-50 text-center">
                                {imagePreview ? (
                                    <div className="relative inline-block h-32 mx-auto">
                                        <img src={imagePreview} alt="Preview" className="h-full object-contain rounded-lg"/>
                                        {!isLoading && <button type='button' onClick={clearFile} className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full p-1.5 shadow-md"><FaTimesCircle /></button>}
                                    </div>
                                ) : (
                                    <label className="cursor-pointer block">
                                        <FaUpload className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                                        <span className="text-blue-600 font-bold text-sm block">اختر صورة قائمة المدرسة</span>
                                        <input type="file" className="hidden" onChange={handleFileChange} required disabled={isLoading} accept="image/png, image/jpeg, image/webp" />
                                    </label>
                                )}
                            </div>

                            {isLoading && uploadProgress > 0 && (
                                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                    <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
                                </div>
                            )}

                            <Button type="submit" disabled={isLoading} className="w-full h-14 text-lg font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/20 transition-all">
                                {isLoading ? 'جاري رفع القائمة...' : 'إرسال القائمة الآن 🎒'}
                            </Button>
                        </>
                    )}
                </form>
            </DialogContent>
        </Dialog>
    );
}