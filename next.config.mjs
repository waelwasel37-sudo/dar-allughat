/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ وضع الخيار داخل experimental لضمان استقرار حزم Firebase Admin
  experimental: {
    serverExternalPackages: ["firebase-admin", "googleapis", "google-auth-library", "sharp"],
  },

  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  images: {
    unoptimized: false,
    remotePatterns: [
      { protocol: 'https', hostname: '*.googleapis.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' }, // ✅ تم تصحيح الفاصلة هنا
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: '*.run.app' },
      { protocol: 'https', hostname: '*.firebaseapp.com' },
      { protocol: 'https', hostname: '*.hosted.app' }
    ],
  },

  async headers() {
    return [
      // تفعيل كاش المتصفح لصور المتجر المحلية لـ سنة كاملة
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      // تفعيل كاش المتصفح للأكواد والملفات الثابتة لتسريع المتجر للزوار
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' }
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: 'https://dar-allughat-com--dar-allughat-97483992-fc6c5.us-central1.hosted.app/__/auth/:path*',
      },
    ];
  },
};

export default nextConfig;
