# Inventário preliminar observado no código

| Fluxo | Dados observados | Evidência |
| --- | --- | --- |
| Cadastro e login | Nome, e-mail, senha e perfil | `app/api/register/route.js`, `app/api/login/route.js` |
| Gestão de clientes | Cadastro, contato WhatsApp, contratos e cobranças | `app/api/clients/route.js`, `app/api/clients/receivables/route.js` |
| Gestão de funcionários | Cadastro e pagamentos | `app/api/employees/route.js`, `app/api/employees/payments/route.js` |
| Cobrança por WhatsApp | Número e mensagem no link aberto pelo usuário | `lib/whatsapp/billing.js` |
| Meta Ads | Identificação da conta, credencial de integração e métricas | `app/api/meta/route.js`, `lib/meta/graph.js` |
| Persistência | MySQL ou JSON local; usuário e preferência de tema no dispositivo | `lib/db.js`, `lib/db.local.js`, `app/page.jsx` |

Bases legais, prazos de retenção, contratos com operadores, identidade do controlador e responsáveis não foram confirmados. Nenhuma base legal foi presumida. Este inventário não é um ROPA final.
