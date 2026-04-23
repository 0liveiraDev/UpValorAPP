import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { cacheGet, cacheSet, cacheInvalidate } from '@/lib/cache';
import { withErrorBoundary } from '@/lib/withErrorBoundary';

const TTL = 3 * 60 * 1000;

export const GET = withErrorBoundary('employees.GET', async (request) => {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  const cacheKey = `employees:${userId}`;
  const cached = cacheGet(cacheKey);
  if (cached) return NextResponse.json(cached);

  const [rows] = await pool.query('SELECT * FROM employees WHERE user_id = ? ORDER BY name ASC', [userId]);
  cacheSet(cacheKey, rows, TTL);
  return NextResponse.json(rows);
});

export const POST = withErrorBoundary('employees.POST', async (request) => {
  const data = await request.json();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO employees (user_id, name, role, contract_months, salary, contract_start)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.userId,
        data.name,
        data.role,
        data.contract_months || 1,
        data.salary || 0,
        data.contract_start || new Date().toISOString().split('T')[0],
      ]
    );

    const employeeId = result.insertId;

    // Gerar pagamentos mensais automaticamente
    if (data.salary > 0 && data.contract_start) {
      const months = data.contract_months || 1;
      const start = new Date(data.contract_start + 'T12:00:00');
      for (let i = 0; i < months; i++) {
        const d = new Date(start);
        d.setMonth(d.getMonth() + i);
        const dueDate = d.toISOString().split('T')[0];
        await conn.query(
          `INSERT INTO employee_payments (employee_id, user_id, description, amount, due_date, status)
           VALUES (?, ?, ?, ?, ?, 'Pendente')`,
          [employeeId, data.userId, `Salário ${i + 1}/${months}`, data.salary, dueDate]
        );
      }
    }

    await conn.commit();
    cacheInvalidate(`employees:${data.userId}`);
    cacheInvalidate(`empPayments:${data.userId}`);
    return NextResponse.json({ id: employeeId, ...data }, { status: 201 });

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

export const PUT = withErrorBoundary('employees.PUT', async (request) => {
  const data = await request.json();
  await pool.query(
    'UPDATE employees SET name=?, role=?, contract_months=?, salary=?, contract_start=? WHERE id=? AND user_id=?',
    [data.name, data.role, data.contract_months, data.salary, data.contract_start, data.id, data.userId]
  );
  cacheInvalidate(`employees:${data.userId}`);
  return NextResponse.json({ success: true });
});

export const DELETE = withErrorBoundary('employees.DELETE', async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  await pool.query('DELETE FROM employees WHERE id = ?', [id]);
  cacheInvalidate('employees:');
  cacheInvalidate('empPayments:');
  return NextResponse.json({ success: true });
});
