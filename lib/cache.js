/**
 * ============================================================
 * ESCUDO DE ESTABILIDADE — Cache em Memória com TTL
 * ============================================================
 * Evita "martelar" o banco de dados com queries repetidas.
 * Sem dependências externas — usa apenas Map nativo do Node.js.
 * ============================================================
 */

const TTL_DEFAULT_MS = 3 * 60 * 1000; // 3 minutos padrão

// Usa globalThis para sobreviver ao hot-reload do Next.js em dev
if (!globalThis.__upvalor_cache) {
  globalThis.__upvalor_cache = new Map();
}
const store = globalThis.__upvalor_cache;

/**
 * Busca um valor no cache.
 * @param {string} key
 * @returns {any|null} — valor ou null se não existir/expirado
 */
export function cacheGet(key) {
  const entry = store.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[CACHE HIT] ${key}`);
  }
  return entry.value;
}

/**
 * Armazena um valor no cache com TTL.
 * @param {string} key
 * @param {any} value
 * @param {number} ttlMs — tempo de vida em ms (padrão: 3 min)
 */
export function cacheSet(key, value, ttlMs = TTL_DEFAULT_MS) {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Invalida todas as chaves que contenham o padrão.
 * Ex: cacheInvalidate('clients') remove 'clients:42', 'clients:99', etc.
 * @param {string} pattern
 */
export function cacheInvalidate(pattern) {
  let count = 0;
  for (const key of store.keys()) {
    if (key.includes(pattern)) {
      store.delete(key);
      count++;
    }
  }
  if (count > 0) {
    console.log(`[CACHE INVALIDATE] Removidas ${count} entradas com padrão: "${pattern}"`);
  }
}

/**
 * Limpa TODO o cache (útil para debugging ou reset em painel admin).
 */
export function cacheClear() {
  const size = store.size;
  store.clear();
  console.log(`[CACHE CLEAR] ${size} entradas removidas.`);
}

// Limpeza automática de entradas expiradas a cada 5 minutos
// Evita acúmulo de memória em caso de muitos userId diferentes
if (!globalThis.__upvalor_cache_cleanup) {
  globalThis.__upvalor_cache_cleanup = setInterval(() => {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of store.entries()) {
      if (now > entry.expiresAt) {
        store.delete(key);
        removed++;
      }
    }
    if (removed > 0) {
      console.log(`[CACHE GC] ${removed} entradas expiradas removidas. Total: ${store.size}`);
    }
  }, 5 * 60 * 1000);

  // Garante que o interval não impeça o processo de encerrar normalmente
  if (globalThis.__upvalor_cache_cleanup.unref) {
    globalThis.__upvalor_cache_cleanup.unref();
  }
}
