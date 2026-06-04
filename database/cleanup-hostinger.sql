-- ============================================================
-- SCRIPT DE LIMPEZA DE DADOS ÓRFÃOS - Hostinger (phpMyAdmin)
-- ============================================================
-- Este script remove receivables, transações e pagamentos
-- que pertencem a clientes/funcionários já excluídos.
--
-- COMO USAR:
-- 1. Acesse o painel da Hostinger → hPanel → Banco de Dados → phpMyAdmin
-- 2. Selecione o banco "u710961292_UpValorBD"
-- 3. Clique na aba "SQL"
-- 4. Cole e execute este script
-- ============================================================

-- 1. Remover cobranças (receivables) de clientes que não existem mais
DELETE FROM client_receivables 
WHERE client_id NOT IN (SELECT id FROM clients);

-- 2. Remover pagamentos de funcionários que não existem mais
DELETE FROM employee_payments 
WHERE employee_id NOT IN (SELECT id FROM employees);

-- 3. Remover transações de recebimento vinculadas a clientes que não existem mais
DELETE FROM transactions 
WHERE description LIKE 'Recebimento - %' 
AND SUBSTRING(description, 15) NOT IN (SELECT name FROM clients);

-- 4. Remover transações de salário vinculadas a funcionários que não existem mais
DELETE FROM transactions 
WHERE description LIKE 'Salário - %' 
AND SUBSTRING(description, 11) NOT IN (SELECT name FROM employees);

-- 5. Verificar resultado final
SELECT 'Clientes' AS tabela, COUNT(*) AS total FROM clients
UNION ALL
SELECT 'Cobranças (receivables)', COUNT(*) FROM client_receivables
UNION ALL
SELECT 'Funcionários', COUNT(*) FROM employees
UNION ALL
SELECT 'Pagamentos funcionários', COUNT(*) FROM employee_payments
UNION ALL
SELECT 'Transações', COUNT(*) FROM transactions;
