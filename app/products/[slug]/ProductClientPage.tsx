'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Product } from '@/app/lib/types';
import { useCart } from '@/app/context/CartContext';
import styles from './ProductDetails.module.css';
import RelatedProducts from '@/app/components/RelatedProducts';
import Rating from '@/app/components/Rating';
import { FaStar, FaEye, FaShareAlt } from 'react-icons/fa';
import { database } from '@/app/lib/firebase-client';
import { ref, onValue, onDisconnect, set, serverTimestamp } from 'firebase/database';

// ✅ تم حذف مكتبة uuid الثقيلة تماماً لتوفير 407 كيبيبايت من حجم الجافا سكريبت

export default function ProductClientPage({ product, relatedProducts }: { product: Product, relatedProducts: Product[] }) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const [viewers, setViewers] = useState(0);
  
  // الحالات الحية (Live States) المتزامنة مع السيرفر وقاعدة البيانات
  const [realTimeStock, setRealTimeStock] = useState(product.stock ?? 0);
  const [livePrice, setLivePrice] = useState(product.price ?? 0);
  const [liveDiscount, setLiveDiscount] = useState(product.discount || 0);
  
  // حالات الطلب المسبق (Pre-order states)
  const [showPreOrderInput, setShowPreOrderInput] = useState(false);
  const [preOrderPhone, setPreOrderPhone] = useState('');
  const [isSubmittingPreOrder, setIsSubmittingPreOrder] = useState(false);
  const [preOrderSubmitted, setPreOrderSubmitted] = useState(false);
  const [preOrderError, setPreOrderError] = useState<string | null>(null);

  const [ratingState, setRatingState] = useState({
    averageRating: product.averageRating || 0,
    ratingCount: product.ratingCount || 0,
  });

  const [activeMedia, setActiveMedia] = useState({ type: 'image', src: product.imageUrl, poster: product.imageUrl });

  // حساب السعر النهائي بعد الخصم بناءً على القيم الحية الحالية
  const priceAfter = useMemo(() => livePrice * (1 - liveDiscount / 100), [livePrice, liveDiscount]);

  // ✅ استخدام الدالة المدمجة بالمتصفح البديلة لـ uuid لتوليد معرف فريد بوزن صفر بايت!
  const userId = useMemo(() => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15); // حماية احتياطية للمتصفحات القديمة جداً
  }, []);

  useEffect(() => {
    const presenceRef = ref(database, `products/${product.slug}/viewers`);
    const userRef = ref(database, `products/${product.slug}/viewers/${userId}`);
    
    const stockRef = ref(database, `products/${product.slug}/stock`);
    const priceRef = ref(database, `products/${product.slug}/price`);
    const discountRef = ref(database, `products/${product.slug}/discount`);

    set(userRef, { timestamp: serverTimestamp() });
    onDisconnect(userRef).remove();

    const viewersListener = onValue(presenceRef, (snapshot) => {
      setViewers(snapshot.size);
    });

    const stockListener = onValue(stockRef, (snapshot) => {
      if (snapshot.exists()) {
        setRealTimeStock(snapshot.val());
      }
    });

    const priceListener = onValue(priceRef, (snapshot) => {
      if (snapshot.exists()) {
        setLivePrice(snapshot.val());
      }
    });

    const discountListener = onValue(discountRef, (snapshot) => {
      if (snapshot.exists()) {
        setLiveDiscount(snapshot.val());
      }
    });

    return () => {
      viewersListener();
      stockListener();
      priceListener();
      discountListener();
      set(userRef, null);
    };
  }, [product.slug, userId]);

  const handleAddToCart = () => {
    const liveProduct = { 
      ...product, 
      stock: realTimeStock, 
      price: livePrice, 
      discount: liveDiscount 
    };
    addToCart(liveProduct);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    const liveProduct = { 
      ...product, 
      stock: realTimeStock, 
      price: livePrice, 
      discount: liveDiscount 
    };
    addToCart(liveProduct);
    router.push('/checkout');
  };

  const handlePreOrder = async () => {
    if (!preOrderPhone || !/^01[0-2,5]{1}[0-9]{8}$/.test(preOrderPhone)) {
        setPreOrderError('الرجاء إدخال رقم هاتف مصري صحيح.');
        return;
    }
    setPreOrderError(null);
    setIsSubmittingPreOrder(true);

    try {
        const response = await fetch('/api/pre-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug: product.slug, phone: preOrderPhone }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to submit pre-order.');
        }

        setPreOrderSubmitted(true);
        setShowPreOrderInput(false);
        setTimeout(() => setPreOrderSubmitted(false), 5000); 

    } catch (error: any) {
        console.error(error);
        setPreOrderError(error.message || 'حدث خطأ. حاول مرة أخرى.');
    } finally {
        setIsSubmittingPreOrder(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `شاهد هذا المنتج الرائع: ${product.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('تم نسخ رابط المنتج! شاركه مع أصدقائك.');
    }
  };
  const handleRatingSuccess = (data: { averageRating: number; ratingCount: number }) => {
    setRatingState(data);
  };

  const mediaGallery = useMemo(() => {
    return [
      { type: 'image', src: product.imageUrl, poster: product.imageUrl },
      ...(product.secondaryImageUrl ? [{ type: 'image', src: product.secondaryImageUrl, poster: product.secondaryImageUrl }] : []),
      ...(product.videoUrl ? [{ type: 'video', src: product.videoUrl, poster: product.imageUrl }] : []),
    ];
  }, [product.imageUrl, product.secondaryImageUrl, product.videoUrl]);

  const formatReleaseDate = (dateString: string | undefined) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('ar-EG');
  };

  const getStockInfo = () => {
    const formattedDate = formatReleaseDate(product.releaseDate);

    if (realTimeStock > 10) return <p className={`${styles.stockInfo} ${styles.inStock}`}>متوفر في المخزون</p>;
    if (realTimeStock > 0) return <p className={`${styles.stockInfo} ${styles.lowStock}`}>{`باقي ${realTimeStock} قطع فقط!`}</p>;
    
    if (product.preOrderEnabled) {
      return (
        <>
          <p className={`${styles.stockInfo} ${styles.outOfStock}`}>نفد المخزون حالياً</p>
          {formattedDate && 
            <p className={styles.releaseDateInfo}>
                {`متاح للطلب المسبق. سيتوفر بتاريخ: ${formattedDate}`}
            </p>}
        </>
      );
    }
    return <p className={`${styles.stockInfo} ${styles.outOfStock}`}>نفد المخزون</p>;
  };

  return (
      <div className={styles.productPageContainer}>
        <div className={styles.container}>
          <div className={styles.mediaContainer}>
           <div className={styles.mainMediaView}>
              {activeMedia.type === 'image' ? (
                <Image 
                    src={activeMedia.src}
                    alt={product.name} 
                    width={500}
                    height={500}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className={styles.image}
                    priority // تسريع تحميل الصورة الرئيسية لـ LCP
                />
              ) : (
                <video
                  key={activeMedia.src}
                  className={styles.video}
                  controls
                  poster={activeMedia.poster}
                  preload="metadata"
                >
                  <source src={activeMedia.src} type="video/mp4" />
                  متصفحك لا يدعم عرض الفيديوهات.
                </video>
              )}
            </div>
            {mediaGallery.length > 1 && (
              <div className={styles.thumbnailTray}>
                {mediaGallery.map((media, index) => (
                  <button 
                    key={index}
                    className={`${styles.thumbnail} ${activeMedia.src === media.src ? styles.activeThumbnail : ''}`}
                    onClick={() => setActiveMedia(media)}
                  >
                    {media.type === 'image' ? (
                      <Image src={media.src} alt={`Thumbnail ${index + 1}`} width={80} height={80} />
                    ) : (
                      <div className={styles.videoThumbnailContainer}>
                        <Image src={media.poster || ''} alt="Video thumbnail" width={80} height={80} />
                        <div className={styles.playIconOverlay}>▶</div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className={styles.detailsContainer}>
            <h1 className={styles.name}>{product.name}</h1>
            {viewers > 1 && <div className={styles.viewersCount}><FaEye /><span>{`${viewers} أشخاص يشاهدون هذا المنتج الآن`}</span></div>}
            
            <div className={styles.priceContainer}>
                {liveDiscount > 0 ? (
                    <>
                        <span className={styles.originalPrice}>{livePrice.toFixed(2)} جنيه</span>
                        <span className={styles.priceAfter}>{priceAfter.toFixed(2)} جنيه</span>
                        <span className={styles.discountBadge}>{`خصم ${liveDiscount}%`}</span>
                    </>
                ) : (
                    <span className={styles.price}>{livePrice.toFixed(2)} جنيه</span>
                )}
            </div>
            <div className={styles.stockContainer}>{getStockInfo()}</div>

            <div className={styles.stickyButtonContainer}>
                {realTimeStock > 0 ? (
                    <div className={styles.buttonContainer}>
                        <button onClick={handleAddToCart} className={styles.button} disabled={added}>{added ? 'تمت الإضافة!' : 'أضف إلى السلة'}</button>
                        <button onClick={handleBuyNow} className={`${styles.button} ${styles.buyNowButton}`}>اشتري الآن</button>
                    </div>
                ) : product.preOrderEnabled ? (
                    <div className={styles.preOrderContainer}>
                        {!showPreOrderInput && (
                            <button 
                                onClick={() => setShowPreOrderInput(true)} 
                                className={`${styles.button} ${styles.preOrderButton} ${preOrderSubmitted ? styles.preOrderSubmitted : ''}`}
                                disabled={preOrderSubmitted}
                            >
                                {preOrderSubmitted ? 'تم استلام طلبك! سنكلمك قريبًا' : 'اطلب مسبقًا'}
                            </button>
                        )}
                        {showPreOrderInput && (
                            <div className={styles.preOrderInputGroup}>
                                <input 
                                    type="tel" 
                                    value={preOrderPhone}
                                    onChange={(e) => setPreOrderPhone(e.target.value)}
                                    placeholder="ادخل رقم هاتفك للطلب المسبق"
                                    className={styles.preOrderInput}
                                />
                                <button onClick={handlePreOrder} className={`${styles.button} ${styles.preOrderSubmitButton}`} disabled={isSubmittingPreOrder}>
                                    {isSubmittingPreOrder ? 'جارٍ التأكيد...' : 'تأكيد الطلب'}
                                </button>
                                <button onClick={() => setShowPreOrderInput(false)} className={styles.cancelButton}>إلغاء</button>
                            </div>
                        )}
                        {preOrderError && <p className={styles.preOrderError}>{preOrderError}</p>}
                    </div>
                ) : (
                    <button className={styles.button} disabled>نفد المخزون</button>
                )}
                <div className={styles.actionsContainer}>
                    <button onClick={handleShare} className={`${styles.iconButton} ${styles.shareButton}`} aria-label="شارك المنتج">
                        <FaShareAlt />
                        <span>شارك واربح</span>
                    </button>
                </div>
            </div>

            <Rating productId={product.id} currentRating={ratingState.averageRating} ratingCount={ratingState.ratingCount} onRatingSuccess={handleRatingSuccess} />
          </div>
        </div>
        <RelatedProducts products={relatedProducts} />
      </div>
  );
}