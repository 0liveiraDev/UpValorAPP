import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAccountId, parseInsightsRow, accountStatusLabel } from '../lib/meta/graph.js';

test('normalizeAccountId aceita com e sem prefixo act_', () => {
  assert.equal(normalizeAccountId('1741855253832736'), 'act_1741855253832736');
  assert.equal(normalizeAccountId(' act_1741855253832736 '), 'act_1741855253832736');
  assert.equal(normalizeAccountId('ACT_123456'), 'act_123456');
});

test('normalizeAccountId rejeita valores inválidos', () => {
  assert.equal(normalizeAccountId(''), null);
  assert.equal(normalizeAccountId(null), null);
  assert.equal(normalizeAccountId('abc'), null);
  assert.equal(normalizeAccountId('act_12a34'), null);
});

test('parseInsightsRow converte strings e calcula custo por resultado', () => {
  const r = parseInsightsRow({
    spend: '300.50', impressions: '10000', reach: '8000', clicks: '250', ctr: '2.5', cpc: '1.2', cpm: '30.05',
    actions: [
      { action_type: 'lead', value: '10' },
      { action_type: 'onsite_conversion.lead_grouped', value: '10' },
      { action_type: 'onsite_conversion.messaging_conversation_started_7d', value: '5' },
      { action_type: 'initiate_checkout', value: '3' },
      { action_type: 'video_view', value: '1200' },
    ],
  });
  assert.equal(r.spend, 300.5);
  assert.equal(r.clicks, 250);
  assert.equal(r.leads, 10); // não duplica lead + lead_grouped
  assert.equal(r.messages, 5);
  assert.equal(r.checkouts, 3);
  assert.equal(r.videoPlays, 1200);
  assert.equal(r.costPerResult, 300.5 / 18);
  assert.equal(r.costPerMessage, 300.5 / 5);
  assert.equal(r.costPerCheckout, 300.5 / 3);
});

test('parseInsightsRow sem dados retorna zeros', () => {
  const r = parseInsightsRow(undefined);
  assert.equal(r.spend, 0);
  assert.equal(r.costPerResult, 0);
});

test('accountStatusLabel mapeia códigos da Meta', () => {
  assert.equal(accountStatusLabel(1), 'ACTIVE');
  assert.equal(accountStatusLabel(9), 'IN_GRACE_PERIOD');
  assert.equal(accountStatusLabel(999), 'UNKNOWN');
});
