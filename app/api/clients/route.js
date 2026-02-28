import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const [clients] = await pool.query('SELECT * FROM clients WHERE user_id = ? ORDER BY name ASC', [userId]);

    return NextResponse.json(clients);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const result = await pool.query(
      'INSERT INTO clients (user_id, name) VALUES (?, ?)',
      [data.userId, data.name]
    );

    return NextResponse.json({ id: result[0].insertId, ...data }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    await pool.query(
      'UPDATE clients SET name = ? WHERE id = ? AND user_id = ?',
      [data.name, data.id, data.userId]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  // ON DELETE CASCADE vai apagar client_receivables automaticamente
  await pool.query('DELETE FROM clients WHERE id = ?', [id]);
  return NextResponse.json({ success: true });
}