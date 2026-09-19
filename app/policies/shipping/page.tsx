
import styles from '../PolicyPage.module.css';

const ShippingPolicyPage = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>سياسة الشحن والتوصيل</h1>
      <div className={styles.content}>
        <h2>الاستلام من الفرع</h2>
        <p>الاستلام من الفرع مجانا.</p>

        <h2>مدة التوصيل:</h2>
        <p>يتم تجهيز الطلب خلال 24 ساعة من تأكيد الشراء عبر واتساب.</p>
        <p>تستغرق عملية التوصيل من 2 إلى 5 أيام عمل.</p>

        <h2>استلام الطلب:</h2>
        <p>عند استلام الطلب، يرجى فحص الكتب والأدوات المكتبية للتأكد من سلامتها قبل مغادرة المندوب.</p>
      </div>
    </div>
  );
};

export default ShippingPolicyPage;
