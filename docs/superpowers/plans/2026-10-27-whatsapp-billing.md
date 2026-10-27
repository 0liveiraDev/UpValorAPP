# WhatsApp Client Billing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar cadastro/edição de WhatsApp por cliente e botão "Cobrar" com modal de escolha de frequência (`Semanal`, `Quinzenal`, `Mensal`), prévia ao vivo da mensagem oficial da Up Valor e disparo via "Cobrar pelo WhatsApp".

**Architecture:** Extrair toda a regra de sanitização, normalização BR (`55` + DDD + número), máscara e montagem do template/URL `wa.me` para um módulo puro testável (`lib/whatsapp/billing.js`). Persistir `whatsapp` em `clients` via queries parametrizadas compatíveis com MySQL e `lib/db.local.js`, expondo um modal modular (`WhatsappBillingModal.jsx`) acionado a partir de `ClientesSection.jsx` e coordenado por `app/page.jsx`.

**Tech Stack:** Next.js 16 (App Router, React 19), Tailwind CSS 4, Framer Motion, Lucide React, `mysql2/promise` + `lib/db.local.js`, `node:test` nativo (Node 24).

**Spec:** `docs/superpowers/specs/2026-10-27-whatsapp-billing-design.md`

## Global Constraints

- Manter o template de mensagem idêntico ao especificado em `Spec §2`, trocando apenas `semanal`, `quinzenal` ou `mensal` (em minúsculas) e preservando `[Mensagem Automática] – Up Valor` e `Jefferson K: 48.541.173/0001-43`.
- Usar exclusivamente queries SQL parametrizadas com sintaxe simples `col = ?` nos `SET` e `WHERE` de `app/api/clients/route.js` para manter compatibilidade total com `lib/db.local.js` e `mysql2`.
- Nunca hardcodar credenciais de banco em código ou scripts de migração (ler de `process.env` via `--env-file=.env.local`).
- Nunca usar `alert()`, `confirm()`, `prompt()` ou `dangerouslySetInnerHTML` nos componentes criados/alterados.
- Abrir links externos com `window.open(url, '_blank', 'noopener,noreferrer')` sincronamente na validação do clique antes de `await` de rede para evitar bloqueio de pop-up.

## Review Focus

- Cliente com DDD `55` (ex.: `(55) 99999-8888`, 11 dígitos iniciando com `55`) deve normalizar para `5555999998888` e exibir `(55) 99999-8888`, sem confundir o DDD gaúcho com o DDI do Brasil.
- Número digitado com zero de operadora no DDD (ex.: `085999998888`) deve remover o `0` inicial e normalizar para `5585999998888`.
- Apagar caracteres no campo de telefone até restarem 1 ou 2 dígitos não deve reinserir `) ` forçado que impeça o Backspace.
- Número vazio ou curto demais (ex.: `12345`) deve retornar `null` em `normalizeWhatsappNumber` e `buildWhatsappUrl`, exibindo erro inline no modal sem abrir aba quebrada.
- Atualização rápida de WhatsApp (`action: 'update_whatsapp'`) em `PUT /api/clients` deve alterar somente a coluna `whatsapp` do `id` pertencente ao `user_id`, mantendo intactos `monthly_fee`, `payment_frequency` e demais colunas do cliente.

---

### Task 1: Módulo Puro de Cobrança e Telefone WhatsApp

**Files:**
- Create: `lib/whatsapp/billing.js`
- Test: `tests/whatsapp-billing.test.mjs`

**Interfaces:**
- Consumes: none
- Produces (`lib/whatsapp/billing.js`):
  - `export const BILLING_FREQUENCIES = ['Semanal', 'Quinzenal', 'Mensal'];`
  - `export function sanitizeWhatsappInput(raw)` -> `string` (máx. 30 chars, apenas `[0-9+\s()-]`, trimmed)
  - `export function normalizeWhatsappNumber(raw)` -> `string | null` (`55` + 10 ou 11 dígitos BR, ou `null`)
  - `export function formatWhatsappDisplay(raw)` -> `string` (`""`, `"85"`, `"(85) 9999"`, `"(85) 3333-4444"`, `"(85) 99999-8888"`)
  - `export function buildWhatsappBillingMessage(frequency = 'Mensal')` -> `string`
  - `export function buildWhatsappUrl(rawPhone, frequency = 'Mensal')` -> `string | null`

