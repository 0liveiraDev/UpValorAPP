# Redesign do Painel + Temas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nova composição visual do Painel, tokens de tema claro/escuro no app inteiro com revelação circular, navegação de período por modo e trava anti-duplicidade em Pagar/Receber — sem mudar cálculos ou regras.

**Architecture:** Lógica pura extraída para `lib/dashboard/*` e `lib/theme/*` (testada com `node --test`). Tokens CSS em `app/globals.css` expostos ao Tailwind v4 via `@theme inline`. Painel decomposto em componentes em `app/components/dashboard/*`; `app/page.jsx` mantém estado, dados e ações e passa props.

**Tech Stack:** Next.js 16.1.6, React 19.2.3, Tailwind v4, framer-motion 12, recharts 3, lucide-react, Node 24 (`node --test`).

**Spec:** `docs/superpowers/specs/2026-10-24-painel-redesign-design.md`

## Global Constraints
- Nenhuma dependência nova. Nenhuma mudança em `app/api/**`, `lib/db*.js`, cálculos de `kpis`, regras de contrato/folha/recebimento, auth ou persistência.
- Tokens com os nomes e valores exatos da tabela do spec (`bg, surface, surface-2, line, line-strong, fg, muted, subtle, accent, accent-fg, pos, neg, warn, traffic`), CSS vars `--uv-<nome>`, utilitários Tailwind `bg-<nome>`, `text-<nome>`, `border-<nome>` (com opacidade `/10`, `/20` funcionando).
- Tema: `localStorage['upvalor_theme']` ∈ `'dark'|'light'`, padrão `'dark'`, atributo `data-theme` em `<html>`.
- Movimento: entrada 220 ms, `cubic-bezier(0.22,1,0.36,1)`, translateY 8px→0, stagger 35 ms, até 5 grupos; transições de estado 150 ms; revelação de tema 450 ms. `prefers-reduced-motion: reduce` remove deslocamentos, stagger, revelação e animação de gráficos.
- Valores monetários com `formatMoney` (pt-BR, BRL) e `font-variant-numeric: tabular-nums`; nenhuma contagem animada.
- Textos em pt-BR. Status sempre com texto (não só cor). Foco visível em todo controle.
- Commits: cada tarefa adiciona só os próprios arquivos (`git add <arquivos>`); se `index.lock` existir, aguarde 2 s e repita.
- Não ler `node_modules`, `.next`, `out`, `android`.

## Review Focus
1. Clique duplo rápido em Receber/Pagar → exatamente 1 PUT + 1 POST de transação (Task 3 `DueListPanel` trava por id; Task 5 aguarda `loadData`).
2. Semana que cruza mês/ano (27/12–02/01) → rótulo, escopo e mês sincronizado corretos (Task 2 testes).
3. Data `YYYY-MM-01` em UTC−3 cai no mês certo nos gráficos (Task 2 teste de `buildChartData`).
4. Falha de API no carregamento → banner de erro em vez de R$ 0,00 silencioso (Task 5).
5. Nomes muito longos / lista com 20+ itens → sem rolagem horizontal da página, "Mostrar todos (N)" visível (Task 3 + validação Task 6).

---

## Wave plan (arquivos disjuntos por onda)
- Onda 1 (paralelo): Task 1 ‖ Task 2
- Onda 2 (paralelo): Task 3 ‖ Task 4
- Onda 3: Task 5
- Onda 4: Task 6 (validação no navegador)

---

### Task 1: Fundação de tema (tokens, provider, toggle com revelação circular)

**Files:**
- Modify: `app/globals.css` (reescrever: tokens, `@theme inline`, utilitários, keyframes, view-transition, reduced-motion; manter `.custom-scrollbar` tokenizado)
- Modify: `app/layout.tsx` (script inline anti-flash no `<head>`; envolver `{children}` com `<ThemeProvider>`)
- Create: `lib/theme/theme.js`, `lib/theme/palette.js`
- Create: `app/components/theme/ThemeProvider.jsx`, `app/components/theme/ThemeToggle.jsx`
- Test: `tests/theme.test.mjs`

