'use client';

import { useEffect } from 'react';
import Script from 'next/script';

interface GoogleReviewsOptInProps {
  orderId: string;
  customerEmail: string;
  deliveryCountry: string;
  estimatedDeliveryDate: string;
}

const GoogleReviewsOptIn = ({ 
  orderId, 
  customerEmail, 
  deliveryCountry, 
  estimatedDeliveryDate 
}: GoogleReviewsOptInProps) => {

  useEffect(() => {
    const renderOptIn = () => {
      if (window.gapi && window.gapi.surveyoptin) {
        window.gapi.surveyoptin.render({
          merchant_id: 5730538537,
          order_id: orderId,
          email: customerEmail,
          delivery_country: deliveryCountry,
          estimated_delivery_date: estimatedDeliveryDate,
        });
      }
    };

    if (window.gapi) {
      renderOptIn();
    } else {
      window.renderOptIn = renderOptIn;
    }

    return () => {
      window.renderOptIn = undefined;
    }
  }, [orderId, customerEmail, deliveryCountry, estimatedDeliveryDate]);

  return (
    <Script
      src="https://apis.google.com/js/platform.js?onload=renderOptIn"
      strategy="lazyOnload"
    />
  );
};

declare global {
    interface Window {
        renderOptIn?: () => void;
    }
}

export default GoogleReviewsOptIn;