- [ ] **Step 1: Escrever os testes unitários cobrindo template, normalização (incluindo DDD 55 e zero inicial), máscara e URL**

Criar `tests/whatsapp-billing.test.mjs` usando `node:test` e `node:assert/strict` testando:
1. `buildWhatsappBillingMessage('Quinzenal')`, `('Semanal')`, `('Mensal')` e fallback para entrada inválida (`'Anual'` -> `'mensal'`), comparando string exata com `Spec §2`.
2. `normalizeWhatsappNumber` para `"(85) 99999-8888"` -> `"5585999998888"`, `"+55 85 99999-8888"` -> `"5585999998888"`, `"55999998888"` (DDD 55, 11 dígitos) -> `"5555999998888"`, `"085999998888"` -> `"5585999998888"`, `"8532221111"` (fixo 10 dígitos) -> `"558532221111"`, e inválidos (`""`, `"12345"`, `null`) -> `null`.
3. `formatWhatsappDisplay` para `""` -> `""`, `"85"` -> `"85"`, `"859"` -> `"(85) 9"`, `"5585999998888"` -> `"(85) 99999-8888"`, `"55999998888"` -> `"(55) 99999-8888"`.
4. `sanitizeWhatsappInput` removendo `<script>`/letras e limitando a 30 chars.
5. `buildWhatsappUrl` retornando `null` quando telefone inválido e URL `https://wa.me/5585999998888?text=...` com mensagem decodificável idêntica ao template.

- [ ] **Step 2: Rodar os testes para confirmar falha inicial (RED)**

Run: `node --test tests/whatsapp-billing.test.mjs`
Expected: FAIL (`ERR_MODULE_NOT_FOUND` para `../lib/whatsapp/billing.js`)

- [ ] **Step 3: Implementar `lib/whatsapp/billing.js`**

Implementar as funções exportadas conforme `Interfaces` e `Spec §2 / §4.1`.

- [ ] **Step 4: Rodar os testes para confirmar aprovação (GREEN)**

Run: `node --test tests/whatsapp-billing.test.mjs`
Expected: PASS (0 falhas)

---

### Task 2: Persistência `whatsapp` na API de Clientes e Script de Migração

**Files:**
- Modify: `app/api/clients/route.js:57-83` e `app/api/clients/route.js:120-223`
- Modify: `database/schema.sql:15-24`
- Create: `database/migration_v4_whatsapp.sql`
- Create: `database/migrate-whatsapp.js`
- Test: `tests/clients-whatsapp-api.test.mjs`

**Interfaces:**
- Consumes: `lib/db.js` (`pool`), `lib/cache.js` (`cacheInvalidate`)
- Produces:
  - `POST /api/clients`: aceita `whatsapp` opcional no payload JSON, sanitiza (`[0-9+\s()-]`, máx. 30 chars, `null` se vazio) e grava em `clients.whatsapp`.
  - `PUT /api/clients` com `{ id, userId, action: 'update_whatsapp', whatsapp }`: valida `id` e `userId` (retorna HTTP 400 se ausentes), executa `UPDATE clients SET whatsapp = ? WHERE id = ? AND user_id = ?`, invalida `clients:${userId}` e retorna `{ success: true, whatsapp }`.
  - `PUT /api/clients` (edição completa sem `action`): quando `data.whatsapp !== undefined`, inclui `whatsapp = ?` no `UPDATE clients SET ... WHERE id = ? AND user_id = ?`; quando `undefined`, mantém query atual sem sobrescrever `whatsapp`.
  - `database/migrate-whatsapp.js`: script CommonJS/ESM seguro lendo variáveis `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` de `process.env` (executável com `node --env-file=.env.local database/migrate-whatsapp.js`), verificando `SHOW COLUMNS FROM clients LIKE 'whatsapp'` e executando `ALTER TABLE clients ADD COLUMN whatsapp VARCHAR(30) DEFAULT NULL` se não existir.

- [ ] **Step 1: Escrever teste de integração `tests/clients-whatsapp-api.test.mjs` sobre `USE_LOCAL_DB=true`**

Testar backup/restauração segura de `database/local-db.json` (ou isolamento), validando:
1. `POST /api/clients` salva `whatsapp` sanitizado e `GET /api/clients?userId=...` retorna o cliente com `whatsapp`.
2. `PUT /api/clients` com `action: 'update_whatsapp'` atualiza somente `whatsapp` sem alterar `monthly_fee` ou `payment_frequency`, respeitando `user_id` (outro `userId` não altera o registro).
3. `PUT /api/clients` de edição completa atualiza `whatsapp` quando enviado e preserva `whatsapp` quando omitido.

