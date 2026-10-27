import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

const repoRoot = path.resolve(import.meta.dirname, '..');
process.chdir(repoRoot);
process.env.USE_LOCAL_DB = 'true';

const rootUrl = pathToFileURL(repoRoot + path.sep).href;
register(
  `data:text/javascript,${encodeURIComponent(`
    export async function resolve(specifier, context, nextResolve) {
      if (specifier === 'next/server') {
        return nextResolve('next/server.js', context);
      }
      if (specifier.startsWith('@/')) {
        const rel = specifier.slice(2);
        const withExt = /\\.[a-z0-9]+$/i.test(rel) ? rel : rel + '.js';
        return nextResolve(new URL(withExt, ${JSON.stringify(rootUrl)}).href, context);
      }
      return nextResolve(specifier, context);
    }
  `)}`
);

const dbPath = path.join(repoRoot, 'database', 'local-db.json');
let hadOriginalDb = false;
let originalDbBytes = null;
let dbSnapshotTaken = false;
let restored = false;

function restoreLocalDb() {
  if (restored || !dbSnapshotTaken) return;
  restored = true;
  if (hadOriginalDb && originalDbBytes !== null) {
    fs.writeFileSync(dbPath, originalDbBytes);
  } else if (!hadOriginalDb && fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
}

process.on('exit', restoreLocalDb);

describe('API /api/clients — persistência de whatsapp (USE_LOCAL_DB=true)', () => {
  let GET;
  let POST;
  let PUT;

  before(async () => {
    if (fs.existsSync(dbPath)) {
      hadOriginalDb = true;
      originalDbBytes = fs.readFileSync(dbPath);
    }
    dbSnapshotTaken = true;

    const seedDb = {
      users: [
        { id: 101, name: 'User A', email: 'a@upvalor.com', password: 'x', role: 'admin', created_at: '2026-10-27T00:00:00.000Z' },
        { id: 202, name: 'User B', email: 'b@upvalor.com', password: 'x', role: 'user', created_at: '2026-10-27T00:00:00.000Z' },
      ],
      clients: [],
      client_receivables: [],
      employees: [],
      employee_payments: [],
      transactions: [],
      _seq: { users: 202, clients: 0, client_receivables: 0, employees: 0, employee_payments: 0, transactions: 0 },
    };
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, JSON.stringify(seedDb, null, 2));

    const routeMod = await import('../app/api/clients/route.js');
    GET = routeMod.GET;
    POST = routeMod.POST;
    PUT = routeMod.PUT;
  });

  after(() => {
    restoreLocalDb();
  });

  test('POST /api/clients salva whatsapp sanitizado e GET retorna o cliente com whatsapp', async () => {
    const createReq = new Request('http://localhost:3000/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 101,
        name: 'Cliente Alpha',
        whatsapp: '  <script>(85) 99999-8888</script>abc  ',
        contract_months: 6,
        payment_frequency: 'Quinzenal',
        monthly_fee: 1500,
        traffic_cost: 500,
        traffic_frequency: 'Mensal',
        contract_start: '2026-10-01',
      }),
    });

    const createRes = await POST(createReq);
    assert.equal(createRes.status, 201);
    const created = await createRes.json();
    assert.ok(created.id);

    // Também cria cliente sem whatsapp -> deve gravar null
    const createEmptyReq = new Request('http://localhost:3000/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 101,
        name: 'Cliente Sem Telefone',
        whatsapp: '   ',
        contract_months: 1,
        payment_frequency: 'Mensal',
        monthly_fee: 800,
        traffic_cost: 0,
        traffic_frequency: 'Mensal',
        contract_start: '2026-10-01',
      }),
    });
    const createEmptyRes = await POST(createEmptyReq);
    assert.equal(createEmptyRes.status, 201);

    const getRes = await GET(new Request('http://localhost:3000/api/clients?userId=101'));
    assert.equal(getRes.status, 200);
    const list = await getRes.json();

    const alpha = list.find((c) => c.name === 'Cliente Alpha');
    assert.ok(alpha, 'Cliente Alpha deve existir na listagem');
    assert.equal(alpha.whatsapp, '(85) 99999-8888');
    assert.equal(Number(alpha.monthly_fee), 1500);
    assert.equal(alpha.payment_frequency, 'Quinzenal');

    const semTel = list.find((c) => c.name === 'Cliente Sem Telefone');
    assert.ok(semTel, 'Cliente Sem Telefone deve existir na listagem');
    assert.equal(semTel.whatsapp, null);
  });

  test('PUT /api/clients com action=update_whatsapp valida id/userId, respeita user_id e preserva demais campos', async () => {
    const listBefore = await (await GET(new Request('http://localhost:3000/api/clients?userId=101'))).json();
    const alpha = listBefore.find((c) => c.name === 'Cliente Alpha');
    assert.ok(alpha);

    // 1. Falha 400 se faltar id ou userId
    const badRes1 = await PUT(
      new Request('http://localhost:3000/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_whatsapp', whatsapp: '(85) 98888-7777' }),
      })
    );
    assert.equal(badRes1.status, 400);

    const badRes2 = await PUT(
      new Request('http://localhost:3000/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alpha.id, action: 'update_whatsapp', whatsapp: '(85) 98888-7777' }),
      })
    );
    assert.equal(badRes2.status, 400);

    // 2. Tentativa com outro userId (202) não deve alterar o cliente de userId 101
    const wrongUserRes = await PUT(
      new Request('http://localhost:3000/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: alpha.id,
          userId: 202,
          action: 'update_whatsapp',
          whatsapp: '(11) 91111-2222',
        }),
      })
    );
    assert.equal(wrongUserRes.status, 200);

    const afterWrongUser = await (await GET(new Request('http://localhost:3000/api/clients?userId=101'))).json();
    const alphaUnchanged = afterWrongUser.find((c) => c.id === alpha.id);
    assert.equal(alphaUnchanged.whatsapp, '(85) 99999-8888');

    // 3. Atualização válida pelo dono (userId: 101)
    const okRes = await PUT(
      new Request('http://localhost:3000/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: alpha.id,
          userId: 101,
          action: 'update_whatsapp',
          whatsapp: '+55 (85) 97777-6666<b>!</b>',
        }),
      })
    );
    assert.equal(okRes.status, 200);
    const okBody = await okRes.json();
    assert.deepEqual(okBody, { success: true, whatsapp: '+55 (85) 97777-6666' });

    // Verifica via GET que o cache foi invalidado e demais campos permaneceram intactos
    const afterOk = await (await GET(new Request('http://localhost:3000/api/clients?userId=101'))).json();
    const alphaUpdated = afterOk.find((c) => c.id === alpha.id);
    assert.equal(alphaUpdated.whatsapp, '+55 (85) 97777-6666');
    assert.equal(Number(alphaUpdated.monthly_fee), 1500);
    assert.equal(Number(alphaUpdated.traffic_cost), 500);
    assert.equal(alphaUpdated.payment_frequency, 'Quinzenal');
    assert.equal(Number(alphaUpdated.contract_months), 6);
  });

  test('PUT /api/clients edição completa atualiza whatsapp quando enviado e preserva quando omitido', async () => {
    const listBefore = await (await GET(new Request('http://localhost:3000/api/clients?userId=101'))).json();
    const alpha = listBefore.find((c) => c.name === 'Cliente Alpha');
    assert.ok(alpha);

    // 0. Falha 400 se faltar id ou userId na edição completa
    const badFullEdit1 = await PUT(
      new Request('http://localhost:3000/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 101, name: 'Sem ID' }),
      })
    );
    assert.equal(badFullEdit1.status, 400);

    const badFullEdit2 = await PUT(
      new Request('http://localhost:3000/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alpha.id, name: 'Sem UserId' }),
      })
    );
    assert.equal(badFullEdit2.status, 400);

    // 1. Edição completa OMITINDO whatsapp -> deve preservar '+55 (85) 97777-6666'
    const editOmitRes = await PUT(
      new Request('http://localhost:3000/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: alpha.id,
          userId: 101,
          name: 'Cliente Alpha Editado',
          contract_months: 12,
          payment_frequency: 'Mensal',
          monthly_fee: 2000,
          traffic_cost: 700,
          traffic_frequency: 'Mensal',
          contract_start: '2026-10-01',
          contract_status: 'Ativo',
        }),
      })
    );
    assert.equal(editOmitRes.status, 200);

    const afterOmit = await (await GET(new Request('http://localhost:3000/api/clients?userId=101'))).json();
    const alphaAfterOmit = afterOmit.find((c) => c.id === alpha.id);
    assert.equal(alphaAfterOmit.name, 'Cliente Alpha Editado');
    assert.equal(Number(alphaAfterOmit.monthly_fee), 2000);
    assert.equal(alphaAfterOmit.whatsapp, '+55 (85) 97777-6666');

    // 2. Edição completa ENVIANDO novo whatsapp -> deve atualizar e sanitizar
    const editWithPhoneRes = await PUT(
      new Request('http://localhost:3000/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: alpha.id,
          userId: 101,
          name: 'Cliente Alpha Final',
          whatsapp: '(55) 99123-4567xyz',
          contract_months: 12,
          payment_frequency: 'Semanal',
          monthly_fee: 2200,
          traffic_cost: 700,
          traffic_frequency: 'Mensal',
          contract_start: '2026-10-01',
          contract_status: 'Ativo',
        }),
      })
    );
    assert.equal(editWithPhoneRes.status, 200);

    const afterWithPhone = await (await GET(new Request('http://localhost:3000/api/clients?userId=101'))).json();
    const alphaAfterWithPhone = afterWithPhone.find((c) => c.id === alpha.id);
    assert.equal(alphaAfterWithPhone.name, 'Cliente Alpha Final');
    assert.equal(alphaAfterWithPhone.payment_frequency, 'Semanal');
    assert.equal(alphaAfterWithPhone.whatsapp, '(55) 99123-4567');
  });

  test('sanitizeWhatsapp limita a 30 caracteres e converte vazio/null para null no update_whatsapp', async () => {
    const listBefore = await (await GET(new Request('http://localhost:3000/api/clients?userId=101'))).json();
    const alpha = listBefore.find((c) => c.name === 'Cliente Alpha Final');
    assert.ok(alpha);

    const longPhone = '+55 (85) 99999-8888 01234567890123456789';
    const truncRes = await PUT(
      new Request('http://localhost:3000/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: alpha.id,
          userId: 101,
          action: 'update_whatsapp',
          whatsapp: longPhone,
        }),
      })
    );
    assert.equal(truncRes.status, 200);
    const truncBody = await truncRes.json();
    assert.equal(truncBody.whatsapp.length, 30);
    assert.equal(truncBody.whatsapp, longPhone.slice(0, 30));

    const clearRes = await PUT(
      new Request('http://localhost:3000/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: alpha.id,
          userId: 101,
          action: 'update_whatsapp',
          whatsapp: '',
        }),
      })
    );
    assert.equal(clearRes.status, 200);
    const clearBody = await clearRes.json();
    assert.deepEqual(clearBody, { success: true, whatsapp: null });
  });
});
