-- UpValor v3 — Migration Script
-- Adicionar campos de contrato em clients e employees

USE u710961292_UpValorBD;

-- 1) Campos de contrato para clientes
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS contract_months INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS payment_frequency ENUM('Semanal','Quinzenal','Mensal') NOT NULL DEFAULT 'Mensal',
  ADD COLUMN IF NOT EXISTS monthly_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS traffic_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS traffic_frequency ENUM('Semanal','Mensal') NOT NULL DEFAULT 'Mensal',
  ADD COLUMN IF NOT EXISTS contract_start DATE,
  ADD COLUMN IF NOT EXISTS contract_status ENUM('Ativo','Vencido','Cancelado') NOT NULL DEFAULT 'Ativo';

-- 2) Campos de contrato para funcionários
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS contract_months INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS salary DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS contract_start DATE;

-- 3) Adicionar coluna category na tabela client_receivables para distinguir gestão de tráfego
ALTER TABLE client_receivables
  ADD COLUMN IF NOT EXISTS category ENUM('gestao','trafego') NOT NULL DEFAULT 'gestao';
