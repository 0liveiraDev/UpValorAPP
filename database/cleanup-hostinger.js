const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'srv1549.hstgr.io',
    port: 3306,
    user: 'u710961292_Bruno',
    password: 'Zoinha1bruno!',
    database: 'u710961292_UpValorBD',
    connectTimeout: 15000,
  });

  console.log('✅ Conectado!\n');

  // Os 2 clientes fantasmas (status Cancelado, duplicatas)
  const ghostIds = [46, 20]; // ID=46 "Renato Contabilidade" Cancelado, ID=20 "Residência Hamburgueria " Cancelado

  for (const id of ghostIds) {
    // Buscar info do fantasma
    const [info] = await conn.query('SELECT id, name, contract_status, user_id FROM clients WHERE id = ?', [id]);
    if (info.length === 0) {
      console.log(`⚠️ Cliente ID=${id} não encontrado, pulando...`);
      continue;
    }
    const client = info[0];
    console.log(`🗑️ Removendo fantasma: ID=${client.id} | "${client.name}" | status=${client.contract_status}`);

    // Deletar receivables
    const [r1] = await conn.query('DELETE FROM client_receivables WHERE client_id = ?', [id]);
    console.log(`   ✓ ${r1.affectedRows} cobrança(s) removida(s)`);

    // Deletar transações vinculadas
    const [r2] = await conn.query('DELETE FROM transactions WHERE user_id = ? AND description LIKE ?', [client.user_id, `Recebimento - ${client.name}%`]);
    console.log(`   ✓ ${r2.affectedRows} transação(ões) removida(s)`);

    // Deletar o cliente
    const [r3] = await conn.query('DELETE FROM clients WHERE id = ?', [id]);
    console.log(`   ✓ Cliente removido (${r3.affectedRows} registro)\n`);
  }

  // Verificar resultado
  const [jeffClients] = await conn.query(
    'SELECT id, name, contract_status FROM clients WHERE user_id = 5 ORDER BY name'
  );
  console.log(`📊 Clientes restantes do Jefferson: ${jeffClients.length}`);
  jeffClients.forEach((c, i) => {
    console.log(`   ${i+1}. ID=${c.id} | "${c.name}" | ${c.contract_status}`);
  });

  // Limpar também os clientes duplicados do admin (user_id=1)
  console.log('\n🧹 Limpando duplicatas do admin...');
  // Manter apenas ID=8 (primeiro ATTURISMO), apagar 11 e 12
  const adminGhosts = [11, 12];
  for (const id of adminGhosts) {
    const [r1] = await conn.query('DELETE FROM client_receivables WHERE client_id = ?', [id]);
    const [r2] = await conn.query('DELETE FROM transactions WHERE user_id = 1 AND description LIKE ?', [`Recebimento - %`]);
    const [r3] = await conn.query('DELETE FROM clients WHERE id = ?', [id]);
    console.log(`   ✓ Admin fantasma ID=${id} removido (${r1.affectedRows} receivables, ${r3.affectedRows} cliente)`);
  }

  console.log('\n✅ Limpeza completa!');
  await conn.end();
})().catch(e => {
  console.error('❌ Erro:', e.message);
  process.exit(1);
});
