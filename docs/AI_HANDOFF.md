# Handoff de Tarefa: Identidade Visual Glassmorphism (Liquid/Frosted Glass) & Tipografia Display

## Atualização da execução — 10/11/2026

### Correção solicitada após a entrega

- Preferência atual: login e cadastro sempre escuros, independentemente do tema salvo no sistema. Aplicado `data-theme="dark"` somente no container de acesso e logo fixa da versão escura; tema global e preferência persistida preservados. Verificado em 1366px e 390px com tema global claro/escuro: cores idênticas, logo visível e blur das bolas preservado. Testes 48/48.

- O usuário solicitou explicitamente preservar o blur da página de login. Após relatar novamente ausência do efeito, o blur passou a ser aplicado diretamente ao canvas: `filter: url('#goo') blur(40px) saturate(120%)`. A vinheta mantém apenas contraste e o card conserva seu vidro. Movimento dos blobs e filtro SVG preservados. Validado em Chrome a 1366 e 390px, sem overflow; capturas `login-blur-canvas-1366.png` e `login-blur-canvas-390.png`. Esta preferência substitui a orientação anterior de remover esse efeito. O endereço acessado pelo usuário ainda precisa ser confirmado se a divergência persistir.
- Criada conta `teste.visual@upvalor.test` pelo endpoint normal de cadastro, com perfil `user`, exclusivamente no banco JSON local (`USE_LOCAL_DB=true`). Senha entregue ao usuário na conversa, não registrada no código nem neste handoff. Login verificado pela API; conta sem dados financeiros adicionados.
- Testes após a correção: 48/48 aprovados.

Os passos de implementação abaixo foram executados na branch `feat/glassmorphism`. A descrição original permanece como histórico. Commit e push dessa branch foram autorizados pelo usuário; merge e deploy continuam fora do escopo.

- `app/layout.tsx`: Outfit para corpo/UI, Unbounded para display e Geist Mono preservada.
- `AppHeader` e `ThemeToggle`: navegação de nível 2 e controles internos sem blur adicional; animações preservadas.
- `app/page.jsx`: login e CRUD com painéis de nível 3, scrims sem blur, inputs e botão secundário de vidro. Fundo do app transparente para revelar os orbs existentes.
- `WhatsappBillingModal`: painel, campos e botões secundários atualizados.
- `AnunciosSection`: cards, vinculação de conta, token e bottom-sheet atualizados; tabela interna sem blur duplicado. `min-w-0` no painel desktop permite truncar nomes extensos sem overflow.
- `ClientesSection`, `FuncionariosSection`, `FluxoSection`: buscas atualizadas; alerta de vencidos com superfície de vidro.
- `PeriodControls` e `HistoryCharts`: controles e tooltip atualizados. `.uv-glass-inset` mantém superfícies internas sem backdrop-filter próprio.
- Lint anterior confirmado diretamente em `HEAD`: import sem uso removido; ID da conta extraído para manter a dependência primitiva do callback; supressão pontual documentada para sincronização remota no efeito, seguindo a convenção existente. Nenhuma regra financeira, autenticação ou endpoint foi alterado.
- `AGENTS.md`: bloco de instruções Next.js acrescentado automaticamente por `next dev`.
- Graphify: mapa estrutural de `app/`, 169 nós e 343 relações em `app/graphify-out/`. CSS não é analisado pelo extrator. O CLI alertou sobre esquema antigo de IDs; o mapa foi usado como apoio, com conferência direta dos componentes.
- `scripts/verify-glass.mjs`: validação em Chrome headless com APIs interceptadas e dados fictícios, incluindo nomes longos, caracteres especiais e listas vazias. Não grava dados reais nem valida a integração externa Meta.

Verificações: `node --test tests/*.test.mjs` passou com **48/48** (o total de 22 abaixo estava desatualizado); `npm run lint` passou sem erros ou warnings; `npm run build` passou. As **45 capturas** (temas dark/light, desktop 1366×768, mobile 390×844, login, seis abas, CRUD, WhatsApp, token, métricas e transparência reduzida) passaram sem overflow horizontal, blur aninhado ou erros de JavaScript. Resultados visuais detalhados estão em `docs/validation/glassmorphism/results.json`; prancha em `docs/validation/glassmorphism/storyboard_implementado.png`.

O dev com Turbopack falhou ao baixar fontes; foi reiniciado com `npx next dev --webpack -p 3099`, com carregamento real de Outfit e Unbounded confirmado no navegador. Avisos preexistentes de MODULE_TYPELESS_PACKAGE_JSON e Cache-Control não impedem testes/build. Headroom foi consultado, mas o proxy de compressão local estava indisponível.

**Pendente apenas aprovação visual do usuário antes de merge/deploy**, conforme a restrição original. Sem alegação de comparação pixel a pixel com os arquivos externos originais, de auditoria WCAG completa ou de teste em hardware mobile. Se houver publicação futura, aplicar a auditoria LGPD obrigatória do projeto.

