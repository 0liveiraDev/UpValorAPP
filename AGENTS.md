# Diretrizes para Agentes de IA - UpValor

## Visão Geral do Projeto
O **UpValor** é um sistema financeiro moderno e completo desenvolvido em **Next.js 16 (App Router)** com **Tailwind CSS v4**, **Framer Motion**, **Recharts** e suporte multiplataforma (Web e Mobile via **Capacitor**).

## Stack e Tecnologias
- **Framework:** Next.js 16.1.6 (React 19, Turbopack, App Router)
- **Estilos:** Tailwind CSS v4 com tokens CSS customizados (`--uv-*`) em `app/globals.css`
- **Animações:** Framer Motion (layout transitions, spring physics, AnimatePresence)
- **Ícones:** Lucide React
- **Gráficos:** Recharts com paleta responsiva aos temas Dark e Light
- **Banco de Dados:** Modo híbrido MySQL/Local JSON em `lib/db.js` e `database/local-db.json`
- **Mobile:** Capacitor 8

## Regras de Engenharia Invioláveis
1. **Preservação de Dados e Lógica de Negócio:**
   - NUNCA altere cálculos de KPIs (`saldo`, `gestaoAReceber`, `trafegoAReceber`, `folhaMes`), status de contratos (`Ativo`, `Vencido`, `Cancelado`), regras de pagamentos e recebimentos, ou autenticação/sessão.
   - NUNCA transforme suposições em fatos nem simule integrações silenciosamente.
2. **Design e Identidade Visual (Dashboard V16 / Storyboard):**
   - Preservar a identidade com o azul predominante (`--uv-accent`) e as cores semânticas de status (`--uv-pos`, `--uv-neg`, `--uv-warn`, `--uv-traffic`).
   - Componentes em Bento Grid com raios suaves (16px), bordas discretas (`--uv-line`), sombras suaves e tipografia com algarismos tabulares (`.uv-num`).
   - Animações fluidas de transição entre abas no Hub (`layoutId="lampNav"`) e accordions suaves com `AnimatePresence` em listas de clientes e funcionários.
3. **Scroll e Visibilidade:**
   - As listas de `A Receber`, `A Pagar aos Funcionários`, `Últimas Transações`, `Clientes` e `Fluxo de Caixa` devem possuir scroll interno com classe `.custom-scrollbar` sem esconder registros ou quebrar o scroll inferior da página.
4. **Verificação Obrigatória:**
   - Execute sempre `node --test tests/*.test.mjs` para garantir que os testes unitários continuem 100% aprovados.
