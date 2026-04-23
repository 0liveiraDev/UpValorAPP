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

    // 2. Gerar recebíveis de gestão automaticamente
    if (data.monthly_fee > 0 && data.contract_start) {
      const datasGestao = gerarDatas(data.contract_start, data.payment_frequency || 'Mensal', data.contract_months || 1);
      for (let i = 0; i < datasGestao.length; i++) {
        await conn.query(
          `INSERT INTO client_receivables (client_id, user_id, description, amount, due_date, status)
           VALUES (?, ?, ?, ?, ?, 'Pendente')`,
          [clientId, data.userId, `Gestão ${i + 1}/${datasGestao.length}`, data.monthly_fee, datasGestao[i]]
        );
      }
    }

    // 3. Gerar recebíveis de tráfego automaticamente
    if (data.traffic_cost > 0 && data.contract_start) {
      const datasTrafico = gerarDatas(data.contract_start, data.traffic_frequency || 'Mensal', data.contract_months || 1);
      for (let i = 0; i < datasTrafico.length; i++) {
        await conn.query(
          `INSERT INTO client_receivables (client_id, user_id, description, amount, due_date, status)
           VALUES (?, ?, ?, ?, ?, 'Pendente')`,
          [clientId, data.userId, `Tráfego ${i + 1}/${datasTrafico.length}`, data.traffic_cost, datasTrafico[i]]
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

      // Gerar novas cobranças de gestão
      if (data.monthly_fee > 0) {
        const datasGestao = gerarDatas(newStart, data.payment_frequency || 'Mensal', data.contract_months || 1);
        for (let i = 0; i < datasGestao.length; i++) {
          await conn.query(
            `INSERT INTO client_receivables (client_id, user_id, description, amount, due_date, status)
             VALUES (?, ?, ?, ?, ?, 'Pendente')`,
            [data.id, data.userId, `Gestão ${i + 1}/${datasGestao.length} (Renovação)`, data.monthly_fee, datasGestao[i]]
          );
        }
      }

      // Gerar novas cobranças de tráfego
      if (data.traffic_cost > 0) {
        const datasTrafico = gerarDatas(newStart, data.traffic_frequency || 'Mensal', data.contract_months || 1);
        for (let i = 0; i < datasTrafico.length; i++) {
          await conn.query(
            `INSERT INTO client_receivables (client_id, user_id, description, amount, due_date, status)
             VALUES (?, ?, ?, ?, ?, 'Pendente')`,
            [data.id, data.userId, `Tráfego ${i + 1}/${datasTrafico.length} (Renovação)`, data.traffic_cost, datasTrafico[i]]
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
  await pool.query('DELETE FROM clients WHERE id = ?', [id]);
  cacheInvalidate('clients:');
  cacheInvalidate('receivables:');
  return NextResponse.json({ success: true });
});