---

**Data/Hora:** 2026-11-10 12:12 BRT (2026-11-10 15:12 UTC)
**Projeto:** UpValor - Gestão Financeira
**Branch de Teste Isolada:** `feat/glassmorphism` (não fazer merge/deploy em `main` até validação explícita do usuário)

---

## 1. Objetivo da Tarefa
Aplicar uma identidade visual consistente de **Glassmorphism (Liquid/Frosted Glass)** em todo o sistema UpValor (Dark Mode e Light Mode), combinada com nova hierarquia tipográfica inspirada nas referências enviadas pelo usuário (`Nura` / `Surgena` -> geometric display + sans-serif limpa via `next/font/google`) e nas referências decodificadas pelo `/storyboard` em `C:\Users\Administrator\Downloads\REFERENCIAS`.

Tudo deve ser feito **em modo teste** na branch `feat/glassmorphism`, preservando 100% da lógica de negócio, cálculos de KPIs, regras de contratos, pagamentos/recebimentos, integração Meta Ads e os 22 testes unitários.

---

## 2. Contexto, Arquitetura de Tokens e Regras Técnicas

### 2.1. Arquitetura de 3 Níveis de Elevação (Centralizada em `app/globals.css`)
- **Nível 1 — Superfícies e Cards de Conteúdo (`.uv-glass` / `.uv-card`):**
  - Fundo: `rgba(255, 255, 255, 0.08)` no dark mode / `rgba(255, 255, 255, 0.65)` no light mode (`--uv-glass-1`).
  - Desfoque: `backdrop-filter: blur(16px) saturate(140%)`.
  - Borda: `1px solid var(--uv-glass-border)` (`rgba(255, 255, 255, 0.15)` no dark / `rgba(255, 255, 255, 0.8)` no light) + brilho superior interno `inset 0 1px 0 0 var(--uv-glass-highlight)`.
  - Sombra: `0 8px 32px 0 rgba(0, 0, 0, 0.32)` (dark) / `0 8px 32px 0 rgba(15, 23, 42, 0.10)` (light).
  - Raio: `18px` (`rounded-2xl`).
  - Hover natural (`300ms ease-out`): transição suave elevando o fundo (`--uv-glass-1-hover`) e a borda (`--uv-glass-border-hover`: `rgba(255, 255, 255, 0.30)` no dark), sem saltos de layout.
- **Nível 2 — Navegação, Headers e Barras Flutuantes (`.uv-glass-nav`):**
  - Fundo: `rgba(255, 255, 255, 0.06)` no dark / `rgba(255, 255, 255, 0.60)` no light (`--uv-glass-2`) com `backdrop-filter: blur(20px) saturate(150%)`.
  - Divisores sutis em `--uv-glass-divider` (`rgba(255, 255, 255, 0.10)` no dark).
- **Nível 3 — Modais, Dropdowns, Bottom-Sheets e Popovers (`.uv-glass-overlay`):**
  - Fundo com maior opacidade (`--uv-glass-3`: `0.16` composto sobre `--uv-glass-3-tint` para contraste WCAG AA garantido) e `backdrop-filter: blur(24px) saturate(160%)`.
  - Backdrop/Scrim de modais (`.uv-scrim`): escurecimento sem `backdrop-filter` próprio para evitar duplo blur sob o painel do modal.
- **Formulários e Botões Secundários (`.uv-glass-input` e `.uv-glass-btn`):**
  - Sem `backdrop-filter` próprio (pois vivem dentro de `.uv-card` ou `.uv-glass-overlay`), usando reflexo interno superior (`inset 0 1px 0 0 var(--uv-glass-sheen)`), borda translúcida e foco com anel suave.

### 2.2. Regras de Performance (Anti-Lag 60 FPS) e Acessibilidade
1. **Proibido Aninhamento de Blurs (GPU Churn):**
   - NUNCA colocar um elemento com `backdrop-blur` / `.uv-card` dentro de outro container que já tenha `backdrop-blur` (ou ancestral com `filter: blur(...)`).
   - A animação `.uv-enter` não deve usar `filter: blur(...)` durante o keyframe para não criar um *backdrop root* que quebre o `backdrop-filter` dos cards filhos.
2. **Contraste WCAG AA:**
   - Manter textos primários em `--uv-fg`, secundários em `--uv-muted` e números tabulares em `.uv-num`.
3. **Fallback para Acessibilidade:**
   - `@media (prefers-reduced-transparency: reduce)` e `@supports not (backdrop-filter: blur(1px))` desativam os blurs e aplicam superfícies sólidas (`--uv-surface-solid`).

---

## 3. O que Já Foi Feito

