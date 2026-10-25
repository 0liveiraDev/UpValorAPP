export const THEME_KEY = 'upvalor_theme';

/**
 * Normaliza qualquer valor para um tema suportado ('dark' | 'light').
 * Apenas 'light' retorna 'light'; qualquer outro valor (incluindo undefined/null) retorna 'dark'.
 * @param {unknown} value
 * @returns {'dark' | 'light'}
 */
export function normalizeTheme(value) {
  return value === 'light' ? 'light' : 'dark';
}

/**
 * Calcula o raio máximo necessário para cobrir uma tela de dimensões (width x height)
 * a partir de uma coordenada de origem (x, y).
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @returns {number}
 */
export function revealRadius(x, y, width, height) {
  return Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
}
