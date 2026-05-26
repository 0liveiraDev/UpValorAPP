/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ['mysql2'],

    // Remover header X-Powered-By para segurança
    poweredByHeader: false,

    // Compressão habilitada
    compress: true,

    async headers() {
        return [
            // ─── Cache longo para assets estáticos do Next.js (_next/static) ───
            {
                source: '/_next/static/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            // ─── Cache para imagens, fontes e SVGs ───
            {
                source: '/:path*.(ico|jpg|jpeg|png|gif|svg|webp|woff|woff2|ttf|eot)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=604800, stale-while-revalidate=86400',
                    },
                ],
            },
            // ─── Cache para manifest e service worker ───
            {
                source: '/(manifest.json|sw.js)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=3600, must-revalidate',
                    },
                ],
            },
            // ─── Sem cache para páginas HTML (não para /api/) ───
            {
                source: '/((?!api/|_next/).*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-cache, no-store, must-revalidate',
                    },
                    {
                        key: 'X-LiteSpeed-Cache-Control',
                        value: 'no-cache',
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;

