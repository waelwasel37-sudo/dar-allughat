'use client';

/**
 * This file provides typed helper functions for sending events to Facebook Pixel.
 */

// Define a generic interface for event data.
interface EventOptions {
  [key: string]: any; 
}

/**
 * Triggers a PageView event.
 * This should be called once on initial page load and on every subsequent route change.
 */
export const pageview = () => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'PageView');
  } else {
    console.warn('Facebook Pixel (fbq) not found. PageView event was not tracked.');
  }
};

/**
 * Sends a custom event to Facebook Pixel.
 * @param eventName The name of the event (e.g., 'Lead', 'Purchase').
 * @param options Optional data to send with the event.
 */
export const trackFbqEvent = (eventName: string, options: EventOptions = {}) => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', eventName, options);
    console.log(`Facebook Pixel event tracked: ${eventName}`, options);
  } else {
    console.warn(`Facebook Pixel (fbq) not found. Event "${eventName}" was not tracked.`);
  }
};
