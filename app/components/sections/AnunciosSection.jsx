'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Megaphone,
  Link2,
  Unlink,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  X,
  BarChart3,
  TrendingUp,
  MousePointerClick,
  Eye,
  CheckCircle2,
  MessageCircle,
  ShoppingCart,
  PlayCircle,
  Users,
} from 'lucide-react';
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

function KpiCard({ label, value, subLabel, tone = 'text-fg', icon: Icon }) {
  return (
    <div className="rounded-2xl border border-line bg-surface-2/60 p-3 sm:p-4 min-w-0 flex flex-col justify-between">
      <div className="flex items-center justify-between gap-1">
        <p className="text-[11px] sm:text-xs text-muted truncate">{label}</p>
        {Icon && <Icon className="w-3.5 h-3.5 text-muted shrink-0 opacity-70" />}
      </div>
      <p className={`uv-num text-lg sm:text-xl font-bold mt-1.5 truncate ${tone}`}>
        {value}
      </p>
      {subLabel && (
        <p className="text-[10px] sm:text-[11px] text-muted truncate mt-1">
          {subLabel}
        </p>
      )}
    </div>
  );
}

function CampaignResultBadge({ campaign }) {
  const { messages = 0, checkouts = 0, leads = 0, purchases = 0, videoPlays = 0, clicks = 0 } = campaign;
  const items = [];
  if (messages > 0) {
    items.push(
      <span key="msg" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-pos/15 text-pos border border-pos/25">
        <MessageCircle className="w-3 h-3" />
        {fmtInt(messages)} msgs
      </span>
    );
  }
  if (checkouts > 0) {
    items.push(
      <span key="chk" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent/15 text-accent-fg border border-accent/25">
        <ShoppingCart className="w-3 h-3" />
        {fmtInt(checkouts)} checkouts
      </span>
    );
  }
  if (leads > 0) {
    items.push(
      <span key="lead" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-traffic/15 text-traffic border border-traffic/25">
        <Users className="w-3 h-3" />
        {fmtInt(leads)} leads
      </span>
    );
  }
  if (purchases > 0) {
    items.push(
      <span key="pur" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-pos/20 text-pos border border-pos/30">
        <CheckCircle2 className="w-3 h-3" />
        {fmtInt(purchases)} compras
      </span>
    );
  }
  if (videoPlays > 0 && items.length === 0) {
    items.push(
      <span key="vid" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-warn/15 text-warn border border-warn/25">
        <PlayCircle className="w-3 h-3" />
        {fmtInt(videoPlays)} plays
      </span>
    );
  }
  if (items.length === 0) {
    items.push(
      <span key="clk" className="text-muted text-xs uv-num">
        {fmtInt(clicks)} cliques
      </span>
    );
  }
  return <div className="flex flex-wrap items-center justify-end gap-1.5">{items}</div>;
}

function AccountLinker({ client, accounts, onSave }) {
  const [value, setValue] = useState(client.meta_ad_account_id || '');
  const [saving, setSaving] = useState(false);

  const save = async (v) => {
    setSaving(true);
    try {
      await onSave(client, v);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 mt-3 pt-3 border-t border-line/60" onClick={(e) => e.stopPropagation()}>
      {accounts.length > 0 ? (
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 min-w-0 h-9 rounded-xl border border-line bg-surface px-2.5 text-xs sm:text-sm text-fg focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">Selecionar conta da Meta…</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.status})
            </option>
          ))}
        </select>
      ) : (
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="act_123456789"
          className="flex-1 min-w-0 h-9 rounded-xl border border-line bg-surface px-3 text-xs sm:text-sm text-fg focus:outline-none focus:ring-1 focus:ring-accent"
        />
      )}
      <button
        disabled={saving || !value}
        onClick={() => save(value)}
        className="h-9 px-3.5 rounded-xl bg-accent text-white text-xs sm:text-sm font-medium disabled:opacity-40 cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0 transition-opacity hover:opacity-90"
      >
        <Link2 className="w-4 h-4" /> Vincular
      </button>
    </div>
  );
}

