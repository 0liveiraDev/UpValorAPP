import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const [rows] = await pool.query('SELECT id, name, email, role FROM users');
  return NextResponse.json(rows);
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  await pool.query('DELETE FROM users WHERE id = ?', [id]);
  return NextResponse.json({ success: true });
}