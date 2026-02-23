import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const [rows] = await pool.query('SELECT * FROM employees WHERE user_id = ? ORDER BY name ASC', [userId]);
  return NextResponse.json(rows);
}

export async function POST(request) {
  const data = await request.json();
  const [result] = await pool.query(
    'INSERT INTO employees (user_id, name, role) VALUES (?, ?, ?)',
    [data.userId, data.name, data.role]
  );
  return NextResponse.json({ id: result.insertId, ...data });
}

export async function PUT(request) {
  const data = await request.json();
  await pool.query(
    'UPDATE employees SET name=?, role=? WHERE id=? AND user_id=?',
    [data.name, data.role, data.id, data.userId]
  );
  return NextResponse.json({ success: true });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  // ON DELETE CASCADE vai apagar employee_payments automaticamente
  await pool.query('DELETE FROM employees WHERE id = ?', [id]);
  return NextResponse.json({ success: true });
}