- [ ] **Step 2: Rodar o teste para confirmar falha inicial (RED)**

Run: `node --test tests/clients-whatsapp-api.test.mjs`
Expected: FAIL (`whatsapp` ausente no registro retornado / `action: 'update_whatsapp'` não tratado)

- [ ] **Step 3: Implementar suporte a `whatsapp` em `app/api/clients/route.js` e arquivos de migração em `database/`**

Atualizar `app/api/clients/route.js`, `database/schema.sql`, criar `database/migration_v4_whatsapp.sql` e `database/migrate-whatsapp.js` sem nenhuma credencial hardcoded.

- [ ] **Step 4: Rodar o teste para confirmar aprovação (GREEN)**

Run: `node --test tests/clients-whatsapp-api.test.mjs`
Expected: PASS (0 falhas)

---

### Task 3: Componente `WhatsappBillingModal`

**Files:**
- Create: `app/components/modals/WhatsappBillingModal.jsx`

**Interfaces:**
- Consumes (`@/lib/whatsapp/billing.js`): `BILLING_FREQUENCIES`, `formatWhatsappDisplay`, `normalizeWhatsappNumber`, `buildWhatsappBillingMessage`, `buildWhatsappUrl`
- Consumes (`@/lib/dashboard/format.js`): `formatMoney`
- Produces (`app/components/modals/WhatsappBillingModal.jsx`):
  - Default export `WhatsappBillingModal({ isOpen, client, pendingAmount = 0, onClose, onSaveWhatsapp })`
  - `onSaveWhatsapp(clientId, formattedPhone)` -> `Promise<{ ok: boolean, error?: string }>`

- [ ] **Step 1: Implementar `app/components/modals/WhatsappBillingModal.jsx`**

Construir modal acessível (`role="dialog"`, `aria-modal="true"`) usando tokens visuais existentes (`bg-surface`, `border-line-strong`, `text-fg`, `bg-pos`, `Framer Motion` `AnimatePresence`) contendo:
1. Cabeçalho com nome do cliente, badge de valor pendente (`formatMoney(pendingAmount)`) e botão fechar (`X`).
2. Seletor de frequência com 3 botões (`Semanal`, `Quinzenal`, `Mensal`), iniciando em `client.payment_frequency` (fallback `Mensal`).
3. Editor inline de WhatsApp (`input type="tel"`, `placeholder="(85) 99999-9999"`) formatado com `formatWhatsappDisplay`, botão `"Salvar"` para gravar o número a qualquer momento com feedback visual (`"Salvo!"` / erro inline), sem `alert()`.
4. Caixa de prévia da mensagem exibindo `buildWhatsappBillingMessage(frequency)` + botão `"Copiar mensagem"` com feedback `"Copiado!"`.
5. Botão principal **"Cobrar pelo WhatsApp"**:
   - Valida `buildWhatsappUrl(phoneInput, frequency)`; se `null`, exibe erro inline `"Informe um número de WhatsApp válido com DDD (ex: 85 99999-9999)."` e não abre janela.
   - Se válido, chama `window.open(url, '_blank', 'noopener,noreferrer')` imediatamente e, se o telefone foi editado em relação a `client.whatsapp`, dispara `onSaveWhatsapp(client.id, phoneInput)` para persistir o número automaticamente.

- [ ] **Step 2: Verificar lint no componente criado**

Run: `npx eslint app/components/modals/WhatsappBillingModal.jsx`
Expected: exit code 0 (sem erros)

---

### Task 4: Botão "Cobrar" e Indicador de WhatsApp em `ClientesSection`

**Files:**
- Modify: `app/components/sections/ClientesSection.jsx:1-50` e `app/components/sections/ClientesSection.jsx:390-480`

**Interfaces:**
- Consumes (`@/lib/whatsapp/billing.js`): `formatWhatsappDisplay`
- Produces (`app/components/sections/ClientesSection.jsx`):
  - Nova prop opcional `onOpenBillingModal` em `ClientesSection`
  - Em cada card de cliente na lista `Todos os Clientes` (e nos cards de `Contratos Vencidos`), botão **"Cobrar"** com ícone `MessageCircle` que chama `onOpenBillingModal?.(client)`.
  - Exibição discreta do WhatsApp formatado (`formatWhatsappDisplay(client.whatsapp)`) na linha de metadados do cliente quando preenchido.