// Componente com os detalhes, KPIs e Campanhas do cliente (compartilhado entre desktop e popup mobile)
function ClientMetricsView({
  client,
  preset,
  setPreset,
  insights,
  loading,
  onRefresh,
  onUnlink,
  onClose,
  isModal = false,
}) {
  const t = insights?.totals;
  const results = t ? t.leads + t.messages + t.purchases : 0;

  return (
    <div className="space-y-4">
      {/* Cabeçalho do Cliente Selecionado */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-line/70">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-fg truncate">{client.name}</h2>
            {isModal && onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-1.5 rounded-full hover:bg-surface-2 text-muted hover:text-fg transition-colors ml-auto cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-traffic/15 text-traffic border border-traffic/25">
              <Megaphone className="w-3 h-3" />
              <span className="uv-num">{client.meta_ad_account_id}</span>
            </span>
            <button
              onClick={() => onUnlink(client)}
              className="text-xs text-muted hover:text-neg inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Unlink className="w-3.5 h-3.5" /> Desvincular
            </button>
          </div>
        </div>

        {/* Botão de Atualizar */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="h-8 px-3 rounded-full border border-line bg-surface-2 hover:bg-surface-2/80 text-xs font-medium text-fg inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-accent' : ''}`} />
            <span>Atualizar</span>
          </button>
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="hidden sm:inline-flex lg:hidden p-1.5 rounded-full hover:bg-surface-2 text-muted hover:text-fg transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Seletor de Períodos */}
      <div className="flex rounded-full border border-line bg-surface-2/80 p-1 gap-1 overflow-x-auto custom-scrollbar">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPreset(p.value)}
            className={`px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap cursor-pointer transition-colors font-medium ${
              preset === p.value ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-fg'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Grid Inteligente de Indicadores Reais */}
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 transition-opacity ${loading ? 'opacity-50' : ''}`}>
        <KpiCard label="Investimento" value={formatMoney(t?.spend || 0)} subLabel="Total no período" tone="text-traffic" icon={BarChart3} />
        
        {/* Mensagens Geradas */}
        <KpiCard
          label="Mensagens Iniciadas"
          value={fmtInt(t?.messages || 0)}
          subLabel={t?.messages > 0 ? `Custo: ${formatMoney(t?.costPerMessage)}/msg` : 'WhatsApp / Direct'}
          tone={t?.messages > 0 ? 'text-pos' : 'text-fg'}
          icon={MessageCircle}
        />

        {/* Finalizações de Compra (Pixel) */}
        <KpiCard
          label="Finalizações de Compra"
          value={fmtInt(t?.checkouts || 0)}
          subLabel={t?.checkouts > 0 ? `Custo: ${formatMoney(t?.costPerCheckout)}/chk` : 'Checkout Pixel'}
          tone={t?.checkouts > 0 ? 'text-accent-fg' : 'text-fg'}
          icon={ShoppingCart}
        />

        {/* Cadastros / Leads */}
        <KpiCard
          label="Cadastros / Leads"
          value={fmtInt(t?.leads || 0)}
          subLabel={t?.leads > 0 ? `Custo: ${formatMoney(t?.costPerLead)}/lead` : 'Formulários / Pixel'}
          tone={t?.leads > 0 ? 'text-traffic' : 'text-fg'}
          icon={Users}
        />

        {/* Plays de Vídeo */}
        <KpiCard
          label="Plays de Vídeo"
          value={fmtInt(t?.videoPlays || 0)}
          subLabel="Reproduções"
          tone="text-fg"
          icon={PlayCircle}
        />

        {/* Alcance de Pessoas */}
        <KpiCard
          label="Alcance"
          value={fmtInt(t?.reach || 0)}
          subLabel="Pessoas únicas"
          tone="text-fg"
          icon={Eye}
        />

        {/* Cliques no Link */}
        <KpiCard
          label="Cliques no Link"
          value={fmtInt(t?.clicks || 0)}
          subLabel={`CTR: ${fmtPct(t?.ctr)}`}
          tone="text-fg"
          icon={MousePointerClick}
        />

        {/* CPC Médio */}
        <KpiCard
          label="CPC Médio"
          value={formatMoney(t?.cpc || 0)}
          subLabel="Custo por clique"
          tone="text-fg"
        />
      </div>

      {/* Card de Campanhas com Rolagem Interna (.custom-scrollbar) */}
      <div className="rounded-2xl border border-line bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-line/60 flex items-center justify-between">
          <p className="font-semibold text-sm sm:text-base text-fg">Campanhas no Período</p>
          <span className="text-xs text-muted uv-num">
            {insights?.campaigns?.length || 0} campanha{insights?.campaigns?.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="max-h-[300px] sm:max-h-[360px] overflow-auto custom-scrollbar">
          <table className="w-full text-xs sm:text-sm">
            <thead className="text-muted text-[11px] sm:text-xs sticky top-0 bg-surface border-b border-line">
              <tr>
                <th className="text-left px-3 sm:px-4 py-2 font-medium">Nome da Campanha</th>
                <th className="text-right px-2.5 sm:px-3 py-2 font-medium">Investido</th>
                <th className="text-right px-2.5 sm:px-3 py-2 font-medium">Cliques</th>
                <th className="text-right px-3 sm:px-4 py-2 font-medium">Resultados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(insights?.campaigns || []).map((c) => (
                <tr key={c.id} className="hover:bg-surface-2/40 transition-colors">
                  <td className="px-3 sm:px-4 py-2.5 text-fg font-medium max-w-[150px] sm:max-w-[240px] truncate" title={c.name}>
                    {c.name}
                  </td>
                  <td className="px-2.5 sm:px-3 py-2.5 text-right uv-num font-medium text-traffic">
                    {formatMoney(c.spend)}
                  </td>
                  <td className="px-2.5 sm:px-3 py-2.5 text-right uv-num text-muted">
                    {fmtInt(c.clicks)}
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 text-right">
                    <CampaignResultBadge campaign={c} />
                  </td>
                </tr>
              ))}
              {!loading && insights && insights.campaigns.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted text-xs sm:text-sm">
                    Nenhuma veiculação de anúncio registrada neste período.
                  </td>
                </tr>
              )}
              {loading && !insights && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted text-xs sm:text-sm">
                    <RefreshCw className="w-5 h-5 animate-spin text-accent mx-auto mb-2" />
                    Carregando dados da Meta Ads…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
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
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  const list = useMemo(() => clients.filter((c) => c.contract_status !== 'Cancelado'), [clients]);
  const selected = list.find((c) => c.id === selectedId) || null;
  const accountName = (id) => accounts.find((a) => a.id === id)?.name || id;

  useEffect(() => {
    const userParam = userId ? `&userId=${encodeURIComponent(userId)}` : '';
    fetch(`/api/meta?action=status${userParam}`)
      .then((r) => r.json())
      .then((s) => {
        setConfigured(s.configured);
        if (s.configured) {
          fetch(`/api/meta?action=accounts${userParam}`)
            .then((r) => r.json())
            .then((d) => (Array.isArray(d) ? setAccounts(d) : setError(d.error || 'Falha ao listar contas')))
            .catch(() => setError('Falha ao listar contas'));
        }
      })
      .catch(() => setConfigured(false));
  }, [userId]);

  const loadInsights = useCallback(async () => {
    if (!selected?.meta_ad_account_id || !configured) {
      setInsights(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const userParam = userId ? `&userId=${encodeURIComponent(userId)}` : '';
      const r = await fetch(
        `/api/meta?action=insights&accountId=${encodeURIComponent(selected.meta_ad_account_id)}&preset=${preset}${userParam}`
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Erro ao buscar métricas');
      setInsights(d);
    } catch (e) {
      setError(e.message);
      setInsights(null);
    } finally {
      setLoading(false);
    }
  }, [selected?.meta_ad_account_id, preset, configured, userId]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const handleSelectClient = (c) => {
    setSelectedId(c.id);
    if (c.meta_ad_account_id) {
      setIsMobileModalOpen(true);
    }
  };

  const handleUnlink = async (c) => {
    if (confirm(`Deseja desvincular a conta de anúncios de ${c.name}?`)) {
      await onLinkAccount(c, null);
      setIsMobileModalOpen(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-[28px] font-semibold text-fg tracking-tight">Anúncios</h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Métricas de tráfego pago da Meta Ads por cliente
          </p>
        </div>
      </div>

      {configured === false && (
        <div className="rounded-2xl border border-warn/30 bg-warn/10 p-4 flex gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-warn shrink-0" />
          <div className="text-fg">
            <p className="font-medium">Conexão com a Meta não configurada</p>
            <p className="text-muted mt-1 text-xs sm:text-sm">
              Nenhuma conta da Meta conectada para este usuário.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-neg/30 bg-neg/10 p-3.5 text-xs sm:text-sm text-neg break-words">
          {error}
        </div>
      )}

      {/* Grid Principal: Lista à Esquerda (Desktop/Mobile) e Detalhes à Direita (Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 items-start">
        {/* Card 1: Lista de Clientes com Rolagem Suave */}
        <div className="rounded-2xl border border-line bg-surface p-3 sm:p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 px-1 border-b border-line">
            <span className="font-semibold text-sm sm:text-base text-fg">Clientes</span>
            <span className="text-xs text-muted uv-num">
              {list.filter((c) => c.meta_ad_account_id).length} de {list.length} com Meta
            </span>
          </div>

          <div className="mt-3 space-y-2 max-h-[580px] overflow-y-auto custom-scrollbar pr-1">
            {list.length === 0 && (
              <p className="text-xs sm:text-sm text-muted p-4 text-center">Nenhum cliente ativo.</p>
            )}

            {list.map((c) => {
              const active = c.id === selectedId;
              const hasAccount = Boolean(c.meta_ad_account_id);

              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectClient(c)}
                  className={`rounded-xl p-3 cursor-pointer transition-all border ${
                    active
                      ? 'border-accent/40 bg-accent/10 shadow-sm'
                      : 'border-line/70 hover:border-line hover:bg-surface-2/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-xs sm:text-sm text-fg truncate">{c.name}</p>
                        {hasAccount && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-pos shrink-0" title="Conta Vinculada" />
                        )}
                      </div>

                      {hasAccount ? (
                        <p className="text-[11px] sm:text-xs text-traffic font-medium mt-0.5 truncate">
                          {accountName(c.meta_ad_account_id)}
                        </p>
                      ) : (
                        <p className="text-[11px] sm:text-xs text-muted mt-0.5">Sem conta vinculada</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {hasAccount && (
                        <span className="lg:hidden text-[11px] font-medium text-accent bg-accent/15 px-2 py-0.5 rounded-full">
                          Ver dados
                        </span>
                      )}
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          active ? 'text-accent-fg translate-x-0.5' : 'text-muted'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Seletor inline de vínculo se o cliente estiver aberto e sem conta vinculada */}
                  {active && !hasAccount && (
                    <AccountLinker client={c} accounts={accounts} onSave={onLinkAccount} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 2: Painel Fixo à Direita (Apenas Telas Grandes - Desktop) */}
        <div className="hidden lg:block rounded-2xl border border-line bg-surface p-5">
          <AnimatePresence mode="wait">
            {!selected ? (
              <div className="py-24 text-center text-muted">
                <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-40 text-accent" />
                <p className="font-medium text-fg">Nenhum cliente selecionado</p>
                <p className="text-xs text-muted mt-1">
                  Selecione um cliente na lista ao lado para acompanhar as métricas da Meta Ads.
                </p>
              </div>
            ) : !selected.meta_ad_account_id ? (
              <div className="py-24 text-center text-muted">
                <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-40 text-warn" />
                <p className="font-medium text-fg">Vincule uma conta de anúncios</p>
                <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                  Vincule a conta correspondente a <b className="text-fg">{selected.name}</b> no card ao lado para carregar os dados.
                </p>
              </div>
            ) : (
              <motion.div
                key={`${selected.id}-${preset}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <ClientMetricsView
                  client={selected}
                  preset={preset}
                  setPreset={setPreset}
                  insights={insights}
                  loading={loading}
                  onRefresh={loadInsights}
                  onUnlink={handleUnlink}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* POP-UP / BOTTOM-SHEET MODAL PARA MOBILE (Abre quando clica no cliente no celular) */}
      <AnimatePresence>
        {isMobileModalOpen && selected && selected.meta_ad_account_id && (
          <div className="lg:hidden fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop com blur suave */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setIsMobileModalOpen(false)}
            />

            {/* Container do Pop-up em formato Bottom-Sheet no celular */}
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="relative bg-surface border border-line-strong rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden z-10"
            >
              {/* Barra de arraste visual para mobile */}
              <div className="w-12 h-1.5 bg-line rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

              <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex-1">
                <ClientMetricsView
                  client={selected}
                  preset={preset}
                  setPreset={setPreset}
                  insights={insights}
                  loading={loading}
                  onRefresh={loadInsights}
                  onUnlink={handleUnlink}
                  onClose={() => setIsMobileModalOpen(false)}
                  isModal={true}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
