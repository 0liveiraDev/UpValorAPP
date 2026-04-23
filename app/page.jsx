'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LayoutDashboard, Users, Briefcase, Wallet, Settings, LogOut,
  TrendingUp, TrendingDown, AlertCircle, Plus, Edit2, Trash2, ChevronDown, ChevronUp, DollarSign,
  ChevronLeft, ChevronRight, CalendarDays, RefreshCw, XCircle, BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';

const cn = (...classes) => classes.filter(Boolean).join(" ");

const formatMoney = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(value) || 0);
const formatDate = (d) => {
  if (!d) return '—';
  try {
    const str = typeof d === 'string' ? d : (d instanceof Date && !isNaN(d) ? d.toISOString() : String(d));
    if (!str || str === 'null' || str.includes('0000-00-00')) return '—';
    const clean = str.includes('T') ? str.split('T')[0] : str.split(' ')[0];
    const parts = clean.split('-');
    if (parts.length < 3) return '—';
    const [y, m, day] = parts;
    if (!y || !m || !day || y.includes('NaN')) return '—';
    return `${day}/${m}/${y}`;
  } catch (err) {
    return '—';
  }
};
const today = () => new Date().toISOString().split('T')[0];

export const HoverEffect = ({ items, className }) => {
  let [hoveredIndex, setHoveredIndex] = useState(null);
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {items.map((item, idx) => (
        <div key={item?.id} className="relative group block p-2 h-full w-full" onMouseEnter={() => setHoveredIndex(idx)} onMouseLeave={() => setHoveredIndex(null)}>
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span className="absolute inset-0 h-full w-full bg-slate-800/[0.8] block rounded-3xl" layoutId="hoverBackground" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.15 } }} exit={{ opacity: 0, transition: { duration: 0.15, delay: 0.2 } }} />
            )}
          </AnimatePresence>
          <div className="rounded-2xl h-full w-full p-4 overflow-hidden bg-[#151821] border border-white/[0.05] group-hover:border-slate-700 relative z-20 transition-colors">
            <div className="relative z-50 p-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-slate-400 font-medium tracking-wide text-sm">{item.title}</h4>
                {item.icon}
              </div>
              <h3 className="text-3xl font-bold text-white mt-4">{item.value}</h3>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

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

    class Blob {
      constructor() {
        this.radius = Math.random() * 150 + 100;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      }
      update() {
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
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    resize();
    blobs = Array.from({ length: 8 }, () => new Blob());

    function animate() {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      blobs.forEach(b => { b.update(); b.draw(); });
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

const inputClass = "w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500";

const StatusBadge = ({ status }) => {
  const map = {
    'Pago': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Pendente': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Atrasado': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };
  return <span className={`px-3 py-1 rounded-full text-xs font-medium border ${map[status] || map['Pendente']}`}>{status}</span>;
};

const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
function getMonthLabel(year, month) { return `${MONTHS_PT[month]} ${year}`; }

const getPeriodLabel = (periodFilter, selectedYear, selectedMonth) => {
  if (periodFilter === 'Trimestral') {
    const q = Math.floor(selectedMonth / 3) + 1;
    return `${q}º Trimestre ${selectedYear}`;
  }
  if (periodFilter === 'Semanal') {
    const now = new Date();
    if (selectedYear === now.getFullYear() && selectedMonth === now.getMonth()) {
      return "Semana Atual";
    }
    return `1ª Semana de ${MONTHS_PT[selectedMonth].slice(0, 3)} ${selectedYear}`;
  }
  return getMonthLabel(selectedYear, selectedMonth);
};

const isDateInScope = (dateVal, periodFilter, selectedYear, selectedMonth) => {
  if (!dateVal) return false;
  try {
    const clean = dateVal.includes('T') ? dateVal.split('T')[0] : dateVal.split(' ')[0];
    const [y, m, d] = clean.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), 12, 0, 0);
    
    if (periodFilter === 'Trimestral') {
      const q = Math.floor(selectedMonth / 3);
      const dQ = Math.floor(date.getMonth());
      return date.getFullYear() === selectedYear && Math.floor(dQ / 3) === q;
    }
    
    if (periodFilter === 'Semanal') {
      const now = new Date();
      now.setHours(12,0,0,0);
      const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth();
      const baseDate = isCurrentMonth ? now : new Date(selectedYear, selectedMonth, 1, 12, 0, 0);
      
      const start = new Date(baseDate);
      start.setDate(baseDate.getDate() - baseDate.getDay());
      start.setHours(0,0,0,0);
      
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23,59,59,999);
      
      return date >= start && date <= end;
    }
    
    return date.getFullYear() === selectedYear && date.getMonth() === selectedMonth;
  } catch (err) {
    return false;
  }
};

