import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();
    
    // Verifica se já existe
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return NextResponse.json({ error: 'E-mail já está em uso.' }, { status: 400 });

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, password, 'user']
    );
    
    return NextResponse.json({ user: { id: result.insertId, name, email, role: 'user' } });
  } catch (error) {
    return NextResponse.json({ error: 'Erro no servidor' }, { status: 500 });
  }
}