import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BILLING_FREQUENCIES,
  sanitizeWhatsappInput,
  normalizeWhatsappNumber,
  formatWhatsappDisplay,
  buildWhatsappBillingMessage,
  buildWhatsappUrl,
} from '../lib/whatsapp/billing.js';

const expectedTemplate = (freqWord) =>
  [
    'Up Valor',
    '',
    `Olá! Passando pra lembrar que o dia do seu pagamento ${freqWord} com a agência Up Valor é hoje. `,
    'Essa é uma mensagem automática só pra te manter informado(a), beleza?',
    '',
    'Qualquer dúvida, estamos à disposição.',
    'Obrigada por seguir com a gente! 🚀',
    '💸 Chave Pix para pagamento:',
    '48.541.173/0001-43',
  ].join('\n');

test('BILLING_FREQUENCIES expõe as três frequências permitidas na ordem correta', () => {
  assert.deepEqual(BILLING_FREQUENCIES, ['Semanal', 'Quinzenal', 'Mensal']);
});

test('buildWhatsappBillingMessage gera o texto oficial exato para Semanal, Quinzenal e Mensal', () => {
  assert.equal(buildWhatsappBillingMessage('Semanal'), expectedTemplate('semanal'));
  assert.equal(buildWhatsappBillingMessage('Quinzenal'), expectedTemplate('quinzenal'));
  assert.equal(buildWhatsappBillingMessage('Mensal'), expectedTemplate('mensal'));
});

test('buildWhatsappBillingMessage aceita variação de caixa/espaços e faz fallback para mensal em inválidos', () => {
  assert.equal(buildWhatsappBillingMessage('quinzenal'), expectedTemplate('quinzenal'));
  assert.equal(buildWhatsappBillingMessage('  SEMANAL '), expectedTemplate('semanal'));
  assert.equal(buildWhatsappBillingMessage(), expectedTemplate('mensal'));
  assert.equal(buildWhatsappBillingMessage('Anual'), expectedTemplate('mensal'));
  assert.equal(buildWhatsappBillingMessage(''), expectedTemplate('mensal'));
  assert.equal(buildWhatsappBillingMessage(null), expectedTemplate('mensal'));
});

test('normalizeWhatsappNumber normaliza telefones brasileiros com DDI 55, DDD 55 (RS) e zero inicial', () => {
  assert.equal(normalizeWhatsappNumber('(85) 99999-8888'), '5585999998888');
  assert.equal(normalizeWhatsappNumber('+55 85 99999-8888'), '5585999998888');
  assert.equal(normalizeWhatsappNumber('55999998888'), '5555999998888');
  assert.equal(normalizeWhatsappNumber('5532221111'), '555532221111');
  assert.equal(normalizeWhatsappNumber('5555999998888'), '5555999998888');
  assert.equal(normalizeWhatsappNumber('085999998888'), '5585999998888');
  assert.equal(normalizeWhatsappNumber('08532221111'), '558532221111');
  assert.equal(normalizeWhatsappNumber('8532221111'), '558532221111');
  assert.equal(normalizeWhatsappNumber('558532221111'), '558532221111');
});

test('normalizeWhatsappNumber retorna null para entradas vazias, curtas ou inválidas', () => {
  assert.equal(normalizeWhatsappNumber(''), null);
  assert.equal(normalizeWhatsappNumber('12345'), null);
  assert.equal(normalizeWhatsappNumber('859999988'), null);
  assert.equal(normalizeWhatsappNumber('123456789012'), null);
  assert.equal(normalizeWhatsappNumber('55859999988889'), null);
  assert.equal(normalizeWhatsappNumber(null), null);
  assert.equal(normalizeWhatsappNumber(undefined), null);
});

test('formatWhatsappDisplay aplica máscara BR sem travar Backspace em 1 ou 2 dígitos e preserva DDD 55', () => {
  assert.equal(formatWhatsappDisplay(''), '');
  assert.equal(formatWhatsappDisplay(null), '');
  assert.equal(formatWhatsappDisplay(undefined), '');
  assert.equal(formatWhatsappDisplay('8'), '8');
  assert.equal(formatWhatsappDisplay('85'), '85');
  assert.equal(formatWhatsappDisplay('(85'), '85');
  assert.equal(formatWhatsappDisplay('859'), '(85) 9');
  assert.equal(formatWhatsappDisplay('859999'), '(85) 9999');
  assert.equal(formatWhatsappDisplay('8599998'), '(85) 9999-8');
  assert.equal(formatWhatsappDisplay('8533334444'), '(85) 3333-4444');
  assert.equal(formatWhatsappDisplay('85999998888'), '(85) 99999-8888');
  assert.equal(formatWhatsappDisplay('5585999998888'), '(85) 99999-8888');
  assert.equal(formatWhatsappDisplay('558533334444'), '(85) 3333-4444');
  assert.equal(formatWhatsappDisplay('55999998888'), '(55) 99999-8888');
  assert.equal(formatWhatsappDisplay('5555999998888'), '(55) 99999-8888');
  assert.equal(formatWhatsappDisplay('085999998888'), '(85) 99999-8888');
  assert.equal(formatWhatsappDisplay('99999999999999'), '(99) 99999-9999');
});

test('sanitizeWhatsappInput remove tags/letras, colapsa espaços e limita a 30 caracteres', () => {
  assert.equal(sanitizeWhatsappInput(null), '');
  assert.equal(sanitizeWhatsappInput(undefined), '');
  assert.equal(sanitizeWhatsappInput(''), '');
  assert.equal(
    sanitizeWhatsappInput('<script>alert("xss")</script> +55 (85) 99999-8888'),
    '() +55 (85) 99999-8888'
  );
  assert.equal(
    sanitizeWhatsappInput('  +55 \n (85)\t99999-8888  abc!@# '),
    '+55 (85) 99999-8888'
  );
  const longInput = '+55 (85) 99999-8888 12345678901234567890';
  const sanitizedLong = sanitizeWhatsappInput(longInput);
  assert.ok(sanitizedLong.length <= 30);
  assert.equal(sanitizedLong, longInput.slice(0, 30).trim());
});

test('buildWhatsappUrl gera link wa.me codificado ou retorna null se telefone inválido', () => {
  assert.equal(buildWhatsappUrl(''), null);
  assert.equal(buildWhatsappUrl('12345', 'Semanal'), null);
  assert.equal(buildWhatsappUrl(null, 'Mensal'), null);

  const url = buildWhatsappUrl('(85) 99999-8888', 'Quinzenal');
  assert.ok(url.startsWith('https://wa.me/5585999998888?text='));
  const encodedText = url.split('?text=')[1];
  assert.equal(decodeURIComponent(encodedText), expectedTemplate('quinzenal'));

  const urlRsDefault = buildWhatsappUrl('(55) 99999-8888');
  assert.ok(urlRsDefault.startsWith('https://wa.me/5555999998888?text='));
  assert.equal(decodeURIComponent(urlRsDefault.split('?text=')[1]), expectedTemplate('mensal'));
});
