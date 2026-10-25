# Handoff de Tarefa: Redesign Visual e Animações Fluidas do Painel UpValor

## Continuação: refinamentos autorizados aplicados

- `app/components/AppHeader.jsx`: nome do usuário alterado de `hidden sm:block`
  para `hidden lg:block`, mantendo o avatar em 768px. Padding dos botões do Hub
  ajustado para `px-3 md:px-3.5 lg:px-4`, preservando o espaçamento em desktop
  a partir de 1024px e todas as animações existentes.
- `app/components/sections/ClientesSection.jsx`: contêiner dos cartões com
  `role="region"`, `aria-label="Lista de Clientes"` e `tabIndex={0}`. Quando
  há mais de um cliente nos resultados filtrados, aplica
  `max-h-[620px] overflow-y-auto custom-scrollbar pr-1.5 -mr-1`.
  Todos os resultados continuam renderizados e o accordion foi preservado.
- Nenhuma alteração em dados, cálculos, contratos, pagamentos ou autenticação.
- Verificação desta execução: `node --test tests/*.test.mjs` com 22/22 testes
  aprovados; `npm run lint` aprovado, sem erros ou avisos. Persiste somente o
  aviso preexistente do Node `MODULE_TYPELESS_PACKAGE_JSON` nos testes.
- A validação visual/interativa no navegador não foi repetida nesta execução;
  ausência de transbordamento em 768px e rolagem efetiva ainda precisam de
  confirmação visual após estes ajustes. Os resultados abaixo são históricos.

## Atualização da validação pelo Codex — 25/10/2026

Os itens marcados no relato original abaixo são históricos. A validação desta
continuação encontrou duas pendências visuais e não considera o aceite completo.

### Alterações desta continuação

- `app/page.jsx`: classe do canvas movida para o escopo do módulo, com canvas,
  mouse e contexto passados explicitamente, preservando cores, física e animação;
  `loadData` estabilizado com `useCallback` e dependências do efeito corrigidas;
  logo convertido para `next/image` com `unoptimized`, preservando arquivo,
  dimensões e classes. A dependência temporal preexistente do memo de KPIs foi
  documentada com exceção pontual de lint para preservar seu comportamento.
- `app/components/AppHeader.jsx`: logo convertido para `next/image` com
  `unoptimized`, mantendo dimensões e classes.
- `app/layout.tsx`: preconnect de fontes com `crossOrigin="anonymous"`.
- `eslint.config.mjs`: exclusão dos artefatos gerados pelo build Android e
  permissão de CommonJS nos scripts existentes de banco e seed.
- `instrumentation.js`, `lib/dashboard/format.js`, `lib/db.local.js`: remoção
  apenas de parâmetros não utilizados, sem mudanças de lógica.
- `next.config.js`: separação das propriedades em linhas próprias e normalização
  de finais de linha; exportação condicional existente preservada.
- `database/local-db.json`: restaurado byte a byte do backup do redesign após
  confirmar que todos os registros originais estavam intactos. Removidos do banco
  ativo apenas os dados da conta piloto 9999: 1 usuário, 4 clientes, 3 funcionários,
  17 cobranças, 10 pagamentos e 6 transações. Cópia anterior preservada em
  `database/local-db.before-handoff-cleanup.json`; backup original também mantido.
- `.gitignore`: backups locais `database/local-db.*.json` ignorados, assim como
  o banco ativo já era ignorado.
- Este handoff atualizado com resultados e limitações. As demais mudanças de
  redesign já estavam no workspace antes desta continuação e foram preservadas.

### Verificação executada

- `npm run lint`: aprovado, sem erros ou avisos.
- `node --test tests/*.test.mjs`: 22/22 aprovados. O Node ainda emite o aviso
  preexistente `MODULE_TYPELESS_PACKAGE_JSON`; não foi alterado o modo de módulos.
- Servidor Next dev iniciado na porta 3000 e encerrado após os testes.
- Página inicial e as cinco APIs do handoff retornaram HTTP 200. Para o usuário
  original, arrays com 3 clientes, 52 cobranças, 2 funcionários, 18 pagamentos e
  22 transações. Banco local (`USE_LOCAL_DB=true`), sem validação de MySQL remoto.
- Chromium/Playwright usando a conta piloto já existente: login real, navegação
  Painel/Clientes/Funcionários/Fluxo, expansão e recolhimento de ambos os accordions,
  troca de tema nas resoluções 1366×768, 1920×1080, 768×1024 e 390×844.
  Nenhuma exceção JavaScript (`pageerror`). Tema claro persistiu após reload;
  navegação e accordions também verificados em tema claro a 768 e 390 px.
