/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ['firebase-admin'],
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'storage.googleapis.com', pathname: '/**' },
            { protocol: 'https', hostname: 'firebasestorage.googleapis.com', pathname: '/**' },
        ],
    },
    async headers() {
        return [
            {
                source: '/:all*(svg|jpg|jpeg|png|gif|ico|css|js)',
                headers: [
                    {
                        key: 'Cache-Control',
                        // Aggressively cache static assets for 1 year.
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
