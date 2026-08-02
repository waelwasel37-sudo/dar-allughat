/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ هذا الجزء صحيح
  experimental: {
    serverExternalPackages: ["firebase-admin", "googleapis", "google-auth-library", "sharp"],
  },
  
  // ✅ هذا الجزء صحيح
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  images: {
    unoptimized: false,
    remotePatterns: [
      { protocol: 'https', hostname: '*.googleapis.com' },
      // ✅ تم تصحيح الخطأ هنا
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' }, 
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      // ✅ وتم تصحيح الخطأ هنا أيضاً
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: '*.run.app' },
      { protocol: 'https', hostname: '*.firebaseapp.com' },
      { protocol: 'https', hostname: '*.hosted.app' }
    ],
  },

  async headers() {
    // ✅ هذا الجزء صحيح
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' }
        ],
      },
    ];
  },

  // ✅ تم استخدام الرابط الذي أعطيتني إياه وصياغته بالشكل البرمجي الصحيح
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