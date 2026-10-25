# Redesign do Painel (tela piloto) + temas claro/escuro — Design

## Intenção
Evoluir o visual do Painel do UpValor (Next.js 16 / React 19 / Tailwind v4, app em `app/page.jsx`) com hierarquia, proporção, tipografia, espaçamento e movimento melhores, inspirado na referência "Dashboard V16" (navegação em cápsula, grade assimétrica, indicador principal destacado, painéis com cabeçalho, gráficos integrados, entrada progressiva, revelação circular de tema). Preservar dados, cálculos, regras e fluxos reais. O usuário valida visualmente antes de qualquer redesign de layout dos outros módulos.

## Fatos do código (verificados)
- App inteiro em um componente client `app/page.jsx` (1409 linhas); estado local com `useState`; dados via `fetch` em `/api/*` (`loadData`, `safeFetch` engole erros e grava `[]`). Dev usa `USE_LOCAL_DB=true` → `database/local-db.json` (gitignored).
- Abas: `painel`, `clientes`, `funcionarios`, `fluxo`, `admin` (só role admin). Nav fixa embaixo no mobile / topo no desktop com `motion.div layoutId="lampNav"`; nome do usuário + sair fixos no canto.
- Período: `periodFilter` (`Semanal|Mensal|Trimestral`), `selectedYear`, `selectedMonth`; `isDateInScope`, `getPeriodLabel`. Setas chamam `navigateMonth(±1)` em qualquer modo.
- KPIs (`kpis` useMemo): `saldo` = Σ entradas − Σ saídas de TODAS as transações (não é do período); `gestaoRecebido/trafegoRecebido` = recebidos no período; `totalAReceber = gestaoAReceber + trafegoAReceber` (parse de "Gestão: R$x | Tráfego: R$y" na descrição); `folhaMes` = pagamentos Pendentes no período; `contratosAtivos`, `contratosVencidos`; Total de Clientes = clientes não Cancelados.
- Listas: `pendingReceivables` (não pagas, no período, sem clientes cancelados), `pendingEmpPayments` (Pendentes no período). Botões "Receber"/"Pagar" só aparecem quando `isCurrentMonth`; executam `markReceivableAsPaid` / `markEmpPaymentAsPaid` (PUT status Pago + POST transação) sem confirmação e sem trava; `loadData()` não é aguardado.
- Gráficos existentes (`buildChartData`, últimos 6 meses a partir de hoje, por vencimento): "Faturamento Gestão" (gestão recebida), "Custo Tráfego" (na verdade tráfego RECEBIDO de cobranças pagas — rótulo errado), "Gasto com Pessoal" (todos os pagamentos, qualquer status). Usa `new Date('YYYY-MM-DD')` (UTC) → dia 1 cai no mês anterior em UTC−3. Meses sem registro viram 0.
- Bloco "Últimas Transações" (5 mais recentes) no Painel.
- Não existe tema claro; cores hardcoded (`bg-[#0f1117]`, `bg-[#151821]`, `text-white`, `slate-*`, `white/5`…). Body usa Arial apesar de Geist carregado. Login tem visual próprio (canvas líquido, escuro fixo).

## Decisões do usuário
1. Tema: remover cores fixas do código e funcionar em claro e escuro no app inteiro (troca apenas de cores nos outros módulos; layout deles intacto).
2. Saldo Atual: manter cálculos; o detalhamento passa a ter rótulo "Recebido no período · Gestão / Tráfego".
3. Gráficos: manter os 3 separados, corrigindo rótulos e visual.
4. Pagar/Receber: desabilitar o botão enquanto a ação está em andamento; sem confirmação.
5. Setas de período: Semanal avança/volta 1 semana; Trimestral avança/volta 1 trimestre; Mensal 1 mês.

## Objetivos
- Painel com nova composição (abaixo), tokens de tema, movimento definido, acessível e responsivo (1366×768, 1920×1080, 768, 390), sem rolagem horizontal da página.
- Tema claro + escuro (escuro é o padrão), persistido, com revelação circular de 450 ms.
- Navegação de período correta por modo.
- Sem transações duplicadas por clique duplo.

## Não-objetivos / anti-objetivos
- Não alterar cálculos de KPIs, regras de contratos, vencimentos, folha, pagamentos, recebimentos, autenticação, permissões, APIs ou persistência.
- Não redesenhar layout de Clientes/Funcionários/Fluxo/Admin/Modais (só cores via tokens).
- Não adicionar dependências, metas, percentuais, previsões ou séries inventadas; não animar contagem de valores financeiros.
- Não usar imagens da referência; não copiar verde‑limão, nomes ou dados dela. Sem deploy.

