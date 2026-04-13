/**
 * ============================================================
 * ESCUDO DE ESTABILIDADE — Pool de Conexões MySQL Otimizado
 * ============================================================
 * Configurações ajustadas para hospedagem compartilhada (Hostinger).
 * - connectionLimit reduzido para evitar "Too many connections"
 * - connectTimeout e acquireTimeout evitam travamento de requisições
 * - Handler 'error' no pool previne crash do processo Node
 * ============================================================
 */

import mysql from 'mysql2/promise';
import { pool as staticLocalPool } from './db.local.js';

// globalThis persiste entre hot-reloads do Next.js em dev,
// evitando que dezenas de pools sejam criados desnecessariamente.
let _pool = globalThis.mysqlPool || null;
let _localPool = null;

async function getPool() {
  if (process.env.USE_LOCAL_DB === 'true') {
    if (!_localPool) {
      _localPool = staticLocalPool;
    }
    return _localPool;
  }

  if (!_pool) {
    _pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,

      // ─── Limites de conexão (crítico para hospedagem compartilhada) ───
      waitForConnections: true,
      connectionLimit: 3,     // Máximo de 3 conexões simultâneas (seguro na Hostinger)
      queueLimit: 20,         // Fila de espera antes de rejeitar
      maxIdle: 2,             // Mantém no máximo 2 conexões ociosas abertas

      // ─── Timeouts (evitam conexões presas em caso de lentidão do servidor) ───
      connectTimeout: 10000,  // 10s para estabelecer a conexão
      acquireTimeout: 10000,  // 10s esperando do pool antes de dar erro

      // ─── Keep-Alive (reconecta automaticamente após queda de rede) ───
      enableKeepAlive: true,
      keepAliveInitialDelay: 30000, // Envia keep-alive após 30s de inatividade

      // ─── Segurança: descarta conexões antigas que podem estar corrompidas ───
      idleTimeout: 60000,     // Fecha conexão ociosa após 60s
    });

    // CRÍTICO: sem este handler, um erro de conexão perdida (ECONNRESET)
    // lança um evento 'error' não tratado e derruba o processo Node inteiro.
    _pool.on('error', (err) => {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] [DB POOL ERROR] Conexão do pool encontrou um erro:`, {
        code: err.code,
        message: err.message,
      });
      // Força recriação do pool na próxima requisição
      if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
        console.warn('[DB POOL] Pool será recriado na próxima requisição.');
        _pool = null;
        globalThis.mysqlPool = null;
      }
    });

    globalThis.mysqlPool = _pool;
    console.log('✅ [DB] Pool MySQL criado (limit=3, timeout=10s)');
  }

  return _pool;
}

// Proxy com interface mysql2 compatível
export const pool = {
  query: async (sql, params = []) => {
    const p = await getPool();
    return p.query(sql, params);
  },
};

export function getPoolInstance() {
  return pool;
}
