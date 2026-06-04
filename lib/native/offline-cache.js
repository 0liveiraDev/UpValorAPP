/**
 * UpValor Offline Cache Service
 * Cache local de dados do dashboard usando @capacitor/preferences
 * Funciona tanto online quanto offline
 */

const CACHE_KEYS = {
  DASHBOARD_KPIs: 'upvalor_kpis',
  CLIENTS: 'upvalor_clients',
  GOALS: 'upvalor_goals',
  LAST_SYNC: 'upvalor_last_sync',
  USER_SESSION: 'upvalor_session',
};

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos

let Preferences = null;

async function getPreferencesPlugin() {
  if (typeof window === 'undefined') return null;
  if (!Preferences) {
    try {
      const { Preferences: Plugin } = await import('@capacitor/preferences');
      Preferences = Plugin;
    } catch {
      return null;
    }
  }
  return Preferences;
}

/**
 * Verifica se o app está rodando dentro do Capacitor (app nativo)
 */
export function isNativeApp() {
  if (typeof window === 'undefined') return false;
  return window.Capacitor?.isNativePlatform?.() ?? false;
}

/**
 * Salva dados no cache local
 * @param {string} key - Chave do cache (use CACHE_KEYS)
 * @param {any} data - Dados a serem salvos
 */
export async function setCacheData(key, data) {
  const plugin = await getPreferencesPlugin();

  const payload = {
    data,
    timestamp: Date.now(),
  };

  if (plugin) {
    // App nativo: usa Capacitor Preferences (Keystore seguro)
    await plugin.set({ key, value: JSON.stringify(payload) });
  } else {
    // Browser: usa localStorage como fallback
    try {
      localStorage.setItem(key, JSON.stringify(payload));
    } catch { /* storage cheio ou privado */ }
  }
}

/**
 * Recupera dados do cache local
 * @param {string} key - Chave do cache
 * @param {boolean} ignoreExpiry - Se true, retorna dados mesmo expirados
 * @returns {any | null}
 */
export async function getCacheData(key, ignoreExpiry = false) {
  const plugin = await getPreferencesPlugin();
  let raw = null;

  if (plugin) {
    const result = await plugin.get({ key });
    raw = result?.value;
  } else {
    raw = localStorage.getItem(key);
  }

  if (!raw) return null;

  try {
    const payload = JSON.parse(raw);
    const age = Date.now() - payload.timestamp;

    if (!ignoreExpiry && age > CACHE_TTL_MS) {
      return null; // Cache expirado
    }

    return payload.data;
  } catch {
    return null;
  }
}

/**
 * Remove um item do cache
 * @param {string} key
 */
export async function removeCacheData(key) {
  const plugin = await getPreferencesPlugin();
  if (plugin) {
    await plugin.remove({ key });
  } else {
    localStorage.removeItem(key);
  }
}

/**
 * Limpa todo o cache do app
 */
export async function clearAllCache() {
  const plugin = await getPreferencesPlugin();
  if (plugin) {
    await plugin.clear();
  } else {
    Object.values(CACHE_KEYS).forEach(k => localStorage.removeItem(k));
  }
}

/**
 * Atualiza o timestamp da última sincronização
 */
export async function updateLastSync() {
  await setCacheData(CACHE_KEYS.LAST_SYNC, { at: new Date().toISOString() });
}

/**
 * Retorna quando foi a última sincronização
 * @returns {Date | null}
 */
export async function getLastSync() {
  const data = await getCacheData(CACHE_KEYS.LAST_SYNC, true); // ignora expiração
  if (!data?.at) return null;
  return new Date(data.at);
}

export { CACHE_KEYS };
