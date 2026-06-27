/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: () => "build_" + Date.now(),
  
  // 🚀 استبعاد مكتبات جوجل والفايربيز من التجميع لمنع أخطاء البناء وتجميد الـ Server APIs
  serverExternalPackages: ["firebase-admin", "googleapis", "google-auth-library"],
  
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  images: {
    // ⚡ استخدام مكتبة Sharp كمشغل أساسي لمعالجة الصور وتقليل استهلاك الذاكرة
    unoptimized: false, 
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com', // ✅ السماح بكل صور حسابات جوجل
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com', // ✅ السماح بصور فايربيس ستورج
      },
    ],
  },

  async headers() {
    return [
      {
        // حل مشكلة منبثقة Google Auth والـ Cross-Origin أونلاين بشكل سليم
        source: '/:path*',
        headers: [{ key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' }],
      },
      {
        // التصحيح القياسي لمسار كاش الصور وملفات التصميم في Next.js لزيادة سرعة الموقع
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;