- [ ] **Step 1: Atualizar `app/components/sections/ClientesSection.jsx`**

Adicionar `MessageCircle` de `lucide-react`, exibir o WhatsApp cadastrado na linha de resumo do cliente (se existir) e adicionar o botão **"Cobrar"** ao lado de `+ Cobrança` (diferenciando visualmente: **"Cobrar"** em destaque verde WhatsApp `bg-pos/12 text-pos border-pos/30 hover:bg-pos/20` e **`+ Cobrança`** em `bg-accent/10 text-accent-fg border-accent/25 hover:bg-accent/18`).

- [ ] **Step 2: Verificar lint em `ClientesSection.jsx`**

Run: `npx eslint app/components/sections/ClientesSection.jsx`
Expected: exit code 0 (sem erros)

---

### Task 5: Integração em `app/page.jsx`, Migração Hostinger e Validação E2E

**Files:**
- Modify: `app/page.jsx:20-30`, `app/page.jsx:420-436`, `app/page.jsx:700-715`, `app/page.jsx:792-833`

**Interfaces:**
- Consumes: `WhatsappBillingModal`, `ClientesSection` (`onOpenBillingModal`), `formatWhatsappDisplay`, `PUT /api/clients` (`action: 'update_whatsapp'`)
- Produces: Fluxo completo integrado no painel principal.

- [ ] **Step 1: Integrar estado, campo `whatsapp` no form de cliente e `WhatsappBillingModal` em `app/page.jsx`**

1. Adicionar `<input name="whatsapp" type="tel" defaultValue={formatWhatsappDisplay(modal.data?.whatsapp || '')} placeholder="(85) 99999-9999" ... />` no modal `modal.type === 'client'` e enviar `whatsapp: data.whatsapp || ''` no `handleSave`.
2. Criar estado `billingClientId` e handler `handleSaveClientWhatsapp(clientId, whatsapp)` chamando `PUT /api/clients` com `{ id: clientId, userId: currentUser.id, action: 'update_whatsapp', whatsapp }` + `await loadData()`.
3. Passar `onOpenBillingModal={(client) => setBillingClientId(client.id)}` para `<ClientesSection />` e renderizar `<WhatsappBillingModal />`.

- [ ] **Step 2: Aplicar migração segura da coluna `whatsapp` no banco MySQL da Hostinger**

Run: `node --env-file=.env.local database/migrate-whatsapp.js`
Expected: `Coluna whatsapp adicionada/verificada com sucesso em clients` sem afetar registros existentes.

- [ ] **Step 3: Executar suíte de testes, linter e build de produção**

Run: `node --test tests/*.test.mjs; npm run lint; npm run build`
Expected: Todos os testes passando, 0 erros de lint e build concluído com código 0.

- [ ] **Step 4: Validar fluxo completo no navegador com `agent-browser` em `http://127.0.0.1:3000`**

Subir servidor Next.js em `127.0.0.1:3000` e testar com `agent-browser`:
1. Login no painel e abertura da aba **Clientes**.
2. Cadastro de cliente com WhatsApp e verificação do número exibido no card.
3. Clique em **Cobrar**, troca entre **Semanal**, **Quinzenal** e **Mensal** conferindo a mudança exata no texto da prévia e preservação da chave Pix `Jefferson K: 48.541.173/0001-43`.
4. Edição inline do WhatsApp dentro do modal **Cobrar**, salvamento e verificação de persistência após reload + inspeção da URL `https://wa.me/55...` gerada no botão **Cobrar pelo WhatsApp**.

## Verification Plan

### Automated Security Check

- **Security Scanner**: Run a scan on all newly created files (`lib/whatsapp/billing.js`, `app/components/modals/WhatsappBillingModal.jsx`, `database/migrate-whatsapp.js`) to identify common vulnerabilities (e.g., XSS, SQL injection, hardcoded secrets). If findings are detected, apply the fix and document the results.
- **Security Audit**: Verify parameterized SQL queries, ownership checks (`user_id`), input sanitization on `whatsapp`, absence of hardcoded DB credentials, absence of `dangerouslySetInnerHTML`/`alert()`, and `noopener,noreferrer` on `window.open`.
