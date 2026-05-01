
// app/lib/meta-capi.ts

/**
 * This module contains functions for sending server-side events to the Meta Conversions API (CAPI).
 */

// Interface for the user data to be sent with the event.
interface UserData {
  client_ip_address: string;
  client_user_agent: string;
  // Add other user data like email (em), phone (ph), etc. after hashing if available.
  // e.g., em: string;
}

// Interface for the main event payload.
interface EventPayload {
  event_name: 'Purchase';
  event_time: number;
  user_data: UserData;
  custom_data: {
    currency: string;
    value: number;
    content_ids: string[]; // Array of product IDs
    num_items: number;
  };
  action_source: 'website';
}

/**
 * Sends a 'Purchase' event to the Meta Conversions API.
 * 
 * @param {object} data - The data for the purchase event.
 * @param {number} data.value - The total value of the order.
 * @param {string[]} data.content_ids - An array of product IDs in the order.
 * @param {number} data.num_items - The total number of items in the order.
 * @param {string} data.ipAddress - The user's IP address.
 * @param {string} data.userAgent - The user's browser user agent.
 * @returns {Promise<void>}
 */
export const sendPurchaseEvent = async ({
  value,
  content_ids,
  num_items,
  ipAddress,
  userAgent,
}: {
  value: number;
  content_ids: string[];
  num_items: number;
  ipAddress: string;
  userAgent: string;
}) => {
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.warn('Meta CAPI environment variables (PIXEL_ID or ACCESS_TOKEN) are not set. Skipping event.');
    return;
  }

  const url = `https://graph.facebook.com/v18.0/${pixelId}/events`;

  const payload: EventPayload = {
    event_name: 'Purchase',
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      client_ip_address: ipAddress,
      client_user_agent: userAgent,
    },
    custom_data: {
      currency: 'EGP', // Assuming EGP
      value: value,
      content_ids: content_ids,
      num_items: num_items,
    },
    action_source: 'website',
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        data: [payload], 
        access_token: accessToken,
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Error sending CAPI event to Meta:', responseData);
      throw new Error('Failed to send event to Meta CAPI.');
    }

    console.log('Successfully sent Purchase event to Meta CAPI:', responseData);
    return responseData;
  
  } catch (error) {
    console.error('An unexpected error occurred while sending CAPI event:', error);
  }
};
