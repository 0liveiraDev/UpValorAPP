/**
 * ============================================================
 * ESCUDO DE ESTABILIDADE — Crash Protection Global
 * ============================================================
 * Este arquivo é carregado automaticamente pelo Next.js UMA VEZ
 * na inicialização do servidor (App Router — Next.js 14+).
 *
 * Registra handlers globais de processo para:
 * - Capturar erros síncronos não tratados (uncaughtException)
 * - Capturar Promises rejeitadas sem .catch() (unhandledRejection)
 *
 * SEM esses handlers, qualquer erro não tratado derruba o processo
 * Node silenciosamente, causando 503 na Hostinger.
 * ============================================================
 */

export async function register() {
  // Só roda no lado do servidor
  if (process.env.NEXT_RUNTIME === 'nodejs') {

    // Handler para erros síncronos não tratados
    process.on('uncaughtException', (error) => {
      const timestamp = new Date().toISOString();
      console.error(`\n🔴 [${timestamp}] [CRASH PROTECTION] uncaughtException capturado:`);
      console.error('  Mensagem:', error.message);
      console.error('  Stack:', error.stack);
      console.error('  Código:', error.code);
      // NÃO fazemos process.exit() aqui para manter o servidor vivo.
      // O Next.js e o PM2 gerenciam o ciclo de vida do processo.
    });

    // Handler para Promises rejeitadas sem .catch()
    process.on('unhandledRejection', (reason, promise) => {
      const timestamp = new Date().toISOString();
      console.error(`\n🟠 [${timestamp}] [CRASH PROTECTION] unhandledRejection capturado:`);
      console.error('  Razão:', reason);
      if (reason instanceof Error) {
        console.error('  Stack:', reason.stack);
        console.error('  Código:', reason.code);
      }
      // Não derruba o processo — apenas loga para diagnóstico
    });

    // Sinal de saída limpa (ex: PM2 restart, Ctrl+C)
    process.on('SIGTERM', () => {
      const timestamp = new Date().toISOString();
      console.log(`\n⚠️  [${timestamp}] [CRASH PROTECTION] SIGTERM recebido — encerrando servidor graciosamente...`);
      // O Next.js cuida do encerramento do servidor HTTP
    });

    console.log('✅ [Crash Protection] Handlers de processo registrados com sucesso.');
  }
}
