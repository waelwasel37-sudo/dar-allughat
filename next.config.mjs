/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: () => "build_" + Date.now(),
  serverExternalPackages: ["firebase-admin", "googleapis", "google-auth-library"],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com', // صور حسابات جوجل
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com', // اسم النطاق لـ Firebase Storage API
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com', // 🎯 الإصلاح الحاسم: اسم النطاق للوصول المباشر للصور (كما هو موثق في سجلات الخطأ)
      },
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
