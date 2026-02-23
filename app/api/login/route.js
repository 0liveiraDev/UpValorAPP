import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    const [users] = await pool.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
    
    if (users.length > 0) {
      const user = users[0];
      delete user.password; // Remove a senha por segurança antes de enviar ao frontend
      return NextResponse.json({ user });
    } else {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Erro no servidor' }, { status: 500 });
  }
}
