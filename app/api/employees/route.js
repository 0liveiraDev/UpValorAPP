import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { cacheGet, cacheSet, cacheInvalidate } from '@/lib/cache';
import { withErrorBoundary } from '@/lib/withErrorBoundary';

const TTL = 3 * 60 * 1000; // 3 minutos

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
  const [result] = await pool.query(
    'INSERT INTO employees (user_id, name, role) VALUES (?, ?, ?)',
    [data.userId, data.name, data.role]
  );
  cacheInvalidate(`employees:${data.userId}`);
  return NextResponse.json({ id: result.insertId, ...data });
});

export const PUT = withErrorBoundary('employees.PUT', async (request) => {
  const data = await request.json();
  await pool.query(
    'UPDATE employees SET name=?, role=? WHERE id=? AND user_id=?',
    [data.name, data.role, data.id, data.userId]
  );
  cacheInvalidate(`employees:${data.userId}`);
  return NextResponse.json({ success: true });
});

export const DELETE = withErrorBoundary('employees.DELETE', async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  // ON DELETE CASCADE vai apagar employee_payments automaticamente
  await pool.query('DELETE FROM employees WHERE id = ?', [id]);
  cacheInvalidate('employees:'); // invalida todos os userId
  return NextResponse.json({ success: true });
});