## Sistema visual (tokens — nomes fixos)
CSS vars em `app/globals.css`, escuro em `:root, [data-theme="dark"]`, claro em `[data-theme="light"]`; expostas ao Tailwind via `@theme inline` como `--color-<nome>`:

| token | escuro | claro | uso |
|---|---|---|---|
| bg | #0f1117 | #f4f6fb | fundo da página |
| surface | #151821 | #ffffff | cards |
| surface-2 | #1c202b | #eef1f7 | superfícies internas, hover, inputs |
| line | rgba(255,255,255,0.07) | #e2e7f0 | bordas |
| line-strong | rgba(255,255,255,0.14) | #cbd3e1 | bordas de hover/inputs |
| fg | #f1f5f9 | #0f172a | texto principal |
| muted | #a7b0c0 | #475569 | texto secundário |
| subtle | #8c96a9 | #5f6b7d | datas, descrições, rótulos terciários |
| accent | #3b82f6 | #2563eb | azul da marca (ações, seleção; status Pendente usa accent/accent-fg, como hoje) |
| accent-fg | #7fb0ff | #1d4ed8 | texto azul sobre superfície |
| pos | #34d399 | #047857 | entrada / Pago / Gestão / Ativo |
| neg | #fb7185 | #be123c | saída / Atrasado / Vencido |
| warn | #fb923c | #c2410c | folha / funcionários / Pagar |
| traffic | #c084fc | #7e22ce | Tráfego |

Mais: `--uv-shadow` (escuro: `0 1px 0 rgba(255,255,255,.03) inset, 0 12px 32px -18px rgba(0,0,0,.7)`; claro: `0 1px 2px rgba(15,23,42,.05), 0 12px 32px -20px rgba(15,23,42,.22)`), `--uv-nav` (escuro `rgba(12,14,20,.86)`, claro `rgba(255,255,255,.88)`), `color-scheme` coerente. Body com Geist (`var(--font-geist-sans)`).
Utilitários/classes: `.uv-card` (bg surface, 1px line, raio 16px, sombra), `.uv-num` (`font-variant-numeric: tabular-nums`), `.uv-enter` (entrada, ver Movimento), foco visível `focus-visible:ring-2 ring-accent/60 ring-offset-0`.
Espaçamento 4/8/12/16/24/32; raio de cards 16px, controles 10–12px, cápsulas full; texto operacional 14–16px; títulos de seção 16–18px semibold; título da página 24–28px.
Gráficos usam paleta JS por tema (mesmos valores da tabela) porque atributos SVG do Recharts não resolvem `var()` de forma confiável.

## Composição do Painel
1. **Cabeçalho global (todas as abas, estável, sem animação de entrada)**: logo (`/logo.png`) à esquerda; cápsula de navegação ao centro (Painel, Clientes, Funcionários, Fluxo, [Admin]) com indicador ativo que desliza (`layoutId`, ~180 ms); à direita botão de tema + nome do usuário + sair. Sticky no topo. < md: nav em cápsula fixa embaixo só com ícones + `aria-label` (comportamento atual), topo com logo, tema e perfil. `aria-current="page"` no item ativo.
2. **Faixa de título + período**: h1 "Painel" + rótulo do período; à direita controle segmentado Semanal/Mensal/Trimestral (`aria-pressed`) e navegador ‹ período › com badge "Previsão" quando o período não contém hoje. Quebra de linha sem sobreposição.
3. **Indicadores financeiros** (grid 12 col em lg): Saldo Atual `lg:col-span-6` (card de destaque com fundo tingido de azul, valor 36–44px, detalhe "Recebido no período · Gestão / Tráfego"); Total a Receber `lg:col-span-3` (detalhe Gestão/Tráfego a receber); Folha do Mês `lg:col-span-3` (sem detalhe). md: Saldo largura total + 2 colunas. Valores com `.uv-num`, mesmo `formatMoney`.
4. **Faixa operacional**: um card compacto com 3 segmentos divididos (Contratos Ativos, Vencidos, Total de Clientes), número 22–24px, rótulo 13–14px, ícone + texto (não só cor). Não clicável.
5. **Recebimentos e pagamentos**: lg 2 colunas ("A Receber — período"/"Previsão — período" e "A Pagar aos Funcionários"), empilhados abaixo de lg. Cabeçalho do painel: ícone, título, rótulo do período, contagem de itens. Linha: nome (truncado com `title`), descrição/categoria (receivable: `description`; pagamento: `employee_role · description`), chip de parcela quando a descrição tiver `(n/m)`, vencimento, `StatusBadge` (texto + cor), valor alinhado à direita com `.uv-num`, ação com largura fixa. Mostra 6 linhas; se houver mais, botão "Mostrar todos (N)" / "Mostrar menos" — nada escondido silenciosamente, sem rolagem interna. Estados vazios: "Nenhuma cobrança neste período." / "Nenhum pagamento neste período.".
6. **Gráficos (3 cards, lg 3 colunas)**: títulos corrigidos "Gestão recebida", "Tráfego recebido", "Folha (paga + pendente)"; subtítulo "Últimos 6 meses · por vencimento". Tooltip com mês/ano, série e valor em BRL. Meses anteriores ao primeiro registro existente da série = `null` (sem barra, tooltip "Sem dados"); meses depois disso sem registros = R$ 0,00 (soma real vazia). Datas parseadas em horário local. Cada gráfico tem `role="img"` + `aria-label` e tabela `sr-only` com os valores.
7. **Últimas Transações**: mantida (5 mais recentes), restilizada com tokens.
8. **Aviso de erro de carregamento**: se algum `/api/*` falhar no `loadData`, banner no topo do Painel "Não foi possível carregar todos os dados. Os valores podem estar incompletos." com botão "Tentar novamente" (chama `loadData`).

