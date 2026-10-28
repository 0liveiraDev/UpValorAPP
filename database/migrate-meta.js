// Migração segura da coluna meta_ad_account_id na tabela clients
// Execute com: node --env-file=.env.local database/migrate-meta.js
const mysql = require('mysql2/promise');

async function migrateMeta() {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  if (!DB_HOST || !DB_USER) {
    console.error('Erro: DB_HOST e DB_USER são obrigatórios. Execute com: node --env-file=.env.local database/migrate-meta.js');
    process.exit(1);
  }

  let conn;
  try {
    conn = await mysql.createConnection({
      host: DB_HOST, port: Number(DB_PORT || 3306), user: DB_USER, password: DB_PASSWORD, database: DB_NAME,
    });
    const [cols] = await conn.query("SHOW COLUMNS FROM clients LIKE 'meta_ad_account_id'");
    if (cols.length === 0) {
      await conn.query('ALTER TABLE clients ADD COLUMN meta_ad_account_id VARCHAR(40) DEFAULT NULL');
      console.log('Coluna meta_ad_account_id adicionada em clients');
    } else {
      console.log('Coluna meta_ad_account_id já existe em clients');
    }

    const [userCols] = await conn.query("SHOW COLUMNS FROM users LIKE 'meta_access_token'");
    if (userCols.length === 0) {
      await conn.query('ALTER TABLE users ADD COLUMN meta_access_token TEXT DEFAULT NULL');
      console.log('Coluna meta_access_token adicionada em users');
    } else {
      console.log('Coluna meta_access_token já existe em users');
    }
  } catch (err) {
    console.error('Erro na migração meta:', err.message);
    process.exitCode = 1;
  } finally {
    if (conn) await conn.end();
  }
}

migrateMeta();
