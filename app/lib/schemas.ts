
import { z } from 'zod';

// Schema for validating customer address and contact information
export const addressSchema = z.object({
  name: z.string()
    .min(3, { message: "يجب أن يكون الاسم 3 أحرف على الأقل" })
    .max(50, { message: "الاسم طويل جدًا" }),
    
  phone: z.string()
    .regex(/^01[0-2,5]{1}[0-9]{8}$/, { message: "صيغة رقم الهاتف غير صحيحة" }),
    
  governorate: z.string()
    .min(1, { message: "يجب اختيار المحافظة" }), // Ensures the field is not empty
    
  address: z.string()
    .min(10, { message: "يجب أن يكون العنوان 10 أحرف على الأقل" })
    .max(200, { message: "العنوان طويل جدًا" }),
});
