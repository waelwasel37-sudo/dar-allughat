
"use client";

import styles from './AddressForm.module.css';

// Define the type for the props the component will receive
interface AddressFormProps {
  onNameChange: (name: string) => void;
  onPhoneChange: (phone: string) => void;
  onGovernorateChange: (governorate: string) => void;
  onAddressChange: (address: string) => void;
}

// List of Egyptian Governorates for the dropdown
const egyptianGovernorates = [
  "القاهرة", "الجيزة", "الأسكندرية", "الدقهلية", "الشرقية", "المنوفية", 
  "القليوبية", "البحيرة", "الغربية", "كفر الشيخ", "دمياط", "الإسماعيلية", 
  "بورسعيد", "السويس", "شمال سيناء", "جنوب سيناء", "البحر الأحمر", 
  "الوادي الجديد", "مطروح", "الفيوم", "بني سويف", "المنيا", "أسيوط", 
  "سوهاج", "قنا", "الأقصر", "أسوان"
];

export default function AddressForm({ onNameChange, onPhoneChange, onGovernorateChange, onAddressChange }: AddressFormProps) {
  return (
    <div className={styles.formContainer}>
      <h3 className={styles.formHeader}>أدخل بيانات التوصيل</h3>
      
      <div className={styles.inputGroup}>
        <label htmlFor="name">الاسم بالكامل</label>
        <input 
          id="name"
          type="text" 
          placeholder="مثال: محمد أحمد" 
          onChange={(e) => onNameChange(e.target.value)}
          className={styles.input}
          required
        />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="phone">رقم الهاتف</label>
        <input 
          id="phone"
          type="tel" 
          placeholder="مثال: 01012345678"
          onChange={(e) => onPhoneChange(e.target.value)}
          className={styles.input}
          required
        />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="governorate">المحافظة</label>
        <select
          id="governorate"
          onChange={(e) => onGovernorateChange(e.target.value)}
          className={styles.input}
          required
        >
          <option value="">-- اختر محافظتك --</option>
          {egyptianGovernorates.map(gov => (
            <option key={gov} value={gov}>{gov}</option>
          ))}
        </select>
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="address">العنوان بالتفصيل</label>
        <input
          id="address"
          type="text"
          placeholder="مثال: 123 شارع الثورة، قسم مصر الجديدة"
          onChange={(e) => onAddressChange(e.target.value)}
          className={styles.input}
          required
        />
        <small className={styles.note}>
          برجاء كتابة العنوان بوضوح (الشارع، رقم العمارة، علامة مميزة) لضمان سرعة التوصيل.
        </small>
      </div>
    </div>
  );
}
