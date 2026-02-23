import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const [rows] = await pool.query('SELECT * FROM clients WHERE user_id = ? ORDER BY name ASC', [userId]);
  return NextResponse.json(rows);
}

export async function POST(request) {
  const data = await request.json();
  const [result] = await pool.query(
    'INSERT INTO clients (user_id, name) VALUES (?, ?)',
    [data.userId, data.name]
  );
  return NextResponse.json({ id: result.insertId, ...data });
}

export async function PUT(request) {
  const data = await request.json();
  await pool.query(
    'UPDATE clients SET name=? WHERE id=? AND user_id=?',
    [data.name, data.id, data.userId]
  );
  return NextResponse.json({ success: true });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  // ON DELETE CASCADE vai apagar client_receivables automaticamente
  await pool.query('DELETE FROM clients WHERE id = ?', [id]);
  return NextResponse.json({ success: true });
}