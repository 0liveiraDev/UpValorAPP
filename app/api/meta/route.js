import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { cacheGet, cacheSet, cacheInvalidate } from '@/lib/cache';
import { withErrorBoundary } from '@/lib/withErrorBoundary';
import { listAdAccounts, getAccountInsights, MetaConfigError } from '@/lib/meta/graph.js';

// Cache curto: evita estourar o rate limit da Meta e deixa a tela rápida.
const TTL = 10 * 60 * 1000;

// Resolve o token exclusivo do usuário para isolamento multi-tenant
async function resolveUserToken(userId) {
  if (!userId) return process.env.META_ACCESS_TOKEN || null;
  try {
    const [rows] = await pool.query('SELECT meta_access_token FROM users WHERE id = ?', [userId]);
    if (rows && rows[0]?.meta_access_token) {
      return rows[0].meta_access_token;
    }
  } catch (err) {
    console.warn('[Meta API] Erro ao buscar token do usuário:', err.message);
  }
  // Se for o usuário principal / admin (id 1 - Jefferson), usa o token padrão do ambiente
  if (String(userId) === '1') {
    return process.env.META_ACCESS_TOKEN || null;
  }
  return null;
}

export const GET = withErrorBoundary('meta.GET', async (request) => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'status';
  const userId = searchParams.get('userId');

  const token = await resolveUserToken(userId);

  if (action === 'status') {
    return NextResponse.json({ configured: Boolean(token) });
  }

  if (!token) {
    return NextResponse.json(
      { error: 'Nenhuma conta da Meta conectada para este usuário.', configured: false },
      { status: 403 }
    );
  }

  try {
    if (action === 'accounts') {
      const key = `meta:accounts:${userId || 'default'}`;
      const cached = cacheGet(key);
      if (cached) return NextResponse.json(cached);
      const accounts = await listAdAccounts(token);
      cacheSet(key, accounts, TTL);
      return NextResponse.json(accounts);
    }

    if (action === 'insights') {
      const accountId = searchParams.get('accountId');
      const preset = searchParams.get('preset') || 'last_30d';
      const key = `meta:insights:${userId || 'default'}:${accountId}:${preset}`;
      const cached = cacheGet(key);
      if (cached) return NextResponse.json(cached);
      const data = await getAccountInsights(accountId, preset, token);
      cacheSet(key, data, TTL);
      return NextResponse.json(data);
    }
  } catch (err) {
    if (err instanceof MetaConfigError) {
      return NextResponse.json({ error: err.message, configured: false }, { status: 503 });
    }
    return NextResponse.json({ error: err.message }, { status: err.status && err.status < 500 ? 400 : 502 });
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
});

export const POST = withErrorBoundary('meta.POST', async (request) => {
  const body = await request.json();
  const { userId, token } = body;
  if (!userId) {
    return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
  }

  await pool.query('UPDATE users SET meta_access_token = ? WHERE id = ?', [token || null, userId]);
  cacheInvalidate(`meta:accounts:${userId}`);
  return NextResponse.json({ success: true });
});