**Interfaces:**
- Produces:
  - `lib/theme/theme.js`: `export const THEME_KEY = 'upvalor_theme'`; `export function normalizeTheme(value: unknown): 'dark'|'light'` (só `'light'` vira light); `export function revealRadius(x: number, y: number, width: number, height: number): number` = `Math.hypot(Math.max(x, width - x), Math.max(y, height - y))`.
  - `lib/theme/palette.js`: `export const CHART_PALETTE = { dark: {...}, light: {...} }`, cada um com chaves `pos, neg, warn, traffic, accent, grid, axis, tooltipBg, tooltipBorder, tooltipFg` (cores = tabela do spec; dark `grid: 'rgba(255,255,255,0.06)'`, `axis: '#8c96a9'`, `tooltipBg: '#1c202b'`, `tooltipBorder: 'rgba(255,255,255,0.14)'`, `tooltipFg: '#f1f5f9'`; light `grid: '#e2e7f0'`, `axis: '#5f6b7d'`, `tooltipBg: '#ffffff'`, `tooltipBorder: '#cbd3e1'`, `tooltipFg: '#0f172a'`).
  - `ThemeProvider.jsx` (`'use client'`): `export function ThemeProvider({ children })`, `export function useTheme(): { theme: 'dark'|'light', toggleTheme: (originEl?: HTMLElement|null) => void }`. Estado inicial lido de `document.documentElement.dataset.theme` num `useEffect` de montagem (SSR assume `'dark'`).
  - `ThemeToggle.jsx` (`'use client'`): `export default function ThemeToggle({ className })` — `<button type="button">` 36×36, ícone `Sun` (tema escuro ativo) / `Moon` (tema claro ativo), `aria-label` "Ativar tema claro" | "Ativar tema escuro", `title` igual; chama `toggleTheme(e.currentTarget)`.
- Classes CSS produzidas (usadas pelas Tasks 3–5): `.uv-card`, `.uv-num`, `.uv-enter` (lê `--uv-delay`), utilitários de cor dos tokens.

- [ ] **Step 1: Teste que falha** — `tests/theme.test.mjs` com `node:test` + `node:assert/strict`:
  - `normalizeTheme('light') === 'light'`; `normalizeTheme('dark') === 'dark'`; `normalizeTheme(null) === 'dark'`; `normalizeTheme('blue') === 'dark'`.
  - `revealRadius(0, 0, 300, 400) === 500`; `revealRadius(300, 400, 300, 400) === 500`; `revealRadius(150, 200, 300, 400) === 250`.
  - `THEME_KEY === 'upvalor_theme'`.
- [ ] **Step 2:** `node --test tests/theme.test.mjs` → FAIL (módulo inexistente).
- [ ] **Step 3: Implementar `lib/theme/theme.js` e `palette.js`.**
- [ ] **Step 4:** `node --test tests/theme.test.mjs` → PASS.
- [ ] **Step 5: `app/globals.css`.** Manter `@import "tailwindcss";`. Vars escuro em `:root, [data-theme="dark"]` (+ `color-scheme: dark`), claro em `[data-theme="light"]` (+ `color-scheme: light`), `--uv-shadow`, `--uv-nav`. `@theme inline { --color-bg: var(--uv-bg); ... --font-sans: var(--font-geist-sans); --font-mono: var(--font-geist-mono); }` para os 14 tokens. `body { background: var(--uv-bg); color: var(--uv-fg); font-family: var(--font-geist-sans), system-ui, sans-serif; }` (remover Arial e o bloco antigo `prefers-color-scheme`/`--background` se `grep -n "bg-background\|text-foreground" app` não achar uso). `.uv-card { background: var(--uv-surface); border: 1px solid var(--uv-line); border-radius: 16px; box-shadow: var(--uv-shadow); }`, `.uv-num { font-variant-numeric: tabular-nums; }`, `@keyframes uv-enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }`, `.uv-enter { animation: uv-enter 220ms cubic-bezier(0.22,1,0.36,1) both; animation-delay: var(--uv-delay, 0ms); }`. View transition: `::view-transition-old(root), ::view-transition-new(root) { animation: none; mix-blend-mode: normal; }` e `::view-transition-new(root) { z-index: 2; }`. `@media (prefers-reduced-motion: reduce) { .uv-enter { animation: none; } *, *::before, *::after { scroll-behavior: auto !important; } }`. Scrollbar com `var(--uv-line)`/`var(--uv-line-strong)`.
- [ ] **Step 6: `ThemeProvider` + `ThemeToggle`.** `toggleTheme(originEl)`: se `transitionRef.current` ativo → return (sem acumular). `next = theme === 'dark' ? 'light' : 'dark'`. `apply = () => { document.documentElement.dataset.theme = next; localStorage.setItem(THEME_KEY, next) (try/catch); flushSync(() => setTheme(next)); }`. Se `!document.startViewTransition` ou `matchMedia('(prefers-reduced-motion: reduce)').matches` ou sem `originEl` → `apply()` e return. Senão: centro `x,y` do `getBoundingClientRect()` do botão; `r = revealRadius(x, y, innerWidth, innerHeight)`; `const t = document.startViewTransition(apply)`; `transitionRef.current = t`; `t.ready.then(() => document.documentElement.animate({ clipPath: [\`circle(0px at ${x}px ${y}px)\`, \`circle(${r}px at ${x}px ${y}px)\`] }, { duration: 450, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' }))`; `t.finished.finally(() => { transitionRef.current = null; })`. Foco permanece no botão (DOM não remonta).
- [ ] **Step 7: `app/layout.tsx`.** No `<head>`: `<script dangerouslySetInnerHTML={{ __html: "(function(){try{var t=localStorage.getItem('upvalor_theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark')}catch(e){document.documentElement.setAttribute('data-theme','dark')}})();" }} />`. Envolver `{children}` com `<ThemeProvider>`. Não alterar os outros Scripts/metadata.
- [ ] **Step 8:** `npx eslint app/globals.css app/layout.tsx lib/theme app/components/theme` sem erros novos; `node --test tests/` PASS.
- [ ] **Step 9: Commit** `feat(theme): tokens claro/escuro, ThemeProvider e toggle com revelação circular`.

