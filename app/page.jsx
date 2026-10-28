'use client';
import Image from 'next/image';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  LayoutDashboard, Users, Briefcase, Wallet, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  parseDescValues,
  parseInstallment,
} from '../lib/dashboard/format.js';
import {
  createPeriod,
  setPeriodFilter,
  shiftPeriod,
  isDateInScope,
  getPeriodLabel,
  isCurrentPeriod,
} from '../lib/dashboard/period.js';
import { buildChartData } from '../lib/dashboard/chartData.js';
import { formatWhatsappDisplay } from '../lib/whatsapp/billing.js';
import AppHeader from './components/AppHeader.jsx';
import DashboardPanel from './components/dashboard/DashboardPanel.jsx';
import ClientesSection from './components/sections/ClientesSection.jsx';
import FuncionariosSection from './components/sections/FuncionariosSection.jsx';
import FluxoSection from './components/sections/FluxoSection.jsx';
import AdminSection from './components/sections/AdminSection.jsx';
import WhatsappBillingModal from './components/modals/WhatsappBillingModal.jsx';

const today = () => new Date().toISOString().split('T')[0];

class LiquidBlob {
  constructor(canvas, colors) {
    this.radius = Math.random() * 150 + 100;
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = (Math.random() - 0.5) * 2;
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }
  update(canvas, mouse) {
    this.x += this.vx;
    this.y += this.vy;
    if (mouse.x !== undefined) {
      const dx = mouse.x - this.x, dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 400) { this.x += dx * 0.01; this.y += dy * 0.01; }
    }
    if (this.x < -this.radius) this.x = canvas.width + this.radius;
    if (this.x > canvas.width + this.radius) this.x = -this.radius;
    if (this.y < -this.radius) this.y = canvas.height + this.radius;
    if (this.y > canvas.height + this.radius) this.y = -this.radius;
  }
  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

// Componente do background líquido animado
function LiquidCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    let blobs = [];
    const mouse = { x: undefined, y: undefined };
    const COLORS = ['#38bdf8', '#818cf8', '#2dd4bf', '#6366f1'];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    resize();
    blobs = Array.from({ length: 8 }, () => new LiquidBlob(canvas, COLORS));

    function animate() {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      blobs.forEach(b => { b.update(canvas, mouse); b.draw(ctx); });
      animId = requestAnimationFrame(animate);
    }
    animate();

    const onMouse = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouse);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, filter: "url('#goo')", background: '#0f172a' }}
    />
  );
}

