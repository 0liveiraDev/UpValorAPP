import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
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
    } catch (error) {
        console.error('[API Employee Payments GET Error]:', error);
        return NextResponse.json({ error: 'Erro ao buscar pagamentos' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const data = await request.json();
        const [result] = await pool.query(
            'INSERT INTO employee_payments (employee_id, user_id, description, amount, due_date, status) VALUES (?, ?, ?, ?, ?, ?)',
            [data.employeeId, data.userId, data.description || 'Salário', data.amount, data.dueDate, data.status || 'Pendente']
        );
        return NextResponse.json({ id: result.insertId, ...data });
    } catch (error) {
        console.error('[API Employee Payments POST Error]:', error);
        return NextResponse.json({ error: 'Erro ao criar pagamento' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const data = await request.json();
        await pool.query(
            'UPDATE employee_payments SET description=?, amount=?, due_date=?, status=? WHERE id=? AND user_id=?',
            [data.description, data.amount, data.dueDate, data.status, data.id, data.userId]
        );
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API Employee Payments PUT Error]:', error);
        return NextResponse.json({ error: 'Erro ao atualizar pagamento' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        await pool.query('DELETE FROM employee_payments WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API Employee Payments DELETE Error]:', error);
        return NextResponse.json({ error: 'Erro ao excluir pagamento' }, { status: 500 });
    }
}
