import { parseLocalDate } from './format.js';

export const PERIOD_FILTERS = ['Semanal', 'Mensal', 'Trimestral'];

export const MONTHS_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function formatLocalDateString(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getSunday(d) {
  const sun = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
  sun.setDate(sun.getDate() - sun.getDay());
  return sun;
}

function getSaturday(sundayDate) {
  const sat = new Date(sundayDate.getFullYear(), sundayDate.getMonth(), sundayDate.getDate(), 12);
  sat.setDate(sat.getDate() + 6);
  return sat;
}

export function createPeriod(today = new Date()) {
  return {
    filter: 'Mensal',
    year: today.getFullYear(),
    month: today.getMonth(),
    weekStart: null,
  };
}

export function setPeriodFilter(p, filter, today = new Date()) {
  if (filter === 'Semanal') {
    if (p.filter === 'Semanal' && p.weekStart) {
      return { ...p, filter: 'Semanal' };
    }
    const isCurrentMonth = p.year === today.getFullYear() && p.month === today.getMonth();
    const baseDate = isCurrentMonth
      ? today
      : new Date(p.year, p.month, 1, 12);
    const sun = getSunday(baseDate);
    return {
      filter: 'Semanal',
      year: p.year,
      month: p.month,
      weekStart: formatLocalDateString(sun),
    };
  }

  return {
    filter,
    year: p.year,
    month: p.month,
    weekStart: null,
  };
}

export function shiftPeriod(p, dir, today = new Date()) {
  if (p.filter === 'Mensal') {
    const d = new Date(p.year, p.month + dir, 1, 12);
    return {
      filter: 'Mensal',
      year: d.getFullYear(),
      month: d.getMonth(),
      weekStart: null,
    };
  }

  if (p.filter === 'Trimestral') {
    const d = new Date(p.year, p.month + dir * 3, 1, 12);
    return {
      filter: 'Trimestral',
      year: d.getFullYear(),
      month: d.getMonth(),
      weekStart: null,
    };
  }

  if (p.filter === 'Semanal') {
    let sun;
    if (p.weekStart) {
      sun = parseLocalDate(p.weekStart);
    }
    if (!sun) {
      sun = getSunday(new Date(p.year, p.month, 1, 12));
    }

    const nextSun = new Date(sun.getFullYear(), sun.getMonth(), sun.getDate() + dir * 7, 12);
    const nextSat = getSaturday(nextSun);

    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
    const sunMid = new Date(nextSun.getFullYear(), nextSun.getMonth(), nextSun.getDate(), 12);
    const satMid = new Date(nextSat.getFullYear(), nextSat.getMonth(), nextSat.getDate(), 12);

    const containsToday = todayMid >= sunMid && todayMid <= satMid;

    const newYear = containsToday ? today.getFullYear() : nextSat.getFullYear();
    const newMonth = containsToday ? today.getMonth() : nextSat.getMonth();

    return {
      filter: 'Semanal',
      year: newYear,
      month: newMonth,
      weekStart: formatLocalDateString(nextSun),
    };
  }

  return p;
}

export function isCurrentPeriod(p, today = new Date()) {
  if (p.filter === 'Semanal') {
    if (!p.weekStart) return false;
    const sun = parseLocalDate(p.weekStart);
    if (!sun) return false;
    const sat = getSaturday(sun);
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
    return todayMid >= sun && todayMid <= sat;
  }

  if (p.filter === 'Trimestral') {
    return (
      p.year === today.getFullYear() &&
      Math.floor(p.month / 3) === Math.floor(today.getMonth() / 3)
    );
  }

  if (p.filter === 'Mensal') {
    return p.year === today.getFullYear() && p.month === today.getMonth();
  }

  return false;
}

export function getPeriodLabel(p, today = new Date()) {
  if (p.filter === 'Semanal') {
    if (!p.weekStart) return 'Semana';
    const sun = parseLocalDate(p.weekStart);
    if (!sun) return 'Semana';
    const sat = getSaturday(sun);
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);

    if (todayMid >= sun && todayMid <= sat) {
      return 'Semana Atual';
    }

    const dSun = String(sun.getDate()).padStart(2, '0');
    const mSun = String(sun.getMonth() + 1).padStart(2, '0');
    const dSat = String(sat.getDate()).padStart(2, '0');
    const mSat = String(sat.getMonth() + 1).padStart(2, '0');
    const ySat = sat.getFullYear();

    return `${dSun}/${mSun} – ${dSat}/${mSat}/${ySat}`;
  }

  if (p.filter === 'Trimestral') {
    const q = Math.floor(p.month / 3) + 1;
    return `${q}º Trimestre ${p.year}`;
  }

  if (p.filter === 'Mensal') {
    return `${MONTHS_PT[p.month]} ${p.year}`;
  }

  return `${MONTHS_PT[p.month] || ''} ${p.year || ''}`.trim();
}

export function isDateInScope(dateVal, p, today = new Date()) {
  const date = parseLocalDate(dateVal);
  if (!date) return false;

  if (p.filter === 'Semanal') {
    let sun;
    if (p.weekStart) {
      sun = parseLocalDate(p.weekStart);
    }
    if (!sun) {
      const isCurrentMonth = p.year === today.getFullYear() && p.month === today.getMonth();
      const base = isCurrentMonth ? today : new Date(p.year, p.month, 1, 12);
      sun = getSunday(base);
    }
    const sat = getSaturday(sun);
    return date >= sun && date <= sat;
  }

  if (p.filter === 'Trimestral') {
    return (
      date.getFullYear() === p.year &&
      Math.floor(date.getMonth() / 3) === Math.floor(p.month / 3)
    );
  }

  if (p.filter === 'Mensal') {
    return date.getFullYear() === p.year && date.getMonth() === p.month;
  }

  return false;
}
