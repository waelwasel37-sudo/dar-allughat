
'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from "react"
import Script from 'next/script'

// Define the type for the window.gtag function for TypeScript
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'js' | 'set' | 'event',
      id: string,
      config?: { [key: string]: any }
    ) => void;
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

// Function to log a page view
export const pageview = (url: string) => {
  // Check if the gtag function is available on the window object and if the tracking ID is set
  if (typeof window.gtag !== 'undefined' && GA_TRACKING_ID) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// Function to log a specific event
export const event = ({ action, category, label, value }: { action: string, category: string, label: string, value: number }) => {
  // Check if the gtag function is available and the tracking ID is set
  if (typeof window.gtag !== 'undefined' && GA_TRACKING_ID) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

const GoogleAnalytics = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // This effect tracks page views whenever the URL changes
  useEffect(() => {
    if (GA_TRACKING_ID) {
      const url = pathname + searchParams.toString();
      pageview(url);
    }
  }, [pathname, searchParams]);

  if (!GA_TRACKING_ID) {
    return null; // Don't render anything if the tracking ID is not set
  }

  return (
    <>
      {/* Load the Google Analytics script */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
      />
      {/* Initialize Google Analytics */}
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  )
}

export default GoogleAnalytics;
