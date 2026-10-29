import test from 'node:test';
import assert from 'node:assert/strict';
import { buildChartData } from '../lib/dashboard/chartData.js';

const today = new Date(2026, 9, 24, 12); // sábado, 24 de Outubro de 2026

test('buildChartData com arrays vazios retorna 6 meses com séries null', () => {
  const data = buildChartData([], [], { months: 6, today });
  assert.equal(data.length, 6);

  const expectedKeys = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];
  const expectedLabels = ['Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out'];

  assert.deepEqual(data.map(d => d.key), expectedKeys);
  assert.deepEqual(data.map(d => d.label), expectedLabels);
  assert.equal(data[5].fullLabel, 'Outubro 2026');

  for (const item of data) {
    assert.equal(item.gestao, null);
    assert.equal(item.trafego, null);
    assert.equal(item.folha, null);
  }
});

test('buildChartData calcula gestão e tráfego com regras de status, descrição e primeiro mês', () => {
  const receivables = [
    { status: 'Pendente', due_date: '2026-06-10', amount: '100', description: 'x' },
    {
      status: 'Pago',
      due_date: '2026-08-01',
      amount: '300',
      description: 'Gestão: R$100.00 | Tráfego: R$200.00 (1/12)',
    },
    {
      status: 'Pago',
      due_date: '2026-09-15T03:00:00.000Z',
      amount: '50.5',
      description: 'Cobrança',
    },
  ];

  const data = buildChartData(receivables, [], { months: 6, today });

  // Maio (2026-05) é anterior ao primeiro vencimento existente (junho/2026) -> null
  assert.equal(data[0].key, '2026-05');
  assert.equal(data[0].gestao, null);
  assert.equal(data[0].trafego, null);

  // Junho (2026-06): primeiro mês com registro, mas status Pendente -> 0
  assert.equal(data[1].key, '2026-06');
  assert.equal(data[1].gestao, 0);
  assert.equal(data[1].trafego, 0);

  // Julho (2026-07): posterior ao primeiro mês, sem registros -> 0
  assert.equal(data[2].key, '2026-07');
  assert.equal(data[2].gestao, 0);
  assert.equal(data[2].trafego, 0);

  // Agosto (2026-08): pago com gestão 100 e tráfego 200
  assert.equal(data[3].key, '2026-08');
  assert.equal(data[3].gestao, 100);
  assert.equal(data[3].trafego, 200);

  // Setembro (2026-09): pago sem padrão -> amount inteiro em gestão
  assert.equal(data[4].key, '2026-09');
  assert.equal(data[4].gestao, 50.5);
  assert.equal(data[4].trafego, 0);

  // Outubro (2026-10): posterior ao primeiro mês, sem registros -> 0
  assert.equal(data[5].key, '2026-10');
  assert.equal(data[5].gestao, 0);
  assert.equal(data[5].trafego, 0);
});

test('buildChartData calcula folha (paga + pendente) com regra do primeiro vencimento', () => {
  const empPayments = [
    { status: 'Pago', due_date: '2026-09-05', amount: '1000' },
    { status: 'Pendente', due_date: '2026-10-05', amount: '1200.25' },
  ];

  const data = buildChartData([], empPayments, { months: 6, today });

  // Maio até Agosto: anteriores ao primeiro vencimento (setembro) -> null
  assert.equal(data[0].folha, null); // 2026-05
  assert.equal(data[1].folha, null); // 2026-06
  assert.equal(data[2].folha, null); // 2026-07
  assert.equal(data[3].folha, null); // 2026-08

  // Setembro: 1000
  assert.equal(data[4].key, '2026-09');
  assert.equal(data[4].folha, 1000);

  // Outubro: 1200.25
  assert.equal(data[5].key, '2026-10');
  assert.equal(data[5].folha, 1200.25);
});

test('data YYYY-MM-01 em UTC-3 cai no mês correto nos gráficos sem regredir para o mês anterior', () => {
  // Teste específico para isolar bug de timezone: 2026-08-01 não deve cair em julho
  const receivables = [
    {
      status: 'Pago',
      due_date: '2026-08-01',
      amount: '500',
      description: 'Gestão: R$500.00 | Tráfego: R$0.00',
    },
  ];

  const data = buildChartData(receivables, [], { months: 6, today });
  // Julho deve ser null porque o primeiro vencimento existente é agosto
  assert.equal(data[2].key, '2026-07');
  assert.equal(data[2].gestao, null);

  // Agosto deve conter a cobrança
  assert.equal(data[3].key, '2026-08');
  assert.equal(data[3].gestao, 500);
});

test('buildChartData atribui corretamente cobrança com category trafego sem padrão na descrição', () => {
  const receivables = [
    {
      status: 'Pago',
      due_date: '2026-08-10',
      amount: '450',
      category: 'trafego',
      description: 'Cobrança - Tráfego',
    },
    {
      status: 'Pago',
      due_date: '2026-08-10',
      amount: '1200',
      category: 'gestao',
      description: 'Cobrança - Gestão',
    },
  ];

  const data = buildChartData(receivables, [], { months: 6, today });
  assert.equal(data[3].key, '2026-08');
  assert.equal(data[3].gestao, 1200);
  assert.equal(data[3].trafego, 450);
});
