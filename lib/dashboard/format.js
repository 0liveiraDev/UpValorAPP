// Utilitários de formatação e parsing para o Painel UpValor

export const formatMoney = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(value) || 0);

export const formatDate = (d) => {
  if (!d) return '—';
  try {
    const str = typeof d === 'string' ? d : (d instanceof Date && !isNaN(d) ? d.toISOString() : String(d));
    if (!str || str === 'null' || str.includes('0000-00-00')) return '—';
    const clean = str.includes('T') ? str.split('T')[0] : str.split(' ')[0];
    const parts = clean.split('-');
    if (parts.length < 3) return '—';
    const [y, m, day] = parts;
    if (!y || !m || !day || y.includes('NaN')) return '—';
    return `${day}/${m}/${y}`;
  } catch {
    return '—';
  }
};

export function parseDescValues(desc) {
  const gestaoMatch = desc?.match(/Gest[ãa]o:\s*R\$([\d.,]+)/);
  const trafegoMatch = desc?.match(/Tr[áa]fego:\s*R\$([\d.,]+)/);
  return {
    gestao: gestaoMatch ? parseFloat(gestaoMatch[1].replace(',', '.')) : 0,
    trafego: trafegoMatch ? parseFloat(trafegoMatch[1].replace(',', '.')) : 0,
  };
}

export function parseInstallment(desc) {
  if (!desc || typeof desc !== 'string') return null;
  const match = desc.match(/\(\s*(\d+)\s*\/\s*(\d+)\s*\)/);
  if (!match) return null;
  return `${match[1]}/${match[2]}`;
}

export function parseLocalDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12, 0, 0, 0);
  }
  if (typeof value !== 'string') return null;
  const clean = value.includes('T') ? value.split('T')[0] : value.split(' ')[0];
  const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const d = parseInt(match[3], 10);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, m - 1, d, 12, 0, 0, 0);
  if (isNaN(dt.getTime()) || dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
    return null;
  }
  return dt;
}
