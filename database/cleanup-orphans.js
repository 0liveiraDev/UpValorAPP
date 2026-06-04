/**
 * Script de limpeza de dados órfãos
 * Remove receivables, transações e employee_payments de clientes/funcionários que já foram excluídos
 * 
 * Uso: node database/cleanup-orphans.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'local-db.json');

function run() {
  if (!fs.existsSync(DB_PATH)) {
    console.log('❌ Arquivo local-db.json não encontrado.');
    return;
  }

  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

  // IDs válidos de clientes e funcionários
  const clientIds = new Set((db.clients || []).map(c => Number(c.id)));
  const employeeIds = new Set((db.employees || []).map(e => Number(e.id)));
  const clientNames = new Set((db.clients || []).map(c => c.name));
  const employeeNames = new Set((db.employees || []).map(e => e.name));

  // --- Limpar receivables órfãos ---
  const receivablesBefore = (db.client_receivables || []).length;
  db.client_receivables = (db.client_receivables || []).filter(r => clientIds.has(Number(r.client_id)));
  const receivablesRemoved = receivablesBefore - db.client_receivables.length;

  // --- Limpar employee_payments órfãos ---
  const paymentsBefore = (db.employee_payments || []).length;
  db.employee_payments = (db.employee_payments || []).filter(p => employeeIds.has(Number(p.employee_id)));
  const paymentsRemoved = paymentsBefore - db.employee_payments.length;

  // --- Limpar transações órfãs (de clientes/funcionários que não existem mais) ---
  const transactionsBefore = (db.transactions || []).length;
  db.transactions = (db.transactions || []).filter(t => {
    const desc = t.description || '';

    // Transações de recebimento de clientes
    const recMatch = desc.match(/^Recebimento\s*(?:Gestão|Tráfego)?:?\s*-?\s*(.+?)(?:\s*\(.*\))?$/i);
    if (recMatch) {
      const name = recMatch[1].trim();
      // Se o nome do cliente não existe mais, é órfã
      if (!clientNames.has(name)) return false;
    }

    // Transações de salário de funcionários
    const salMatch = desc.match(/^(?:Salário|Pagamento de Salário):?\s*-?\s*(.+?)(?:\s*\(.*\))?$/i);
    if (salMatch) {
      const name = salMatch[1].trim();
      if (!employeeNames.has(name)) return false;
    }

    return true;
  });
  const transactionsRemoved = transactionsBefore - db.transactions.length;

  // Salvar
  const totalRemoved = receivablesRemoved + paymentsRemoved + transactionsRemoved;

  if (totalRemoved === 0) {
    console.log('✅ Nenhum dado órfão encontrado. O banco está limpo!');
  } else {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    console.log('🧹 Limpeza concluída:');
    console.log(`   • ${receivablesRemoved} cobrança(s) órfã(s) removida(s)`);
    console.log(`   • ${paymentsRemoved} pagamento(s) de funcionário(s) órfão(s) removido(s)`);
    console.log(`   • ${transactionsRemoved} transação(ões) órfã(s) removida(s)`);
    console.log(`   Total: ${totalRemoved} registro(s) limpo(s)`);
  }

  // Resumo do estado atual
  console.log('\n📊 Estado atual do banco:');
  console.log(`   • ${db.clients?.length || 0} clientes`);
  console.log(`   • ${db.client_receivables?.length || 0} cobranças`);
  console.log(`   • ${db.employees?.length || 0} funcionários`);
  console.log(`   • ${db.employee_payments?.length || 0} pagamentos de funcionários`);
  console.log(`   • ${db.transactions?.length || 0} transações`);
}

run();
