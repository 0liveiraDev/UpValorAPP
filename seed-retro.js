const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database/local-db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

function gerarDatas(startStr, frequencia, parcelas) {
  let datas = [];
  let atual = new Date(startStr);
  for (let i = 0; i < parcelas; i++) {
      datas.push(new Date(atual));
      if (frequencia === 'Semanal') atual.setDate(atual.getDate() + 7);
      else if (frequencia === 'Quinzenal') atual.setDate(atual.getDate() + 14);
      else atual.setMonth(atual.getMonth() + 1);
  }
  return datas;
}

let recId = 1;
let payId = 1;
let transId = Math.max(...db.transactions.map(t => t.id), 0) + 1;

db.client_receivables = [];
db.employee_payments = [];
db.transactions = []; // Opcional limpar as antigas e re-inserir. Vou re-inserir só com base nos gerados como 'Pago'.

// Populando Receitas de Clientes
db.clients.forEach(c => {
  if (c.contract_status === 'Cancelado') return;
  const start = c.contract_start || c.created_at;
  
  // Gestão
  let parcelasGestao = c.contract_months || 1;
  const freqGestao = c.payment_frequency || 'Mensal';
  if (freqGestao === 'Quinzenal') parcelasGestao *= 2;
  if (freqGestao === 'Semanal') parcelasGestao *= 4;
  
  const datasGestao = gerarDatas(start, freqGestao, parcelasGestao);
  datasGestao.forEach((data, index) => {
      const isPast = data < new Date();
      db.client_receivables.push({
          id: recId,
          client_id: c.id,
          amount: parseFloat(c.monthly_fee),
          due_date: data.toISOString(),
          status: isPast ? 'Pago' : 'Pendente',
          description: `Gestão ${freqGestao} ${index + 1}`,
          category: 'gestao',
          created_at: new Date().toISOString()
      });
      
      if (isPast) {
          db.transactions.push({
              id: transId++,
              type: 'entrada',
              amount: parseFloat(c.monthly_fee),
              description: `Recebimento Gestão: ${c.name} (${freqGestao} ${index + 1})`,
              date: data.toISOString(),
              created_at: new Date().toISOString()
          });
      }
      recId++;
  });

  // Tráfego
  if (c.traffic_cost > 0) {
      let parcelasTra = c.contract_months || 1;
      const freqTra = c.traffic_frequency || 'Mensal';
      if (freqTra === 'Semanal') parcelasTra *= 4;
      const datasTra = gerarDatas(start, freqTra, parcelasTra);
      
      datasTra.forEach((data, index) => {
          const isPast = data < new Date();
          db.client_receivables.push({
              id: recId,
              client_id: c.id,
              amount: parseFloat(c.traffic_cost),
              due_date: data.toISOString(),
              status: isPast ? 'Pago' : 'Pendente',
              description: `Tráfego ${freqTra} ${index + 1}`,
              category: 'trafego',
              created_at: new Date().toISOString()
          });
          
          if (isPast) {
              db.transactions.push({
                  id: transId++,
                  type: 'entrada', /* No cenário deles, tráfego pode ser cobrado junto do cliente */
                  amount: parseFloat(c.traffic_cost),
                  description: `Recebimento Tráfego: ${c.name} (${freqTra} ${index + 1})`,
                  date: data.toISOString(),
                  created_at: new Date().toISOString()
              });
          }
          recId++;
      });
  }
});

// Populando Pagamentos a Funcionários
db.employees.forEach(e => {
  const start = e.contract_start || e.created_at;
  const parcelas = e.contract_months || 1;
  const datas = gerarDatas(start, 'Mensal', parcelas);
  
  datas.forEach((data, index) => {
      const isPast = data < new Date();
      db.employee_payments.push({
          id: payId,
          employee_id: e.id,
          amount: parseFloat(e.salary),
          due_date: data.toISOString(),
          status: isPast ? 'Pago' : 'Pendente',
          description: `Salário Mês ${index + 1}`,
          created_at: new Date().toISOString()
      });
      
      if (isPast) {
          db.transactions.push({
              id: transId++,
              type: 'saida',
              amount: parseFloat(e.salary),
              description: `Pagamento de Salário: ${e.name} (Mês ${index + 1})`,
              date: data.toISOString(),
              created_at: new Date().toISOString()
          });
      }
      payId++;
  });
});

db._seq.client_receivables = recId;
db._seq.employee_payments = payId;
db._seq.transactions = transId;

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('Database retroativamente populada com sucesso! ' + (recId - 1) + ' recebíveis e ' + (payId - 1) + ' pagamentos gerados.');