---

### Task 2: Lógica pura do Painel (formatação, período, dados de gráficos)

**Files:**
- Create: `lib/dashboard/format.js`, `lib/dashboard/period.js`, `lib/dashboard/chartData.js`
- Test: `tests/format.test.mjs`, `tests/period.test.mjs`, `tests/chartData.test.mjs`

**Interfaces:**
- Produces:
  - `format.js`: `formatMoney(value)` e `formatDate(d)` e `parseDescValues(desc)` com comportamento idêntico a `app/page.jsx:15-30` e `:211-218` (copiar); `parseInstallment(desc: string|null): string|null` (regex `/\((\d+)\s*\/\s*(\d+)\)/` → `"1/12"`); `parseLocalDate(value: string|Date|null): Date|null` (pega a parte `YYYY-MM-DD` antes de `T` ou espaço, retorna `new Date(y, m-1, d, 12)`; inválido → `null`; `Date` válido → mesmo dia ao meio-dia local).
  - `period.js`: `PERIOD_FILTERS = ['Semanal','Mensal','Trimestral']`; tipo `Period = { filter: string, year: number, month: number /*0-11*/, weekStart: string|null /*'YYYY-MM-DD' domingo*/ }`; `createPeriod(today: Date): Period` (Mensal, mês de hoje, weekStart null); `setPeriodFilter(p: Period, filter: string, today: Date): Period`; `shiftPeriod(p: Period, dir: 1|-1, today: Date): Period`; `isDateInScope(dateVal, p: Period, today: Date): boolean`; `getPeriodLabel(p: Period, today: Date): string`; `isCurrentPeriod(p: Period, today: Date): boolean`.
  - `chartData.js`: `buildChartData(receivables, empPayments, { months = 6, today = new Date() } = {}): Array<{ key: string /*'2026-10'*/, label: string /*'Out'*/, fullLabel: string /*'Outubro 2026'*/, gestao: number|null, trafego: number|null, folha: number|null }>`.
- Regras (do spec, seção Período e Gráficos): Semanal = domingo–sábado inclusivo; entrar em Semanal → semana de hoje se `year/month` = mês de hoje, senão semana que contém o dia 1; `shiftPeriod` Semanal ±7 dias e sincroniza `year/month` = mês de hoje se a semana contém hoje, senão mês do sábado; Trimestral ±3 meses; Mensal ±1 mês; sair de Semanal → `weekStart: null` mantendo `year/month`. Rótulos: Mensal `"Outubro 2026"`, Trimestral `"4º Trimestre 2026"`, Semanal `"Semana Atual"` ou `"25/10 – 31/10/2026"` (en dash com espaços; ano só no fim). `isCurrentPeriod`: período contém hoje. Gráficos: somas de cobranças `status === 'Pago'` por mês de vencimento (parse de gestão/tráfego; sem padrão → `amount` inteiro em gestão), folha = todos os pagamentos por mês de vencimento, valores arredondados a centavos; meses anteriores ao mês do primeiro vencimento existente da fonte (cobranças em qualquer status para gestão/tráfego; pagamentos para folha) = `null`; sem registros na fonte → todos `null`; nomes de meses `MONTHS_PT` de `app/page.jsx:155`.

