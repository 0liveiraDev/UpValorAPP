import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const clientId = searchParams.get('clientId');
    let rows;
    if (clientId) {
        [rows] = await pool.query(
            'SELECT * FROM client_receivables WHERE client_id = ? AND user_id = ? ORDER BY due_date ASC',
            [clientId, userId]
        );
    } else {
        [rows] = await pool.query(
            `SELECT cr.*, c.name as client_name 
       FROM client_receivables cr
       JOIN clients c ON cr.client_id = c.id
       WHERE cr.user_id = ? ORDER BY cr.due_date ASC`,
            [userId]
        );
    }
    return NextResponse.json(rows);
}

export async function POST(request) {
    const data = await request.json();
    const [result] = await pool.query(
        'INSERT INTO client_receivables (client_id, user_id, description, amount, due_date, status) VALUES (?, ?, ?, ?, ?, ?)',
        [data.clientId, data.userId, data.description || 'Cobrança', data.amount, data.dueDate, data.status || 'Pendente']
    );
    return NextResponse.json({ id: result.insertId, ...data });
}

export async function PUT(request) {
    const data = await request.json();
    await pool.query(
        'UPDATE client_receivables SET description=?, amount=?, due_date=?, status=? WHERE id=? AND user_id=?',
        [data.description, data.amount, data.dueDate, data.status, data.id, data.userId]
    );
    return NextResponse.json({ success: true });
}

export async function DELETE(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    await pool.query('DELETE FROM client_receivables WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
}
