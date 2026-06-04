/**
 * UpValor Share Service
 * Compartilhamento nativo via @capacitor/share
 * Suporta WhatsApp, e-mail, e qualquer app nativo do Android
 */

let Share = null;

async function getSharePlugin() {
  if (typeof window === 'undefined') return null;
  if (!Share) {
    try {
      const { Share: Plugin } = await import('@capacitor/share');
      Share = Plugin;
    } catch {
      return null;
    }
  }
  return Share;
}

/**
 * Verifica se o compartilhamento está disponível no dispositivo
 */
export async function canShare() {
  const plugin = await getSharePlugin();
  if (!plugin) return false;

  try {
    const result = await plugin.canShare();
    return result.value;
  } catch {
    return false;
  }
}

/**
 * Compartilha um relatório ou dado do dashboard
 * @param {Object} options
 * @param {string} options.title - Título do relatório
 * @param {string} options.text - Texto principal a compartilhar
 * @param {string} [options.url] - URL do relatório (opcional)
 * @param {string} [options.dialogTitle] - Título do dialog de compartilhamento
 */
export async function shareReport({ title, text, url, dialogTitle = 'Compartilhar via' }) {
  const plugin = await getSharePlugin();

  if (!plugin) {
    // Fallback browser: tenta Web Share API
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return;
    }
    // Último fallback: copia para área de transferência
    const content = url ? `${text}\n${url}` : text;
    await navigator.clipboard.writeText(content);
    alert('Relatório copiado para a área de transferência!');
    return;
  }

  await plugin.share({
    title,
    text,
    url,
    dialogTitle,
  });
}

/**
 * Compartilha um KPI rápido do dashboard
 * @param {string} metricName - Nome da métrica (ex: "Novos Clientes")
 * @param {string} metricValue - Valor (ex: "47")
 * @param {string} period - Período (ex: "Maio 2025")
 */
export async function shareKPI(metricName, metricValue, period) {
  await shareReport({
    title: `UpValor — ${metricName}`,
    text: `📊 ${metricName}: ${metricValue}\n📅 Período: ${period}\n\nDados do Dashboard UpValor`,
    dialogTitle: 'Compartilhar métrica',
  });
}

/**
 * Compartilha o link do dashboard
 */
export async function shareDashboardLink() {
  await shareReport({
    title: 'UpValor Dashboard',
    text: 'Acompanhe os resultados da UpValor em tempo real:',
    url: 'https://www.dashboard.upvaloragencia.com.br',
    dialogTitle: 'Compartilhar dashboard',
  });
}
