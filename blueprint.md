# Blueprint: Dar Allughat E-commerce Store

## Overview

This document outlines the architecture, features, and design principles for the Dar Allughat e-commerce web application. The project is built using Next.js on the frontend and Firebase for backend services, including Firestore, Firebase Storage, and Firebase Authentication.

## Core Features & Design

*   **Framework**: Next.js 15 with App Router
*   **Styling**: Tailwind CSS with CSS Modules for component-level styling.
*   **Authentication**: Firebase Authentication for both customer and admin users. Admin access is role-based.
*   **Database**: Firestore for storing products, categories, user data, and orders.
*   **Storage**: Firebase Storage for product images, videos, and other media.
*   **Data Integrity**: Strict Zod validation for customer data (name, Egyptian phone number, governorate, address).
*   **Regional Logistics**: A dropdown list of 27 Egyptian governorates ensures shipping data accuracy, replacing complex map APIs.
*   **Conversion Optimization**: A smart WhatsApp checkout flow that generates a rich, pre-filled message including customer details, product specifics, image links, and direct product URLs. This is coupled with an automated "Thank You" page and cart clearing to prevent duplicate orders.
*   **Shopping Cart**: A client-side cart managed with React Context, designed to be converted into a slide-out drawer.
*   **Admin Dashboard**: A protected area for managing products, categories, and viewing orders.
*   **SEO & Marketing**:
    *   Dynamically generated sitemaps (`sitemap.ts`) and `robots.ts`.
    *   Server-side metadata generation and JSON-LD Schema for rich search results.
    *   Facebook Pixel integration for conversion tracking.

---

## **المهمة الحالية: تحويل السلة إلى درج منزلق (Slide-out Drawer)**

**الهدف**: تحسين تجربة المستخدم بشكل كبير عن طريق استبدال صفحة السلة التقليدية (`/cart`) بدرج يظهر من جانب الشاشة، مما يسمح للمستخدم بإضافة المنتجات ورؤية السلة دون مغادرة الصفحة التي يتصفحها.

### **خطة التنفيذ:**

1.  **إنشاء مكون `SlideOutCart.tsx`:**
    *   **التنفيذ**: بناء مكون "درج" جديد في `app/components/`. هذا المكون سيحتوي على منطق عرض محتويات السلة بالكامل، والذي سيتم نقله من `app/cart/CartClient.tsx`.
    *   **التحكم بالحالة**: المكون سيدير حالة الفتح والإغلاق الخاصة به.

2.  **تحديث `CartContext.tsx`:**
    *   **التنفيذ**: إضافة حالة جديدة (`isCartOpen`) ودوال (`openCart`, `closeCart`, `toggleCart`) إلى سياق السلة (Cart Context) للسماح للمكونات الأخرى بالتحكم في ظهور الدرج.

3.  **دمج الدرج في الهيدر الرئيسي:**
    *   **التنفيذ**: تحديد مكون الهيدر (Header) في المشروع، واستبدال الرابط الذي يؤدي إلى صفحة `/cart` بزر جديد. هذا الزر عند النقر عليه سيقوم باستدعاء دالة `toggleCart()` من الـ Context لإظهار الدرج المنزلق.

4.  **إزالة صفحة السلة القديمة:**
    *   **التنفيذ**: بعد التأكد من أن الدرج المنزلق يعمل بشكل كامل، سيتم حذف المجلد `app/cart` لتجنب وجود كود غير مستخدم والحفاظ على نظافة المشروع.
