import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UpValor - Gestão Financeira",
  description: "Sistema de gestão financeira — clientes, funcionários e fluxo de caixa",
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "UpValor",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" translate="no" suppressHydrationWarning>
      <head>
        <meta name="google" content="notranslate" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="UpValor" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
      </head>
      <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                // Limpar caches antigos imediatamente
                if ('caches' in window) {
                  caches.keys().then(function(names) {
                    names.forEach(function(name) {
                      if (name !== 'upvalor-v4') {
                        caches.delete(name);
                        console.log('Cache removido:', name);
                      }
                    });
                  });
                }
                // Registrar SW e forçar update
                navigator.serviceWorker.register('/sw.js')
                  .then(function(reg) {
                    console.log('SW registrado:', reg.scope);
                    reg.update();
                  })
                  .catch(function(err) { console.warn('SW erro:', err); });
              });
            }
          `}
        </Script>
        <Script id="capacitor-native-init" strategy="afterInteractive">
          {`
            // Inicializar serviços nativos Capacitor (StatusBar, SplashScreen)
            window.addEventListener('load', async function() {
              if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
                console.log('[UpValor] App nativo detectado:', window.Capacitor.getPlatform());
                try {
                  const { StatusBar } = await import('@capacitor/status-bar');
                  await StatusBar.setStyle({ style: 'DARK' });
                  await StatusBar.setBackgroundColor({ color: '#0d0f14' });
                } catch(e) {}
                try {
                  const { SplashScreen } = await import('@capacitor/splash-screen');
                  setTimeout(function() {
                    SplashScreen.hide({ fadeOutDuration: 500 });
                  }, 800);
                } catch(e) {}
              }
            });
          `}
        </Script>
      </body>
    </html>
  );
}
