import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const employeeId = searchParams.get('employeeId');
    let rows;
    if (employeeId) {
        [rows] = await pool.query(
            'SELECT * FROM employee_payments WHERE employee_id = ? AND user_id = ? ORDER BY due_date ASC',
            [employeeId, userId]
        );
    } else {
        [rows] = await pool.query(
            `SELECT ep.*, e.name as employee_name, e.role as employee_role
       FROM employee_payments ep
       JOIN employees e ON ep.employee_id = e.id
       WHERE ep.user_id = ? ORDER BY ep.due_date ASC`,
            [userId]
        );
    }
    return NextResponse.json(rows);
}

export async function POST(request) {
    const data = await request.json();
    const [result] = await pool.query(
        'INSERT INTO employee_payments (employee_id, user_id, description, amount, due_date, status) VALUES (?, ?, ?, ?, ?, ?)',
        [data.employeeId, data.userId, data.description || 'Salário', data.amount, data.dueDate, data.status || 'Pendente']
    );
    return NextResponse.json({ id: result.insertId, ...data });
}

export async function PUT(request) {
    const data = await request.json();
    await pool.query(
        'UPDATE employee_payments SET description=?, amount=?, due_date=?, status=? WHERE id=? AND user_id=?',
        [data.description, data.amount, data.dueDate, data.status, data.id, data.userId]
    );
    return NextResponse.json({ success: true });
}

export async function DELETE(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    await pool.query('DELETE FROM employee_payments WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
}
