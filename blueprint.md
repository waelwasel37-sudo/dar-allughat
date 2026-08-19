# Blueprint: Dar Al-Lughat E-commerce Site

## Overview

This document outlines the architecture and features of the Dar Al-Lughat e-commerce website. The project is built on Next.js with Firebase as the backend, focusing on high performance, SEO, and real-time data accuracy.

## Core Architecture: Hybrid Caching Strategy

The application employs a sophisticated hybrid caching model to deliver a fast user experience while ensuring critical data (price, stock) is always up-to-date.

1.  **Server-side Caching (On-Demand ISR):**
    *   Product pages are statically generated at build time or on the first request.
    *   These pages are cached indefinitely on the server.
    *   The cache for a specific product is only invalidated and regenerated (`On-Demand Revalidation`) when an update is triggered from the admin panel (e.g., changing product details). This is achieved using Next.js's `unstable_cache` and tagging mechanism (`revalidateTag`).
    *   This provides maximum performance and reduces database reads.

2.  **Client-side Real-time Data:**
    *   Once a cached page is served to the user, the client-side code (`ProductClientPage.tsx`) immediately establishes a real-time connection to Firebase Realtime Database.
    *   It listens for live updates on three critical fields: `price`, `stock`, and `discount`.
    *   This ensures that even if the cache is a few seconds old, the user always sees the most accurate, real-time pricing and availability, preventing overselling and pricing errors.

## Key Features Implemented

*   **Product Catalog:**
    *   Dynamic product pages (`/products/[slug]`).
    *   Server-side rendering for fast initial load and optimal SEO.
    *   Improved `Metadata` and `JSON-LD` schemas for rich snippets in search results and social media sharing.
*   **Real-time Functionality:**
    *   Live viewer count on product pages.
    *   Real-time updates for stock, price, and discounts.
*   **Shopping Cart:**
    *   Client-side cart management using React Context (`CartContext`).
    *   `Add to Cart` and `Buy Now` functionalities.
*   **Pre-Orders:**
    *   Users can pre-order out-of-stock items if enabled.
*   **User Engagement:**
    *   Product rating system.
    *   Social sharing functionality.

## Current Plan: Finalizing the Hybrid Caching Implementation

*   **[COMPLETED]** Update `app/lib/data-server.ts` to wrap all data-fetching functions with `unstable_cache` and appropriate tags.
*   **[COMPLETED]** Update `app/products/[slug]/page.tsx` to remove the time-based revalidation (`revalidate = 3600`) and rely on the new tagged-based On-Demand ISR.
*   **[COMPLETED]** Update `app/products/[slug]/ProductClientPage.tsx` to fetch and display live price, stock, and discount data from Firebase Realtime Database, ensuring data accuracy.