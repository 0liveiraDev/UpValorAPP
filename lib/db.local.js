// Banco de dados local baseado em JSON - zero dependências externas
// Arquivo salvo em: database/local-db.json
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'database', 'local-db.json');

const DEFAULT_DB = {
  users: [
    { id: 1, name: 'Administrador', email: 'admin@upvalor.com', password: 'admin123', role: 'admin', created_at: new Date().toISOString() }
  ],
  clients: [],
  client_receivables: [],
  employees: [],
  employee_payments: [],
  transactions: [],
  _seq: { users: 1, clients: 0, client_receivables: 0, employees: 0, employee_payments: 0, transactions: 0 }
};

function load() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (_) { }
  return JSON.parse(JSON.stringify(DEFAULT_DB));
}

function save(db) {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('[LocalDB] save error:', e.message);
  }
}

function seq(db, table) {
  if (!db._seq) db._seq = {};
  db._seq[table] = (db._seq[table] || 0) + 1;
  return db._seq[table];
}

// Normaliza o SQL
function norm(sql) {
  return sql.trim().replace(/\s+/g, ' ');
}

// Extrai o nome da tabela principal do FROM
function tableFrom(sql) {
  const m = sql.match(/FROM\s+([a-z_]+)/i);
  return m ? m[1] : null;
}

// Parse simples de WHERE: "col1 = ? AND col2 = ?"
function parseWhere(whereStr, params, startIdx = 0) {
  if (!whereStr) return { filters: {}, nextIdx: startIdx };
  const parts = whereStr.trim().split(/\s+AND\s+/i);
  const filters = {};
  let idx = startIdx;
  for (const part of parts) {
    // Remove alias prefix: "cr.user_id" → "user_id"
    const col = part.split(/\s*=\s*\?/)[0].trim().replace(/^\w+\./, '');
    filters[col] = params[idx++];
  }
  return { filters, nextIdx: idx };
}

function matchRow(row, filters) {
  return Object.entries(filters).every(([k, v]) => {
    if (v === undefined || v === null) return true;
    return String(row[k]) === String(v);
  });
}

function execQuery(sql, params) {
  const db = load();
  const s = norm(sql);
  const upper = s.toUpperCase();

  // ─── SELECT ────────────────────────────────────────────────────────────────
  if (upper.startsWith('SELECT')) {
    const table = tableFrom(s);
    if (!table || !db[table]) return [[], []];

    let rows = [...(db[table] || [])];

    // WHERE
    const whereM = s.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s*$)/i);
    if (whereM) {
      const { filters } = parseWhere(whereM[1], params, 0);
      rows = rows.filter(r => matchRow(r, filters));
    }

    // JOIN enrichment
    if (/JOIN\s+clients/i.test(s) && table === 'client_receivables') {
      rows = rows.map(r => {
        const c = (db.clients || []).find(x => Number(x.id) === Number(r.client_id));
        return { ...r, client_name: c?.name ?? '', client_role: '' };
      });
    }
    if (/JOIN\s+employees/i.test(s) && table === 'employee_payments') {
      rows = rows.map(r => {
        const e = (db.employees || []).find(x => Number(x.id) === Number(r.employee_id));
        return { ...r, employee_name: e?.name ?? '', employee_role: e?.role ?? '' };
      });
    }

    // ORDER BY
    const orderM = s.match(/ORDER\s+BY\s+(?:\w+\.)?(\w+)(?:\s+(ASC|DESC))?/i);
    if (orderM) {
      const field = orderM[1];
      const dir = (orderM[2] || 'ASC').toUpperCase();
      rows.sort((a, b) => {
        const av = a[field] ?? '';
        const bv = b[field] ?? '';
        if (av < bv) return dir === 'ASC' ? -1 : 1;
        if (av > bv) return dir === 'ASC' ? 1 : -1;
        return 0;
      });
    }

    return [rows, []];
  }

  // ─── INSERT ────────────────────────────────────────────────────────────────
  if (upper.startsWith('INSERT')) {
    const tableM = s.match(/INTO\s+([a-z_]+)\s*\(([^)]+)\)/i);
    if (!tableM) return [{ insertId: 0 }, []];
    const table = tableM[1];
    const cols = tableM[2].split(',').map(c => c.trim());
    if (!db[table]) db[table] = [];
    const newId = seq(db, table);
    const row = { id: newId, created_at: new Date().toISOString() };
    cols.forEach((col, i) => { row[col] = params[i]; });
    db[table].push(row);
    save(db);
    return [{ insertId: newId, affectedRows: 1 }, []];
  }

  // ─── UPDATE ────────────────────────────────────────────────────────────────
  if (upper.startsWith('UPDATE')) {
    const tableM = s.match(/UPDATE\s+([a-z_]+)\s+SET/i);
    if (!tableM) return [{ affectedRows: 0 }, []];
    const table = tableM[1];

    // Extract SET columns
    const setM = s.match(/SET\s+(.+?)\s+WHERE/i);
    const setCols = (setM?.[1] ?? '').split(',').map(c => c.split(/\s*=\s*\?/)[0].trim());

    // Extract WHERE columns
    const whereM = s.match(/WHERE\s+(.+?)\s*$/i);
    const whereParts = (whereM?.[1] ?? '').split(/\s+AND\s+/i);
    const whereCols = whereParts.map(p => p.split(/\s*=\s*\?/)[0].trim().replace(/^\w+\./, ''));

    // Assign values
    let idx = 0;
    const setVals = {};
    setCols.forEach(col => { setVals[col] = params[idx++]; });
    const whereVals = {};
    whereCols.forEach(col => { whereVals[col] = params[idx++]; });

    let affected = 0;
    db[table] = (db[table] || []).map(row => {
      if (matchRow(row, whereVals)) {
        affected++;
        return { ...row, ...setVals };
      }
      return row;
    });
    save(db);
    return [{ affectedRows: affected }, []];
  }

  // ─── DELETE ────────────────────────────────────────────────────────────────
  if (upper.startsWith('DELETE')) {
    const table = tableFrom(s);
    if (!table || !db[table]) return [{ affectedRows: 0 }, []];

    const whereM = s.match(/WHERE\s+(.+?)\s*$/i);
    const whereParts = (whereM?.[1] ?? '').split(/\s+AND\s+/i);
    const whereCols = whereParts.map(p => p.split(/\s*=\s*\?/)[0].trim().replace(/^\w+\./, ''));
    const whereVals = {};
    whereCols.forEach((col, i) => { whereVals[col] = params[i]; });

    // Cascata manual
    if (table === 'clients') {
      const dead = (db.clients || []).filter(r => matchRow(r, whereVals)).map(r => r.id);
      db.client_receivables = (db.client_receivables || []).filter(r => !dead.includes(Number(r.client_id)));
    }
    if (table === 'employees') {
      const dead = (db.employees || []).filter(r => matchRow(r, whereVals)).map(r => r.id);
      db.employee_payments = (db.employee_payments || []).filter(r => !dead.includes(Number(r.employee_id)));
    }

    const before = db[table].length;
    db[table] = db[table].filter(row => !matchRow(row, whereVals));
    const affected = before - db[table].length;
    save(db);
    return [{ affectedRows: affected }, []];
  }

  return [[], []];
}

export const pool = {
  query: async (sql, params = []) => {
    try {
      return execQuery(sql, params);
    } catch (err) {
      console.error('[LocalDB] query error:', err.message, '\nSQL:', sql, '\nParams:', params);
      throw err;
    }
  }
};

export function getPool() { return pool; }
