// Migração segura da coluna whatsapp na tabela clients
// Execute com: node --env-file=.env.local database/migrate-whatsapp.js
const mysql = require('mysql2/promise');

async function migrateWhatsapp() {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

  if (!DB_HOST || !DB_USER) {
    console.error(
      'Erro: Variáveis DB_HOST e DB_USER são obrigatórias. Execute com: node --env-file=.env.local database/migrate-whatsapp.js'
    );
    process.exit(1);
  }

  let conn;
  try {
    conn = await mysql.createConnection({
      host: DB_HOST,
      port: Number(DB_PORT || 3306),
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
    });

    const [cols] = await conn.query("SHOW COLUMNS FROM clients LIKE 'whatsapp'");
    if (cols.length === 0) {
      await conn.query('ALTER TABLE clients ADD COLUMN whatsapp VARCHAR(30) DEFAULT NULL');
    }

    console.log('Coluna whatsapp adicionada/verificada com sucesso em clients');
  } catch (err) {
    console.error('Erro na migração de whatsapp:', err.message);
    process.exitCode = 1;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

migrateWhatsapp();
