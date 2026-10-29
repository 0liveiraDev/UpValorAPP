import { parseLocalDate, parseDescValues } from './format.js';
import { MONTHS_PT } from './period.js';

export function buildChartData(
  receivables = [],
  empPayments = [],
  { months = 6, today = new Date() } = {}
) {
  const safeRecs = Array.isArray(receivables) ? receivables : [];
  const safePayments = Array.isArray(empPayments) ? empPayments : [];

  // Mês do primeiro vencimento existente da fonte (cobranças em qualquer status)
  let minRecIndex = Infinity;
  for (const r of safeRecs) {
    const rd = parseLocalDate(r.due_date || r.dueDate);
    if (rd) {
      const idx = rd.getFullYear() * 12 + rd.getMonth();
      if (idx < minRecIndex) minRecIndex = idx;
    }
  }

  // Mês do primeiro vencimento existente da fonte (pagamentos para folha)
  let minPayIndex = Infinity;
  for (const p of safePayments) {
    const pd = parseLocalDate(p.due_date || p.dueDate);
    if (pd) {
      const idx = pd.getFullYear() * 12 + pd.getMonth();
      if (idx < minPayIndex) minPayIndex = idx;
    }
  }

  const result = [];
  const startOffset = months - 1;

  for (let i = 0; i < months; i++) {
    const slotDate = new Date(today.getFullYear(), today.getMonth() - (startOffset - i), 1, 12);
    const y = slotDate.getFullYear();
    const m = slotDate.getMonth();
    const monthIndex = y * 12 + m;

    const key = `${y}-${String(m + 1).padStart(2, '0')}`;
    const label = MONTHS_PT[m].slice(0, 3);
    const fullLabel = `${MONTHS_PT[m]} ${y}`;

    let gestao = null;
    let trafego = null;
    let folha = null;

    // Gestão e Tráfego
    if (minRecIndex !== Infinity && monthIndex >= minRecIndex) {
      let sumGestao = 0;
      let sumTrafego = 0;

      for (const r of safeRecs) {
        if (r.status !== 'Pago') continue;
        const rd = parseLocalDate(r.due_date || r.dueDate);
        if (rd && rd.getFullYear() === y && rd.getMonth() === m) {
          const desc = r.description || '';
          const hasPattern =
            /Gest[ãa]o:\s*R\$/i.test(desc) || /Tr[áa]fego:\s*R\$/i.test(desc);

          if (hasPattern) {
            const parsed = parseDescValues(desc);
            sumGestao += parsed.gestao;
            sumTrafego += parsed.trafego;
          } else if (r.category === 'trafego') {
            sumTrafego += parseFloat(r.amount) || 0;
          } else {
            sumGestao += parseFloat(r.amount) || 0;
          }
        }
      }

      gestao = Math.round(sumGestao * 100) / 100;
      trafego = Math.round(sumTrafego * 100) / 100;
    }

    // Folha
    if (minPayIndex !== Infinity && monthIndex >= minPayIndex) {
      let sumFolha = 0;

      for (const p of safePayments) {
        const pd = parseLocalDate(p.due_date || p.dueDate);
        if (pd && pd.getFullYear() === y && pd.getMonth() === m) {
          sumFolha += parseFloat(p.amount) || 0;
        }
      }

      folha = Math.round(sumFolha * 100) / 100;
    }

    result.push({
      key,
      label,
      fullLabel,
      gestao,
      trafego,
      folha,
    });
  }

  return result;
}
