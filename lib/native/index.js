/**
 * UpValor Native Services — Index
 * Ponto de entrada centralizado para todos os serviços nativos Capacitor
 */

export * from './biometric.js';
export * from './offline-cache.js';
export * from './share.js';

/**
 * Inicializa todos os serviços nativos
 * Deve ser chamado uma vez no app startup (layout.js ou _app.js)
 */
export async function initNativeServices() {
  if (typeof window === 'undefined') return;

  const isCapacitor = window.Capacitor?.isNativePlatform?.();

  if (isCapacitor) {
    console.log('[UpValor Native] Rodando em modo app nativo:', window.Capacitor.getPlatform());

    // Importa e inicializa StatusBar
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#0d0f14' });
    } catch (e) {
      console.warn('[StatusBar] Não disponível:', e.message);
    }

    // Esconde SplashScreen após carregamento
    try {
      const { SplashScreen } = await import('@capacitor/splash-screen');
      setTimeout(async () => {
        await SplashScreen.hide({ fadeOutDuration: 500 });
      }, 500);
    } catch (e) {
      console.warn('[SplashScreen] Não disponível:', e.message);
    }
  } else {
    console.log('[UpValor Native] Rodando em modo browser/web');
  }
}
