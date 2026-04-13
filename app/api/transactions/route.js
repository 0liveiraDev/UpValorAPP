import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const [rows] = await pool.query('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC', [userId]);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('[API Transactions GET Error]:', error);
    return NextResponse.json({ error: 'Erro ao buscar transações' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const [result] = await pool.query(
      'INSERT INTO transactions (user_id, description, amount, date, type) VALUES (?, ?, ?, ?, ?)',
      [data.userId, data.description, data.amount, data.date, data.type]
    );
    return NextResponse.json({ id: result.insertId, ...data });
  } catch (error) {
    console.error('[API Transactions POST Error]:', error);
    return NextResponse.json({ error: 'Erro ao criar transação' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    await pool.query(
      'UPDATE transactions SET description = ?, amount = ?, date = ?, type = ? WHERE id = ? AND user_id = ?',
      [data.description, data.amount, data.date, data.type, data.id, data.userId]
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API Transactions PUT Error]:', error);
    return NextResponse.json({ error: 'Erro ao atualizar transação' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    await pool.query('DELETE FROM transactions WHERE id = ?', [id]);
    return NextResponse.json({ message: 'Transação excluída' });
  } catch (error) {
    console.error('[API Transactions DELETE Error]:', error);
    return NextResponse.json({ error: 'Erro ao excluir transação' }, { status: 500 });
  }
}