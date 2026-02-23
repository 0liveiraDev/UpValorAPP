// Script de migração — roda direto pelo Node.js
// Execute com: node database/migrate.js
require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function migrate() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    console.log('✅ Conectado ao banco de dados.');

    try {
        // 1. Criar tabela de cobranças de clientes
        await conn.execute(`
      CREATE TABLE IF NOT EXISTS client_receivables (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        user_id INT NOT NULL,
        description VARCHAR(255) NOT NULL DEFAULT 'Cobranca',
        amount DECIMAL(10, 2) NOT NULL,
        due_date DATE,
        status ENUM('Pendente', 'Pago', 'Atrasado') DEFAULT 'Pendente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
        console.log('✅ Tabela client_receivables criada/verificada.');

        // 2. Criar tabela de pagamentos de funcionários
        await conn.execute(`
      CREATE TABLE IF NOT EXISTS employee_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        user_id INT NOT NULL,
        description VARCHAR(255) NOT NULL DEFAULT 'Salario',
        amount DECIMAL(10, 2) NOT NULL,
        due_date DATE,
        status ENUM('Pendente', 'Pago') DEFAULT 'Pendente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
        console.log('✅ Tabela employee_payments criada/verificada.');

        // 3. Remover colunas antigas de clients (amount, due_date, status)
        const [clientCols] = await conn.execute(`SHOW COLUMNS FROM clients LIKE 'amount'`);
        if (clientCols.length > 0) {
            await conn.execute(`ALTER TABLE clients DROP COLUMN amount`);
            console.log('✅ Coluna amount removida de clients.');
        }
        const [clientDueCols] = await conn.execute(`SHOW COLUMNS FROM clients LIKE 'due_date'`);
        if (clientDueCols.length > 0) {
            await conn.execute(`ALTER TABLE clients DROP COLUMN due_date`);
            console.log('✅ Coluna due_date removida de clients.');
        }
        const [clientStatusCols] = await conn.execute(`SHOW COLUMNS FROM clients LIKE 'status'`);
        if (clientStatusCols.length > 0) {
            await conn.execute(`ALTER TABLE clients DROP COLUMN status`);
            console.log('✅ Coluna status removida de clients.');
        }
        const [clientDueDateCols] = await conn.execute(`SHOW COLUMNS FROM clients LIKE 'dueDate'`);
        if (clientDueDateCols.length > 0) {
            await conn.execute(`ALTER TABLE clients DROP COLUMN dueDate`);
            console.log('✅ Coluna dueDate removida de clients.');
        }

        // 4. Remover colunas antigas de employees (salary, status)
        const [empSalaryCols] = await conn.execute(`SHOW COLUMNS FROM employees LIKE 'salary'`);
        if (empSalaryCols.length > 0) {
            await conn.execute(`ALTER TABLE employees DROP COLUMN salary`);
            console.log('✅ Coluna salary removida de employees.');
        }
        const [empStatusCols] = await conn.execute(`SHOW COLUMNS FROM employees LIKE 'status'`);
        if (empStatusCols.length > 0) {
            await conn.execute(`ALTER TABLE employees DROP COLUMN status`);
            console.log('✅ Coluna status removida de employees.');
        }

        console.log('\n🎉 Migração concluída com sucesso!');
    } catch (err) {
        console.error('❌ Erro durante a migração:', err.message);
    } finally {
        await conn.end();
    }
}

migrate();
