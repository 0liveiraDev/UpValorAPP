# Cobrança de Clientes via WhatsApp — Design Spec

**Date:** 2026-10-27
**Project:** UpValor (`upvalor`)

## 1. Intent & Why

Permitir que o usuário do painel UpValor cobre rapidamente pelo WhatsApp os clientes com valores em aberto diretamente na aba **Clientes**, escolhendo na hora se a cobrança enviada será **Semanal**, **Quinzenal** ou **Mensal**, mantendo o texto institucional padronizado da agência Up Valor e salvando o número de WhatsApp no cadastro de cada cliente.

## 2. Exact Message Specification

O texto enviado deve permanecer **exatamente igual** ao modelo oficial abaixo, alterando exclusivamente a palavra de frequência (`semanal`, `quinzenal` ou `mensal` em minúsculas):

```text
[Mensagem Automática] – Up Valor

Olá! Passando pra lembrar que o dia do seu pagamento {semanal|quinzenal|mensal} com a agência Up Valor é hoje. 
Essa é uma mensagem automática só pra te manter informado(a), beleza?

Qualquer dúvida, estamos à disposição.
Obrigada por seguir com a gente! 🚀
💸 Chave Pix para pagamento:
Jefferson K: 48.541.173/0001-43
```

## 3. Goals, Non-Goals & Anti-Goals

- **Goals:**
  - Persistir o campo `whatsapp` (`VARCHAR(30) NULL`) por cliente no banco MySQL (Hostinger) e no banco JSON local (`lib/db.local.js`).
  - Permitir cadastrar/editar o número de WhatsApp tanto no modal **Novo/Editar Cliente** quanto diretamente dentro do modal **Cobrar**.
  - Adicionar o botão **Cobrar** em cada cliente na aba **Clientes** (`ClientesSection.jsx`).
  - No modal **Cobrar**, pré-selecionar a recorrência do contrato do cliente (`Semanal`, `Quinzenal` ou `Mensal`), permitir alternar entre as três opções com atualização imediata da prévia da mensagem, permitir copiar o texto e abrir o WhatsApp (`https://wa.me/55...`) via botão **Cobrar pelo WhatsApp**.
- **Non-Goals:**
  - Integração paga com APIs externas não-oficiais de disparo automático em background.
  - Alteração nas regras de cálculo de saldo, KPIs, geração de parcelas ou exclusão em cascata.
- **Anti-Goals:**
  - Usar `alert()`, `confirm()` ou `prompt()` nativos do navegador no fluxo novo.
  - Expor credenciais hardcoded em arquivos versionados.
  - Bloquear a abertura da janela do WhatsApp por popup blocker após chamadas assíncronas.

## 4. Architecture & Security Constraints

1. **Módulo Puro (`lib/whatsapp/billing.js`):**
   - `BILLING_FREQUENCIES = ['Semanal', 'Quinzenal', 'Mensal']`
   - `sanitizeWhatsappInput(raw)`: remove caracteres fora de `[0-9+\s()-]`, faz `trim()` e limita a 30 caracteres.
   - `normalizeWhatsappNumber(raw)`: extrai dígitos, remove zero inicial de operadora em números de 11–12 dígitos iniciados por `0`, adiciona DDI `55` para números brasileiros de 10 ou 11 dígitos (incluindo DDD `55` do RS sem remover indevidamente o DDD), aceita 12 ou 13 dígitos já iniciados por `55`, e retorna `null` para entradas inválidas.
   - `formatWhatsappDisplay(raw)`: formata dígitos locais como `(DD) XXXX-XXXX` ou `(DD) 9XXXX-XXXX` sem travar a tecla Backspace quando há 1–2 dígitos.
   - `buildWhatsappBillingMessage(frequency)`: valida `frequency` contra allow-list (`Semanal`, `Quinzenal`, `Mensal`, fallback `Mensal`) e gera o texto exato.
   - `buildWhatsappUrl(rawPhone, frequency)`: retorna `https://wa.me/${normalized}?text=${encodeURIComponent(message)}` ou `null` se o telefone for inválido.
2. **Persistência & API (`app/api/clients/route.js`):**
   - Queries parametrizadas (`?`) compatíveis simultaneamente com `mysql2/promise` e com o parser regex de `lib/db.local.js` (`col = ?`).
   - Validação de propriedade (`WHERE id = ? AND user_id = ?`) em todas as operações.
   - Suporte a `action: 'update_whatsapp'` no `PUT /api/clients` para salvar apenas o telefone sem sobrescrever dados contratuais, além do suporte ao campo `whatsapp` no `POST` e no `PUT` completo.
3. **Frontend Modular:**
   - Novo componente dedicado `app/components/modals/WhatsappBillingModal.jsx` (evitando inflar `app/page.jsx`).
   - Abertura de `window.open(url, '_blank', 'noopener,noreferrer')` acionada diretamente no evento de clique antes de `await` de rede para evitar bloqueio de pop-up e proteger contra reverse tabnabbing.
