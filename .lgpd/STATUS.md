# Verificação pré-publicação — UpValor

Data: 2026-11-10. Cenário: sistema existente com atualização visual.
Escopo: diagnóstico de código para a publicação do commit `399bf33`; não constitui auditoria jurídica completa.

## Resultado

Publicação ainda não liberada pela regra pré-publicação fornecida pelo usuário: não foi localizada política de privacidade ou canal de contato de privacidade no repositório. Esses recursos podem existir externamente, mas sua existência não foi confirmada.

- Merge fast-forward concluído na `main` local.
- Nenhum push da `main` realizado nesta etapa.
- O diff em relação à main remota não modifica APIs ou integrações de dados.
- Não encontrados scripts de Meta Pixel, Google Analytics ou chamadas `fbq`/`gtag` em `app`, `lib` e `public`. A integração de consulta à Meta Ads é distinta de um pixel de rastreamento.
- Banco local de testes e credenciais não fazem parte do commit.

## Evidências e próximos passos

Ver `data-map.md` e `gaps.md`. Confirmar URL da política e canal de privacidade existentes. Se inexistentes, fornecer identificação do controlador e contato responsável para preparar documentos para revisão, sem inventar dados institucionais.

Critério de bloqueio: instruções do projeto exigem política e canal ativos antes de publicação de sistemas com dados pessoais. Não é uma conclusão de que todo item ausente no repositório inexiste na organização.
