'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, Users, Briefcase, Wallet, Settings, LogOut,
  TrendingUp, TrendingDown, AlertCircle, Plus, Edit2, Trash2, ChevronDown, ChevronUp, DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const cn = (...classes) => classes.filter(Boolean).join(" ");

const formatMoney = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(value) || 0);
const formatDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
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

const inputClass = "w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500";
const StatusBadge = ({ status }) => {
  const map = {
    'Pago': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Pendente': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Atrasado': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };
  return <span className={`px-3 py-1 rounded-full text-xs font-medium border ${map[status] || map['Pendente']}`}>{status}</span>;
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('painel');
  const [isLoaded, setIsLoaded] = useState(false);

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
    try {
      const [cliRes, recRes, empRes, payRes, traRes, usrRes] = await Promise.all([
        fetch(`/api/clients?userId=${currentUser.id}`),
        fetch(`/api/clients/receivables?userId=${currentUser.id}`),
        fetch(`/api/employees?userId=${currentUser.id}`),
        fetch(`/api/employees/payments?userId=${currentUser.id}`),
        fetch(`/api/transactions?userId=${currentUser.id}`),
        fetch('/api/users')
      ]);
      setClients(await cliRes.json());
      setReceivables(await recRes.json());
      setEmployees(await empRes.json());
      setEmpPayments(await payRes.json());
      setTransactions(await traRes.json());
      setUsers(await usrRes.json());
    } catch (error) {
      console.error("Erro ao carregar dados", error);
    }
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
        const payload = { name: data.name, userId: currentUser.id };
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
        const payload = { name: data.name, role: data.role, userId: currentUser.id };
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
    const aReceber = receivables.filter(r => r.status !== 'Pago').reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const vencido = receivables.filter(r => r.status === 'Atrasado').reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const folhaSalarial = empPayments.filter(p => p.status === 'Pendente').reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const entradas = transactions.filter(t => t.type === 'entrada').reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const saidas = transactions.filter(t => t.type === 'saida').reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const saldo = entradas - saidas;
    return { aReceber, vencido, folhaSalarial, saldo };
  }, [receivables, empPayments, transactions]);

  const kpiItems = [
    { id: "saldo", title: "Saldo Atual", value: formatMoney(kpis.saldo), icon: <Wallet className="text-blue-400 w-5 h-5" /> },
    { id: "receber", title: "A Receber", value: formatMoney(kpis.aReceber), icon: <TrendingUp className="text-emerald-400 w-5 h-5" /> },
    { id: "vencido", title: "Cobranças Vencidas", value: formatMoney(kpis.vencido), icon: <AlertCircle className="text-rose-400 w-5 h-5" /> },
    { id: "folha", title: "Folha Pendente", value: formatMoney(kpis.folhaSalarial), icon: <Briefcase className="text-orange-400 w-5 h-5" /> }
  ];

  if (!isLoaded) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
              <TrendingUp className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">UpValor</h1>
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

  // Cobranças pendentes/atrasadas para o dashboard
  const pendingReceivables = receivables.filter(r => r.status !== 'Pago');
  const pendingEmpPayments = empPayments.filter(p => p.status === 'Pendente');

  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-200 font-sans relative pb-32">
      <div className="fixed top-4 right-4 z-50 flex items-center bg-[#151821]/80 backdrop-blur-md p-1.5 rounded-full border border-white/5 shadow-xl">
        <span className="text-sm font-medium text-white mr-3 ml-4">{currentUser.name}</span>
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

      <main className="pt-28 max-w-7xl mx-auto px-6 md:px-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white capitalize">
            {activeTab === 'fluxo' ? 'Fluxo de Caixa' : activeTab === 'painel' ? 'Painel de Controle' : activeTab === 'funcionarios' ? 'Funcionários' : activeTab}
          </h1>
          {(activeTab === 'clientes' || activeTab === 'funcionarios') && (
            <button
              onClick={() => setModal({ isOpen: true, type: activeTab === 'clientes' ? 'client' : 'employee', data: null, parentId: null, parentName: '' })}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-colors"
            >
              <Plus className="w-4 h-4" /><span>{activeTab === 'clientes' ? 'Novo Cliente' : 'Novo Funcionário'}</span>
            </button>
          )}
          {activeTab === 'fluxo' && (
            <button
              onClick={() => setModal({ isOpen: true, type: 'transaction', data: null, parentId: null, parentName: '' })}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-colors"
            >
              <Plus className="w-4 h-4" /><span>Nova Transação</span>
            </button>
          )}
        </div>

        {/* ===== PAINEL ===== */}
        {activeTab === 'painel' && (
          <>
            <HoverEffect items={kpiItems} className="-mx-2" />

            {/* A Receber dos Clientes */}
            <div className="mt-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="text-emerald-400 w-5 h-5" /> A Receber dos Clientes
              </h2>
              <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                <table className="w-full text-left border-collapse">
                  <thead><tr className="bg-[#151821]/80 text-slate-400 text-sm"><th className="p-4">Cliente</th><th className="p-4">Descrição</th><th className="p-4">Vencimento</th><th className="p-4">Status</th><th className="p-4 text-right">Valor</th><th className="p-4 text-right">Ação</th></tr></thead>
                  <tbody className="divide-y divide-white/5">
                    {pendingReceivables.length === 0 && (
                      <tr><td colSpan="6" className="p-8 text-center text-slate-500 italic">Nenhuma cobrança pendente.</td></tr>
                    )}
                    {pendingReceivables.map(r => (
                      <tr key={r.id}>
                        <td className="p-4 text-white font-medium">{r.client_name}</td>
                        <td className="p-4 text-slate-400">{r.description}</td>
                        <td className="p-4 text-slate-400">{formatDate(r.due_date)}</td>
                        <td className="p-4"><StatusBadge status={r.status} /></td>
                        <td className="p-4 text-right text-emerald-400 font-mono font-semibold">{formatMoney(r.amount)}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => markReceivableAsPaid(r)} className="text-xs text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg hover:bg-blue-500/10 transition-colors">Receber</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* A Pagar aos Funcionários */}
            <div className="mt-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Briefcase className="text-orange-400 w-5 h-5" /> A Pagar aos Funcionários
              </h2>
              <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                <table className="w-full text-left border-collapse">
                  <thead><tr className="bg-[#151821]/80 text-slate-400 text-sm"><th className="p-4">Funcionário</th><th className="p-4">Cargo</th><th className="p-4">Descrição</th><th className="p-4">Status</th><th className="p-4 text-right">Valor</th><th className="p-4 text-right">Ação</th></tr></thead>
                  <tbody className="divide-y divide-white/5">
                    {pendingEmpPayments.length === 0 && (
                      <tr><td colSpan="6" className="p-8 text-center text-slate-500 italic">Nenhum pagamento pendente.</td></tr>
                    )}
                    {pendingEmpPayments.map(p => (
                      <tr key={p.id}>
                        <td className="p-4 text-white font-medium">{p.employee_name}</td>
                        <td className="p-4 text-slate-400">{p.employee_role}</td>
                        <td className="p-4 text-slate-400">{p.description}</td>
                        <td className="p-4"><StatusBadge status={p.status} /></td>
                        <td className="p-4 text-right text-rose-400 font-mono font-semibold">{formatMoney(p.amount)}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => markEmpPaymentAsPaid(p)} className="text-xs text-orange-400 border border-orange-500/20 px-3 py-1.5 rounded-lg hover:bg-orange-500/10 transition-colors">Pagar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Últimas transações */}
            <div className="mt-8 space-y-4">
              <h2 className="text-xl font-bold text-white">Últimas Transações</h2>
              <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                <table className="w-full text-left border-collapse">
                  <thead><tr className="bg-[#151821]/80 text-slate-400 text-sm"><th className="p-4">Data</th><th className="p-4">Descrição</th><th className="p-4">Tipo</th><th className="p-4 text-right">Valor</th></tr></thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.slice(0, 5).map(t => (
                      <tr key={t.id}>
                        <td className="p-4 text-slate-400">{formatDate(t.date?.split('T')[0] || t.date)}</td>
                        <td className="p-4 text-white font-medium">{t.description}</td>
                        <td className="p-4"><span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${t.type === 'entrada' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>{t.type}</span></td>
                        <td className="p-4 text-right font-mono" style={{ color: t.type === 'entrada' ? '#10b981' : '#f43f5e' }}>{t.type === 'entrada' ? '+' : '-'} {formatMoney(t.amount)}</td>
                      </tr>
                    ))}
                    {transactions.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-slate-500 italic">Nenhuma transação registrada.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ===== CLIENTES ===== */}
        {activeTab === 'clientes' && (
          <div className="space-y-3">
            {clients.length === 0 && (
              <div className="bg-white/5 rounded-2xl p-10 text-center text-slate-500 italic border border-white/5">
                Nenhum cliente cadastrado. Clique em "Novo Cliente" para começar.
              </div>
            )}
            {clients.map(client => {
              const clientRecs = receivables.filter(r => r.client_id === client.id);
              const isExpanded = expandedClients[client.id];
              const pendingSum = clientRecs.filter(r => r.status !== 'Pago').reduce((a, b) => a + parseFloat(b.amount), 0);
              return (
                <div key={client.id} className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <button onClick={() => setExpandedClients(prev => ({ ...prev, [client.id]: !prev[client.id] }))} className="text-slate-400 hover:text-white transition-colors">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      <div>
                        <p className="text-white font-semibold">{client.name}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{clientRecs.length} cobrança(s) · A receber: <span className="text-emerald-400">{formatMoney(pendingSum)}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setModal({ isOpen: true, type: 'receivable', data: null, parentId: client.id, parentName: client.name })}
                        className="flex items-center gap-1.5 text-xs text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Nova Cobrança
                      </button>
                      <button onClick={() => setModal({ isOpen: true, type: 'client', data: client, parentId: null, parentName: '' })} className="text-slate-400 hover:text-blue-400 p-1.5 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteClient(client.id, client.name)} className="text-slate-400 hover:text-rose-400 p-1.5 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-white/5">
                      {clientRecs.length === 0 ? (
                        <p className="p-4 pl-14 text-slate-500 text-sm italic">Nenhuma cobrança registrada para este cliente.</p>
                      ) : (
                        <table className="w-full text-left">
                          <thead><tr className="bg-[#0f1117]/60 text-slate-500 text-xs"><th className="py-2 pl-14 pr-4">Descrição</th><th className="py-2 px-4">Vencimento</th><th className="py-2 px-4">Status</th><th className="py-2 px-4 text-right">Valor</th><th className="py-2 px-4 text-right">Ação</th></tr></thead>
                          <tbody className="divide-y divide-white/[0.03]">
                            {clientRecs.map(r => (
                              <tr key={r.id}>
                                <td className="py-3 pl-14 pr-4 text-slate-300 text-sm">{r.description}</td>
                                <td className="py-3 px-4 text-slate-400 text-sm">{formatDate(r.due_date)}</td>
                                <td className="py-3 px-4"><StatusBadge status={r.status} /></td>
                                <td className="py-3 px-4 text-right font-mono text-sm" style={{ color: r.status === 'Pago' ? '#10b981' : '#e2e8f0' }}>{formatMoney(r.amount)}</td>
                                <td className="py-3 px-4 text-right space-x-1">
                                  {r.status !== 'Pago' && <button onClick={() => markReceivableAsPaid(r)} className="text-xs text-blue-400 border border-blue-500/20 px-2 py-1 rounded hover:bg-blue-500/10 transition-colors">Receber</button>}
                                  <button onClick={() => setModal({ isOpen: true, type: 'receivable', data: r, parentId: client.id, parentName: client.name })} className="text-slate-400 hover:text-blue-400 p-1 rounded"><Edit2 className="w-3.5 h-3.5 inline" /></button>
                                  <button onClick={() => handleDeleteReceivable(r)} className="text-slate-400 hover:text-rose-400 p-1 rounded"><Trash2 className="w-3.5 h-3.5 inline" /></button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
                    <div className="border-t border-white/5">
                      {empPays.length === 0 ? (
                        <p className="p-4 pl-14 text-slate-500 text-sm italic">Nenhum pagamento registrado para este funcionário.</p>
                      ) : (
                        <table className="w-full text-left">
                          <thead><tr className="bg-[#0f1117]/60 text-slate-500 text-xs"><th className="py-2 pl-14 pr-4">Descrição</th><th className="py-2 px-4">Vencimento</th><th className="py-2 px-4">Status</th><th className="py-2 px-4 text-right">Valor</th><th className="py-2 px-4 text-right">Ação</th></tr></thead>
                          <tbody className="divide-y divide-white/[0.03]">
                            {empPays.map(p => (
                              <tr key={p.id}>
                                <td className="py-3 pl-14 pr-4 text-slate-300 text-sm">{p.description}</td>
                                <td className="py-3 px-4 text-slate-400 text-sm">{formatDate(p.due_date)}</td>
                                <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                                <td className="py-3 px-4 text-right font-mono text-sm" style={{ color: p.status === 'Pago' ? '#10b981' : '#e2e8f0' }}>{formatMoney(p.amount)}</td>
                                <td className="py-3 px-4 text-right space-x-1">
                                  {p.status !== 'Pago' && <button onClick={() => markEmpPaymentAsPaid(p)} className="text-xs text-orange-400 border border-orange-500/20 px-2 py-1 rounded hover:bg-orange-500/10 transition-colors">Pagar</button>}
                                  <button onClick={() => setModal({ isOpen: true, type: 'empPayment', data: p, parentId: emp.id, parentName: emp.name })} className="text-slate-400 hover:text-blue-400 p-1 rounded"><Edit2 className="w-3.5 h-3.5 inline" /></button>
                                  <button onClick={() => handleDeleteEmpPayment(p)} className="text-slate-400 hover:text-rose-400 p-1 rounded"><Trash2 className="w-3.5 h-3.5 inline" /></button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
          <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-[#151821]/80 text-slate-400 text-sm"><th className="p-4">Data</th><th className="p-4">Descrição</th><th className="p-4">Tipo</th><th className="p-4">Valor</th><th className="p-4 text-right">Ação</th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map(t => (
                  <tr key={t.id}>
                    <td className="p-4 text-slate-400">{formatDate(t.date?.split('T')[0] || t.date)}</td>
                    <td className="p-4 text-white font-medium">{t.description}</td>
                    <td className="p-4"><span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${t.type === 'entrada' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>{t.type}</span></td>
                    <td className="p-4 font-mono" style={{ color: t.type === 'entrada' ? '#10b981' : '#f43f5e' }}>{t.type === 'entrada' ? '+' : '-'} {formatMoney(t.amount)}</td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => setModal({ isOpen: true, type: 'transaction', data: t, parentId: null, parentName: '' })} className="text-slate-400 hover:text-blue-400"><Edit2 className="w-4 h-4 inline" /></button>
                      <button onClick={() => handleDeleteTransaction(t)} className="text-slate-400 hover:text-rose-400"><Trash2 className="w-4 h-4 inline" /></button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-500 italic">Nenhuma transação registrada.</td></tr>}
              </tbody>
            </table>
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
                      {u.id !== currentUser.id && (
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
                  <input name="name" defaultValue={modal.data?.name} placeholder="Nome do Cliente" className={inputClass} required />
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
