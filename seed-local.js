const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'database', 'local-db.json');

const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth();

// Generate an array of dates around the current month
const getDateStr = (monthOffset, day) => {
  const d = new Date(currentYear, currentMonth + monthOffset, day);
  return d.toISOString();
};

const fakeDb = {
  users: [
    { id: 1, name: 'Administrador', email: 'admin@upvalor.com', password: 'admin', role: 'admin', created_at: getDateStr(0, 1) }
  ],
  clients: [
    { id: 1, name: 'Eco Vida Ltda', contract_months: 12, payment_frequency: 'Mensal', monthly_fee: 1500.00, traffic_cost: 0, traffic_frequency: 'Mensal', contract_start: getDateStr(-2, 5), contract_status: 'Ativo', created_at: getDateStr(-2, 5) },
    { id: 2, name: 'Tech Solutions SA', contract_months: 6, payment_frequency: 'Quinzenal', monthly_fee: 3000.00, traffic_cost: 1000.00, traffic_frequency: 'Semanal', contract_start: getDateStr(-1, 10), contract_status: 'Ativo', created_at: getDateStr(-1, 10) },
    { id: 3, name: 'Padaria Central', contract_months: 1, payment_frequency: 'Semanal', monthly_fee: 500.00, traffic_cost: 0, traffic_frequency: 'Mensal', contract_start: getDateStr(-3, 1), contract_status: 'Vencido', created_at: getDateStr(-3, 1) }
  ],
  employees: [
    { id: 1, name: 'João Silva', role: 'Gestor de Tráfego', contract_months: 12, salary: 2500.00, contract_start: getDateStr(-2, 1), created_at: getDateStr(-2, 1) },
    { id: 2, name: 'Maria Souza', role: 'Copywriter', contract_months: 6, salary: 2000.00, contract_start: getDateStr(0, 5), created_at: getDateStr(0, 5) }
  ],
  client_receivables: [
    { id: 1, client_id: 1, amount: 1500.00, due_date: getDateStr(-2, 5), status: 'Pago', description: 'Mensalidade Mês 1', category: 'gestao', created_at: getDateStr(-2, 5) },
    { id: 2, client_id: 1, amount: 1500.00, due_date: getDateStr(-1, 5), status: 'Pago', description: 'Mensalidade Mês 2', category: 'gestao', created_at: getDateStr(-2, 5) },
    { id: 3, client_id: 1, amount: 1500.00, due_date: getDateStr(0, 5), status: 'Pendente', description: 'Mensalidade Mês 3', category: 'gestao', created_at: getDateStr(-2, 5) },
    { id: 4, client_id: 1, amount: 1500.00, due_date: getDateStr(1, 5), status: 'Pendente', description: 'Mensalidade Mês 4', category: 'gestao', created_at: getDateStr(-2, 5) },
    
    { id: 5, client_id: 2, amount: 1500.00, due_date: getDateStr(-1, 10), status: 'Pago', description: 'Gestão Quinzena 1', category: 'gestao', created_at: getDateStr(-1, 10) },
    { id: 6, client_id: 2, amount: 1500.00, due_date: getDateStr(-1, 25), status: 'Pago', description: 'Gestão Quinzena 2', category: 'gestao', created_at: getDateStr(-1, 10) },
    { id: 7, client_id: 2, amount: 1500.00, due_date: getDateStr(0, 10), status: 'Pendente', description: 'Gestão Quinzena 3', category: 'gestao', created_at: getDateStr(-1, 10) },
    
    { id: 8, client_id: 2, amount: 1000.00, due_date: getDateStr(-1, 10), status: 'Pago', description: 'Tráfego Semana 1', category: 'trafego', created_at: getDateStr(-1, 10) },
    { id: 9, client_id: 2, amount: 1000.00, due_date: getDateStr(-1, 17), status: 'Pago', description: 'Tráfego Semana 2', category: 'trafego', created_at: getDateStr(-1, 10) },
    { id: 10, client_id: 2, amount: 1000.00, due_date: getDateStr(0, 10), status: 'Pendente', description: 'Tráfego Semana 3', category: 'trafego', created_at: getDateStr(-1, 10) }
  ],
  employee_payments: [
    { id: 1, employee_id: 1, amount: 2500.00, due_date: getDateStr(-2, 1), status: 'Pago', description: 'Salário Mês 1', created_at: getDateStr(-2, 1) },
    { id: 2, employee_id: 1, amount: 2500.00, due_date: getDateStr(-1, 1), status: 'Pago', description: 'Salário Mês 2', created_at: getDateStr(-2, 1) },
    { id: 3, employee_id: 1, amount: 2500.00, due_date: getDateStr(0, 1), status: 'Pendente', description: 'Salário Mês 3', created_at: getDateStr(-2, 1) },
    { id: 4, employee_id: 2, amount: 2000.00, due_date: getDateStr(0, 5), status: 'Pendente', description: 'Salário Mês 1', created_at: getDateStr(0, 5) }
  ],
  transactions: [
    { id: 1, type: 'entrada', amount: 1500.00, description: 'Pagamento Eco Vida Ltda', date: getDateStr(-2, 5), created_at: getDateStr(-2, 5) },
    { id: 2, type: 'saida', amount: 2500.00, description: 'Salário João Silva', date: getDateStr(-2, 1), created_at: getDateStr(-2, 1) },
    { id: 3, type: 'saida', amount: 1000.00, description: 'Tráfego Google Ads', date: getDateStr(-1, 10), created_at: getDateStr(-1, 10) }
  ],
  _seq: { users: 1, clients: 3, client_receivables: 10, employees: 2, employee_payments: 4, transactions: 3 }
};

fs.writeFileSync(DB_PATH, JSON.stringify(fakeDb, null, 2));
console.log('Dados falsos injetados com sucesso em local-db.json!');
