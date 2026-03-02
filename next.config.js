/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ['mysql2'],
    async headers() {
        return [
            {
                // Aplicar a TODAS as rotas
                source: '/:path*',
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
            {
                // Página principal
                source: '/',
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
