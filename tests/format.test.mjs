import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatMoney,
  formatDate,
  parseDescValues,
  parseInstallment,
  parseLocalDate,
} from '../lib/dashboard/format.js';

test('formatDate formata data ISO e lida com vazios/inválidos', () => {
  assert.equal(formatDate('2026-10-05T03:00:00.000Z'), '05/10/2026');
  assert.equal(formatDate('2026-10-05'), '05/10/2026');
  assert.equal(formatDate('2026-10-05 10:00:00'), '05/10/2026');
  assert.equal(formatDate(null), '—');
  assert.equal(formatDate(undefined), '—');
  assert.equal(formatDate(''), '—');
  assert.equal(formatDate('null'), '—');
  assert.equal(formatDate('0000-00-00'), '—');
  assert.equal(formatDate('invalid-date'), '—');
});

test('formatMoney formata BRL em padrão pt-BR', () => {
  const expected1234 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(1234.5);
  assert.equal(formatMoney(1234.5), expected1234);
  assert.equal(formatMoney('1234.50'), expected1234);

  const expectedZero = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(0);
  assert.equal(formatMoney(0), expectedZero);
  assert.equal(formatMoney(null), expectedZero);
  assert.equal(formatMoney('abc'), expectedZero);
});

test('parseDescValues extrai gestão e tráfego da descrição', () => {
  assert.deepEqual(
    parseDescValues('Gestão: R$500.00 | Tráfego: R$800.00 (1/12)'),
    { gestao: 500, trafego: 800 }
  );
  assert.deepEqual(
    parseDescValues('Gestao: R$250,50 | Trafego: R$100,25'),
    { gestao: 250.5, trafego: 100.25 }
  );
  assert.deepEqual(
    parseDescValues('Cobrança avulsa'),
    { gestao: 0, trafego: 0 }
  );
  assert.deepEqual(
    parseDescValues(null),
    { gestao: 0, trafego: 0 }
  );
  assert.deepEqual(
    parseDescValues(undefined),
    { gestao: 0, trafego: 0 }
  );
});

test('parseInstallment extrai parcela no formato (n/m)', () => {
  assert.equal(parseInstallment('Gestão: R$1 | Tráfego: R$2 (3/12)'), '3/12');
  assert.equal(parseInstallment('Mensalidade ( 1 / 24 )'), '1/24');
  assert.equal(parseInstallment('Salário'), null);
  assert.equal(parseInstallment(null), null);
  assert.equal(parseInstallment(undefined), null);
});

test('parseLocalDate faz parse de data local sem desvio UTC', () => {
  const d1 = parseLocalDate('2026-08-01');
  assert.notEqual(d1, null);
  assert.equal(d1.getFullYear(), 2026);
  assert.equal(d1.getMonth(), 7); // Agosto (0-indexed)
  assert.equal(d1.getDate(), 1);
  assert.equal(d1.getHours(), 12);

  const d2 = parseLocalDate('2026-08-01 10:00:00');
  assert.notEqual(d2, null);
  assert.equal(d2.getDate(), 1);
  assert.equal(d2.getMonth(), 7);

  const d3 = parseLocalDate('2026-08-01T03:00:00.000Z');
  assert.notEqual(d3, null);
  assert.equal(d3.getFullYear(), 2026);
  assert.equal(d3.getMonth(), 7);
  assert.equal(d3.getDate(), 1);

  assert.equal(parseLocalDate('lixo'), null);
  assert.equal(parseLocalDate(''), null);
  assert.equal(parseLocalDate(null), null);
  assert.equal(parseLocalDate(undefined), null);

  const existingDate = new Date(2026, 9, 24, 8, 30);
  const parsedFromDate = parseLocalDate(existingDate);
  assert.notEqual(parsedFromDate, null);
  assert.equal(parsedFromDate.getFullYear(), 2026);
  assert.equal(parsedFromDate.getMonth(), 9);
  assert.equal(parsedFromDate.getDate(), 24);
  assert.equal(parsedFromDate.getHours(), 12);
});