1. **Decodificação das Referências via `/storyboard`:**
   - Inspecionada a pasta `C:\Users\Administrator\Downloads\REFERENCIAS` (`image.png` do app *nido Smart Home OS* em vidro claro acetinado + vídeo `Glassy Dashboard V30` em vidro escuro com orbs ambientes, cápsulas translúcidas e bento grid).
   - Extraídos os 33 quadros do vídeo e geradas as pranchas `glass_storyboard_1.png` e `glass_storyboard_2.png` no diretório de artifacts da conversa.
   - Analisadas também as duas referências tipográficas enviadas pelo usuário (`NURA` e `SURGENA` — fontes geométricas display de traço largo e curvas modernas).
2. **Isolamento em Modo Teste (Git Branch):**
   - Criada e ativada a branch `feat/glassmorphism` a partir de `main` (`b78ea5c`).
3. **Implementação Completa dos Tokens e Classes Base em `app/globals.css`:**
   - Definidos todos os tokens de Glassmorphism para Dark Mode e Light Mode (`--uv-glass-1`, `--uv-glass-1-hover`, `--uv-glass-2`, `--uv-glass-3`, `--uv-glass-3-tint`, `--uv-glass-border`, `--uv-glass-border-hover`, `--uv-glass-divider`, `--uv-glass-highlight`, `--uv-glass-shadow`, `--uv-glass-overlay-shadow`, `--uv-glass-input`, `--uv-glass-btn-hover`, `--uv-glass-sheen`, `--uv-scrim`, `--uv-orb-1..3`).
   - Criado o fundo ambiente fixo `body::before` com 3 orbs radiais suaves que dão profundidade real à refração do vidro nos temas escuro e claro.
   - Criadas dentro de `@layer components` as classes utilitárias `.uv-glass`, `.uv-card` (Nível 1), `.uv-glass-nav` (Nível 2), `.uv-glass-overlay` (Nível 3), `.uv-scrim`, `.uv-glass-input` e `.uv-glass-btn`.
   - Implementados os fallbacks `@media (prefers-reduced-transparency: reduce)` e `@supports not (backdrop-filter: blur(1px))`.
   - Removido `filter: blur(4px)` de `@keyframes uv-enter` para não invalidar o `backdrop-filter` dos cards filhos.

---

## 4. O que Iria Terminar (Próximos Passos para Concluir)

### Passo 1 — Tipografia Display + Sans Geométrica (`app/layout.tsx`)
- Importar `Outfit` (corpo/UI geométrica limpa, variável `--font-outfit`) e `Unbounded` (display geométrica inspirada em *Nura/Surgena* para `h1` e `.uv-display`, variável `--font-unbounded`), mantendo `Geist_Mono` (`--font-geist-mono`) de `next/font/google`.
- Aplicar `${outfit.variable} ${unbounded.variable} ${geistMono.variable}` no `<body>` em `app/layout.tsx` (as variáveis já estão conectadas em `app/globals.css`).

### Passo 2 — Navegação e Header em Nível 2 (`app/components/AppHeader.jsx` e `ThemeToggle.jsx`)
- Em `app/components/AppHeader.jsx`:
  - Trocar o `<header>` sticky para usar `uv-glass-nav sticky top-0 z-40 border-b` (removendo o `style={{ background: 'var(--uv-nav)' }}` e `backdrop-blur-xl` avulso).
  - Na `<nav aria-label="Principal">` desktop (que está dentro do `<header>` com blur), usar superfície translúcida interna **sem** `backdrop-blur` aninhado (`bg-white/[0.05] dark / border-line`).
  - Na `<nav aria-label="Navegação móvel">` fixa inferior (`md:hidden fixed bottom-4`), aplicar `uv-glass-nav` (Nível 2) e remover o `style={{ background: 'var(--uv-nav)' }}`.
- Em `app/components/theme/ThemeToggle.jsx`:
  - Aplicar `uv-glass-btn` (sem blur aninhado, pois fica dentro do `AppHeader`).

### Passo 3 — Login, Modais Nível 3 e Inputs de Vidro (`app/page.jsx`)
- Atualizar as constantes de input no topo de `app/page.jsx`:
  - `loginInputClass`: `"uv-glass-input w-full rounded-xl px-4 py-2.5 text-sm"`
  - `inputClass`: `"uv-glass-input w-full rounded-xl px-4 py-2.5 text-sm"`
- Na tela de Login (`app/page.jsx` linhas ~706-733):
  - Evitar duplo `backdrop-filter` entre o overlay fixo e o card de login: deixar o card de login com `uv-glass-overlay` (Nível 3, `backdrop-blur-[24px]`) e o overlay de fundo apenas como vinheta de contraste sem `backdropFilter` duplicado (já que o SVG filter `#goo` no `<LiquidCanvas />` faz a fusão líquida dos blobs).