- [ ] **Step 1: Testes que falham.** `today = new Date(2026, 9, 24, 12)` (sábado).
  - `format.test.mjs`: `formatDate('2026-10-05T03:00:00.000Z') === '05/10/2026'`; `formatDate(null) === '—'`; `formatMoney(1234.5)` igual a `new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(1234.5)`; `parseDescValues('Gestão: R$500.00 | Tráfego: R$800.00 (1/12)')` deep-equals `{ gestao: 500, trafego: 800 }`; `parseInstallment('Gestão: R$1 | Tráfego: R$2 (3/12)') === '3/12'`; `parseInstallment('Salário') === null`; `parseLocalDate('2026-08-01').getMonth() === 7`; `parseLocalDate('2026-08-01 10:00:00').getDate() === 1`; `parseLocalDate('lixo') === null`.
  - `period.test.mjs`:
    - `setPeriodFilter(createPeriod(today),'Semanal',today).weekStart === '2026-10-18'`; label `'Semana Atual'`; `isCurrentPeriod` true.
    - `shiftPeriod(semanaAtual, 1, today)` → `weekStart '2026-10-25'`, `month 9`, label `'25/10 – 31/10/2026'`, `isCurrentPeriod` false; de novo `+1` → `'2026-11-01'`, `month 10`; `-1` a partir da atual → `'2026-10-11'`.
    - `{ filter:'Semanal', year:2026, month:11, weekStart:'2026-12-27' }` `+1` → `weekStart '2027-01-03'`, `year 2027`, `month 0`; label de `'2026-12-27'` = `'27/12 – 02/01/2027'`.
    - `setPeriodFilter({ filter:'Mensal', year:2026, month:11, weekStart:null }, 'Semanal', today).weekStart === '2026-11-29'` e `month === 11`.
    - Escopo semana atual: `'2026-10-18'` true, `'2026-10-24'` true, `'2026-10-25'` false, `'2026-10-17'` false, `'2026-10-20T03:00:00.000Z'` true.
    - Trimestral: de Mensal out/2026 → `setPeriodFilter(...,'Trimestral')` label `'4º Trimestre 2026'`; `+1` → `year 2027, month 0`, label `'1º Trimestre 2027'`; `-1` (a partir de out/2026) → `month 6`, `'3º Trimestre 2026'`; `isCurrentPeriod` de Trimestral nov/2026 = true; escopo trimestral 4º/2026: `'2026-12-31'` true, `'2026-09-30'` false.
    - Mensal: `shiftPeriod({filter:'Mensal',year:2026,month:0,weekStart:null}, -1, today)` → `year 2025, month 11`; label `'Dezembro 2025'`; escopo mensal out/2026 `'2026-10-01'` true, `null` false, `'abc'` false.
    - Sair de Semanal: `setPeriodFilter(semanaSeguinte,'Mensal',today)` → `weekStart null`, `month 9`.
  - `chartData.test.mjs`: com `today`:
    - Arrays vazios → 6 itens, keys `'2026-05'..'2026-10'`, labels `['Mai','Jun','Jul','Ago','Set','Out']`, `fullLabel` do último `'Outubro 2026'`, todas as séries `null`.
    - Cobranças `[{status:'Pendente', due_date:'2026-06-10', amount:'100', description:'x'}, {status:'Pago', due_date:'2026-08-01', amount:'300', description:'Gestão: R$100.00 | Tráfego: R$200.00 (1/12)'}, {status:'Pago', due_date:'2026-09-15T03:00:00.000Z', amount:'50.5', description:'Cobrança'}]` → mai: gestao/trafego `null`; jun e jul: `0`; ago: `gestao 100, trafego 200`; set: `gestao 50.5, trafego 0`.
    - Pagamentos `[{status:'Pago', due_date:'2026-09-05', amount:'1000'}, {status:'Pendente', due_date:'2026-10-05', amount:'1200.25'}]` → folha mai..ago `null`, set `1000`, out `1200.25`.
- [ ] **Step 2:** `node --test tests/` → FAIL (módulos inexistentes).
- [ ] **Step 3: Implementar `format.js`, `period.js`, `chartData.js`.** Datas sempre via `parseLocalDate`; formatar `weekStart` com componentes locais (nunca `toISOString`).
- [ ] **Step 4:** `node --test tests/` → todos PASS.
- [ ] **Step 5: Commit** `feat(dashboard): lógica pura de período, formatação e dados de gráficos com testes`.

---

### Task 3: Componentes do Painel

**Files (somente criação):**
- `app/components/ui/StatusBadge.jsx`
- `app/components/dashboard/PeriodControls.jsx`, `FinanceKpis.jsx`, `OperationalStrip.jsx`, `DueListPanel.jsx`, `HistoryCharts.jsx`, `RecentTransactions.jsx`, `LoadErrorBanner.jsx`, `DashboardPanel.jsx`

