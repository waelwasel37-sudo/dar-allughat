/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ['firebase-admin'],
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'storage.googleapis.com', pathname: '/**' },
            { protocol: 'https', hostname: 'firebasestorage.googleapis.com', pathname: '/**' },
            { protocol: 'https', hostname: 'dar-allughat-97483992-fc6c5.firebasestorage.app', pathname: '/**' },
        ],
    },
    async headers() {
        return [
            {
                source: '/:all*(svg|jpg|jpeg|png|gif|ico|css|js)',
                headers: [
                    {
                        key: 'Cache-Control',
                        // تم تغييرها إلى no-store لإجبار خوادم Firebase على تدمير الكاش المكسور فوراً
                        value: 'no-store, must-revalidate',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;