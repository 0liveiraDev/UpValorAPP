// db.js — escolhe automaticamente SQLite local (dev) ou MySQL (produção)
// Para usar local: defina USE_LOCAL_DB=true no .env.local

import mysql from 'mysql2/promise';

let _pool = null;
let _localPool = null;

async function getPool() {
  if (process.env.USE_LOCAL_DB === 'true') {
    if (!_localPool) {
      // Importação dinâmica APENAS em modo local — não afeta build de produção
      const mod = await import('./db.local.js');
      _localPool = mod.pool;
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
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return _pool;
}

// Proxy com interface mysql2 compatível
export const pool = {
  query: async (sql, params = []) => {
    const p = await getPool();
    return p.query(sql, params);
  }
};

export function getPoolInstance() {
  return pool;
}
