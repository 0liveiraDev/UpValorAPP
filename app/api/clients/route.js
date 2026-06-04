import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { cacheGet, cacheSet, cacheInvalidate } from '@/lib/cache';
import { withErrorBoundary } from '@/lib/withErrorBoundary';

const TTL = 3 * 60 * 1000;

// Gera datas das parcelas com base na frequência e número de meses
function gerarDatas(startDate, frequency, contractMonths) {
  const datas = [];
  const start = new Date(startDate + 'T12:00:00');

  let totalParcelas;
  let intervaloDias;

  if (frequency === 'Mensal') {
    totalParcelas = contractMonths;
    for (let i = 0; i < totalParcelas; i++) {
      const d = new Date(start);
      d.setMonth(d.getMonth() + i);
      datas.push(d.toISOString().split('T')[0]);
    }
  } else if (frequency === 'Quinzenal') {
    totalParcelas = contractMonths * 2;
    intervaloDias = 14;
    for (let i = 0; i < totalParcelas; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i * intervaloDias);
      datas.push(d.toISOString().split('T')[0]);
    }
  } else if (frequency === 'Semanal') {
    totalParcelas = contractMonths * 4;
    intervaloDias = 7;
    for (let i = 0; i < totalParcelas; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i * intervaloDias);
      datas.push(d.toISOString().split('T')[0]);
    }
  }

  return datas;
}

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
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Inserir o cliente com todos os campos de contrato
    const [result] = await conn.query(
      `INSERT INTO clients 
        (user_id, name, contract_months, payment_frequency, monthly_fee, traffic_cost, traffic_frequency, contract_start, contract_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.userId,
        data.name,
        data.contract_months || 1,
        data.payment_frequency || 'Mensal',
        data.monthly_fee || 0,
        data.traffic_cost || 0,
        data.traffic_frequency || 'Mensal',
        data.contract_start || new Date().toISOString().split('T')[0],
        'Ativo'
      ]
    );

    const clientId = result.insertId;

    // 2. Gerar cobranças UNIFICADAS (gestão + tráfego na mesma linha)
    const gestao = parseFloat(data.monthly_fee) || 0;
    const trafego = parseFloat(data.traffic_cost) || 0;
    const totalCobranca = gestao + trafego;

    if (totalCobranca > 0 && data.contract_start) {
      const datas = gerarDatas(data.contract_start, data.payment_frequency || 'Mensal', data.contract_months || 1);
      for (let i = 0; i < datas.length; i++) {
        // Montar descrição detalhada
        let desc = `Gestão: R$${gestao.toFixed(2)}`;
        if (trafego > 0) desc += ` | Tráfego: R$${trafego.toFixed(2)}`;
        desc += ` (${i + 1}/${datas.length})`;

        await conn.query(
          `INSERT INTO client_receivables (client_id, user_id, description, amount, due_date, status)
           VALUES (?, ?, ?, ?, ?, 'Pendente')`,
          [clientId, data.userId, desc, totalCobranca, datas[i]]
        );
      }
    }

    await conn.commit();
    cacheInvalidate(`clients:${data.userId}`);
    cacheInvalidate(`receivables:${data.userId}`);
    return NextResponse.json({ id: clientId, ...data }, { status: 201 });

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

export const PUT = withErrorBoundary('clients.PUT', async (request) => {
  const data = await request.json();

  // Cancelar contrato
  if (data.action === 'cancel') {
    await pool.query(
      'UPDATE clients SET contract_status = ? WHERE id = ? AND user_id = ?',
      ['Cancelado', data.id, data.userId]
    );
    cacheInvalidate(`clients:${data.userId}`);
    return NextResponse.json({ success: true });
  }

  // Renovar contrato: gera novas cobranças com os mesmos termos
  if (data.action === 'renew') {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const newStart = new Date().toISOString().split('T')[0];

      await conn.query(
        `UPDATE clients SET contract_status = ?, contract_start = ?, contract_months = ? WHERE id = ? AND user_id = ?`,
        ['Ativo', newStart, data.contract_months, data.id, data.userId]
      );

      // Gerar cobranças unificadas (gestão + tráfego)
      const gestao = parseFloat(data.monthly_fee) || 0;
      const trafego = parseFloat(data.traffic_cost) || 0;
      const totalCobranca = gestao + trafego;

      if (totalCobranca > 0) {
        const datas = gerarDatas(newStart, data.payment_frequency || 'Mensal', data.contract_months || 1);
        for (let i = 0; i < datas.length; i++) {
          let desc = `Gestão: R$${gestao.toFixed(2)}`;
          if (trafego > 0) desc += ` | Tráfego: R$${trafego.toFixed(2)}`;
          desc += ` (${i + 1}/${datas.length}) (Renovação)`;

          await conn.query(
            `INSERT INTO client_receivables (client_id, user_id, description, amount, due_date, status)
             VALUES (?, ?, ?, ?, ?, 'Pendente')`,
            [data.id, data.userId, desc, totalCobranca, datas[i]]
          );
        }
      }

      await conn.commit();
      cacheInvalidate(`clients:${data.userId}`);
      cacheInvalidate(`receivables:${data.userId}`);
      return NextResponse.json({ success: true });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // Edição normal do cliente
  await pool.query(
    `UPDATE clients SET name = ?, contract_months = ?, payment_frequency = ?, monthly_fee = ?,
      traffic_cost = ?, traffic_frequency = ?, contract_start = ?, contract_status = ?
     WHERE id = ? AND user_id = ?`,
    [
      data.name, data.contract_months, data.payment_frequency, data.monthly_fee,
      data.traffic_cost, data.traffic_frequency, data.contract_start, data.contract_status,
      data.id, data.userId
    ]
  );
  cacheInvalidate(`clients:${data.userId}`);
  return NextResponse.json({ success: true });
});

export const DELETE = withErrorBoundary('clients.DELETE', async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const userId = searchParams.get('userId');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Buscar nome do cliente para limpar transações vinculadas
    const [clientRows] = await conn.query('SELECT name FROM clients WHERE id = ? AND user_id = ?', [id, userId]);
    const clientName = clientRows?.[0]?.name;

    // 2. Deletar todas as cobranças (receivables) do cliente
    await conn.query('DELETE FROM client_receivables WHERE client_id = ? AND user_id = ?', [id, userId]);

    // 3. Deletar transações vinculadas no fluxo de caixa (entradas geradas por pagamentos deste cliente)
    if (clientName) {
      await conn.query('DELETE FROM transactions WHERE user_id = ? AND description = ?', [userId, `Recebimento - ${clientName}`]);
    }

    // 4. Deletar o cliente
    await conn.query('DELETE FROM clients WHERE id = ? AND user_id = ?', [id, userId]);

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  cacheInvalidate(`clients:${userId}`);
  cacheInvalidate(`receivables:${userId}`);
  return NextResponse.json({ success: true });
});