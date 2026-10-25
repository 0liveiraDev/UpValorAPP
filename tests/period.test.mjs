import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PERIOD_FILTERS,
  createPeriod,
  setPeriodFilter,
  shiftPeriod,
  isDateInScope,
  getPeriodLabel,
  isCurrentPeriod,
} from '../lib/dashboard/period.js';

const today = new Date(2026, 9, 24, 12); // sábado, 24 de Outubro de 2026

test('PERIOD_FILTERS contém os filtros na ordem correta', () => {
  assert.deepEqual(PERIOD_FILTERS, ['Semanal', 'Mensal', 'Trimestral']);
});

test('createPeriod inicializa Mensal com mês de hoje e weekStart null', () => {
  const p = createPeriod(today);
  assert.equal(p.filter, 'Mensal');
  assert.equal(p.year, 2026);
  assert.equal(p.month, 9);
  assert.equal(p.weekStart, null);
  assert.equal(getPeriodLabel(p, today), 'Outubro 2026');
  assert.equal(isCurrentPeriod(p, today), true);
});

test('transição e navegação em Semanal', () => {
  const pMensal = createPeriod(today);
  const semanaAtual = setPeriodFilter(pMensal, 'Semanal', today);

  // Semana de hoje: domingo 18/10 até sábado 24/10/2026
  assert.equal(semanaAtual.filter, 'Semanal');
  assert.equal(semanaAtual.weekStart, '2026-10-18');
  assert.equal(getPeriodLabel(semanaAtual, today), 'Semana Atual');
  assert.equal(isCurrentPeriod(semanaAtual, today), true);

  // Avançar +1 semana
  const semanaSeguinte = shiftPeriod(semanaAtual, 1, today);
  assert.equal(semanaSeguinte.weekStart, '2026-10-25');
  assert.equal(semanaSeguinte.month, 9); // Sábado cai em 31/10
  assert.equal(getPeriodLabel(semanaSeguinte, today), '25/10 – 31/10/2026');
  assert.equal(isCurrentPeriod(semanaSeguinte, today), false);

  // Avançar +1 de novo
  const semanaMaisUma = shiftPeriod(semanaSeguinte, 1, today);
  assert.equal(semanaMaisUma.weekStart, '2026-11-01');
  assert.equal(semanaMaisUma.month, 10); // Novembro

  // Voltar -1 a partir da semana atual
  const semanaAnterior = shiftPeriod(semanaAtual, -1, today);
  assert.equal(semanaAnterior.weekStart, '2026-10-11');
});

test('Semanal que cruza virada de ano sincroniza ano, mês e rótulo', () => {
  // Semana que começa em 27/12/2026 (domingo) e vai até 02/01/2027 (sábado)
  const viradaAno = { filter: 'Semanal', year: 2026, month: 11, weekStart: '2026-12-27' };
  assert.equal(getPeriodLabel(viradaAno, today), '27/12 – 02/01/2027');

  // Avançar +1 semana
  const primeiraSemana2027 = shiftPeriod(viradaAno, 1, today);
  assert.equal(primeiraSemana2027.weekStart, '2027-01-03');
  assert.equal(primeiraSemana2027.year, 2027);
  assert.equal(primeiraSemana2027.month, 0);
});

test('entrar em Semanal a partir de outro mês seleciona a semana do dia 1', () => {
  // Dezembro/2026 (mês 11): dia 1 é terça-feira 01/12/2026; domingo é 29/11/2026
  const pDez = { filter: 'Mensal', year: 2026, month: 11, weekStart: null };
  const semDez = setPeriodFilter(pDez, 'Semanal', today);
  assert.equal(semDez.weekStart, '2026-11-29');
  assert.equal(semDez.month, 11);
  assert.equal(semDez.year, 2026);
});

test('sair de Semanal para Mensal reseta weekStart e mantém year/month', () => {
  const semanaSeguinte = { filter: 'Semanal', year: 2026, month: 9, weekStart: '2026-10-25' };
  const pMensal = setPeriodFilter(semanaSeguinte, 'Mensal', today);
  assert.equal(pMensal.weekStart, null);
  assert.equal(pMensal.year, 2026);
  assert.equal(pMensal.month, 9);
  assert.equal(pMensal.filter, 'Mensal');
});

test('escopo de data em Semanal', () => {
  const pSemana = { filter: 'Semanal', year: 2026, month: 9, weekStart: '2026-10-18' };
  assert.equal(isDateInScope('2026-10-18', pSemana, today), true);
  assert.equal(isDateInScope('2026-10-24', pSemana, today), true);
  assert.equal(isDateInScope('2026-10-25', pSemana, today), false);
  assert.equal(isDateInScope('2026-10-17', pSemana, today), false);
  assert.equal(isDateInScope('2026-10-20T03:00:00.000Z', pSemana, today), true);
});

test('navegação, rótulo e escopo em Trimestral', () => {
  const pMensal = createPeriod(today);
  const pTrim = setPeriodFilter(pMensal, 'Trimestral', today);
  assert.equal(getPeriodLabel(pTrim, today), '4º Trimestre 2026');

  // +1 trimestre
  const pTrimSeguinte = shiftPeriod(pTrim, 1, today);
  assert.equal(pTrimSeguinte.year, 2027);
  assert.equal(pTrimSeguinte.month, 0);
  assert.equal(getPeriodLabel(pTrimSeguinte, today), '1º Trimestre 2027');

  // -1 trimestre a partir de out/2026
  const pTrimAnterior = shiftPeriod(pTrim, -1, today);
  assert.equal(pTrimAnterior.year, 2026);
  assert.equal(pTrimAnterior.month, 6);
  assert.equal(getPeriodLabel(pTrimAnterior, today), '3º Trimestre 2026');

  // isCurrentPeriod com nov/2026 (mesmo 4º trimestre de hoje out/2026)
  assert.equal(
    isCurrentPeriod({ filter: 'Trimestral', year: 2026, month: 10, weekStart: null }, today),
    true
  );

  // Escopo Trimestral 4º/2026 (out, nov, dez)
  assert.equal(isDateInScope('2026-12-31', pTrim, today), true);
  assert.equal(isDateInScope('2026-09-30', pTrim, today), false);
});

test('navegação, rótulo e escopo em Mensal', () => {
  const pJan = { filter: 'Mensal', year: 2026, month: 0, weekStart: null };
  const pDezAnt = shiftPeriod(pJan, -1, today);
  assert.equal(pDezAnt.year, 2025);
  assert.equal(pDezAnt.month, 11);
  assert.equal(getPeriodLabel(pDezAnt, today), 'Dezembro 2025');

  const pOut = { filter: 'Mensal', year: 2026, month: 9, weekStart: null };
  assert.equal(isDateInScope('2026-10-01', pOut, today), true);
  assert.equal(isDateInScope(null, pOut, today), false);
  assert.equal(isDateInScope('abc', pOut, today), false);
});