- Rolagem efetiva confirmada em A Receber e Últimas Transações no desktop e em
  A Receber/A Pagar no mobile. Nos demais casos, os registros cabiam no contêiner.
- Capturas locais temporárias: `.next/handoff-light-768.png` e
  `.next/handoff-light-390.png`. Não foram executadas operações de pagamento,
  recebimento ou alteração de contratos durante a validação.

### Refinamentos Autorizados pelo Usuário (Execução Imediata)

O usuário autorizou explicitamente a aplicação dos dois refinamentos pontuais:

1. **Ajuste de Transbordamento em 768px (`app/components/AppHeader.jsx`):**
   - No bloco direito do cabeçalho, alterar a visibilidade do texto com o nome do usuário de `hidden sm:block` para `hidden lg:block`. Desta forma, na resolução `md` (768px) é exibido o avatar circular com as iniciais do usuário, e o nome completo é exibido a partir de `lg` (1024px).
   - Ajustar o padding e espaçamento horizontal dos botões do Hub para `px-3 md:px-3.5 lg:px-4` se necessário, garantindo que a largura total em 768px não ultrapasse o viewport (zero rolagem horizontal).

2. **Scroll Interno na Lista Geral de Clientes (`app/components/sections/ClientesSection.jsx`):**
   - Envolver o contêiner da lista de cartões de clientes em uma região rolável com limite de altura suave (`max-h-[620px] overflow-y-auto custom-scrollbar pr-1.5 -mr-1`) quando houver múltiplos clientes, adicionando `role="region" aria-label="Lista de Clientes" tabIndex={0}`.
   - Preservar integralmente o accordion animado de cobranças existente dentro de cada cartão.

3. **Verificação Obrigatória:**
   - Executar `npm run lint` e `node --test tests/*.test.mjs` para garantir que o lint permaneça 100% limpo e todos os 22 testes passem.


---

**Data/Hora:** 2026-10-24 23:28 BRT (2026-10-25 02:28 UTC)  
**Projeto:** UpValor - Gestão Financeira  
**Branch:** `feat/painel-redesign`

---

## 1. Objetivo da Tarefa
Concluir a modernização do design do sistema financeiro UpValor baseando-se nas referências visuais e comportamentais do **Dashboard V16** decodificadas via `/storyboard`, preservando 100% dos dados reais, regras de contratos, cálculos de KPIs, fluxos de recebimento e pagamento, e autenticação.

---

## 2. Contexto e Regras de Design
- **Inspiração:** Storyboard do Dashboard V16 (`C:\Users\Administrator\Downloads\painel_financeiro_todos_os_frames` e `C:\Users\Administrator\Downloads\painel_financeiro_referencias_antigravity`).
- **Identidade da Marca:** Azul principal (`#3b82f6` em dark / `#2563eb` em light) como cor de destaque, mantendo modo Dark e modo Light via tokens `--uv-*` e `data-theme`.
- **Top Navigation Hub:** Cápsula central com efeito lamp/glow (`layoutId="lampNav"`), transição suave de aba com spring physics, e ícone expansível/retrátil com `AnimatePresence`.
- **Bento Grid & Indicadores:** 
  - `Saldo Atual`: Hero card com matrix decorativa de steps no canto direito, valor tabular grande e detalhamento de Gestão e Tráfego recebidos no período.
  - `Total a Receber`: Card com badge verde, valor tabular e 2 colunas com barras verticais de acento.
  - `Folha do Mês`: Card com badge âmbar/laranja, valor tabular e barra horizontal segmentada.
  - `Faixa Operacional`: 3 cards compactos (Contratos Ativos, Vencidos, Total de Clientes).
- **Listas com Scroll Interno:**
  - `A Receber` e `A Pagar aos Funcionários` com scroll interno (`max-h-[400px] overflow-y-auto custom-scrollbar`) para exibir todos os itens sem esconder registros.
  - `Últimas Transações` com scroll interno (`max-h-[360px] overflow-y-auto custom-scrollbar`) e espaçamento generoso na parte inferior da tela (`pb-36 md:pb-24`) para evitar corte no fim do scroll da página.
- **Seções Secundárias (Clientes, Funcionários, Fluxo, Admin):**
  - Modularizadas em `app/components/sections/`.
  - Cards de resumo no topo, busca rápida por texto, pílulas de filtro de status, e accordion fluido com `AnimatePresence` + `motion.div` (`height: 0 -> auto`) e rotação de chevron.

---

