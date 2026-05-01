'use client';

import { useState } from 'react';
import styles from './ShareButton.module.css';
import { FaShareAlt, FaWhatsapp, FaFacebook, FaTwitter, FaCopy } from 'react-icons/fa';

// Define the props the component will accept
interface ShareButtonProps {
  title?: string;
  text?: string;
  url?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ 
  title = 'مكتبات دار اللغات', 
  text = 'اكتشف عالماً من المعرفة واللوازم المدرسية في مكتبات دار اللغات!', 
  url = typeof window !== 'undefined' ? window.location.origin : '' 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');

  const shareData = { title, text, url };

  const handleNativeShare = async () => {
    // Check if we are sharing the main site or a product page
    const isProduct = url.includes('/product/');
    const sharePayload = {
        title: shareData.title,
        text: isProduct ? `${shareData.title}: ${shareData.text}` : shareData.text,
        url: shareData.url,
    };

    if (navigator.share) {
      try {
        await navigator.share(sharePayload);
      } catch (err) {
        console.error('Error using native share:', err);
      }
    } else {
      setShowMenu(!showMenu);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareData.url).then(() => {
      setCopySuccess('تم النسخ!');
      setTimeout(() => setCopySuccess(''), 2000);
    }, () => {
      setCopySuccess('فشل النسخ');
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  const openShareLink = (shareUrl: string) => {
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className={styles.container}>
      <button onClick={handleNativeShare} className={styles.shareButton} title="شارك المنتج">
        <FaShareAlt />
        {/* Hide text on product card to save space */}
        {!url.includes('/product/') && <span>شارك واربح</span>}
      </button>
      {showMenu && (
        <div className={styles.shareMenu}>
            <a onClick={() => openShareLink(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`)} aria-label="Share on WhatsApp">
                <FaWhatsapp style={{color: '#25D366'}}/>
            </a>
            <a onClick={() => openShareLink(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`)} aria-label="Share on Facebook">
                <FaFacebook style={{color: '#1877F2'}}/>
            </a>
            <a onClick={() => openShareLink(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.text)}`)} aria-label="Share on Twitter">
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