## Movimento
- Entrada do Painel ao montar a aba: grupos 2–6 com `opacity 0→1` e `translateY(8px→0)`, 220 ms, `cubic-bezier(0.22,1,0.36,1)`, stagger 35 ms (delays 0/35/70/105/140 ms), `animation-fill-mode: both`. Não repete em atualização de dados, digitação ou mudança de período (só remonta ao trocar de aba). Cabeçalho global não anima.
- Abas/período: estado atualizado imediatamente; transições de cor/fundo 150 ms; indicador da nav desliza ~180 ms; dimensões estáveis.
- Botões: hover de cor/borda 150 ms; `active:scale-[0.97]` 100 ms; foco visível; ação dispara no clique.
- Números: sem contagem animada (todos operacionais).
- Gráficos: animação de entrada nativa curta do Recharts (≤ 400 ms), desligada com movimento reduzido.
- Tema: View Transitions API — `document.startViewTransition` + `clip-path: circle(0 at x y) → circle(r at x y)` em `::view-transition-new(root)`, 450 ms, mesma curva, r = distância até o canto mais distante; centro = centro do botão. Clique durante transição em andamento é ignorado. Fallback (sem API ou `prefers-reduced-motion`): troca instantânea. Preferência em `localStorage['upvalor_theme']` (`'dark'|'light'`, padrão `'dark'`), aplicada antes da pintura por script inline em `layout.tsx` (sem efeito ao iniciar).
- `prefers-reduced-motion: reduce`: sem deslocamentos, sem stagger, sem revelação circular, sem animação de gráficos; framer-motion com `MotionConfig reducedMotion="user"`.

## Período (regra nova de navegação)
- Mensal: ±1 mês (como hoje).
- Trimestral: ±3 meses (mantendo o mês relativo dentro do trimestre).
- Semanal: semana domingo–sábado. Ao entrar em Semanal: se o mês selecionado é o atual → semana de hoje; senão → semana que contém o dia 1 do mês selecionado (regra atual). Setas: ±7 dias. Rótulo: "Semana Atual" se contém hoje; senão "dd/mm – dd/mm/aaaa". `selectedYear/selectedMonth` acompanham: mês de hoje se a semana contém hoje; senão o mês do sábado da semana.
- `isDateInScope` Semanal usa a semana selecionada (intervalo inclusivo).
- "Período atual" (`isCurrentPeriod`) = o período contém hoje. Substitui `isCurrentMonth` só no Painel (botões Receber/Pagar, "A Receber"/"Previsão", badge). Observação: em Mensal e em Trimestral alinhado é idêntico ao comportamento atual.

## Restrições
- Sem novas dependências (framer-motion, recharts, lucide-react, Tailwind v4 já existem).
- Lógica pura testada com `node --test` (Node 24, ESM por detecção) em `tests/*.test.mjs`.
- `markReceivableAsPaid`/`markEmpPaymentAsPaid` passam a `await loadData()` (sem mudar requisições) para a trava cobrir até a lista atualizar.
- Testes no navegador com dados de teste no JSON local, com backup e restauração de `database/local-db.json`. Nenhuma ação financeira real.

## Deixado ao implementador
Ícones lucide específicos, microcopy de subtítulos não citados, detalhes de padding dentro da escala definida.