**Interfaces:**
- Consumes: tokens/classes da Task 1; `useTheme` (`app/components/theme/ThemeProvider.jsx`); `CHART_PALETTE` (`lib/theme/palette.js`); `formatMoney`, `formatDate` (`lib/dashboard/format.js`); `PERIOD_FILTERS` (`lib/dashboard/period.js`); formato de `buildChartData` (Task 2).
- Produces (todas `'use client'`, export default salvo indicado):
  - `StatusBadge({ status })`: `Pago` → `bg-pos/10 text-pos border-pos/20`; `Pendente` (e desconhecido) → `bg-accent/10 text-accent-fg border-accent/20`; `Atrasado` → `bg-neg/10 text-neg border-neg/20`; texto = status; `text-xs font-medium px-2.5 py-0.5 rounded-full border`.
  - `PeriodControls({ filter, label, isCurrent, onFilterChange, onShift })`: grupo segmentado com `role="group" aria-label="Período"`, botões `aria-pressed`; navegador com botões `aria-label` "Período anterior"/"Próximo período", rótulo `aria-live="polite"`, badge "Previsão" quando `!isCurrent`. Largura do rótulo estável (`min-w-[11rem] text-center`).
  - `FinanceKpis({ kpis })`: usa `kpis.saldo, gestaoRecebido, trafegoRecebido, totalAReceber, gestaoAReceber, trafegoAReceber, folhaMes`. Grid `grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4`; Saldo `md:col-span-2 lg:col-span-6` (tingido: `bg-gradient-to-br from-accent/20 via-accent/5 to-transparent` sobre `.uv-card`, valor `text-4xl lg:text-[44px] font-semibold tracking-tight uv-num`, detalhe com rótulo exato "Recebido no período" e linhas "Gestão" (`text-pos`) / "Tráfego" (`text-traffic`)); "Total a Receber" `lg:col-span-3` com detalhe "Gestão"/"Tráfego"; "Folha do Mês" `lg:col-span-3` sem detalhe. Títulos 14px `text-muted`, valores secundários `text-2xl lg:text-[28px] uv-num`. Cards não clicáveis (sem hover de elevação/cursor).
  - `OperationalStrip({ active, expired, totalClients })`: um `.uv-card` com 3 segmentos `grid grid-cols-3 divide-x divide-line`; cada um ícone (`CheckCircle2` pos / `AlertCircle` neg / `Users` muted) + número `text-2xl font-semibold uv-num` + rótulo ("Contratos Ativos", "Vencidos", "Total de Clientes") `text-[13px] text-muted`.
  - `DueListPanel({ title, icon: Icon, iconClass, periodLabel, items, amountClass, actionLabel, actionClass, canAct, onAction, emptyText, initialLimit = 6 })` — `items: Array<{ id, name, detail, installment, dueDate, status, amount }>`; `onAction(id): Promise<void>`. `.uv-card` com cabeçalho (ícone, título 16px semibold, `periodLabel` `text-subtle`, contador `"{n} itens"`/`"1 item"`), lista `<ul>` sem altura máxima; linha = grid `grid-cols-[minmax(0,1fr)_auto]`: esquerda nome (`truncate font-medium text-fg`, `title`), detalhe (`truncate text-sm text-muted`, `title`), meta (`StatusBadge`, "Vence {formatDate}" `text-subtle text-[13px]`, chip "Parcela {installment}" quando houver); direita coluna `items-end`: valor `uv-num font-semibold {amountClass}` e, se `canAct`, botão `w-[88px] h-8` com `actionLabel`. Estado pendente por id (`Set` em `useState`/ref): botão `disabled aria-busy="true"` com texto "Aguarde…" enquanto `onAction(id)` não resolve; segundo clique no mesmo id ignorado antes de chamar `onAction` (checar ref síncrona); `finally` libera. `items.length > initialLimit` → mostra `initialLimit` e botão "Mostrar todos ({n})" / "Mostrar menos" (`aria-expanded`). Vazio → `<p>` com `emptyText`.
  - `HistoryCharts({ data })`: 3 cards (`lg:grid-cols-3`), títulos exatos "Gestão recebida" (`pos`), "Tráfego recebido" (`traffic`), "Folha (paga + pendente)" (`warn`); subtítulo "Últimos 6 meses · por vencimento". Recharts `BarChart` altura 160, `XAxis dataKey="label"`, `YAxis` com `k`, cores de `CHART_PALETTE[theme]`, `Tooltip content` custom: `fullLabel`, nome da série, `formatMoney(v)` ou "Sem dados" se `null`. `isAnimationActive={!reduced}` (`useReducedMotion` do framer-motion), `animationDuration={400}`. Wrapper `role="img"` + `aria-label` "{título}, últimos 6 meses" e `<table className="sr-only">` com mês/valor ("Sem dados" para null).
  - `RecentTransactions({ transactions })`: até 5 primeiras; sinal + cor (`text-pos` entrada / `text-neg` saída) + rótulo textual "Entrada"/"Saída"; vazio "Nenhuma transação registrada.".
  - `LoadErrorBanner({ onRetry })`: `role="alert"`, texto exato "Não foi possível carregar todos os dados. Os valores podem estar incompletos.", botão "Tentar novamente".
  - `DashboardPanel(props)` com props `{ kpis, period, periodLabel, isCurrent, onFilterChange, onShift, receivableItems, paymentItems, onReceive, onPay, chartData, transactions, contracts: { active, expired, totalClients }, loadError, onRetry }`. Estrutura: (banner se `loadError`) → grupo 1 cabeçalho: `<h1>` "Painel" `text-2xl md:text-[28px] font-semibold` + subtítulo `periodLabel` + `PeriodControls` em `flex flex-wrap items-end justify-between gap-4` → grupo 2 `FinanceKpis` → grupo 3 `OperationalStrip` → grupo 4 `grid lg:grid-cols-2 gap-4` com `DueListPanel` "A Receber"/"Previsão" + " — {periodLabel}" conforme `isCurrent` (ícone `TrendingUp` pos, valor `text-pos`, ação "Receber" `accent`) e "A Pagar aos Funcionários" (ícone `Briefcase` warn, valor `text-neg`, ação "Pagar" `warn`), empty texts "Nenhuma cobrança neste período." / "Nenhum pagamento neste período." → grupo 5 `HistoryCharts` + `RecentTransactions`. Cada grupo com `className="uv-enter"` e `style={{ '--uv-delay': \`${i*35}ms\` }}` (i = 0..4). Espaçamento vertical `space-y-6`.
  - Botões: `transition-colors duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60`. Botão de ação "Receber": `border border-accent/30 text-accent-fg hover:bg-accent/10`; "Pagar": `border border-warn/30 text-warn hover:bg-warn/10`.

