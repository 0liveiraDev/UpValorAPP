import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const [rows] = await pool.query('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC', [userId]);
  return NextResponse.json(rows);
}

export async function POST(request) {
  const data = await request.json();
  const [result] = await pool.query(
    'INSERT INTO transactions (user_id, description, amount, date, type) VALUES (?, ?, ?, ?, ?)',
    [data.userId, data.description, data.amount, data.date, data.type]
  );
  return NextResponse.json({ id: result.insertId, ...data });
}

export async function PUT(request) {
  const data = await request.json();
  await pool.query(
    'UPDATE transactions SET description = ?, amount = ?, date = ?, type = ? WHERE id = ? AND user_id = ?',
    [data.description, data.amount, data.date, data.type, data.id, data.userId]
  );
  return NextResponse.json(data);
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  await pool.query('DELETE FROM transactions WHERE id = ?', [id]);
  return NextResponse.json({ message: 'Transação excluída' });
}