/** @type {import('next').NextConfig} */
const nextConfig = {
  // الحزم الخارجية لضمان استقرار Firebase Admin على الخادم
  serverExternalPackages: ["firebase-admin", "googleapis", "google-auth-library"],
  
  typescript: { ignoreBuildErrors: true },

  // الطريقة الصحيحة للـ ESLint في Next.js 15 لتخطي أخطاء التنسيق أثناء البناء
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 🎯 كائن تحسين وقبول صور المتجر السليم والمصحح بالكامل
  images: {
    unoptimized: false,
    remotePatterns: [
      { protocol: 'https', hostname: '*.googleapis.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: '*.run.app' },
      { protocol: 'https', hostname: '*.firebaseapp.com' }
    ],
  },

  // 🚀 الفلتر الذكي المضاف لمنع ظهور خطأ 404 عند تسجيل الدخول
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: 'https://dar-allughat-97483992-fc6c5.firebaseapp.com/__/auth/:path*',
      },
    ];
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
};

export default nextConfig;
