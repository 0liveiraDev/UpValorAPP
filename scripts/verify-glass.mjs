// Validação visual isolada: todas as APIs são interceptadas, sem escrita no banco.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const loadPlaywright = createRequire(import.meta.url);
import path from 'node:path';
const { chromium } = loadPlaywright(process.env.PLAYWRIGHT_MODULE || path.join(process.env.APPDATA, 'npm/node_modules/@playwright/mcp/node_modules/playwright-core'));
const out = path.resolve('docs/validation/glassmorphism');
const client = { id: 1, name: 'Cliente visual & caracteres especiais — '.repeat(4), contract_status: 'Ativo', monthly_fee: 450, traffic_cost: 450, meta_ad_account_id: 'act_123', whatsapp: '5511999999999', start_date: '2026-11-01' };
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    let data = [];
    if (url.pathname === '/api/clients') data = [client];
    if (url.pathname === '/api/meta') data = url.searchParams.get('action') === 'status' ? { configured: true } : url.searchParams.get('action') === 'accounts' ? { accounts: [{ id: 'act_123', name: 'Conta fictícia' }] } : { totals: {}, campaigns: [] };
    await route.fulfill({ json: data });
  });
  const results = [];
  async function capture(name) {
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(650); // Aguarda as transições existentes terminarem.
    const checks = await page.evaluate(() => {
      const visible = el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
      const blur = el => !['none', ''].includes(getComputedStyle(el).backdropFilter);
      const nested = [...document.querySelectorAll('*')].filter(el => visible(el) && blur(el)).filter(el => {
        for (let p = el.parentElement; p; p = p.parentElement) if (blur(p)) return true;
        return false;
      }).map(el => el.className);
      return { overflow: document.documentElement.scrollWidth > innerWidth, nested, fonts: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family) };
    });
    results.push({ name, ...checks });
    await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
  }
  await page.goto('http://localhost:3099');
  await page.locator('input[name=email]').waitFor();
  for (const theme of ['dark', 'light']) for (const width of [1366, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 768 });
    await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
    await capture(`login-${theme}-${width}`);
  }
  await page.evaluate(() => localStorage.setItem('upvalor_user', JSON.stringify({ id: 999999, name: 'Validação visual', role: 'admin' })));
  await page.reload();
  for (const theme of ['dark', 'light']) for (const width of [1366, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 768 });
    await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
    for (const tab of ['Painel', 'Clientes', 'Funcionários', 'Fluxo', 'Anúncios', 'Admin']) {
      const nav = page.getByRole('navigation', { name: width === 390 ? 'Navegação móvel' : 'Principal', exact: true });
      await nav.getByRole('button', { name: tab, exact: true }).click();
      await capture(`${tab}-${theme}-${width}`);
      if (tab === 'Clientes') {
        await page.getByRole('button', { name: 'Novo Cliente', exact: true }).click();
        await capture(`crud-${theme}-${width}`);
        await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
        await page.getByRole('button', { name: 'Cobrar', exact: true }).first().click();
        await capture(`whatsapp-${theme}-${width}`);
        await page.getByRole('button', { name: 'Fechar modal de cobrança', exact: true }).click();
      }
      if (tab === 'Anúncios') {
        await page.getByRole('button', { name: 'Configurar Token', exact: true }).click();
        await capture(`token-${theme}-${width}`);
        await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
        await page.getByText(client.name, { exact: true }).first().click();
        await capture(`metricas-${theme}-${width}`);
        if (width === 390) await page.getByRole('button', { name: 'Fechar pop-up', exact: true }).click();
      }
    }
  }
  await page.emulateMedia({ reducedTransparency: 'reduce' });
  await capture('transparencia-reduzida');
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ results, errors }, null, 2));
  console.log(JSON.stringify({ captures: results.length, failures: results.filter(r => r.overflow || r.nested.length), errors }));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
