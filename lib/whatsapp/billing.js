// Utilitários puros de sanitização, normalização BR, máscara e link de cobrança via WhatsApp

export const BILLING_FREQUENCIES = ['Semanal', 'Quinzenal', 'Mensal'];

export function sanitizeWhatsappInput(raw) {
  if (raw == null || raw === '') return '';
  return String(raw)
    .replace(/[^0-9+\s()-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 30)
    .trim();
}

export function normalizeWhatsappNumber(raw) {
  let digits = String(raw ?? '').replace(/\D/g, '');
  if (digits.startsWith('0') && (digits.length === 11 || digits.length === 12)) {
    digits = digits.slice(1);
  }
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    return digits;
  }
  return null;
}

export function formatWhatsappDisplay(raw) {
  let digits = String(raw ?? '').replace(/\D/g, '');
  if (digits.startsWith('0') && (digits.length === 11 || digits.length === 12)) {
    digits = digits.slice(1);
  }
  const d =
    (digits.length === 12 || digits.length === 13) && digits.startsWith('55')
      ? digits.slice(2)
      : digits.slice(0, 11);

  if (d.length === 0) return '';
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

export function buildWhatsappBillingMessage(frequency = 'Mensal') {
  const normalizedInput = String(frequency ?? '').trim().toLowerCase();
  const matched = BILLING_FREQUENCIES.find((f) => f.toLowerCase() === normalizedInput);
  const freqWord = (matched || 'Mensal').toLowerCase();

  return [
    '[Mensagem Automática] – Up Valor',
    '',
    `Olá! Passando pra lembrar que o dia do seu pagamento ${freqWord} com a agência Up Valor é hoje. `,
    'Essa é uma mensagem automática só pra te manter informado(a), beleza?',
    '',
    'Qualquer dúvida, estamos à disposição.',
    'Obrigada por seguir com a gente! 🚀',
    '💸 Chave Pix para pagamento:',
    'Jefferson K: 48.541.173/0001-43',
  ].join('\n');
}

export function buildWhatsappUrl(rawPhone, frequency = 'Mensal') {
  const normalized = normalizeWhatsappNumber(rawPhone);
  if (!normalized) return null;
  const message = buildWhatsappBillingMessage(frequency);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
