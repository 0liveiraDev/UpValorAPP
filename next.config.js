/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ['mysql2'],

    // Necessário para que o instrumentation.js (Crash Protection) seja carregado
    experimental: {
        instrumentationHook: true,
    },

    async headers() {
        return [
            {
                // Cache-Control apenas para páginas (não para /api/)
                // Rotas de API gerenciam seus próprios cabeçalhos
                source: '/((?!api/).*)',
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

