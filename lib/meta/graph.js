// Integração com a Meta Marketing API (Graph API) — somente leitura.
// O token fica APENAS no servidor (variável META_ACCESS_TOKEN). Nunca enviar ao browser.

export const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v21.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export const DATE_PRESETS = ['today', 'yesterday', 'last_7d', 'last_30d', 'this_month', 'last_month', 'maximum'];

const ACCOUNT_STATUS = {
  1: 'ACTIVE', 2: 'DISABLED', 3: 'UNSETTLED', 7: 'PENDING_RISK_REVIEW',
  8: 'PENDING_SETTLEMENT', 9: 'IN_GRACE_PERIOD', 100: 'PENDING_CLOSURE', 101: 'CLOSED',
};

// Aceita "act_123", "123" ou com espaços; retorna "act_123" ou null se inválido.
export function normalizeAccountId(raw) {
  if (raw === undefined || raw === null) return null;
  const digits = String(raw).trim().replace(/^act_/i, '');
  if (!/^\d{5,25}$/.test(digits)) return null;
  return `act_${digits}`;
}

const LEAD_TYPES = ['lead', 'onsite_conversion.lead_grouped', 'offsite_conversion.fb_pixel_lead'];
const MESSAGE_TYPES = ['onsite_conversion.messaging_conversation_started_7d'];
const PURCHASE_TYPES = ['purchase', 'offsite_conversion.fb_pixel_purchase', 'omni_purchase'];

function sumActions(actions, types) {
  if (!Array.isArray(actions)) return 0;
  // Pega o primeiro tipo encontrado (evita contar o mesmo evento em duplicidade)
  for (const t of types) {
    const a = actions.find((x) => x.action_type === t);
    if (a) return Number(a.value) || 0;
  }
  return 0;
}

// Converte a linha bruta do /insights em números prontos para a UI.
export function parseInsightsRow(row) {
  if (!row) {
    return { spend: 0, impressions: 0, reach: 0, clicks: 0, ctr: 0, cpc: 0, cpm: 0, leads: 0, messages: 0, purchases: 0, costPerResult: 0 };
  }
  const spend = Number(row.spend) || 0;
  const leads = sumActions(row.actions, LEAD_TYPES);
  const messages = sumActions(row.actions, MESSAGE_TYPES);
  const purchases = sumActions(row.actions, PURCHASE_TYPES);
  const results = leads + messages + purchases;
  return {
    spend,
    impressions: Number(row.impressions) || 0,
    reach: Number(row.reach) || 0,
    clicks: Number(row.clicks) || 0,
    ctr: Number(row.ctr) || 0,
    cpc: Number(row.cpc) || 0,
    cpm: Number(row.cpm) || 0,
    leads,
    messages,
    purchases,
    costPerResult: results > 0 ? spend / results : 0,
  };
}

export function accountStatusLabel(code) {
  return ACCOUNT_STATUS[Number(code)] || 'UNKNOWN';
}

export class MetaConfigError extends Error {}

async function graphGet(path, params = {}, token = process.env.META_ACCESS_TOKEN) {
  if (!token) throw new MetaConfigError('META_ACCESS_TOKEN não configurado no servidor.');
  const url = new URL(`${GRAPH_BASE}/${path}`);
  Object.entries(params).forEach(([k, v]) => v !== undefined && url.searchParams.set(k, String(v)));
  url.searchParams.set('access_token', token);

  const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const msg = json?.error?.message || `Graph API HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.code = json?.error?.code;
    throw err;
  }
  return json;
}

// Lista todas as contas de anúncio que o token enxerga (BMs próprias + parceiras).
export async function listAdAccounts(token = process.env.META_ACCESS_TOKEN) {
  const out = [];
  let after;
  for (let page = 0; page < 10; page++) {
    const json = await graphGet('me/adaccounts', {
      fields: 'account_id,name,account_status,currency',
      limit: 100,
      after,
    }, token);
    for (const a of json.data || []) {
      out.push({
        id: `act_${a.account_id}`,
        name: a.name || a.account_id,
        status: accountStatusLabel(a.account_status),
        currency: a.currency,
        businessName: '',
      });
    }
    after = json.paging?.cursors?.after;
    if (!json.paging?.next || !after) break;
  }
  return out;
}

const INSIGHT_FIELDS = 'spend,impressions,reach,clicks,ctr,cpc,cpm,actions';

export async function getAccountInsights(accountId, datePreset = 'last_30d', token = process.env.META_ACCESS_TOKEN) {
  const id = normalizeAccountId(accountId);
  if (!id) throw new Error('ID de conta de anúncio inválido.');
  const preset = DATE_PRESETS.includes(datePreset) ? datePreset : 'last_30d';

  const [summary, campaigns] = await Promise.all([
    graphGet(`${id}/insights`, { fields: INSIGHT_FIELDS, date_preset: preset }, token),
    graphGet(`${id}/insights`, {
      fields: `campaign_id,campaign_name,${INSIGHT_FIELDS}`,
      level: 'campaign',
      date_preset: preset,
      limit: 50,
      sort: 'spend_descending',
    }, token),
  ]);

  return {
    accountId: id,
    datePreset: preset,
    totals: parseInsightsRow(summary.data?.[0]),
    campaigns: (campaigns.data || []).map((c) => ({
      id: c.campaign_id,
      name: c.campaign_name,
      ...parseInsightsRow(c),
    })),
  };
}