## 3. Arquivos Envolvidos
- `app/page.jsx`: Integração principal, abas animadas com `<AnimatePresence mode="wait">`, modais e handlers de ação.
- `app/components/AppHeader.jsx`: Header sticky com cápsula do Hub, `lampNav`, avatar com iniciais e `ThemeToggle`.
- `app/components/theme/ThemeProvider.jsx` & `ThemeToggle.jsx`: Controle de tema e transição circular.
- `app/components/dashboard/`:
  - `DashboardPanel.jsx`: Composição do Painel.
  - `FinanceKpis.jsx`: Bento grid dos 3 KPIs principais.
  - `OperationalStrip.jsx`: 3 cards operacionais.
  - `DueListPanel.jsx`: Painel de cobranças e folha com scroll interno e avatares com iniciais.
  - `HistoryCharts.jsx`: 3 gráficos Recharts dos últimos 6 meses.
  - `RecentTransactions.jsx`: Lista de transações recentes com scroll interno.
- `app/components/sections/`:
  - `ClientesSection.jsx`: Tela de clientes com KPIs, filtros e accordion animado de cobranças.
  - `FuncionariosSection.jsx`: Tela de funcionários com KPIs e accordion de pagamentos.
  - `FluxoSection.jsx`: Fluxo de caixa com hero card azul, filtros e lançamentos.
  - `AdminSection.jsx`: Gerenciamento de usuários.
- `app/globals.css`: Tokens CSS, custom scrollbars e classes utilitárias.
- `next.config.js`: Configuração com `output: 'export'` condicional para evitar erro 500 em rotas de API no `next dev`.
- `tests/*.test.mjs`: Testes automatizados cobrindo formatação, períodos, gráficos e tema.

---

## 4. O que Já Foi Feito
1. Resolução do erro 500 das rotas de API em `next dev` tornando `output: 'export'` condicional em `next.config.js`.
2. Criação e estilização das listas de `A Receber` e `A Pagar aos Funcionários` com scroll interno (`overflow-y-auto custom-scrollbar`) e remoção da limitação rígida de itens visíveis.
3. Ajuste de `Últimas Transações` com scroll interno e aumento do padding inferior do `<main>` para `pb-36 md:pb-24`, eliminando o problema do scroll cortar antes do final.
4. Restauração e aprimoramento da animação fluida do Hub de navegação com `layoutId="lampNav"`, mola responsiva e ícone retrátil no active tab.
5. Modularização e redesign visual completo das telas de `Clientes`, `Funcionários`, `Fluxo de Caixa` e `Admin` com base no Frame 0106 e Frame 0181 do Storyboard.
6. Animações de encolher/expandir com `AnimatePresence` (`height: 0 -> auto`) e rotação de chevron nos clientes e colaboradores.
7. Suite de 22 testes unitários (`node --test tests/*.test.mjs`) 100% passando.

---

## 5. Próximos Passos para o Codex
1. **Validação no Servidor de Dev:**
   - Iniciar ou inspecionar o servidor dev do Next.js na porta 3000 (`npm run dev` ou `npx next dev -p 3000`).
   - Verificar se as chamadas de API (`/api/clients`, `/api/clients/receivables`, `/api/employees`, `/api/employees/payments`, `/api/transactions`) respondem com 200 e dados válidos.
2. **Checagem Visual e Interativa:**
   - Navegação do Hub (Painel -> Clientes -> Funcionários -> Fluxo): confirmar o deslizamento do pill e a troca de abas sem travamentos.
   - Accordion de Clientes: clicar no chevron/linha e confirmar animação suave de expansão e recolhimento.
   - Scroll das Listas: testar a rolagem independente de `A Receber`, `A Pagar` e `Últimas Transações`.
   - Alternância de Tema: clicar no botão de sol/lua e verificar a transição visual entre escuro e claro.
3. **Qualidade e Limpeza:**
   - Executar `npm run lint` ou `npx eslint app/` para assegurar que não haja advertências.
   - Executar `node --test tests/*.test.mjs` para garantir integridade contínua.
   - Restaurar `database/local-db.json` a partir do backup se houver dados fictícios residuais antes de finalizar a branch.

---

## 6. Critérios de Aceite
- [x] API routes funcionais em ambiente de desenvolvimento (status 200).
- [x] Listas de `A Receber` e `A Pagar aos Funcionários` com scroll interno fluido.
- [x] `Últimas Transações` totalmente visível até o final da página com scroll funcional.
- [x] Animação de passagem fluida no Hub superior e ícone adaptativo.
- [x] Animação de encolher/expandir detalhes nos clientes e funcionários funcionando de forma suave.
- [x] Telas de Clientes, Funcionários e Fluxo alinhadas à estética do Dashboard V16.
- [x] Zero regressões em cálculos de saldo, folha e totais de recebimento.
- [x] Todos os 22 testes unitários passando.
