// db.js — seleciona SQLite JSON (local) ou MySQL (produção)
// Para usar local: defina USE_LOCAL_DB=true no .env.local

import { pool as localPool } from './db.local.js';
import mysql from 'mysql2/promise';

let _mysqlPool = null;

function getMysqlPool() {
  if (!_mysqlPool) {
    _mysqlPool = mysql.createPool({
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
  return _mysqlPool;
}

export const pool = {
  query: async (sql, params = []) => {
    if (process.env.USE_LOCAL_DB === 'true') {
      return localPool.query(sql, params);
    }
    return getMysqlPool().query(sql, params);
  }
};

export function getPool() {
  return pool;
}
