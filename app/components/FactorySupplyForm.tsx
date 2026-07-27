'use client';

import { useState, useEffect } from 'react';
import { trackFbqEvent } from '../lib/fpixel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface FactorySupplyFormProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function FactorySupplyForm({ isOpen, onClose }: FactorySupplyFormProps) {
    const [companyName, setCompanyName] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [phone, setPhone] = useState('');
    const [requiredItems, setRequiredItems] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null); // To show API errors

    useEffect(() => {
        if (isOpen) {
            trackFbqEvent('ViewContent', { 
                content_name: 'Factory Supply Form',
                content_category: 'B2B Wholesale'
            });
        } else {
            // Reset form state on close
            setCompanyName('');
            setContactPerson('');
            setPhone('');
            setRequiredItems('');
            setSuccess(null);
            setError(null);
            setIsLoading(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyName || !contactPerson || !phone || !requiredItems) return;

        setIsLoading(true);
        setError(null);

        try {
            // 🎯 1. Save data to the database via our new API
            const response = await fetch('/api/factory-supplies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ companyName, contactPerson, phone, requiredItems }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit the request. Please try again.');
            }

            // 2. Track successful lead
            trackFbqEvent('Lead', { content_name: 'Factory Supply Submission' });
            
            // 3. Set success message and trigger WhatsApp redirect
            setSuccess('تم تسجيل طلب التوريد بنجاح! جاري تحويلك لقسم مبيعات الجملة...');

            const whatsappNumber = '201220396597';
            const message = `*طلب توريد للمصانع والمؤسسات جديد* 🏢\n\n*اسم الشركة/المؤسسة:* ${companyName}\n*المسؤول:* ${contactPerson}\n*رقم التواصل:* ${phone}\n\n*الأدوات والمستلزمات المطلوبة:* \n${requiredItems}`;
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

            setTimeout(() => {
                window.open(whatsappUrl, '_blank');
                onClose();
            }, 2000); // 2-second delay to allow user to read the message

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
            <DialogContent className="w-[75vw] max-w-sm rounded-2xl p-6 bg-white direction-rtl text-right sm:rounded-2xl border-none shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black text-center text-gray-900 flex items-center justify-center gap-2">
                        🏢 توريدات مصانع ومؤسسات
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-2">
                    {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-semibold">{success}</div>}
                    {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-semibold">{error}</div>}

                    {!success && (
                        <>
                            <div className="flex flex-col gap-4">
                                <Input 
                                    type="text" 
                                    placeholder="اسم الشركة / المصنع / المؤسسة" 
                                    value={companyName} 
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyName(e.target.value)} 
                                    required 
                                    disabled={isLoading} 
                                    className="h-12 text-[1.05rem] rounded-xl border-gray-300 focus-visible:ring-green-600 bg-white" 
                                />
                                <Input 
                                    type="text" 
                                    placeholder="اسم المسؤول للتواصل" 
                                    value={contactPerson} 
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactPerson(e.target.value)} 
                                    required 
                                    disabled={isLoading} 
                                    className="h-12 text-[1.05rem] rounded-xl border-gray-300 focus-visible:ring-green-600 bg-white" 
                                />
                            </div>
                            <Input 
                                type="tel" 
                                placeholder="رقم الهاتف للتواصل مباشر" 
                                value={phone} 
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)} 
                                required 
                                disabled={isLoading} 
                                className="h-12 text-[1.05rem] rounded-xl border-gray-300 focus-visible:ring-green-600 bg-white" 
                            />
                            
                            <Textarea 
                                placeholder="اكتب هنا تفاصيل الأدوات المكتبية أو الورقيات أو المستلزمات المطلوبة توريدها للمؤسسة..." 
                                value={requiredItems} 
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRequiredItems(e.target.value)} 
                                required 
                                rows={4} 
                                disabled={isLoading} 
                                className="text-[1.05rem] rounded-xl border-gray-300 focus-visible:ring-green-600 bg-white p-3" 
                            />

                            <Button 
                                type="submit" 
                                disabled={isLoading} 
                                className="w-full h-14 text-lg font-black text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-lg shadow-green-600/20 transition-all"
                            >
                                {isLoading ? 'جاري التسجيل والحفظ...' : 'إرسال طلب التوريد الآن 🏢'}
                            </Button>
                        </>
                    )}
                </form>
            </DialogContent>
        </Dialog>
    );
}
