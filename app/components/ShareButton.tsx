'use client';

import { useState, useEffect } from 'react';
import styles from './ShareButton.module.css';
import { FaShareAlt, FaWhatsapp, FaFacebook, FaTwitter, FaCopy } from 'react-icons/fa';

// Define the props the component will accept
interface ShareButtonProps {
  title?: string;
  text?: string;
  url?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ 
  title = 'مكتبة دار اللغات', // تم التعديل حسب الاسم القانوني
  text = 'اكتشف عالماً من المعرفة واللوازم المدرسية في مكتبة دار اللغات!', // تم التعديل
  url 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [finalUrl, setFinalUrl] = useState('');

  useEffect(() => {
    // Ensure this code runs only on the client side
    const determinedUrl = url || window.location.href;
    setFinalUrl(determinedUrl);
  }, [url]);


  const shareData = { title, text, url: finalUrl };

  const handleShareClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (navigator.share) {
      try {
        await navigator.share({
            title: shareData.title,
            text: shareData.text,
            url: shareData.url,
        });
      } catch (err) {
        console.error('Error using native share:', err);
        // Fallback to menu if native share is cancelled or fails
        setShowMenu(!showMenu);
      }
    } else {
      setShowMenu(!showMenu);
    }
  };

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(shareData.url).then(() => {
      setCopySuccess('تم النسخ!');
      setTimeout(() => setCopySuccess(''), 2000);
    }, () => {
      setCopySuccess('فشل النسخ');
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  const openShareLink = (e: React.MouseEvent, shareUrl: string) => {
    e.stopPropagation();
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }

  // Determine if this is a product card context to show only the icon
  const isProductCard = shareData.url.includes('/products/');

  return (
    <div className={styles.container}>
      <button onClick={handleShareClick} className={styles.shareButton} title="شارك واربح">
        <FaShareAlt />
        {!isProductCard && <span>شارك واربح</span>}
      </button>

      {showMenu && (
        <div className={styles.shareMenu}>
            <a onClick={(e) => openShareLink(e, `https://api.whatsapp.com/send?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`)} aria-label="Share on WhatsApp">
                <FaWhatsapp style={{color: '#25D366'}}/>
            </a>
            <a onClick={(e) => openShareLink(e, `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`)} aria-label="Share on Facebook">
                <FaFacebook style={{color: '#1877F2'}}/>
            </a>
            <a onClick={(e) => openShareLink(e, `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.text)}`)} aria-label="Share on Twitter">
                <FaTwitter style={{color: '#1DA1F2'}}/>
            </a>
            <button onClick={copyToClipboard} aria-label="Copy link">
                <FaCopy />
            </button>
        </div>
      )}
      {copySuccess && <div className={styles.copySuccess}>{copySuccess}</div>}
    </div>
  );
};

export default ShareButton;
