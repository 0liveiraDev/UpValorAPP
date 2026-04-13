/**
 * ============================================================
 * ESCUDO DE ESTABILIDADE — Wrapper Global de Erros para Rotas API
 * ============================================================
 * HOF (Higher-Order Function) que envolve handlers de rota Next.js
 * em um try/catch padronizado, evitando duplicação de código.
 * ============================================================
 */

import { NextResponse } from 'next/server';

/**
 * Envolve um handler de rota Next.js com tratamento de erro global.
 *
 * @param {string} routeName — nome da rota para identificação no log
 * @param {Function} handler — async function(request, context) => Response
 * @returns {Function} — handler protegido
 *
 * @example
 * export const GET = withErrorBoundary('clients.GET', async (req) => {
 *   const [rows] = await pool.query('SELECT ...');
 *   return NextResponse.json(rows);
 * });
 */
export function withErrorBoundary(routeName, handler) {
  return async function (request, context) {
    try {
      return await handler(request, context);
    } catch (error) {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] [ERRO API] ${routeName}:`, {
        message: error.message,
        code: error.code,       // ex: ECONNRESET, ER_TOO_MANY_USER_CONNECTIONS
        errno: error.errno,
        sqlState: error.sqlState,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });

      // Erros específicos de banco de dados → mensagem mais útil para debug
      if (error.code === 'ER_TOO_MANY_USER_CONNECTIONS') {
        return NextResponse.json(
          { error: 'Servidor sobrecarregado. Tente novamente em instantes.' },
          { status: 503 }
        );
      }

      if (error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST') {
        return NextResponse.json(
          { error: 'Conexão com banco de dados perdida. Tente novamente.' },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: 'Erro interno do servidor.' },
        { status: 500 }
      );
    }
  };
}
