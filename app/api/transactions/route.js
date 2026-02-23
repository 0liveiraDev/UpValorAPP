import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const [rows] = await pool.query('SELECT * FROM transactions ORDER BY date DESC');
  return NextResponse.json(rows);
}

export async function POST(request) {
  const data = await request.json();
  const [result] = await pool.query(
    'INSERT INTO transactions (description, amount, date, type) VALUES (?, ?, ?, ?)',
    [data.description, data.amount, data.date, data.type]
  );
  return NextResponse.json({ id: result.insertId, ...data });
}