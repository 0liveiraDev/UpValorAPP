import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { cacheGet, cacheSet, cacheInvalidate } from '@/lib/cache';
import { withErrorBoundary } from '@/lib/withErrorBoundary';

const TTL = 3 * 60 * 1000; // 3 minutos

export const GET = withErrorBoundary('clients.GET', async (request) => {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  const cacheKey = `clients:${userId}`;
  const cached = cacheGet(cacheKey);
  if (cached) return NextResponse.json(cached);

  const [clients] = await pool.query('SELECT * FROM clients WHERE user_id = ? ORDER BY name ASC', [userId]);
  cacheSet(cacheKey, clients, TTL);
  return NextResponse.json(clients);
});

export const POST = withErrorBoundary('clients.POST', async (request) => {
  const data = await request.json();
  const result = await pool.query(
    'INSERT INTO clients (user_id, name) VALUES (?, ?)',
    [data.userId, data.name]
  );
  cacheInvalidate(`clients:${data.userId}`);
  return NextResponse.json({ id: result[0].insertId, ...data }, { status: 201 });
});

export const PUT = withErrorBoundary('clients.PUT', async (request) => {
  const data = await request.json();
  await pool.query(
    'UPDATE clients SET name = ? WHERE id = ? AND user_id = ?',
    [data.name, data.id, data.userId]
  );
  cacheInvalidate(`clients:${data.userId}`);
  return NextResponse.json({ success: true });
});

export const DELETE = withErrorBoundary('clients.DELETE', async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  // ON DELETE CASCADE vai apagar client_receivables automaticamente
  await pool.query('DELETE FROM clients WHERE id = ?', [id]);
  cacheInvalidate('clients:'); // invalida todos os userId
  return NextResponse.json({ success: true });
});