const loginInputClass = "w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500";
const inputClass = "w-full bg-surface-2 border border-line-strong text-fg placeholder:text-subtle rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('painel');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Dados
  const [clients, setClients] = useState([]);
  const [receivables, setReceivables] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [empPayments, setEmpPayments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);

  // UI
  const [modal, setModal] = useState({ isOpen: false, type: '', data: null, parentId: null, parentName: '' });
  const [billingClientId, setBillingClientId] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [expandedClients, setExpandedClients] = useState({});
  const [expandedEmployees, setExpandedEmployees] = useState({});
  const [loadError, setLoadError] = useState(false);

  // Período
  const [period, setPeriod] = useState(() => createPeriod(new Date()));
  const now = new Date();
  const isCurrent = isCurrentPeriod(period, now);
  const periodLabel = getPeriodLabel(period, now);
  const handleFilterChange = (f) => setPeriod((p) => setPeriodFilter(p, f, new Date()));
  const handleShift = (d) => setPeriod((p) => shiftPeriod(p, d, new Date()));

  useEffect(() => {
    // Preserva a primeira renderização idêntica no servidor e no cliente antes de habilitar a UI.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  // --- PERSISTÊNCIA DE LOGIN COM BIOMETRIA ---
  useEffect(() => {
    const doAutoLogin = async () => {
      const savedUser = localStorage.getItem('upvalor_user');
      if (savedUser) {
        let authSuccess = true;

        // Tentar biometria se estiver no app nativo
        if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
          try {
            const { checkBiometricAvailability, authenticateWithBiometric } = await import('../lib/native/biometric.js');
            const avail = await checkBiometricAvailability();
            
            if (avail.isAvailable) {
              const result = await authenticateWithBiometric('Confirme sua identidade para acessar o painel');
              authSuccess = result;
            }
          } catch (err) {
            console.warn('[Biometric] Erro ao tentar autenticação biométrica:', err);
          }
        }

        if (authSuccess) {
          setCurrentUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
        } else {
          // Falhou biometria (cancelado ou erro), força login manual
          localStorage.removeItem('upvalor_user');
          setIsAuthenticated(false);
        }
      }
      setIsLoaded(true);
    };

    doAutoLogin();
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('upvalor_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('upvalor_user');
    }
  }, [currentUser]);

  // --- BUSCAR DADOS DO BANCO ---
  const loadData = useCallback(async () => {
    if (!currentUser) return;

    // Função helper para lidar com o json seguro e garantir arrays
    const safeFetch = async (url, setter) => {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setter(Array.isArray(data) ? data : []);
          return true;
        } else {
          console.warn(`Erro ao carregar da URL ${url}:`, res.status);
          setter([]);
          return false;
        }
      } catch (error) {
        console.error(`Falha no fetch para ${url}:`, error);
        setter([]);
        return false;
      }
    };

    // Buscas independentes: Desta forma se uma der 404/500, a outra continua carregando
    const results = await Promise.allSettled([
      safeFetch(`/api/clients?userId=${currentUser.id}`, setClients),
      safeFetch(`/api/clients/receivables?userId=${currentUser.id}`, setReceivables),
      safeFetch(`/api/employees?userId=${currentUser.id}`, setEmployees),
      safeFetch(`/api/employees/payments?userId=${currentUser.id}`, setEmpPayments),
      safeFetch(`/api/transactions?userId=${currentUser.id}`, setTransactions),
      safeFetch('/api/users', setUsers)
    ]);
    setLoadError(results.some((r) => r.status === 'rejected' || r.value === false));
  }, [currentUser]);

  useEffect(() => {
    // Sincroniza os dados remotos após o login; mantém o tratamento de falhas das requisições.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isAuthenticated) loadData();
  }, [isAuthenticated, loadData]);

  const billingClient = useMemo(
    () => clients.find((c) => c.id === billingClientId) || null,
    [clients, billingClientId]
  );

  const billingPendingAmount = useMemo(() => {
    if (!billingClientId) return 0;
    return receivables
      .filter((r) => r.client_id === billingClientId && r.status !== 'Pago')
      .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  }, [receivables, billingClientId]);

  const handleSaveClientWhatsapp = useCallback(
    async (clientId, whatsapp) => {
      if (!currentUser?.id || !clientId) {
        return { ok: false, error: 'Sessão inválida.' };
      }
      try {
        const res = await fetch('/api/clients', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: clientId,
            userId: currentUser.id,
            action: 'update_whatsapp',
            whatsapp: whatsapp || '',
          }),
        });
        if (!res.ok) {
          return { ok: false, error: 'Não foi possível salvar o WhatsApp.' };
        }
        await loadData();
        return { ok: true };
      } catch {
        return { ok: false, error: 'Erro de conexão ao salvar o WhatsApp.' };
      }
    },
    [currentUser, loadData]
  );

  // --- AUTH ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: e.target.email.value, password: e.target.password.value })
    });
    const data = await res.json();
    if (res.ok) { setCurrentUser(data.user); setIsAuthenticated(true); }
    else setLoginError(data.error);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: e.target.name.value, email: e.target.email.value, password: e.target.password.value })
    });
    const data = await res.json();
    if (res.ok) { setCurrentUser(data.user); setIsAuthenticated(true); }
    else setLoginError(data.error);
  };

  const handleLogout = () => {
    setIsAuthenticated(false); setCurrentUser(null); setActiveTab('painel'); setIsLoginMode(true);
    localStorage.removeItem('upvalor_user');
  };

  // --- DELETE HELPERS ---
  const deleteLinkedTransaction = async (description) => {
    const linked = transactions.filter(t => t.description.toLowerCase() === description.toLowerCase());
    for (const t of linked) {
      await fetch(`/api/transactions?id=${t.id}&userId=${currentUser.id}`, { method: 'DELETE' });
    }
  };

  // Deletar cliente: o backend faz cascata completa (receivables + transações vinculadas + cliente)
  const handleDeleteClient = async (clientId, clientName) => {
    if (!confirm(`Excluir "${clientName}" e todas as cobranças vinculadas? Esta ação não pode ser desfeita.`)) return;
    await fetch(`/api/clients?id=${clientId}&userId=${currentUser.id}`, { method: 'DELETE' });
    loadData();
  };

  // Deletar cobrança individual do cliente
  const handleDeleteReceivable = async (receivable) => {
    if (receivable.status === 'Pago') {
      // Reverter transação do fluxo de caixa
      await deleteLinkedTransaction(`Recebimento - ${receivable.client_name}`);
    }
    await fetch(`/api/clients/receivables?id=${receivable.id}&userId=${currentUser.id}`, { method: 'DELETE' });
    loadData();
  };

  // Deletar funcionário: cascata apaga payments, e as transações
  const handleDeleteEmployee = async (employeeId, employeeName) => {
    const empPays = empPayments.filter(p => p.employee_id === employeeId);
    for (const p of empPays) {
      if (p.status === 'Pago') {
        await deleteLinkedTransaction(`Salário - ${employeeName}`);
      }
    }
    await fetch(`/api/employees?id=${employeeId}&userId=${currentUser.id}`, { method: 'DELETE' });
    loadData();
  };

  // Deletar pagamento individual de funcionário
  const handleDeleteEmpPayment = async (payment) => {
    if (payment.status === 'Pago') {
      await deleteLinkedTransaction(`Salário - ${payment.employee_name}`);
    }
    await fetch(`/api/employees/payments?id=${payment.id}&userId=${currentUser.id}`, { method: 'DELETE' });
    loadData();
  };

  const handleDeleteUser = async (id) => {
    if (id === currentUser.id) return;
    await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
    setUsers(users.filter(u => u.id !== id));
  };

  // Cancelar contrato do cliente
  const handleCancelContract = async (client) => {
    if (!confirm(`Cancelar o contrato de "${client.name}"? Esta ação não pode ser desfeita.`)) return;
    await fetch('/api/clients', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', id: client.id, userId: currentUser.id })
    });
    loadData();
  };

  // Renovar contrato do cliente com os mesmos termos
  const handleRenewContract = async (client) => {
    await fetch('/api/clients', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'renew',
        id: client.id,
        userId: currentUser.id,
        contract_months: client.contract_months || 1,
        payment_frequency: client.payment_frequency || 'Mensal',
        monthly_fee: parseFloat(client.monthly_fee) || 0,
        traffic_cost: parseFloat(client.traffic_cost) || 0,
        traffic_frequency: client.traffic_frequency || 'Mensal',
      })
    });
    loadData();
  };

  // Deletar transação do fluxo de caixa — e reverter status da cobrança/pagamento
  const handleDeleteTransaction = async (trans) => {
    const desc = trans.description.toLowerCase();
    if (desc.startsWith('recebimento - ')) {
      const clientName = trans.description.substring(14).trim();
      // Reverter cobrança para Pendente
      const receivable = receivables.find(r => r.client_name?.toLowerCase() === clientName.toLowerCase() && r.status === 'Pago');
      if (receivable) {
        await fetch('/api/clients/receivables', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...receivable, status: 'Pendente', userId: currentUser.id, dueDate: receivable.due_date })
        });
      }
    } else if (desc.startsWith('salário - ')) {
      const empName = trans.description.substring(10).trim();
      const payment = empPayments.find(p => p.employee_name?.toLowerCase() === empName.toLowerCase() && p.status === 'Pago');
      if (payment) {
        await fetch('/api/employees/payments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payment, status: 'Pendente', userId: currentUser.id, dueDate: payment.due_date })
        });
      }
    }
    await fetch(`/api/transactions?id=${trans.id}&userId=${currentUser.id}`, { method: 'DELETE' });
    loadData();
  };

  // --- MARCAR COMO PAGO ---
  const markReceivableAsPaid = async (receivable) => {
    await fetch('/api/clients/receivables', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...receivable, status: 'Pago', userId: currentUser.id, dueDate: receivable.due_date })
    });
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: today(), description: `Recebimento - ${receivable.client_name}`, type: 'entrada', amount: receivable.amount, userId: currentUser.id })
    });
    await loadData();
  };

  const markEmpPaymentAsPaid = async (payment) => {
    await fetch('/api/employees/payments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payment, status: 'Pago', userId: currentUser.id, dueDate: payment.due_date })
    });
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: today(), description: `Salário - ${payment.employee_name}`, type: 'saida', amount: payment.amount, userId: currentUser.id })
    });
    await loadData();
  };

  // --- SAVE MODAL ---
  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    const isEdit = !!modal.data;
    const headers = { 'Content-Type': 'application/json' };

    // Helper: criar transação no fluxo de caixa
    const createTransaction = async (description, amount, type) => {
      await fetch('/api/transactions', {
        method: 'POST',
        headers,
        body: JSON.stringify({ date: today(), description, amount: parseFloat(amount), type, userId: currentUser.id })
      });
    };

    try {
      if (modal.type === 'client') {
        const payload = {
          name: data.name,
          whatsapp: data.whatsapp || '',
          userId: currentUser.id,
          contract_months: parseInt(data.contract_months) || 1,
          payment_frequency: data.payment_frequency || 'Mensal',
          monthly_fee: parseFloat(data.monthly_fee) || 0,
          traffic_cost: parseFloat(data.traffic_cost) || 0,
          contract_start: data.contract_start || today(),
        };
        if (isEdit) await fetch('/api/clients', { method: 'PUT', headers, body: JSON.stringify({ id: modal.data.id, ...payload }) });
        else await fetch('/api/clients', { method: 'POST', headers, body: JSON.stringify(payload) });

      } else if (modal.type === 'receivable') {
        const payload = { clientId: modal.parentId, userId: currentUser.id, description: data.description, amount: parseFloat(data.amount), dueDate: data.dueDate, status: data.status || 'Pendente', category: data.category || 'gestao' };
        const oldStatus = modal.data?.status;
        const newStatus = data.status;

        if (isEdit) {
          await fetch('/api/clients/receivables', { method: 'PUT', headers, body: JSON.stringify({ id: modal.data.id, ...payload }) });
          // Mudou de não-Pago para Pago → criar transação
          if (oldStatus !== 'Pago' && newStatus === 'Pago') {
            await createTransaction(`Recebimento - ${modal.parentName}`, data.amount, 'entrada');
          }
          // Mudou de Pago para não-Pago → reverter transação
          if (oldStatus === 'Pago' && newStatus !== 'Pago') {
            await deleteLinkedTransaction(`Recebimento - ${modal.parentName}`);
          }
        } else {
          await fetch('/api/clients/receivables', { method: 'POST', headers, body: JSON.stringify(payload) });
          // Criou já como Pago → criar transação
          if (newStatus === 'Pago') {
            await createTransaction(`Recebimento - ${modal.parentName}`, data.amount, 'entrada');
          }
        }

      } else if (modal.type === 'employee') {
        const payload = {
          name: data.name,
          role: data.role,
          userId: currentUser.id,
          contract_months: parseInt(data.contract_months) || 1,
          salary: parseFloat(data.salary) || 0,
          contract_start: data.contract_start || today(),
        };
        if (isEdit) await fetch('/api/employees', { method: 'PUT', headers, body: JSON.stringify({ id: modal.data.id, ...payload }) });
        else await fetch('/api/employees', { method: 'POST', headers, body: JSON.stringify(payload) });

      } else if (modal.type === 'empPayment') {
        const payload = { employeeId: modal.parentId, userId: currentUser.id, description: data.description, amount: parseFloat(data.amount), dueDate: data.dueDate, status: data.status || 'Pendente' };
        const oldStatus = modal.data?.status;
        const newStatus = data.status;

        if (isEdit) {
          await fetch('/api/employees/payments', { method: 'PUT', headers, body: JSON.stringify({ id: modal.data.id, ...payload }) });
          if (oldStatus !== 'Pago' && newStatus === 'Pago') {
            await createTransaction(`Salário - ${modal.parentName}`, data.amount, 'saida');
          }
          if (oldStatus === 'Pago' && newStatus !== 'Pago') {
            await deleteLinkedTransaction(`Salário - ${modal.parentName}`);
          }
        } else {
          await fetch('/api/employees/payments', { method: 'POST', headers, body: JSON.stringify(payload) });
          if (newStatus === 'Pago') {
            await createTransaction(`Salário - ${modal.parentName}`, data.amount, 'saida');
          }
        }

      } else if (modal.type === 'transaction') {
        const payload = { ...data, amount: parseFloat(data.amount), userId: currentUser.id };
        if (isEdit) await fetch('/api/transactions', { method: 'PUT', headers, body: JSON.stringify({ id: modal.data.id, ...payload }) });
        else await fetch('/api/transactions', { method: 'POST', headers, body: JSON.stringify(payload) });
      }
      loadData();
      setModal({ isOpen: false, type: '', data: null, parentId: null, parentName: '' });
    } catch {
      alert("Erro ao salvar.");
    }
  };

  // --- KPIS ---
  const kpis = useMemo(() => {
    // IDs de clientes cancelados — seus receivables não devem contar nos KPIs
    const cancelledClientIds = new Set(clients.filter(c => c.contract_status === 'Cancelado').map(c => c.id));
    
    // Filtrar pelo escopo temporal E excluir clientes cancelados
    const scopeRecs = receivables.filter(r => {
      if (cancelledClientIds.has(r.client_id)) return false;
      return isDateInScope(r.due_date || r.dueDate, period, now);
    });
    
    // Discriminar gestão vs tráfego via parsing da descrição
    let gestaoAReceber = 0, trafegoAReceber = 0;
    let gestaoRecebido = 0, trafegoRecebido = 0;
    scopeRecs.forEach(r => {
      const parsed = parseDescValues(r.description);
      const amt = parseFloat(r.amount);
      if (parsed.gestao > 0 || parsed.trafego > 0) {
        if (r.status !== 'Pago') { gestaoAReceber += parsed.gestao; trafegoAReceber += parsed.trafego; }
        else { gestaoRecebido += parsed.gestao; trafegoRecebido += parsed.trafego; }
      } else {
        // Cobranças antigas sem parsing (antes da unificação)
        if (r.status !== 'Pago') gestaoAReceber += amt;
        else gestaoRecebido += amt;
      }
    });
    
    const totalAReceber = gestaoAReceber + trafegoAReceber;
    const totalRecebido = gestaoRecebido + trafegoRecebido;
    const vencido = receivables.filter(r => r.status === 'Atrasado').reduce((a, b) => a + parseFloat(b.amount), 0);
    const folhaMes = empPayments.filter(p => p.status === 'Pendente' && isDateInScope(p.due_date || p.dueDate, period, now)).reduce((a, b) => a + parseFloat(b.amount), 0);
    const entradas = transactions.filter(t => t.type === 'entrada').reduce((a, b) => a + parseFloat(b.amount), 0);
    const saidas = transactions.filter(t => t.type === 'saida').reduce((a, b) => a + parseFloat(b.amount), 0);
    const saldo = entradas - saidas;
    const contratosAtivos = clients.filter(c => c.contract_status === 'Ativo').length;
    const contratosVencidos = clients.filter(c => c.contract_status === 'Vencido').length;
    return { gestaoAReceber, trafegoAReceber, totalAReceber, gestaoRecebido, trafegoRecebido, totalRecebido, vencido, folhaMes, saldo, contratosAtivos, contratosVencidos };
    // Preserva a atualização dos KPIs apenas quando dados ou período mudam.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receivables, empPayments, transactions, clients, period]);

  if (!isLoaded) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: '#0f172a' }}>
        {/* SVG Gooey Filter */}
        <svg style={{ position: 'absolute', visibility: 'hidden', width: 0, height: 0 }}>
          <defs>
            <filter id="goo">
              <feGaussianBlur in="SourceGraphic" stdDeviation="40" result="blur" />
              <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 80 -20" result="goo" />
              <feComposite in="SourceGraphic" in2="goo" operator="atop" />
            </filter>
          </defs>
        </svg>

        {/* Canvas com blobs líquidos */}
        <LiquidCanvas />

        {/* Overlay de vidro */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 1, background: 'rgba(15,23,42,0.25)', backdropFilter: 'blur(40px) saturate(120%)', pointerEvents: 'none' }} />

        {/* Card de login */}
        <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-40 h-auto mb-2">
              <Image unoptimized src="/logo.png" alt="UpValor" className="uv-logo-light w-full h-auto object-contain drop-shadow-xl" width="160" height="64" fetchPriority="high" />
              <Image unoptimized src="/logo-dark.png" alt="UpValor" className="uv-logo-dark w-full h-auto object-contain drop-shadow-xl" width="160" height="64" fetchPriority="high" />
            </div>
          </div>
          {loginError && <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center">{loginError}</div>}
          {isLoginMode ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <input name="email" type="email" placeholder="Seu e-mail" className={loginInputClass} required />
              <input name="password" type="password" placeholder="Sua senha" className={loginInputClass} required />
              <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white font-semibold rounded-lg px-4 py-3 shadow-lg shadow-blue-500/25">Entrar no Sistema</button>
              <p className="text-center text-sm text-slate-400 mt-4">Não tem uma conta? <button type="button" onClick={() => setIsLoginMode(false)} className="text-blue-400 hover:text-blue-300 font-medium">Cadastre-se</button></p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <input name="name" type="text" placeholder="Seu nome completo" className={loginInputClass} required />
              <input name="email" type="email" placeholder="Seu e-mail" className={loginInputClass} required />
              <input name="password" type="password" placeholder="Escolha uma senha" className={loginInputClass} required minLength={6} />
              <button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-semibold rounded-lg px-4 py-3 shadow-lg shadow-emerald-500/25 mt-2">Criar Minha Conta</button>
              <p className="text-center text-sm text-slate-400 mt-4">Já tem uma conta? <button type="button" onClick={() => setIsLoginMode(true)} className="text-blue-400 hover:text-blue-300 font-medium">Fazer login</button></p>
            </form>
          )}
        </div>
      </div>
    );
  }

  const navItems = [
    { name: "painel", label: "Painel", icon: LayoutDashboard },
    { name: "clientes", label: "Clientes", icon: Users },
    { name: "funcionarios", label: "Funcionários", icon: Briefcase },
    { name: "fluxo", label: "Fluxo", icon: Wallet },
    ...(currentUser?.role === 'admin' ? [{ name: "admin", label: "Admin", icon: Settings }] : [])
  ];

  // Cobranças pendentes para o dashboard (período selecionado)
  const cancelledIds = new Set(clients.filter(c => c.contract_status === 'Cancelado').map(c => c.id));
  const pendingReceivables = receivables.filter(r => {
    if (r.status === 'Pago') return false;
    if (cancelledIds.has(r.client_id)) return false;
    return isDateInScope(r.due_date || r.dueDate, period, now);
  });
  const pendingEmpPayments = empPayments.filter(p => {
    if (p.status !== 'Pendente') return false;
    return isDateInScope(p.due_date || p.dueDate, period, now);
  });
  const handleReceive = (id) => {
    const item = receivables.find((r) => r.id === id);
    return item ? markReceivableAsPaid(item) : Promise.resolve();
  };

  const handlePay = (id) => {
    const item = empPayments.find((p) => p.id === id);
    return item ? markEmpPaymentAsPaid(item) : Promise.resolve();
  };

  const toggleClientExpand = (id) => {
    setExpandedClients((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleEmpExpand = (id) => {
    setExpandedEmployees((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
      <div className="min-h-screen bg-bg text-fg font-sans relative">
        <AppHeader
          navItems={navItems}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userName={currentUser?.name}
          onLogout={handleLogout}
        />

        <main className="max-w-7xl mx-auto px-3 md:px-8 pt-6 md:pt-8 pb-36 md:pb-24 space-y-6 md:space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === 'painel' && isClient && (
              <motion.div
                key="tab-painel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <DashboardPanel
                  kpis={kpis}
                  period={period}
                  periodLabel={periodLabel}
                  isCurrent={isCurrent}
                  onFilterChange={handleFilterChange}
                  onShift={handleShift}
                  receivableItems={pendingReceivables.map((r) => ({
                    id: r.id,
                    name: r.client_name,
                    detail: r.description,
                    installment: parseInstallment(r.description),
                    dueDate: r.due_date,
                    status: r.status,
                    amount: r.amount,
                  }))}
                  paymentItems={pendingEmpPayments.map((p) => ({
                    id: p.id,
                    name: p.employee_name,
                    detail: [p.employee_role, p.description].filter(Boolean).join(' · '),
                    installment: parseInstallment(p.description),
                    dueDate: p.due_date,
                    status: p.status,
                    amount: p.amount,
                  }))}
                  onReceive={handleReceive}
                  onPay={handlePay}
                  chartData={buildChartData(receivables, empPayments, { months: 6, today: now })}
                  transactions={transactions}
                  contracts={{
                    active: kpis.contratosAtivos,
                    expired: kpis.contratosVencidos,
                    totalClients: clients.filter((c) => c.contract_status !== 'Cancelado').length,
                  }}
                  loadError={loadError}
                  onRetry={loadData}
                />
              </motion.div>
            )}

            {activeTab === 'clientes' && (
              <motion.div
                key="tab-clientes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <ClientesSection
                  clients={clients}
                  receivables={receivables}
                  expandedClients={expandedClients}
                  onToggleExpand={toggleClientExpand}
                  onOpenModal={setModal}
                  onOpenBillingModal={(client) => setBillingClientId(client.id)}
                  onRenewContract={handleRenewContract}
                  onCancelContract={handleCancelContract}
                  onDeleteClient={handleDeleteClient}
                  onMarkReceivablePaid={markReceivableAsPaid}
                  onDeleteReceivable={handleDeleteReceivable}
                />
              </motion.div>
            )}

            {activeTab === 'funcionarios' && (
              <motion.div
                key="tab-funcionarios"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <FuncionariosSection
                  employees={employees}
                  empPayments={empPayments}
                  expandedEmployees={expandedEmployees}
                  onToggleExpand={toggleEmpExpand}
                  onOpenModal={setModal}
                  onDeleteEmployee={handleDeleteEmployee}
                  onMarkEmpPaymentPaid={markEmpPaymentAsPaid}
                  onDeleteEmpPayment={handleDeleteEmpPayment}
                />
              </motion.div>
            )}

            {activeTab === 'fluxo' && (
              <motion.div
                key="tab-fluxo"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <FluxoSection
                  transactions={transactions}
                  onOpenModal={setModal}
                  onDeleteTransaction={handleDeleteTransaction}
                />
              </motion.div>
            )}

            {activeTab === 'admin' && (
              <motion.div
                key="tab-admin"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <AdminSection
                  users={users}
                  currentUserId={currentUser?.id}
                  onDeleteUser={handleDeleteUser}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* ===== MODAL ===== */}
        <AnimatePresence>
          {modal.isOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal({ isOpen: false, type: '', data: null, parentId: null, parentName: '' })} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-surface border border-line-strong rounded-2xl shadow-2xl w-full max-w-md p-6 z-10"
              >
                <h3 className="text-xl font-bold text-fg mb-1">
                  {modal.type === 'client' ? (modal.data ? 'Editar Cliente' : 'Novo Cliente') :
                    modal.type === 'receivable' ? (modal.data ? 'Editar Cobrança' : `Nova Cobrança — ${modal.parentName}`) :
                      modal.type === 'employee' ? (modal.data ? 'Editar Funcionário' : 'Novo Funcionário') :
                        modal.type === 'empPayment' ? (modal.data ? 'Editar Pagamento' : `Novo Pagamento — ${modal.parentName}`) :
                          modal.type === 'transaction' ? (modal.data ? 'Editar Transação' : 'Nova Transação') : 'Dados'}
                </h3>
                {modal.parentName && (modal.type === 'receivable' || modal.type === 'empPayment') && !modal.data &&
                  <p className="text-subtle text-sm mb-4">Vinculado a: <span className="text-fg">{modal.parentName}</span></p>
                }
                <form onSubmit={handleSave} className="space-y-4 mt-4">
                  {/* Cliente */}
                  {modal.type === 'client' && (
                    <>
                      <input name="name" defaultValue={modal.data?.name} placeholder="Nome da Empresa / Cliente" className={inputClass} required />
                      <div>
                        <label className="text-muted text-xs mb-1 block">WhatsApp do Cliente <span className="text-subtle">(com DDD)</span></label>
                        <input
                          name="whatsapp"
                          type="tel"
                          defaultValue={formatWhatsappDisplay(modal.data?.whatsapp || '')}
                          onChange={(e) => {
                            e.target.value = formatWhatsappDisplay(e.target.value);
                          }}
                          placeholder="(85) 99999-9999"
                          className={inputClass}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-muted text-xs mb-1 block">Meses de Contrato</label>
                          <input name="contract_months" type="number" min="1" defaultValue={modal.data?.contract_months || 1} className={inputClass} required />
                        </div>
                        <div>
                          <label className="text-muted text-xs mb-1 block">Frequência de Pagamento</label>
                          <select name="payment_frequency" defaultValue={modal.data?.payment_frequency || 'Mensal'} className={inputClass}>
                            <option value="Semanal">Semanal</option>
                            <option value="Quinzenal">Quinzenal</option>
                            <option value="Mensal">Mensal</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-muted text-xs mb-1 block">Valor da Gestão (R$)</label>
                          <input name="monthly_fee" type="number" step="0.01" defaultValue={modal.data?.monthly_fee || ''} placeholder="0,00" className={inputClass} required />
                        </div>
                        <div>
                          <label className="text-muted text-xs mb-1 block">Data 1º Pagamento</label>
                          <input name="contract_start" type="date" defaultValue={modal.data?.contract_start?.split('T')[0] || today()} className={inputClass} required />
                        </div>
                      </div>
                      <div className="border-t border-line pt-3">
                        <p className="text-muted text-xs mb-2">Custo de Tráfego <span className="text-subtle">(opcional — mesma frequência)</span></p>
                        <div>
                          <label className="text-muted text-xs mb-1 block">Valor Tráfego (R$)</label>
                          <input name="traffic_cost" type="number" step="0.01" defaultValue={modal.data?.traffic_cost || ''} placeholder="0,00" className={inputClass} />
                        </div>
                      </div>
                      {!modal.data && (
                        <p className="text-accent-fg/70 text-xs bg-accent/5 border border-accent/10 rounded-lg px-3 py-2">
                          ℹ️ Todas as cobranças e custos de tráfego serão gerados automaticamente.
                        </p>
                      )}
                    </>
                  )}

                  {/* Cobrança do cliente */}
                  {modal.type === 'receivable' && (
                    <>
                      <div>
                        <label className="text-muted text-xs mb-1 block">Tipo de Cobrança</label>
                        <select name="category" defaultValue={modal.data?.category || 'gestao'} className={inputClass}>
                          <option value="gestao">Gestão</option>
                          <option value="trafego">Tráfego</option>
                        </select>
                      </div>
                      <input name="description" defaultValue={modal.data?.description || 'Cobrança'} placeholder="Descrição (ex: Serviço de Março)" className={inputClass} required />
                      <input name="amount" type="number" step="0.01" defaultValue={modal.data?.amount} placeholder="Valor (R$)" className={inputClass} required />
                      <input name="dueDate" type="date" defaultValue={modal.data?.due_date?.split('T')[0] || today()} className={inputClass} />
                      <select name="status" defaultValue={modal.data?.status || 'Pendente'} className={inputClass}>
                        <option value="Pendente">Pendente</option>
                        <option value="Atrasado">Atrasado</option>
                        <option value="Pago">Pago</option>
                      </select>
                    </>
                  )}

                  {/* Funcionário */}
                  {modal.type === 'employee' && (
                    <>
                      <input name="name" defaultValue={modal.data?.name} placeholder="Nome do Funcionário" className={inputClass} required />
                      <input name="role" defaultValue={modal.data?.role} placeholder="Cargo" className={inputClass} required />
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-muted text-xs mb-1 block">Meses de Contrato</label>
                          <input name="contract_months" type="number" min="1" defaultValue={modal.data?.contract_months || 1} className={inputClass} required />
                        </div>
                        <div>
                          <label className="text-muted text-xs mb-1 block">Salário Mensal (R$)</label>
                          <input name="salary" type="number" step="0.01" defaultValue={modal.data?.salary || ''} placeholder="0,00" className={inputClass} required />
                        </div>
                      </div>
                      <div>
                        <label className="text-muted text-xs mb-1 block">Data 1º Pagamento</label>
                        <input name="contract_start" type="date" defaultValue={modal.data?.contract_start?.split('T')[0] || today()} className={inputClass} required />
                      </div>
                      {!modal.data && (
                        <p className="text-warn/70 text-xs bg-warn/5 border border-warn/10 rounded-lg px-3 py-2">
                          ℹ️ Todos os pagamentos mensais serão gerados automaticamente.
                        </p>
                      )}
                    </>
                  )}

                  {/* Pagamento do funcionário */}
                  {modal.type === 'empPayment' && (
                    <>
                      <input name="description" defaultValue={modal.data?.description || 'Salário'} placeholder="Descrição (ex: Salário Março/2026)" className={inputClass} required />
                      <input name="amount" type="number" step="0.01" defaultValue={modal.data?.amount} placeholder="Valor (R$)" className={inputClass} required />
                      <input name="dueDate" type="date" defaultValue={modal.data?.due_date?.split('T')[0] || today()} className={inputClass} />
                      <select name="status" defaultValue={modal.data?.status || 'Pendente'} className={inputClass}>
                        <option value="Pendente">Pendente</option>
                        <option value="Pago">Pago</option>
                      </select>
                    </>
                  )}

                  {/* Transação */}
                  {modal.type === 'transaction' && (
                    <>
                      <input name="description" defaultValue={modal.data?.description} placeholder="Descrição da Transação" className={inputClass} required />
                      <input name="amount" type="number" step="0.01" defaultValue={modal.data?.amount} placeholder="Valor" className={inputClass} required />
                      <input name="date" type="date" defaultValue={modal.data?.date?.split('T')[0] || today()} className={inputClass} required />
                      <select name="type" defaultValue={modal.data?.type || 'saida'} className={inputClass}>
                        <option value="saida">Saída (Despesa)</option>
                        <option value="entrada">Entrada (Receita)</option>
                      </select>
                    </>
                  )}

                  <div className="pt-4 flex justify-end space-x-3">
                    <button type="button" onClick={() => setModal({ isOpen: false, type: '', data: null, parentId: null, parentName: '' })} className="px-4 py-2 text-muted hover:text-fg transition-colors">Cancelar</button>
                    <button type="submit" className="px-6 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium transition-colors">Salvar</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <WhatsappBillingModal
          isOpen={Boolean(billingClient)}
          client={billingClient}
          pendingAmount={billingPendingAmount}
          onClose={() => setBillingClientId(null)}
          onSaveWhatsapp={handleSaveClientWhatsapp}
        />
      </div>
  );
}
