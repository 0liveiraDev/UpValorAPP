'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Megaphone, Link2, Unlink, RefreshCw, AlertTriangle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatMoney } from '@/lib/dashboard/format.js';

const PRESETS = [
  { value: 'today', label: 'Hoje' },
  { value: 'last_7d', label: '7 dias' },
  { value: 'last_30d', label: '30 dias' },
  { value: 'this_month', label: 'Este mês' },
  { value: 'last_month', label: 'Mês passado' },
];

const fmtInt = (n) => Number(n || 0).toLocaleString('pt-BR');
const fmtPct = (n) => `${Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;

function Kpi({ label, value, tone = 'text-fg' }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 min-w-0">
      <p className="text-xs text-muted truncate">{label}</p>
      <p className={`uv-num text-lg md:text-xl font-semibold mt-1 truncate ${tone}`}>{value}</p>
    </div>
  );
}

function AccountLinker({ client, accounts, onSave }) {
  const [value, setValue] = useState(client.meta_ad_account_id || '');
  const [saving, setSaving] = useState(false);
  const save = async (v) => {
    setSaving(true);
    try { await onSave(client, v); } finally { setSaving(false); }
  };
  return (
    <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
      {accounts.length > 0 ? (
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 min-w-0 h-9 rounded-xl border border-line bg-surface-2 px-2 text-sm text-fg"
        >
          <option value="">Selecionar conta…</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}{a.businessName ? ` · ${a.businessName}` : ''}</option>
          ))}
        </select>
      ) : (
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="act_123456789"
          className="flex-1 min-w-0 h-9 rounded-xl border border-line bg-surface-2 px-3 text-sm text-fg"
        />
      )}
      <button
        disabled={saving || !value}
        onClick={() => save(value)}
        className="h-9 px-3 rounded-xl bg-accent text-white text-sm font-medium disabled:opacity-40 cursor-pointer inline-flex items-center gap-1.5"
      >
        <Link2 className="w-4 h-4" /> Vincular
      </button>
    </div>
  );
}

export default function AnunciosSection({ clients = [], onLinkAccount, userId }) {
  const [configured, setConfigured] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [preset, setPreset] = useState('last_30d');
  const [selectedId, setSelectedId] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const list = useMemo(() => clients.filter((c) => c.contract_status !== 'Cancelado'), [clients]);
  const selected = list.find((c) => c.id === selectedId) || null;
  const accountName = (id) => accounts.find((a) => a.id === id)?.name || id;

  useEffect(() => {
    const userParam = userId ? `&userId=${encodeURIComponent(userId)}` : '';
    fetch(`/api/meta?action=status${userParam}`).then((r) => r.json()).then((s) => {
      setConfigured(s.configured);
      if (s.configured) {
        fetch(`/api/meta?action=accounts${userParam}`).then((r) => r.json())
          .then((d) => Array.isArray(d) ? setAccounts(d) : setError(d.error || 'Falha ao listar contas'))
          .catch(() => setError('Falha ao listar contas'));
      }
    }).catch(() => setConfigured(false));
  }, [userId]);

  const loadInsights = useCallback(async () => {
    if (!selected?.meta_ad_account_id || !configured) { setInsights(null); return; }
    setLoading(true); setError('');
    try {
      const userParam = userId ? `&userId=${encodeURIComponent(userId)}` : '';
      const r = await fetch(`/api/meta?action=insights&accountId=${encodeURIComponent(selected.meta_ad_account_id)}&preset=${preset}${userParam}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Erro ao buscar métricas');
      setInsights(d);
    } catch (e) { setError(e.message); setInsights(null); }
    finally { setLoading(false); }
  }, [selected?.meta_ad_account_id, preset, configured, userId]);

  useEffect(() => { loadInsights(); }, [loadInsights]);

  const t = insights?.totals;
  const results = t ? t.leads + t.messages + t.purchases : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-[28px] font-semibold text-fg tracking-tight">Anúncios</h1>
          <p className="text-sm text-muted mt-0.5">Métricas da Meta Ads por cliente</p>
        </div>
        <div className="flex rounded-full border border-line bg-surface-2 p-1 gap-1 overflow-x-auto">
          {PRESETS.map((p) => (
            <button key={p.value} onClick={() => setPreset(p.value)}
              className={`px-3 h-8 rounded-full text-sm whitespace-nowrap cursor-pointer transition-colors ${preset === p.value ? 'bg-accent text-white' : 'text-muted hover:text-fg'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {configured === false && (
        <div className="rounded-2xl border border-warn/30 bg-warn/10 p-4 flex gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-warn shrink-0" />
          <div className="text-fg">
            <p className="font-medium">Conexão com a Meta não configurada</p>
            <p className="text-muted mt-1">Defina <code className="uv-num">META_ACCESS_TOKEN</code> no servidor (token de Usuário do Sistema do Business Manager com permissão <code>ads_read</code>). Você já pode vincular os IDs das contas aos clientes.</p>
          </div>
        </div>
      )}

      {error && <div className="rounded-2xl border border-neg/30 bg-neg/10 p-3 text-sm text-neg break-words">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
        <div className="rounded-2xl border border-line bg-surface p-3 max-h-[640px] overflow-y-auto custom-scrollbar">
          {list.length === 0 && <p className="text-sm text-muted p-3">Nenhum cliente ativo.</p>}
          {list.map((c) => {
            const active = c.id === selectedId;
            return (
              <div key={c.id} onClick={() => setSelectedId(c.id)}
                className={`rounded-xl p-3 cursor-pointer transition-colors border ${active ? 'border-accent/40 bg-accent/10' : 'border-transparent hover:bg-surface-2'}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-fg truncate">{c.name}</p>
                  <ChevronRight className={`w-4 h-4 shrink-0 ${active ? 'text-accent-fg' : 'text-muted'}`} />
                </div>
                {c.meta_ad_account_id ? (
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p className="text-xs text-traffic truncate">{accountName(c.meta_ad_account_id)}</p>
                    {active && (
                      <button onClick={(e) => { e.stopPropagation(); onLinkAccount(c, null); }}
                        className="text-xs text-muted hover:text-neg inline-flex items-center gap-1 cursor-pointer">
                        <Unlink className="w-3.5 h-3.5" /> Desvincular
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted mt-1">Sem conta vinculada</p>
                )}
                {active && !c.meta_ad_account_id && <AccountLinker client={c} accounts={accounts} onSave={onLinkAccount} />}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={`${selectedId}-${preset}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} className="space-y-4 min-w-0">
            {!selected && (
              <div className="rounded-2xl border border-line bg-surface p-8 text-center text-muted">
                <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-60" />
                Selecione um cliente para ver os anúncios.
              </div>
            )}
            {selected && !selected.meta_ad_account_id && (
              <div className="rounded-2xl border border-line bg-surface p-8 text-center text-muted">Vincule uma conta de anúncios a <b className="text-fg">{selected.name}</b>.</div>
            )}
            {selected?.meta_ad_account_id && (
              <>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-muted truncate">{selected.name} · <span className="uv-num">{selected.meta_ad_account_id}</span></p>
                  <button onClick={loadInsights} disabled={loading} className="text-sm text-muted hover:text-fg inline-flex items-center gap-1.5 cursor-pointer">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
                  </button>
                </div>
                <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${loading ? 'opacity-50' : ''}`}>
                  <Kpi label="Investimento" value={formatMoney(t?.spend || 0)} tone="text-traffic" />
                  <Kpi label="Resultados" value={fmtInt(results)} tone="text-pos" />
                  <Kpi label="Custo por resultado" value={formatMoney(t?.costPerResult || 0)} />
                  <Kpi label="Impressões" value={fmtInt(t?.impressions)} />
                  <Kpi label="Alcance" value={fmtInt(t?.reach)} />
                  <Kpi label="Cliques" value={fmtInt(t?.clicks)} />
                  <Kpi label="CTR" value={fmtPct(t?.ctr)} />
                  <Kpi label="CPC" value={formatMoney(t?.cpc || 0)} />
                </div>
                <div className="rounded-2xl border border-line bg-surface">
                  <p className="px-4 pt-4 pb-2 font-medium text-fg">Campanhas</p>
                  <div className="max-h-[360px] overflow-auto custom-scrollbar">
                    <table className="w-full text-sm">
                      <thead className="text-muted text-xs sticky top-0 bg-surface">
                        <tr><th className="text-left px-4 py-2 font-normal">Campanha</th><th className="text-right px-3 font-normal">Gasto</th><th className="text-right px-3 font-normal">Cliques</th><th className="text-right px-4 font-normal">Resultados</th></tr>
                      </thead>
                      <tbody>
                        {(insights?.campaigns || []).map((c) => (
                          <tr key={c.id} className="border-t border-line">
                            <td className="px-4 py-2.5 text-fg max-w-[260px] truncate" title={c.name}>{c.name}</td>
                            <td className="px-3 text-right uv-num">{formatMoney(c.spend)}</td>
                            <td className="px-3 text-right uv-num">{fmtInt(c.clicks)}</td>
                            <td className="px-4 text-right uv-num">{fmtInt(c.leads + c.messages + c.purchases)}</td>
                          </tr>
                        ))}
                        {!loading && insights && insights.campaigns.length === 0 && (
                          <tr><td colSpan={4} className="px-4 py-6 text-center text-muted">Sem veiculação no período.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