// Calcula faturamento/gastos por mês para gráficos
function buildChartData(receivables, empPayments, months = 6) {
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const label = MONTHS_PT[m].slice(0, 3);
    const faturamento = receivables
      .filter(r => r.category !== 'trafego' && r.status === 'Pago')
      .filter(r => { const rd = new Date(r.due_date || r.dueDate); return rd.getFullYear() === y && rd.getMonth() === m; })
      .reduce((a, b) => a + parseFloat(b.amount), 0);
    const trafego = receivables
      .filter(r => r.category === 'trafego')
      .filter(r => { const rd = new Date(r.due_date || r.dueDate); return rd.getFullYear() === y && rd.getMonth() === m; })
      .reduce((a, b) => a + parseFloat(b.amount), 0);
    const pessoal = empPayments
      .filter(p => { const pd = new Date(p.due_date || p.dueDate); return pd.getFullYear() === y && pd.getMonth() === m; })
      .reduce((a, b) => a + parseFloat(b.amount), 0);
    return { label, faturamento: Math.round(faturamento), trafego: Math.round(trafego), pessoal: Math.round(pessoal) };
  });
}

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
  const [loginError, setLoginError] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [expandedClients, setExpandedClients] = useState({});
  const [expandedEmployees, setExpandedEmployees] = useState({});
  const [periodFilter, setPeriodFilter] = useState('Mensal');

  // Filtro por mês
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth();

  const navigateMonth = (dir) => {
    setSelectedMonth(prev => {
      let m = prev + dir;
      if (m < 0) { setSelectedYear(y => y - 1); return 11; }
      if (m > 11) { setSelectedYear(y => y + 1); return 0; }
      return m;
    });
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  // --- PERSISTÊNCIA DE LOGIN ---
  useEffect(() => {
    const savedUser = localStorage.getItem('upvalor_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('upvalor_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('upvalor_user');
    }
  }, [currentUser]);

  // --- BUSCAR DADOS DO BANCO ---
  const loadData = async () => {
    if (!currentUser) return;

    // Função helper para lidar com o json seguro e garantir arrays
    const safeFetch = async (url, setter) => {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setter(Array.isArray(data) ? data : []);
        } else {
          console.warn(`Erro ao carregar da URL ${url}:`, res.status);
          setter([]);
        }
      } catch (error) {
        console.error(`Falha no fetch para ${url}:`, error);
        setter([]);
      }
    };

    // Buscas independentes: Desta forma se uma der 404/500, a outra continua carregando
    await Promise.allSettled([
      safeFetch(`/api/clients?userId=${currentUser.id}`, setClients),
      safeFetch(`/api/clients/receivables?userId=${currentUser.id}`, setReceivables),
      safeFetch(`/api/employees?userId=${currentUser.id}`, setEmployees),
      safeFetch(`/api/employees/payments?userId=${currentUser.id}`, setEmpPayments),
      safeFetch(`/api/transactions?userId=${currentUser.id}`, setTransactions),
      safeFetch('/api/users', setUsers)
    ]);
  };

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated]);

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

  // Deletar cliente: apaga o cliente (cascata apaga receivables no DB), e as transações vinculadas
  const handleDeleteClient = async (clientId, clientName) => {
    const clientReceivables = receivables.filter(r => r.client_id === clientId);
    for (const r of clientReceivables) {
      if (r.status === 'Pago') {
        await deleteLinkedTransaction(`Recebimento - ${clientName}`);
      }
    }
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
    loadData();
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
    loadData();
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
          userId: currentUser.id,
          contract_months: parseInt(data.contract_months) || 1,
          payment_frequency: data.payment_frequency || 'Mensal',
          monthly_fee: parseFloat(data.monthly_fee) || 0,
          traffic_cost: parseFloat(data.traffic_cost) || 0,
          traffic_frequency: data.traffic_frequency || 'Mensal',
          contract_start: data.contract_start || today(),
        };
        if (isEdit) await fetch('/api/clients', { method: 'PUT', headers, body: JSON.stringify({ id: modal.data.id, ...payload }) });
        else await fetch('/api/clients', { method: 'POST', headers, body: JSON.stringify(payload) });

      } else if (modal.type === 'receivable') {
        const payload = { clientId: modal.parentId, userId: currentUser.id, description: data.description, amount: parseFloat(data.amount), dueDate: data.dueDate, status: data.status || 'Pendente' };
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
    } catch (error) {
      alert("Erro ao salvar.");
    }
  };


  // --- KPIS ---
  const kpis = useMemo(() => {
    // Filtrar pelo escopo temporal escolhido (Semanal, Mensal, Trimestral)
    const scopeRecs = receivables.filter(r => isDateInScope(r.due_date || r.dueDate, periodFilter, selectedYear, selectedMonth));
    const aReceber = scopeRecs.filter(r => r.status !== 'Pago' && r.category !== 'trafego').reduce((a, b) => a + parseFloat(b.amount), 0);
    const aReceberTotal = scopeRecs.filter(r => r.status !== 'Pago').reduce((a, b) => a + parseFloat(b.amount), 0);
    const vencido = receivables.filter(r => r.status === 'Atrasado').reduce((a, b) => a + parseFloat(b.amount), 0);
    const folhaMes = empPayments.filter(p => p.status === 'Pendente' && isDateInScope(p.due_date || p.dueDate, periodFilter, selectedYear, selectedMonth)).reduce((a, b) => a + parseFloat(b.amount), 0);
    const trafego = scopeRecs.filter(r => r.category === 'trafego' && r.status !== 'Pago').reduce((a, b) => a + parseFloat(b.amount), 0);
    const entradas = transactions.filter(t => t.type === 'entrada').reduce((a, b) => a + parseFloat(b.amount), 0);
    const saidas = transactions.filter(t => t.type === 'saida').reduce((a, b) => a + parseFloat(b.amount), 0);
    const saldo = entradas - saidas;
    const contratosAtivos = clients.filter(c => c.contract_status === 'Ativo').length;
    const contratosVencidos = clients.filter(c => c.contract_status === 'Vencido').length;
    return { aReceber, aReceberTotal, vencido, folhaMes, trafego, saldo, contratosAtivos, contratosVencidos };
  }, [receivables, empPayments, transactions, clients, selectedYear, selectedMonth, periodFilter]);

  const kpiItems = [
    { id: "saldo", title: "Saldo Atual", value: formatMoney(kpis.saldo), icon: <Wallet className="text-blue-400 w-5 h-5" /> },
    { id: "receber", title: "Gestão a Receber", value: formatMoney(kpis.aReceber), icon: <TrendingUp className="text-emerald-400 w-5 h-5" /> },
    { id: "trafego", title: "Tráfego Pendente", value: formatMoney(kpis.trafego), icon: <BarChart2 className="text-purple-400 w-5 h-5" /> },
    { id: "folha", title: "Folha do Mês", value: formatMoney(kpis.folhaMes), icon: <Briefcase className="text-orange-400 w-5 h-5" /> }
  ];

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
              <img src="/logo.png" alt="UpValor" className="w-full h-auto object-contain drop-shadow-xl" />
            </div>
          </div>
          {loginError && <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center">{loginError}</div>}
          {isLoginMode ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <input name="email" type="email" placeholder="Seu e-mail" className={inputClass} required />
              <input name="password" type="password" placeholder="Sua senha" className={inputClass} required />
              <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white font-semibold rounded-lg px-4 py-3 shadow-lg shadow-blue-500/25">Entrar no Sistema</button>
              <p className="text-center text-sm text-slate-400 mt-4">Não tem uma conta? <button type="button" onClick={() => setIsLoginMode(false)} className="text-blue-400 hover:text-blue-300 font-medium">Cadastre-se</button></p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <input name="name" type="text" placeholder="Seu nome completo" className={inputClass} required />
              <input name="email" type="email" placeholder="Seu e-mail" className={inputClass} required />
              <input name="password" type="password" placeholder="Escolha uma senha" className={inputClass} required minLength={6} />
              <button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-semibold rounded-lg px-4 py-3 shadow-lg shadow-emerald-500/25 mt-2">Criar Minha Conta</button>
              <p className="text-center text-sm text-slate-400 mt-4">Já tem uma conta? <button type="button" onClick={() => setIsLoginMode(true)} className="text-blue-400 hover:text-blue-300 font-medium">Fazer login</button></p>
            </form>
          )}
        </div>
      </div>
    );
  }

  const neonColor = "#3b82f6";
  const navItems = [
    { name: "painel", label: "Painel", icon: LayoutDashboard },
    { name: "clientes", label: "Clientes", icon: Users },
    { name: "funcionarios", label: "Funcionários", icon: Briefcase },
    { name: "fluxo", label: "Fluxo", icon: Wallet },
    ...(currentUser?.role === 'admin' ? [{ name: "admin", label: "Admin", icon: Settings }] : [])
  ];

  // Cobranças pendentes para o dashboard (mês selecionado)
  const pendingReceivables = receivables.filter(r => {
    if (r.status === 'Pago') return false;
    return isDateInScope(r.due_date || r.dueDate, periodFilter, selectedYear, selectedMonth);
  });
  const pendingEmpPayments = empPayments.filter(p => {
    if (p.status !== 'Pendente') return false;
    return isDateInScope(p.due_date || p.dueDate, periodFilter, selectedYear, selectedMonth);
  });
  const chartData = buildChartData(receivables, empPayments, 6);
  const expiredContracts = clients.filter(c => c.contract_status === 'Vencido');

  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-200 font-sans relative pb-32">
      <div className="fixed top-4 right-4 z-50 flex items-center bg-[#151821]/80 backdrop-blur-md p-1.5 rounded-full border border-white/5 shadow-xl">
        <span className="text-sm font-medium text-white mr-3 ml-4">{currentUser?.name || "Usuário"}</span>
        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-400 rounded-full bg-white/5 mr-1"><LogOut className="w-4 h-4" /></button>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:top-6 md:bottom-auto z-50">
        <div className="flex items-center gap-1 border border-white/[0.08] backdrop-blur-xl py-1.5 px-1.5 rounded-full shadow-2xl bg-[#0A0A0A]/90">
          {navItems.map((item) => {
            const isActive = activeTab === item.name;
            return (
              <button key={item.name} onClick={() => setActiveTab(item.name)} className={cn("relative px-4 md:px-6 py-2.5 rounded-full text-sm font-semibold transition-all", isActive ? "text-white" : "text-white/45 hover:text-white/80")}>
                <span className="relative z-10 hidden md:inline">{item.label}</span>
                <span className="relative z-10 md:hidden flex items-center justify-center"><item.icon size={20} strokeWidth={2.5} /></span>
                {isActive && <motion.div layoutId="lampNav" className="absolute inset-0 w-full bg-white/[0.05] rounded-full -z-0"><div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-t-full" style={{ backgroundColor: neonColor, boxShadow: `0 0 12px 1px ${neonColor}` }} /></motion.div>}
              </button>
            );
          })}
        </div>
      </div>

      <main className="pt-20 md:pt-28 max-w-7xl mx-auto px-3 md:px-8 space-y-6 md:space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-white capitalize">
            {activeTab === 'fluxo' ? 'Fluxo de Caixa' : activeTab === 'painel' ? 'Painel' : activeTab === 'funcionarios' ? 'Funcionários' : activeTab}
          </h1>
          {(activeTab === 'clientes' || activeTab === 'funcionarios') && (
            <button
              onClick={() => setModal({ isOpen: true, type: activeTab === 'clientes' ? 'client' : 'employee', data: null, parentId: null, parentName: '' })}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-blue-500/20 transition-colors"
            >
              <Plus className="w-4 h-4" /><span>{activeTab === 'clientes' ? 'Novo Cliente' : 'Novo Funcionário'}</span>
            </button>
          )}
          {activeTab === 'fluxo' && (
            <button
              onClick={() => setModal({ isOpen: true, type: 'transaction', data: null, parentId: null, parentName: '' })}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-blue-500/20 transition-colors"
            >
              <Plus className="w-4 h-4" /><span>Nova Transação</span>
            </button>
          )}
        </div>

        {/* ===== PAINEL ===== */}
        {activeTab === 'painel' && isClient && (
          <>
            <div className="space-y-4">
              {/* Top Bar: Filtro de Período e Navegação */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Filtro de Período (Semanal/Mensal/Trimestral) */}
                <div className="flex bg-[#151821] p-1 rounded-xl border border-white/5 w-full md:w-auto">
                  {['Semanal', 'Mensal', 'Trimestral'].map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriodFilter(p)}
                      className={cn(
                        "flex-1 md:flex-none px-4 py-1.5 rounded-lg text-sm font-medium transition-all text-center",
                        periodFilter === p ? "bg-blue-600/20 text-blue-400" : "text-slate-400 hover:text-white"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Navegador de Mês */}
                <div className="flex items-center justify-between bg-[#151821] border border-white/5 rounded-xl px-2 py-1 flex-1 max-w-sm">
                  <button onClick={() => navigateMonth(-1)} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-2 px-2">
                    <CalendarDays className="w-4 h-4 text-blue-400" />
                    <span className="text-white font-semibold text-sm whitespace-nowrap">{getPeriodLabel(periodFilter, selectedYear, selectedMonth)}</span>
                    {!isCurrentMonth && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium whitespace-nowrap">Previsão</span>
                    )}
                  </div>
                  <button onClick={() => navigateMonth(1)} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

            {/* KPIs */}
            <HoverEffect items={kpiItems} className="-mx-2" />

            {/* KPIs Extras de Contratos */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#151821] border border-white/5 rounded-xl p-4 text-center">
                <p className="text-slate-400 text-xs mb-1">Contratos Ativos</p>
                <p className="text-2xl font-bold text-emerald-400">{kpis.contratosAtivos}</p>
              </div>
              <div className="bg-[#151821] border border-white/5 rounded-xl p-4 text-center">
                <p className="text-slate-400 text-xs mb-1">Vencidos</p>
                <p className="text-2xl font-bold text-rose-400">{kpis.contratosVencidos}</p>
              </div>
              <div className="bg-[#151821] border border-white/5 rounded-xl p-4 text-center">
                <p className="text-slate-400 text-xs mb-1">Total Clientes</p>
                <p className="text-2xl font-bold text-white">{clients.length}</p>
              </div>
            </div>

            {/* A Receber dos Clientes (mês selecionado) */}
            <div className="space-y-3">
              <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="text-emerald-400 w-5 h-5" />
                {isCurrentMonth ? 'A Receber — ' : 'Previsão — '}{getPeriodLabel(periodFilter, selectedYear, selectedMonth)}
              </h2>
              <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                {pendingReceivables.length === 0 ? (
                  <p className="p-6 text-center text-slate-500 italic text-sm">Nenhuma cobrança neste mês.</p>
                ) : (
                  <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
                    {pendingReceivables.map(r => (
                      <div key={r.id} className="p-4 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-white font-semibold truncate">{r.client_name}</p>
                          <p className="text-slate-400 text-xs mt-0.5 truncate">{r.description}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <StatusBadge status={r.status} />
                            {r.category === 'trafego' && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/20">Tráfego</span>}
                            <span className="text-slate-500 text-xs">{formatDate(r.due_date)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-emerald-400 font-mono font-bold text-sm">{formatMoney(r.amount)}</span>
                          {isCurrentMonth && <button onClick={() => markReceivableAsPaid(r)} className="text-xs text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg hover:bg-blue-500/10 transition-colors whitespace-nowrap">Receber</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* A Pagar aos Funcionários */}
            <div className="space-y-3">
              <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                <Briefcase className="text-orange-400 w-5 h-5" /> A Pagar aos Funcionários
              </h2>
              <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                {pendingEmpPayments.length === 0 ? (
                  <p className="p-6 text-center text-slate-500 italic text-sm">Nenhum pagamento neste mês.</p>
                ) : (
                  <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
                    {pendingEmpPayments.map(p => (
                      <div key={p.id} className="p-4 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-white font-semibold truncate">{p.employee_name}</p>
                          <p className="text-slate-400 text-xs mt-0.5 truncate">{p.employee_role} · {p.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <StatusBadge status={p.status} />
                            <span className="text-slate-500 text-xs">{formatDate(p.due_date)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-rose-400 font-mono font-bold text-sm">{formatMoney(p.amount)}</span>
                          {isCurrentMonth && <button onClick={() => markEmpPaymentAsPaid(p)} className="text-xs text-orange-400 border border-orange-500/20 px-3 py-1.5 rounded-lg hover:bg-orange-500/10 transition-colors whitespace-nowrap">Pagar</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Gráficos — Últimos 6 meses */}
            <div className="space-y-4">
              <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                <BarChart2 className="text-blue-400 w-5 h-5" /> Evolução Financeira (6 meses)
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Faturamento Gestão */}
                <div className="bg-[#151821] border border-white/5 rounded-2xl p-4">
                  <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wide mb-3">Faturamento Gestão</p>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                      <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #ffffff10', borderRadius: 8, color: '#fff', fontSize: 12 }} formatter={v => formatMoney(v)} />
                      <Bar dataKey="faturamento" fill="#10b981" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Gasto Tráfego */}
                <div className="bg-[#151821] border border-white/5 rounded-2xl p-4">
                  <p className="text-purple-400 text-xs font-semibold uppercase tracking-wide mb-3">Custo Tráfego</p>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                      <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #ffffff10', borderRadius: 8, color: '#fff', fontSize: 12 }} formatter={v => formatMoney(v)} />
                      <Bar dataKey="trafego" fill="#a855f7" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Gasto Pessoal */}
                <div className="bg-[#151821] border border-white/5 rounded-2xl p-4">
                  <p className="text-orange-400 text-xs font-semibold uppercase tracking-wide mb-3">Gasto com Pessoal</p>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                      <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #ffffff10', borderRadius: 8, color: '#fff', fontSize: 12 }} formatter={v => formatMoney(v)} />
                      <Bar dataKey="pessoal" fill="#f97316" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Últimas Transações */}
            <div className="space-y-3">
              <h2 className="text-lg md:text-xl font-bold text-white">Últimas Transações</h2>
              <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                {transactions.length === 0 ? (
                  <p className="p-6 text-center text-slate-500 italic text-sm">Nenhuma transação registrada.</p>
                ) : (
                  <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
                    {transactions.slice(0, 5).map(t => (
                      <div key={t.id} className="px-4 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-white font-medium text-sm truncate">{t.description}</p>
                          <p className="text-slate-500 text-xs mt-0.5">{formatDate(t.date)}</p>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="font-mono font-bold text-sm" style={{ color: t.type === 'entrada' ? '#10b981' : '#f43f5e' }}>{t.type === 'entrada' ? '+' : '-'} {formatMoney(t.amount)}</span>
                          <span className={`text-[10px] uppercase font-bold mt-0.5 ${t.type === 'entrada' ? 'text-emerald-400' : 'text-rose-400'}`}>{t.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          </>
        )}


        {/* ===== CLIENTES ===== */}
        {activeTab === 'clientes' && (
          <div className="space-y-4">
            {/* Seção: Contratos Vencidos */}
            {expiredContracts.length > 0 && (
              <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 space-y-3">
                <h3 className="text-rose-400 font-semibold text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Contratos Vencidos ({expiredContracts.length})
                </h3>
                {expiredContracts.map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-[#0f1117]/60 rounded-xl p-3">
                    <div>
                      <p className="text-white font-medium text-sm">{c.name}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{c.contract_months} mês(es) · {c.payment_frequency} · {formatMoney(c.monthly_fee)}/recorrência</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRenewContract(c)}
                        className="flex items-center gap-1 text-xs text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" /> Renovar
                      </button>
                      <button
                        onClick={() => handleCancelContract(c)}
                        className="flex items-center gap-1 text-xs text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                      >
                        <XCircle className="w-3 h-3" /> Cancelar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {clients.filter(c => c.contract_status !== 'Cancelado').length === 0 && (
              <div className="bg-white/5 rounded-2xl p-10 text-center text-slate-500 italic border border-white/5">
                Nenhum cliente ativo. Clique em "Novo Cliente" para começar.
              </div>
            )}
            {clients.filter(c => c.contract_status !== 'Cancelado').map(client => {
              const clientRecs = receivables.filter(r => r.client_id === client.id);
              const isExpanded = expandedClients[client.id];
              const pendingSum = clientRecs.filter(r => r.status !== 'Pago' && r.category !== 'trafego').reduce((a, b) => a + parseFloat(b.amount), 0);
              const trafegoSum = clientRecs.filter(r => r.status !== 'Pago' && r.category === 'trafego').reduce((a, b) => a + parseFloat(b.amount), 0);
              const statusColor = client.contract_status === 'Ativo' ? 'text-emerald-400' : client.contract_status === 'Vencido' ? 'text-rose-400' : 'text-slate-500';
              return (
                <div key={client.id} className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setExpandedClients(prev => ({ ...prev, [client.id]: !prev[client.id] }))} className="text-slate-400 hover:text-white transition-colors">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-semibold">{client.name}</p>
                          <span className={`text-[10px] font-bold uppercase ${statusColor}`}>{client.contract_status || 'Ativo'}</span>
                        </div>
                        <p className="text-slate-500 text-xs mt-0.5">
                          {client.payment_frequency || 'Mensal'} · {client.contract_months || 1} mês(es) ·
                          Gestão: <span className="text-emerald-400">{formatMoney(pendingSum)}</span>
                          {trafegoSum > 0 && <> · Tráfego: <span className="text-purple-400">{formatMoney(trafegoSum)}</span></>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setModal({ isOpen: true, type: 'receivable', data: null, parentId: client.id, parentName: client.name })}
                        className="flex items-center gap-1 text-xs text-emerald-400 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Cobrança
                      </button>
                      {client.contract_status === 'Vencido' && (
                        <button onClick={() => handleRenewContract(client)} className="text-slate-400 hover:text-emerald-400 p-1.5 rounded transition-colors" title="Renovar contrato">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => setModal({ isOpen: true, type: 'client', data: client, parentId: null, parentName: '' })} className="text-slate-400 hover:text-blue-400 p-1.5 rounded transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleCancelContract(client)} className="text-slate-400 hover:text-rose-400 p-1.5 rounded transition-colors" title="Cancelar contrato">
                        <XCircle className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteClient(client.id, client.name)} className="text-slate-400 hover:text-rose-400 p-1.5 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-white/5 p-3 space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                      {clientRecs.length === 0 ? (
                        <p className="text-slate-500 text-sm italic text-center py-2">Nenhuma cobrança registrada.</p>
                      ) : (
                        clientRecs.map(r => (
                          <div key={r.id} className="bg-[#0f1117]/60 rounded-lg p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-slate-300 text-sm font-medium truncate">{r.description}</p>
                                  {r.category === 'trafego' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">Tráfego</span>}
                                </div>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  <StatusBadge status={r.status} />
                                  <span className="text-slate-500 text-xs">{formatDate(r.due_date)}</span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2 shrink-0">
                                <span className="font-mono text-sm font-semibold" style={{ color: r.status === 'Pago' ? '#10b981' : '#e2e8f0' }}>{formatMoney(r.amount)}</span>
                                <div className="flex items-center gap-1">
                                  {r.status !== 'Pago' && <button onClick={() => markReceivableAsPaid(r)} className="text-xs text-blue-400 border border-blue-500/20 px-2 py-1 rounded hover:bg-blue-500/10">Receber</button>}
                                  <button onClick={() => setModal({ isOpen: true, type: 'receivable', data: r, parentId: client.id, parentName: client.name })} className="text-slate-400 hover:text-blue-400 p-1"><Edit2 className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => handleDeleteReceivable(r)} className="text-slate-400 hover:text-rose-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}


        {/* ===== FUNCIONÁRIOS ===== */}
        {activeTab === 'funcionarios' && (
          <div className="space-y-3">
            {employees.length === 0 && (
              <div className="bg-white/5 rounded-2xl p-10 text-center text-slate-500 italic border border-white/5">
                Nenhum funcionário cadastrado. Clique em "Novo Funcionário" para começar.
              </div>
            )}
            {employees.map(emp => {
              const empPays = empPayments.filter(p => p.employee_id === emp.id);
              const isExpanded = expandedEmployees[emp.id];
              const pendingSum = empPays.filter(p => p.status === 'Pendente').reduce((a, b) => a + parseFloat(b.amount), 0);
              return (
                <div key={emp.id} className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <button onClick={() => setExpandedEmployees(prev => ({ ...prev, [emp.id]: !prev[emp.id] }))} className="text-slate-400 hover:text-white transition-colors">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      <div>
                        <p className="text-white font-semibold">{emp.name}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{emp.role} · {empPays.length} pagamento(s) · A pagar: <span className="text-orange-400">{formatMoney(pendingSum)}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setModal({ isOpen: true, type: 'empPayment', data: null, parentId: emp.id, parentName: emp.name })}
                        className="flex items-center gap-1.5 text-xs text-orange-400 border border-orange-500/20 px-3 py-1.5 rounded-lg hover:bg-orange-500/10 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Novo Pagamento
                      </button>
                      <button onClick={() => setModal({ isOpen: true, type: 'employee', data: emp, parentId: null, parentName: '' })} className="text-slate-400 hover:text-blue-400 p-1.5 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteEmployee(emp.id, emp.name)} className="text-slate-400 hover:text-rose-400 p-1.5 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-white/5 p-3 space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                      {empPays.length === 0 ? (
                        <p className="text-slate-500 text-sm italic text-center py-2">Nenhum pagamento registrado.</p>
                      ) : (
                        empPays.map(p => (
                          <div key={p.id} className="bg-[#0f1117]/60 rounded-lg p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-slate-300 text-sm font-medium truncate">{p.description}</p>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  <StatusBadge status={p.status} />
                                  <span className="text-slate-500 text-xs">{formatDate(p.due_date)}</span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2 shrink-0">
                                <span className="font-mono text-sm font-semibold" style={{ color: p.status === 'Pago' ? '#10b981' : '#e2e8f0' }}>{formatMoney(p.amount)}</span>
                                <div className="flex items-center gap-1">
                                  {p.status !== 'Pago' && <button onClick={() => markEmpPaymentAsPaid(p)} className="text-xs text-orange-400 border border-orange-500/20 px-2 py-1 rounded hover:bg-orange-500/10">Pagar</button>}
                                  <button onClick={() => setModal({ isOpen: true, type: 'empPayment', data: p, parentId: emp.id, parentName: emp.name })} className="text-slate-400 hover:text-blue-400 p-1"><Edit2 className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => handleDeleteEmpPayment(p)} className="text-slate-400 hover:text-rose-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ===== FLUXO DE CAIXA ===== */}
        {activeTab === 'fluxo' && (
          <div className="space-y-2">
            {transactions.length === 0 && (
              <div className="bg-white/5 rounded-2xl p-8 text-center text-slate-500 italic border border-white/5">Nenhuma transação registrada.</div>
            )}
            {transactions.map(t => (
              <div key={t.id} className="bg-white/5 rounded-xl border border-white/5 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-sm truncate">{t.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${t.type === 'entrada' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>{t.type}</span>
                      <span className="text-slate-500 text-xs">{formatDate(t.date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono font-bold text-sm" style={{ color: t.type === 'entrada' ? '#10b981' : '#f43f5e' }}>{t.type === 'entrada' ? '+' : '-'} {formatMoney(t.amount)}</span>
                    <div className="flex gap-1">
                      <button onClick={() => setModal({ isOpen: true, type: 'transaction', data: t, parentId: null, parentName: '' })} className="text-slate-400 hover:text-blue-400 p-1"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteTransaction(t)} className="text-slate-400 hover:text-rose-400 p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== ADMIN ===== */}
        {activeTab === 'admin' && (
          <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-[#151821]/80 text-slate-400 text-sm"><th className="p-4">Nome</th><th className="p-4">E-mail</th><th className="p-4">Função</th><th className="p-4 text-right">Ação</th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="p-4 text-white font-medium">{u.name}</td>
                    <td className="p-4 text-slate-400">{u.email}</td>
                    <td className="p-4 capitalize">{u.role}</td>
                    <td className="p-4 text-right">
                      {u.id !== currentUser?.id && (
                        <button onClick={() => handleDeleteUser(u.id)} className="text-slate-400 hover:text-rose-400"><Trash2 className="w-4 h-4 inline" /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
              className="relative bg-[#151821] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 z-10"
            >
              <h3 className="text-xl font-bold text-white mb-1">
                {modal.type === 'client' ? (modal.data ? 'Editar Cliente' : 'Novo Cliente') :
                  modal.type === 'receivable' ? (modal.data ? 'Editar Cobrança' : `Nova Cobrança — ${modal.parentName}`) :
                    modal.type === 'employee' ? (modal.data ? 'Editar Funcionário' : 'Novo Funcionário') :
                      modal.type === 'empPayment' ? (modal.data ? 'Editar Pagamento' : `Novo Pagamento — ${modal.parentName}`) :
                        modal.type === 'transaction' ? (modal.data ? 'Editar Transação' : 'Nova Transação') : 'Dados'}
              </h3>
              {modal.parentName && (modal.type === 'receivable' || modal.type === 'empPayment') && !modal.data &&
                <p className="text-slate-500 text-sm mb-4">Vinculado a: <span className="text-slate-300">{modal.parentName}</span></p>
              }
              <form onSubmit={handleSave} className="space-y-4 mt-4">
                {/* Cliente */}
                {modal.type === 'client' && (
                  <>
                    <input name="name" defaultValue={modal.data?.name} placeholder="Nome da Empresa / Cliente" className={inputClass} required />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 text-xs mb-1 block">Meses de Contrato</label>
                        <input name="contract_months" type="number" min="1" defaultValue={modal.data?.contract_months || 1} className={inputClass} required />
                      </div>
                      <div>
                        <label className="text-slate-400 text-xs mb-1 block">Frequência de Pagamento</label>
                        <select name="payment_frequency" defaultValue={modal.data?.payment_frequency || 'Mensal'} className={inputClass}>
                          <option value="Semanal">Semanal</option>
                          <option value="Quinzenal">Quinzenal</option>
                          <option value="Mensal">Mensal</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 text-xs mb-1 block">Valor da Gestão (R$)</label>
                        <input name="monthly_fee" type="number" step="0.01" defaultValue={modal.data?.monthly_fee || ''} placeholder="0,00" className={inputClass} required />
                      </div>
                      <div>
                        <label className="text-slate-400 text-xs mb-1 block">Data 1º Pagamento</label>
                        <input name="contract_start" type="date" defaultValue={modal.data?.contract_start?.split('T')[0] || today()} className={inputClass} style={{ colorScheme: 'dark' }} required />
                      </div>
                    </div>
                    <div className="border-t border-white/5 pt-3">
                      <p className="text-slate-400 text-xs mb-2">Custo de Tráfego <span className="text-slate-500">(opcional)</span></p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-400 text-xs mb-1 block">Valor Tráfego (R$)</label>
                          <input name="traffic_cost" type="number" step="0.01" defaultValue={modal.data?.traffic_cost || ''} placeholder="0,00" className={inputClass} />
                        </div>
                        <div>
                          <label className="text-slate-400 text-xs mb-1 block">Frequência Tráfego</label>
                          <select name="traffic_frequency" defaultValue={modal.data?.traffic_frequency || 'Mensal'} className={inputClass}>
                            <option value="Semanal">Semanal</option>
                            <option value="Mensal">Mensal</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    {!modal.data && (
                      <p className="text-blue-400/70 text-xs bg-blue-500/5 border border-blue-500/10 rounded-lg px-3 py-2">
                        ℹ️ Todas as cobranças e custos de tráfego serão gerados automaticamente.
                      </p>
                    )}
                  </>
                )}

                {/* Cobrança do cliente */}
                {modal.type === 'receivable' && (
                  <>
                    <input name="description" defaultValue={modal.data?.description || 'Cobrança'} placeholder="Descrição (ex: Serviço de Março)" className={inputClass} required />
                    <input name="amount" type="number" step="0.01" defaultValue={modal.data?.amount} placeholder="Valor (R$)" className={inputClass} required />
                    <input name="dueDate" type="date" defaultValue={modal.data?.due_date?.split('T')[0] || today()} className={inputClass} style={{ colorScheme: 'dark' }} />
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
                        <label className="text-slate-400 text-xs mb-1 block">Meses de Contrato</label>
                        <input name="contract_months" type="number" min="1" defaultValue={modal.data?.contract_months || 1} className={inputClass} required />
                      </div>
                      <div>
                        <label className="text-slate-400 text-xs mb-1 block">Salário Mensal (R$)</label>
                        <input name="salary" type="number" step="0.01" defaultValue={modal.data?.salary || ''} placeholder="0,00" className={inputClass} required />
                      </div>
                    </div>
                    <div>
                      <label className="text-slate-400 text-xs mb-1 block">Data 1º Pagamento</label>
                      <input name="contract_start" type="date" defaultValue={modal.data?.contract_start?.split('T')[0] || today()} className={inputClass} style={{ colorScheme: 'dark' }} required />
                    </div>
                    {!modal.data && (
                      <p className="text-orange-400/70 text-xs bg-orange-500/5 border border-orange-500/10 rounded-lg px-3 py-2">
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
                    <input name="dueDate" type="date" defaultValue={modal.data?.due_date?.split('T')[0] || today()} className={inputClass} style={{ colorScheme: 'dark' }} />
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
                    <input name="date" type="date" defaultValue={modal.data?.date?.split('T')[0] || today()} className={inputClass} style={{ colorScheme: 'dark' }} required />
                    <select name="type" defaultValue={modal.data?.type || 'saida'} className={inputClass}>
                      <option value="saida">Saída (Despesa)</option>
                      <option value="entrada">Entrada (Receita)</option>
                    </select>
                  </>
                )}

                <div className="pt-4 flex justify-end space-x-3">
                  <button type="button" onClick={() => setModal({ isOpen: false, type: '', data: null, parentId: null, parentName: '' })} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">Cancelar</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">Salvar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