- [ ] **Step 1:** Implementar `StatusBadge` e componentes folha (`PeriodControls`, `FinanceKpis`, `OperationalStrip`, `DueListPanel`, `HistoryCharts`, `RecentTransactions`, `LoadErrorBanner`).
- [ ] **Step 2:** Implementar `DashboardPanel`.
- [ ] **Step 3:** `npx eslint app/components/ui app/components/dashboard` → 0 erros.
- [ ] **Step 4: Commit** `feat(painel): componentes da nova composição do Painel`.

(Sem infraestrutura de teste de componentes no projeto; o comportamento é verificado na Task 6 no navegador. A trava por id é verificada lá com clique duplo.)

---

### Task 4: Tokenizar cores dos outros módulos em `app/page.jsx`

**Files:**
- Modify: `app/page.jsx` — SOMENTE: `inputClass` (linha ~144), bloco Clientes (`{activeTab === 'clientes' && (` ~1018) até o fim do arquivo (Funcionários, Fluxo, Admin, Modais), e a linha raiz `<div className="min-h-screen bg-[#0f1117] text-slate-200 ...">` (~773).
- NÃO tocar: linhas 1–143 e 145–772 exceto `inputClass` (login, `LiquidCanvas`, `HoverEffect`, `StatusBadge`, lógica), cabeçalho/nav (774–815), bloco do Painel (817–1015).

**Interfaces:**
- Consumes: utilitários de token da Task 1; `CHART_PALETTE` + `useTheme` se houver gráfico Recharts nos módulos escopados.
- Produces: `const loginInputClass` = valor ATUAL de `inputClass` (string idêntica), usado pelos inputs do login (linhas ~730–739); `inputClass` tokenizado: `"w-full bg-surface-2 border border-line-strong text-fg placeholder:text-subtle rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent"`.

Mapeamento (só cor; nunca mudar layout, espaçamento, tamanhos, estrutura ou textos):

