import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const [rows] = await pool.query('SELECT * FROM employees WHERE user_id = ? ORDER BY name ASC', [userId]);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('[API Employees GET Error]:', error);
    return NextResponse.json({ error: 'Erro ao buscar funcionários' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const [result] = await pool.query(
      'INSERT INTO employees (user_id, name, role) VALUES (?, ?, ?)',
      [data.userId, data.name, data.role]
    );
    return NextResponse.json({ id: result.insertId, ...data });
  } catch (error) {
    console.error('[API Employees POST Error]:', error);
    return NextResponse.json({ error: 'Erro ao criar funcionário' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    await pool.query(
      'UPDATE employees SET name=?, role=? WHERE id=? AND user_id=?',
      [data.name, data.role, data.id, data.userId]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API Employees PUT Error]:', error);
    return NextResponse.json({ error: 'Erro ao atualizar funcionário' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    // ON DELETE CASCADE vai apagar employee_payments automaticamente
    await pool.query('DELETE FROM employees WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API Employees DELETE Error]:', error);
    return NextResponse.json({ error: 'Erro ao excluir funcionário' }, { status: 500 });
  }
}
