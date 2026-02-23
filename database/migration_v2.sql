-- UpValor v2 — Migration Script
-- Separar clientes/funcionários de seus pagamentos/cobranças

USE u710961292_UpValorBD;

-- 1) Nova tabela de cobranças de clientes (recebíveis)
CREATE TABLE IF NOT EXISTS client_receivables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    user_id INT NOT NULL,
    description VARCHAR(255) NOT NULL DEFAULT 'Cobrança',
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE,
    status ENUM('Pendente', 'Pago', 'Atrasado') DEFAULT 'Pendente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2) Nova tabela de pagamentos de funcionários
CREATE TABLE IF NOT EXISTS employee_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    user_id INT NOT NULL,
    description VARCHAR(255) NOT NULL DEFAULT 'Salário',
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE,
    status ENUM('Pendente', 'Pago') DEFAULT 'Pendente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3) Remover colunas de amount/dueDate/status das tabelas de clients e employees
--    (Só roda se as colunas existirem; seguro para executar múltiplas vezes)
ALTER TABLE clients
    DROP COLUMN IF EXISTS amount,
    DROP COLUMN IF EXISTS dueDate,
    DROP COLUMN IF EXISTS due_date,
    DROP COLUMN IF EXISTS status;

ALTER TABLE employees
    DROP COLUMN IF EXISTS salary,
    DROP COLUMN IF EXISTS status;
