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

  const userId = 5; // Jefferson

  // Encontrar clientes cancelados
  const [cancelados] = await conn.query(
    "SELECT id, name FROM clients WHERE user_id = ? AND contract_status = 'Cancelado'",
    [userId]
  );

  console.log(`🔍 Clientes cancelados encontrados: ${cancelados.length}`);

  for (const client of cancelados) {
    console.log(`\n🗑️ Limpando "${client.name}" (ID=${client.id}):`);

    // Deletar receivables pendentes
    const [r1] = await conn.query(
      "DELETE FROM client_receivables WHERE client_id = ? AND user_id = ?",
      [client.id, userId]
    );
    console.log(`   ✓ ${r1.affectedRows} cobrança(s) removida(s)`);

    // Deletar transações vinculadas
    const [r2] = await conn.query(
      'DELETE FROM transactions WHERE user_id = ? AND description LIKE ?',
      [userId, `Recebimento - ${client.name}%`]
    );
    console.log(`   ✓ ${r2.affectedRows} transação(ões) removida(s)`);

    // Deletar o próprio cliente cancelado
    const [r3] = await conn.query(
      'DELETE FROM clients WHERE id = ? AND user_id = ?',
      [client.id, userId]
    );
    console.log(`   ✓ Cliente removido (${r3.affectedRows} registro)`);
  }

  // Verificar resultado
  const [clientsFinal] = await conn.query(
    'SELECT id, name, contract_status FROM clients WHERE user_id = ? ORDER BY name',
    [userId]
  );
  console.log(`\n📊 Clientes restantes do Jefferson: ${clientsFinal.length}`);
  clientsFinal.forEach((c, i) => {
    console.log(`   ${i+1}. "${c.name}" | ${c.contract_status}`);
  });

  // Saldo
  const [entradas] = await conn.query("SELECT COALESCE(SUM(amount),0) as t FROM transactions WHERE user_id = ? AND type='entrada'", [userId]);
  const [saidas] = await conn.query("SELECT COALESCE(SUM(amount),0) as t FROM transactions WHERE user_id = ? AND type='saida'", [userId]);
  const saldo = parseFloat(entradas[0].t) - parseFloat(saidas[0].t);
  console.log(`\n💰 Saldo: R$ ${saldo.toFixed(2)}`);

  // Receivables órfãos restantes
  const [orphans] = await conn.query(
    'SELECT COUNT(*) as total FROM client_receivables WHERE user_id = ? AND client_id NOT IN (SELECT id FROM clients)',
    [userId]
  );
  console.log(`📋 Receivables órfãos restantes: ${orphans[0].total}`);

  await conn.end();
})().catch(e => {
  console.error('❌ Erro:', e.message);
  process.exit(1);
});
