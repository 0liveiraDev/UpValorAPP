const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'srv1549.hstgr.io', port: 3306, user: 'u710961292_Bruno', password: 'Zoinha1bruno!', database: 'u710961292_UpValorBD' });
  const [e] = await c.query("SELECT COALESCE(SUM(amount),0) as t FROM transactions WHERE user_id=5 AND type='entrada'");
  const [s] = await c.query("SELECT COALESCE(SUM(amount),0) as t FROM transactions WHERE user_id=5 AND type='saida'");
  const saldo = parseFloat(e[0].t) - parseFloat(s[0].t);
  console.log('Saldo atual: R$', saldo.toFixed(2));
  if (saldo < 0) {
    const aj = Math.abs(saldo);
    const [r] = await c.query('INSERT INTO transactions (user_id,description,amount,date,type) VALUES (?,?,?,?,?)', [5, 'Ajuste de saldo - Correção de dados', aj, '2026-09-13', 'entrada']);
    console.log('✅ Ajuste de R$ ' + aj.toFixed(2) + ' criado, ID=' + r.insertId);
    console.log('💰 Novo saldo: R$ 0.00');
  } else {
    console.log('✅ Saldo já está positivo ou zero.');
  }
  await c.end();
})().catch(e => console.error('Erro:', e.message));