| de | para |
|---|---|
| `bg-[#0f1117]` | `bg-bg` |
| `bg-[#151821]` (qualquer opacidade) | `bg-surface` |
| `bg-[#1e293b]`, `bg-slate-800`, `bg-slate-800/50`, `bg-slate-900*` | `bg-surface-2` |
| `bg-white/N`, `bg-white/[0.0N]`, `hover:bg-white/N` | `bg-fg/N` (mesma opacidade) |
| `border-white/5`, `border-white/[0.05]`, `divide-white/5` | `border-line` / `divide-line` |
| `border-white/10`, `border-slate-700`, `border-slate-800` | `border-line-strong` |
| `text-white`, `text-slate-100/200/300`, `hover:text-white` | `text-fg`, `hover:text-fg` — EXCETO texto sobre fundo sólido de cor (`bg-blue-600`, `bg-rose-600`, gradientes), que permanece `text-white` |
| `text-slate-400` | `text-muted` |
| `text-slate-500`, `text-slate-600` | `text-subtle` |
| `*-emerald-*` (400/500, com /N) | `*-pos` (com /N) |
| `*-rose-*`, `*-red-*` | `*-neg` |
| `*-orange-*` | `*-warn` |
| `*-purple-*` | `*-traffic` |
| `text-blue-400/300` | `text-accent-fg`; `bg-blue-500/N`, `border-blue-500/N` → `bg-accent/N`, `border-accent/N`; `bg-blue-600 hover:bg-blue-500` → `bg-accent hover:bg-accent/90`; `ring-blue-500` → `ring-accent` |
| `style={{ colorScheme: 'dark' }}` | remover a prop (globals define `color-scheme`) |
| hex inline em `style` (`'#10b981'`, `'#f43f5e'`…) | `var(--uv-pos)`, `var(--uv-neg)` etc. |
| `shadow-blue-500/20` | `shadow-accent/20` |

`bg-black/N` de overlays de modal permanece.

- [ ] **Step 1:** Criar `loginInputClass` com o valor atual e trocar os inputs do login para ele; tokenizar `inputClass`.
- [ ] **Step 2:** Aplicar o mapeamento no escopo permitido.
- [ ] **Step 3: Verificação.** PowerShell: `$l = Get-Content app/page.jsx; $l[1015..($l.Count-1)] | Select-String -Pattern '#151821|#0f1117|slate-|white/|emerald-|rose-|orange-|purple-|blue-[345]00|colorScheme'` → nenhuma ocorrência, salvo `text-white` sobre fundo sólido (listar cada sobra no relatório com justificativa). `npx eslint app/page.jsx` sem erros novos (comparar com `git stash`-free: rodar antes e depois e anexar contagens).
- [ ] **Step 4: Commit** `refactor(theme): tokeniza cores de Clientes, Funcionários, Fluxo, Admin e modais`.

---

### Task 5: Integração no `app/page.jsx` + cabeçalho global

**Files:**
- Create: `app/components/AppHeader.jsx`
- Modify: `app/page.jsx`

**Interfaces:**
- Consumes: tudo das Tasks 1–3; `inputClass`/`loginInputClass` da Task 4.
- Produces: `AppHeader({ navItems, activeTab, onTabChange, userName, onLogout })` (`'use client'`).

