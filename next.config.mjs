/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🎯 تم إصلاح حزم الخادم الخارجية لضمان عدم انهيار الـ Firebase Admin بالخلفية
  serverExternalPackages: ["firebase-admin", "googleapis", "google-auth-library"],
  
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com', 
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com', 
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '*.run.app', // ✅ السماح بنطاقات App Hosting
      },
      {
        protocol: 'https',
        hostname: '*.firebaseapp.com', // ✅ السماح بنطاقات Firebase
      }
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            // 🎯 تعديل عبقري منك لحل مشكلة تعليق واغلاق نافذة جوجل المنبثقة COOP
            value: 'same-origin-allow-popups', 
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none'
          }
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;
