'use client';

import { useEffect } from 'react';
import Script from 'next/script';

const GoogleMerchantBadge = () => {
  useEffect(() => {
    if (window.merchantwidget) {
      window.merchantwidget.start({
        merchant_id: 5730538537,
        position: "BOTTOM_LEFT",
      });
    }
  }, []);

  return (
    <Script 
      id="merchantWidgetScript"
      src="https://www.gstatic.com/shopping/merchant/merchantwidget.js"
      strategy="lazyOnload"
      onLoad={() => {
        if (window.merchantwidget) {
          window.merchantwidget.start({
            merchant_id: 5730538537,
            position: "BOTTOM_LEFT",
          });
        }
      }}
    />
  );
};

export default GoogleMerchantBadge;