- [ ] **Step 1: `AppHeader`.** `<header className="sticky top-0 z-40 border-b border-line backdrop-blur-xl" style={{ background: 'var(--uv-nav)' }}>`, container `max-w-7xl mx-auto px-3 md:px-8 h-16 flex items-center justify-between gap-3`. Esquerda: `<img src="/logo.png" alt="UpValor" width="112" height="32" className="h-8 w-auto">`. Centro (≥ md): `<nav aria-label="Principal">` cápsula `rounded-full border border-line bg-fg/[0.04] p-1 flex gap-1`; cada item `<button aria-current={active ? 'page' : undefined}>` `px-4 h-9 rounded-full text-sm font-medium transition-colors duration-150`, ativo `text-white`, inativo `text-muted hover:text-fg`; indicador `motion.span layoutId="navPill"` `absolute inset-0 rounded-full bg-accent` com `transition={{ type: 'tween', duration: 0.18, ease: [0.22, 1, 0.36, 1] }}`. Direita: `ThemeToggle`, nome do usuário (`text-sm font-medium text-fg max-w-[10rem] truncate hidden sm:block`), botão sair (`aria-label="Sair do sistema"`, `LogOut`, hover `text-neg`). < md: a mesma nav renderizada em cápsula fixa `fixed bottom-4 left-1/2 -translate-x-1/2 z-50` só com ícones (`aria-label={item.label}`), mesmo indicador (layoutId distinto `navPillMobile`).
- [ ] **Step 2: Período.** Trocar `periodFilter/selectedYear/selectedMonth/navigateMonth/isCurrentMonth` por `const [period, setPeriod] = useState(() => createPeriod(new Date()))`; `const now = new Date()`; `isCurrent = isCurrentPeriod(period, now)`; `periodLabel = getPeriodLabel(period, now)`; `onFilterChange = f => setPeriod(p => setPeriodFilter(p, f, new Date()))`; `onShift = d => setPeriod(p => shiftPeriod(p, d, new Date()))`. Em `kpis`, `pendingReceivables`, `pendingEmpPayments`: `isDateInScope(date, period, now)` (o resto das fórmulas idêntico); deps do `useMemo` = `[receivables, empPayments, transactions, clients, period]`. Garantir que nada mais use os nomes removidos (`grep`).
- [ ] **Step 3: Limpeza.** Importar `formatMoney`, `formatDate`, `parseDescValues`, `parseInstallment` de `lib/dashboard/format.js`, `buildChartData` de `lib/dashboard/chartData.js`, `StatusBadge` de `app/components/ui/StatusBadge.jsx`; remover as definições locais equivalentes, `HoverEffect`, `MONTHS_PT/getMonthLabel/getPeriodLabel/isDateInScope` locais, `kpiItems`, `neonColor` e imports não usados.
- [ ] **Step 4: Ações e erro.** `markReceivableAsPaid` e `markEmpPaymentAsPaid`: `loadData()` → `await loadData()` (requisições inalteradas). `loadData`: `safeFetch` retorna `true/false`; após `Promise.allSettled`, `setLoadError(results.some(r => r.status === 'rejected' || r.value === false))` (novo `useState(false)`).
- [ ] **Step 5: Render.** Raiz autenticada envolvida por `<MotionConfig reducedMotion="user">`; `<AppHeader .../>` substitui a pílula fixa de usuário e a nav antiga; `<main className="max-w-7xl mx-auto px-3 md:px-8 pt-6 md:pt-8 pb-28 md:pb-12 space-y-6 md:space-y-8">`. A linha de título genérica (h1 + botões Novo Cliente/Novo Funcionário/Nova Transação) passa a renderizar só quando `activeTab !== 'painel'` (tokenizar suas cores com o mapeamento da Task 4). O bloco `activeTab === 'painel' && isClient` vira `<DashboardPanel key="painel" ... />` com: `receivableItems = pendingReceivables.map(r => ({ id: r.id, name: r.client_name, detail: r.description, installment: parseInstallment(r.description), dueDate: r.due_date, status: r.status, amount: r.amount }))`, `paymentItems = pendingEmpPayments.map(p => ({ id: p.id, name: p.employee_name, detail: [p.employee_role, p.description].filter(Boolean).join(' · '), installment: parseInstallment(p.description), dueDate: p.due_date, status: p.status, amount: p.amount }))`, `onReceive = id => markReceivableAsPaid(receivables.find(r => r.id === id))`, `onPay = id => markEmpPaymentAsPaid(empPayments.find(p => p.id === id))`, `chartData = buildChartData(receivables, empPayments, { months: 6, today: now })`, `contracts = { active: kpis.contratosAtivos, expired: kpis.contratosVencidos, totalClients: clients.filter(c => c.contract_status !== 'Cancelado').length }`, `canAct` via `isCurrent`, `loadError`, `onRetry = loadData`.
- [ ] **Step 6: Verificação.** `node --test tests/` PASS; `npx eslint app/page.jsx app/components` sem erros novos; `npm run dev` sobe e `GET /` responde 200 (parar o servidor depois).
- [ ] **Step 7: Commit** `feat(painel): integra nova composição, cabeçalho global e navegação de período`.

---

### Task 6: Validação no navegador (controller)

**Files:** nenhum código de produto. Artefatos em `<artifact dir>`: screenshots e `storyboard_implementado.png`.

- [ ] **Step 1:** Backup `database/local-db.json` → `database/local-db.backup-redesign.json`. Subir `npm run dev`.
- [ ] **Step 2:** Criar usuário de teste via `/api/register` e dados via API: 1 cliente com nome de 80+ caracteres, ≥ 14 cobranças no mês atual, cobranças em semanas diferentes, 3 funcionários com pagamentos pendentes, transações de entrada/saída.
- [ ] **Step 3:** Playwright: login; navegação entre abas; Semanal/Mensal/Trimestral; ‹ › em cada modo (rótulos e listas coerentes); "Mostrar todos"; clique duplo em Receber e em Pagar → contar transações via `/api/transactions` (aumenta exatamente 1 por ação); estados vazios (período futuro distante); erro (bloquear `/api/transactions` via route → banner); tema claro/escuro com screenshot no meio da revelação; reload preserva tema sem animação; `emulateMedia({ reducedMotion: 'reduce' })` → troca instantânea; viewports 1366×768, 1920×1080, 768×1024, 390×844 sem `document.documentElement.scrollWidth > innerWidth`; console sem erros; abas Clientes/Funcionários/Fluxo abrem em ambos os temas.
- [ ] **Step 4:** Parar o servidor, restaurar o backup do JSON e apagar o backup.
