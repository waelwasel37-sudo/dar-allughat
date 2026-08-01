/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🎯 تم إضافة "sharp" لضمان استقرار معالجة الصور المحلية (مثل اللوجو) على الخادم وحل خطأ 400
  serverExternalPackages: ["firebase-admin", "googleapis", "google-auth-library", "sharp"],
  
  typescript: { ignoreBuildErrors: true },

  // كائن تحسين وقبول صور المتجر السليم والمصحح بالكامل
  images: {
    unoptimized: false,
    remotePatterns: [
      { protocol: 'https', hostname: '*.googleapis.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: '*.run.app' },
      { protocol: 'https', hostname: '*.firebaseapp.com' },
      { protocol: 'https', hostname: '*.hosted.app' } // تم تأمين نطاق الاستضافة الحديث لفايربيز
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups', 
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none'
          }
        ],
      },
    ];
  },

  // قاعدة إعادة التوجيه لإصلاح مشكلة المصادقة مع Firebase
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: `https://dar-allughat-97483992-fc6c5.firebaseapp.com/__/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;