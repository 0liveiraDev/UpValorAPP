import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { cacheInvalidate } from '@/lib/cache';
import { buildReceivableDescription, parseDescValues } from '@/lib/dashboard/format.js';

const NO_STORE_HEADERS = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
};

function stripLegacyCategorySuffix(desc) {
    return String(desc || '')
        .replace(/\s*-\s*(Gest[ãa]o|Tr[áa]fego)\s*$/i, '')
        .trim() || 'Cobrança';
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const clientId = searchParams.get('clientId');
        let rows;
        if (clientId) {
            [rows] = await pool.query(
                `SELECT cr.*, c.name as client_name, c.monthly_fee as client_monthly_fee, c.traffic_cost as client_traffic_cost
           FROM client_receivables cr
           JOIN clients c ON cr.client_id = c.id
           WHERE cr.client_id = ? AND cr.user_id = ? ORDER BY cr.due_date ASC`,
                [clientId, userId]
            );
        } else {
            [rows] = await pool.query(
                `SELECT cr.*, c.name as client_name, c.monthly_fee as client_monthly_fee, c.traffic_cost as client_traffic_cost
           FROM client_receivables cr
           JOIN clients c ON cr.client_id = c.id
           WHERE cr.user_id = ? ORDER BY cr.due_date ASC`,
                [userId]
            );
        }
        return NextResponse.json(rows, { headers: NO_STORE_HEADERS });
    } catch (error) {
        console.error('[API Receivables GET Error]:', error);
        return NextResponse.json({ error: 'Erro ao buscar recebíveis' }, { status: 500, headers: NO_STORE_HEADERS });
    }
}

export async function POST(request) {
    try {
        const data = await request.json();
        const category = data.category === 'trafego' ? 'trafego' : 'gestao';
        const desc = String(data.description || 'Cobrança').trim();
        const amount = Math.round((parseFloat(data.amount) || 0) * 100) / 100;
        const status = data.status || 'Pendente';
        const dueDate = String(data.dueDate || '').split('T')[0];

        // Salvaguarda contra bundles antigos em cache que enviam 2 POSTs seguidos ("... - Gestão" e "... - Tráfego")
        const parsedIncoming = parseDescValues(desc);
        const isLegacySplitPost =
            parsedIncoming.gestao === 0 &&
            parsedIncoming.trafego === 0 &&
            (/\s-\s*(Gest[ãa]o|Tr[áa]fego)\s*$/i.test(desc) || desc.toLowerCase() === 'tráfego' || desc.toLowerCase() === 'trafego');

        if (isLegacySplitPost && data.clientId && data.userId && dueDate) {
            const complementCat = category === 'trafego' ? 'gestao' : 'trafego';
            const [recentRows] = await pool.query(
                `SELECT * FROM client_receivables
                 WHERE client_id = ? AND user_id = ? AND due_date = ? AND status = ? AND category = ?
                 ORDER BY id DESC`,
                [data.clientId, data.userId, dueDate, status, complementCat]
            );
            const candidate = recentRows?.[0];
            if (candidate) {
                const candidateParsed = parseDescValues(candidate.description);
                const createdMs = candidate.created_at ? new Date(candidate.created_at).getTime() : Date.now();
                const ageSeconds = Math.abs(Date.now() - createdMs) / 1000;
                if (candidateParsed.gestao === 0 && candidateParsed.trafego === 0 && ageSeconds <= 60) {
                    const prevAmt = Math.round((parseFloat(candidate.amount) || 0) * 100) / 100;
                    const gestaoVal = category === 'gestao' ? amount : prevAmt;
                    const trafegoVal = category === 'trafego' ? amount : prevAmt;
                    const mergedAmount = Math.round((gestaoVal + trafegoVal) * 100) / 100;
                    const baseTitle = stripLegacyCategorySuffix(candidate.description);
                    const mergedDesc = buildReceivableDescription(baseTitle, gestaoVal, trafegoVal);

                    await pool.query(
                        'UPDATE client_receivables SET description=?, amount=?, due_date=?, status=?, category=? WHERE id=? AND user_id=?',
                        [mergedDesc, mergedAmount, dueDate, status, 'gestao', candidate.id, data.userId]
                    );
                    cacheInvalidate(`receivables:${data.userId}`);
                    return NextResponse.json(
                        { id: candidate.id, ...data, description: mergedDesc, amount: mergedAmount, category: 'gestao', merged: true },
                        { headers: NO_STORE_HEADERS }
                    );
                }
            }
        }

        const [result] = await pool.query(
            'INSERT INTO client_receivables (client_id, user_id, description, amount, due_date, status, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [data.clientId, data.userId, desc, amount, dueDate, status, category]
        );
        cacheInvalidate(`receivables:${data.userId}`);
        return NextResponse.json({ id: result.insertId, ...data }, { headers: NO_STORE_HEADERS });
    } catch (error) {
        console.error('[API Receivables POST Error]:', error);
        return NextResponse.json({ error: 'Erro ao criar recebível' }, { status: 500, headers: NO_STORE_HEADERS });
    }
}

export async function PUT(request) {
    try {
        const data = await request.json();
        const dueDate = String(data.dueDate || data.due_date || '').split('T')[0];
        await pool.query(
            'UPDATE client_receivables SET description=?, amount=?, due_date=?, status=?, category=? WHERE id=? AND user_id=?',
            [data.description, data.amount, dueDate, data.status, data.category === 'trafego' ? 'trafego' : 'gestao', data.id, data.userId]
        );
        cacheInvalidate('receivables:');
        return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
    } catch (error) {
        console.error('[API Receivables PUT Error]:', error);
        return NextResponse.json({ error: 'Erro ao atualizar recebível' }, { status: 500, headers: NO_STORE_HEADERS });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        await pool.query('DELETE FROM client_receivables WHERE id = ?', [id]);
        cacheInvalidate('receivables:');
        return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
    } catch (error) {
        console.error('[API Receivables DELETE Error]:', error);
        return NextResponse.json({ error: 'Erro ao excluir recebível' }, { status: 500, headers: NO_STORE_HEADERS });
    }
}
