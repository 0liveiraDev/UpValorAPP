import { getPoolInstance } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    const pool = getPoolInstance();
    const [users] = await pool.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);

    if (users && users.length > 0) {
      const user = users[0];
      delete user.password; // Remove a senha por segurança antes de enviar ao frontend
      return NextResponse.json({ user });
    } else {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 });
    }
  } catch (error) {
    // 👇 ESTA É A LINHA NOVA QUE VAI MOSTRAR O VERDADEIRO PROBLEMA:
    console.error("=== ERRO DETALHADO DA API DE LOGIN ===", error);

    return NextResponse.json({ error: `Erro B.D: ${error.message}` }, { status: 500 });
  }
}