- No Modal CRUD principal (`app/page.jsx` linhas ~945-952):
  - Trocar o backdrop `<div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />` por `<div className="absolute inset-0 uv-scrim" onClick={closeModal} />` (sem blur duplicado).
  - Trocar o container `<motion.div>` do modal de `bg-surface border border-line-strong rounded-2xl shadow-2xl` para `uv-glass-overlay rounded-2xl w-full max-w-md p-6 z-10`.
  - No botão secundário `"Cancelar"`, aplicar `uv-glass-btn rounded-xl px-4 py-2`.

### Passo 4 — Modais Secundários em Nível 3 (`WhatsappBillingModal.jsx` e `AnunciosSection.jsx`)
- Em `app/components/modals/WhatsappBillingModal.jsx`:
  - Backdrop: usar `uv-scrim` (sem `backdrop-blur-sm`).
  - Painel do modal: usar `uv-glass-overlay rounded-2xl w-full max-w-lg p-4 sm:p-5 z-10 max-h-[90vh] flex flex-col overflow-hidden`.
  - Input de WhatsApp e botões secundários (`Copiar`, `Salvar`, `Fechar`): aplicar `uv-glass-input` e `uv-glass-btn`.
- Em `app/components/sections/AnunciosSection.jsx`:
  - Nos cards principais (`Lista de Clientes` na linha ~541, `Painel Fixo à Direita` na linha ~611 e tabela de campanhas na linha ~299): trocar `rounded-2xl border border-line bg-surface` por `uv-card` (Nível 1), garantindo que os subcards internos de métricas (`MetricCard` linha ~40) **não** tenham `backdrop-blur` (usam apenas `bg-surface-2/60 border border-line` para respeitar a proibição de blurs aninhados).
  - Nos 2 modais de `AnunciosSection.jsx` (Bottom-Sheet Mobile linha ~655 e Modal de Token Meta linha ~728):
    - Trocar os backdrops `bg-black/75 backdrop-blur-sm` por `uv-scrim`.
    - Trocar os painéis de `bg-surface border ... shadow-2xl` por `uv-glass-overlay`.
    - No header interno do bottom-sheet mobile (`linha ~688`), usar `bg-transparent` em vez de `bg-surface` opaco.
    - Nos inputs/selects/textarea (`AccountLinker` linhas ~129, ~143 e `tokenInput` linha ~766) e botões secundários (`Configurar Token`, `Atualizar`, `Cancelar`): usar `uv-glass-input` e `uv-glass-btn`.

### Passo 5 — Campos de Busca, Controles de Período e Seções (`ClientesSection`, `FuncionariosSection`, `FluxoSection`, `PeriodControls`, `HistoryCharts`)
- Em `ClientesSection.jsx` (linha ~112), `FuncionariosSection.jsx` (linha ~93) e `FluxoSection.jsx` (linha ~70):
  - Trocar os campos de busca `<input type="search" ...>` para usarem `uv-glass-input h-10 pl-9 pr-4 rounded-full text-sm w-48 sm:w-60`.
  - Em `ClientesSection.jsx` (alerta de Contratos Vencidos linha ~213): aplicar `uv-glass` com borda `border-neg/35` e nos itens internos manter fundo translúcido sem blur aninhado.
- Em `app/components/dashboard/PeriodControls.jsx` (linhas ~20 e ~43):
  - Aplicar `uv-glass` (ou `uv-glass-btn` nos controles segmentados de período e navegação de mês/semana).
- Em `app/components/dashboard/HistoryCharts.jsx` (linha ~32):
  - No `CustomTooltip` do Recharts, usar `uv-glass-overlay rounded-xl px-3.5 py-2.5 text-xs` (Nível 3 — popover) sem inline `background: var(--uv-surface)`.

### Passo 6 — Verificação Obrigatória e Validação Ao Vivo
1. Executar `node --test tests/*.test.mjs` (confirmar 22/22 testes passando).
2. Executar `npm run lint` (confirmar 0 erros e 0 warnings).
3. Executar `npm run build` para comprovar que o build de produção compila sem erros.
4. Iniciar servidor dev local (`npx next dev -p 3099`), inspecionar via Playwright nos modos **Dark** e **Light** (desktop `1366×768` e mobile `390×844`), verificar programaticamente que **nenhum elemento com `backdrop-filter` está aninhado dentro de outro elemento com `backdrop-filter`**, gerar a prancha `storyboard_implementado.png` e chamar o usuário para validar antes de qualquer merge ou deploy.

---

## 5. Como Continuar via Codex ou Nova Sessão
Para executar automaticamente pelo Codex no terminal:
```powershell
"Leia AGENTS.md e docs/AI_HANDOFF.md. Continue a implementação na branch feat/glassmorphism a partir do Passo 1 da seção 4, valide com testes e lint e relate o resultado." | codex exec --sandbox workspace-write
```
