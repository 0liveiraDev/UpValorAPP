'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, Users, Briefcase, Wallet, Settings, LogOut,
  TrendingUp, TrendingDown, AlertCircle, Plus, Edit2, Trash2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const cn = (...classes) => classes.filter(Boolean).join(" ");

export const HoverEffect = ({ items, className }) => {
  let [hoveredIndex, setHoveredIndex] = useState(null);
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {items.map((item, idx) => (
        <div key={item?.id} className="relative group block p-2 h-full w-full" onMouseEnter={() => setHoveredIndex(idx)} onMouseLeave={() => setHoveredIndex(null)}>
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                className="absolute inset-0 h-full w-full bg-slate-800/[0.8] block rounded-3xl"
                layoutId="hoverBackground"
                initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.15 } }} exit={{ opacity: 0, transition: { duration: 0.15, delay: 0.2 } }}
              />
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

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('painel');
  const [isLoaded, setIsLoaded] = useState(false);

  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);

  const [modal, setModal] = useState({ isOpen: false, type: '', data: null });
  const [loginError, setLoginError] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);

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
      const [cliRes, empRes, traRes, usrRes] = await Promise.all([
        fetch(`/api/clients?userId=${currentUser.id}`),
        fetch(`/api/employees?userId=${currentUser.id}`),
        fetch(`/api/transactions?userId=${currentUser.id}`),
        fetch('/api/users')
      ]);
      setClients(await cliRes.json());
      setEmployees(await empRes.json());
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
    if (res.ok) {
      setCurrentUser(data.user);
      setIsAuthenticated(true);
    } else {
      setLoginError(data.error);
    }
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
    if (res.ok) {
      setCurrentUser(data.user);
      setIsAuthenticated(true);
    } else {
      setLoginError(data.error);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('painel');
    setIsLoginMode(true);
    localStorage.removeItem('upvalor_user');
  };

  // --- CRUD ACTIONS ---
  const handleDeleteClient = async (id) => {
    const client = clients.find(c => c.id === id);
    if (client) {
      // Excluir transações vinculadas (Recebimento - Nome)
      const linkedTrans = transactions.filter(t => t.description.toLowerCase().includes(`recebimento - ${client.name.toLowerCase()}`));
      for (const t of linkedTrans) {
        await fetch(`/api/transactions?id=${t.id}&userId=${currentUser.id}`, { method: 'DELETE' });
      }
    }
    await fetch(`/api/clients?id=${id}&userId=${currentUser.id}`, { method: 'DELETE' });
    loadData();
  };

  const handleDeleteEmployee = async (id) => {
    const emp = employees.find(e => e.id === id);
    if (emp) {
      // Excluir transações vinculadas (Salário - Nome)
      const linkedTrans = transactions.filter(t => t.description.toLowerCase().includes(`salário - ${emp.name.toLowerCase()}`));
      for (const t of linkedTrans) {
        await fetch(`/api/transactions?id=${t.id}&userId=${currentUser.id}`, { method: 'DELETE' });
      }
    }
    await fetch(`/api/employees?id=${id}&userId=${currentUser.id}`, { method: 'DELETE' });
    loadData();
  };

  const handleDeleteUser = async (id) => {
    if (id === currentUser.id) return;
    await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
    setUsers(users.filter(u => u.id !== id));
  };

  const handleDeleteTransaction = async (id) => {
    const trans = transactions.find(t => t.id === id);
    if (trans) {
      const desc = trans.description.toLowerCase();
      // Tentar reverter status de cliente/funcionário (mais robusco)
      if (desc.includes('recebimento - ')) {
        const clientName = trans.description.split(' - ')[1]?.trim();
        const client = clients.find(c => c.name.toLowerCase() === clientName?.toLowerCase());
        if (client) {
          await fetch('/api/clients', { method: 'PUT', body: JSON.stringify({ ...client, status: 'Pendente', userId: currentUser.id }) });
        }
      } else if (desc.includes('salário - ')) {
        const empName = trans.description.split(' - ')[1]?.trim();
        const emp = employees.find(e => e.name.toLowerCase() === empName?.toLowerCase());
        if (emp) {
          await fetch('/api/employees', { method: 'PUT', body: JSON.stringify({ ...emp, status: 'Pendente', userId: currentUser.id }) });
        }
      }
    }
    await fetch(`/api/transactions?id=${id}&userId=${currentUser.id}`, { method: 'DELETE' });
    loadData();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    const isEdit = !!modal.data;

    try {
      if (modal.type === 'client') {
        const payload = { ...data, amount: parseFloat(data.amount), userId: currentUser.id };
        if (isEdit) {
          await fetch('/api/clients', { method: 'PUT', body: JSON.stringify({ id: modal.data.id, ...payload }) });
          // Sincronizar transação se já existir uma vinculada
          const linkedTrans = transactions.find(t => t.description.includes(`Recebimento - ${modal.data.name}`));
          if (linkedTrans) {
            await fetch('/api/transactions', {
              method: 'PUT',
              body: JSON.stringify({ ...linkedTrans, amount: payload.amount, description: `Recebimento - ${payload.name}`, userId: currentUser.id })
            });
          }
        } else {
          await fetch('/api/clients', { method: 'POST', body: JSON.stringify(payload) });
        }
      } else if (modal.type === 'employee') {
        const payload = { ...data, salary: parseFloat(data.salary), userId: currentUser.id };
        if (isEdit) {
          await fetch('/api/employees', { method: 'PUT', body: JSON.stringify({ id: modal.data.id, ...payload }) });
          // Sincronizar transação se já existir uma vinculada
          const linkedTrans = transactions.find(t => t.description.includes(`Salário - ${modal.data.name}`));
          if (linkedTrans) {
            await fetch('/api/transactions', {
              method: 'PUT',
              body: JSON.stringify({ ...linkedTrans, amount: payload.salary, description: `Salário - ${payload.name}`, userId: currentUser.id })
            });
          }
        } else {
          await fetch('/api/employees', { method: 'POST', body: JSON.stringify(payload) });
        }
      } else if (modal.type === 'transaction') {
        const payload = { ...data, amount: parseFloat(data.amount), userId: currentUser.id };
        if (isEdit) {
          await fetch('/api/transactions', { method: 'PUT', body: JSON.stringify({ id: modal.data.id, ...payload }) });
        } else {
          await fetch('/api/transactions', { method: 'POST', body: JSON.stringify(payload) });
        }
      }
      loadData();
      setModal({ isOpen: false, type: '', data: null });
    } catch (error) {
      alert("Erro ao salvar no banco de dados.");
    }
  };

  const markClientAsPaid = async (client) => {
    await fetch('/api/clients', { method: 'PUT', body: JSON.stringify({ ...client, status: 'Pago', userId: currentUser.id }) });
    await fetch('/api/transactions', { method: 'POST', body: JSON.stringify({ date: new Date().toISOString().split('T')[0], description: `Recebimento - ${client.name}`, type: 'entrada', amount: client.amount, userId: currentUser.id }) });
    loadData();
  };

  const markEmployeeAsPaid = async (emp) => {
    await fetch('/api/employees', { method: 'PUT', body: JSON.stringify({ ...emp, status: 'Pago', userId: currentUser.id }) });
    await fetch('/api/transactions', { method: 'POST', body: JSON.stringify({ date: new Date().toISOString().split('T')[0], description: `Salário - ${emp.name}`, type: 'saida', amount: emp.salary, userId: currentUser.id }) });
    loadData();
  };

  // --- KPIS ---
  const kpis = useMemo(() => {
    const aReceber = clients.filter(c => c.status !== 'Pago').reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const vencido = clients.filter(c => c.status === 'Atrasado').reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const folhaSalarial = employees.filter(e => e.status !== 'Pago').reduce((acc, curr) => acc + parseFloat(curr.salary), 0);
    const entradas = transactions.filter(t => t.type === 'entrada').reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const saidas = transactions.filter(t => t.type === 'saida').reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const saldo = entradas - saidas;
    return { aReceber, vencido, folhaSalarial, saldo };
  }, [clients, employees, transactions]);

  const formatMoney = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

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
        <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl transition-all duration-300">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
              <TrendingUp className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">UpValor</h1>
          </div>
          {loginError && <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center">{loginError}</div>}

          {isLoginMode ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <input name="email" type="email" placeholder="Seu e-mail" className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              <input name="password" type="password" placeholder="Sua senha" className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white font-semibold rounded-lg px-4 py-3 shadow-lg shadow-blue-500/25">Entrar no Sistema</button>
              <p className="text-center text-sm text-slate-400 mt-4">Não tem uma conta? <button type="button" onClick={() => setIsLoginMode(false)} className="text-blue-400 hover:text-blue-300 font-medium">Cadastre-se</button></p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <input name="name" type="text" placeholder="Seu nome completo" className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              <input name="email" type="email" placeholder="Seu e-mail" className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              <input name="password" type="password" placeholder="Escolha uma senha" className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" required minLength={6} />
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

  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-200 font-sans relative pb-32">
      {/* Header e Menus Flutuantes (Simplificados para o arquivo não ficar gigante) */}
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
          <h1 className="text-3xl font-bold text-white capitalize">{activeTab === 'fluxo' ? 'Fluxo de Caixa' : activeTab === 'painel' ? 'Painel de Controle' : activeTab}</h1>
          {activeTab !== 'painel' && activeTab !== 'admin' && (
            <button onClick={() => setModal({ isOpen: true, type: activeTab === 'clientes' ? 'client' : activeTab === 'funcionarios' ? 'employee' : 'transaction', data: null })} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20">
              <Plus className="w-4 h-4" /><span>Novo Registro</span>
            </button>
          )}
        </div>

        {activeTab === 'painel' && (
          <>
            <HoverEffect items={kpiItems} className="-mx-2" />
            <div className="mt-12 space-y-4">
              <h2 className="text-xl font-bold text-white">Últimas Transações</h2>
              <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#151821]/80 text-slate-400 text-sm">
                      <th className="p-4">Data</th>
                      <th className="p-4">Descrição</th>
                      <th className="p-4">Tipo</th>
                      <th className="p-4 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.slice(0, 5).map(t => (
                      <tr key={t.id}>
                        <td className="p-4 text-slate-400">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                        <td className="p-4 text-white font-medium">{t.description}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${t.type === 'entrada' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono" style={{ color: t.type === 'entrada' ? '#10b981' : '#f43f5e' }}>
                          {t.type === 'entrada' ? '+' : '-'} {formatMoney(t.amount)}
                        </td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-slate-500 italic">Nenhuma transação registrada.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'clientes' && (
          <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-[#151821]/80 text-slate-400 text-sm"><th className="p-4">Cliente</th><th className="p-4">Valor</th><th className="p-4">Status</th><th className="p-4 text-right">Ação</th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {clients.map(client => (
                  <tr key={client.id}>
                    <td className="p-4 text-white font-medium">{client.name}</td>
                    <td className="p-4">{formatMoney(client.amount)}</td>
                    <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-medium border ${client.status === 'Pago' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : client.status === 'Atrasado' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>{client.status}</span></td>
                    <td className="p-4 text-right space-x-2">
                      {client.status !== 'Pago' && <button onClick={() => markClientAsPaid(client)} className="text-xs text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg">Receber</button>}
                      <button onClick={() => setModal({ isOpen: true, type: 'client', data: client })} className="text-slate-400 hover:text-blue-400"><Edit2 className="w-4 h-4 inline" /></button>
                      <button onClick={() => handleDeleteClient(client.id)} className="text-slate-400 hover:text-rose-400"><Trash2 className="w-4 h-4 inline" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'funcionarios' && (
          <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-[#151821]/80 text-slate-400 text-sm"><th className="p-4">Nome</th><th className="p-4">Cargo</th><th className="p-4">Salário</th><th className="p-4">Status</th><th className="p-4 text-right">Ação</th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {employees.map(emp => (
                  <tr key={emp.id}>
                    <td className="p-4 text-white font-medium">{emp.name}</td>
                    <td className="p-4 text-slate-400">{emp.role}</td>
                    <td className="p-4">{formatMoney(emp.salary)}</td>
                    <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-medium border ${emp.status === 'Pago' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>{emp.status}</span></td>
                    <td className="p-4 text-right space-x-2">
                      {emp.status !== 'Pago' && <button onClick={() => markEmployeeAsPaid(emp)} className="text-xs text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg">Pagar</button>}
                      <button onClick={() => setModal({ isOpen: true, type: 'employee', data: emp })} className="text-slate-400 hover:text-blue-400"><Edit2 className="w-4 h-4 inline" /></button>
                      <button onClick={() => handleDeleteEmployee(emp.id)} className="text-slate-400 hover:text-rose-400"><Trash2 className="w-4 h-4 inline" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'fluxo' && (
          <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-[#151821]/80 text-slate-400 text-sm"><th className="p-4">Data</th><th className="p-4">Descrição</th><th className="p-4">Tipo</th><th className="p-4">Valor</th><th className="p-4 text-right">Ação</th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map(t => (
                  <tr key={t.id}>
                    <td className="p-4 text-slate-400">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                    <td className="p-4 text-white font-medium">{t.description}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${t.type === 'entrada' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="p-4 font-mono" style={{ color: t.type === 'entrada' ? '#10b981' : '#f43f5e' }}>
                      {t.type === 'entrada' ? '+' : '-'} {formatMoney(t.amount)}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => setModal({ isOpen: true, type: 'transaction', data: t })} className="text-slate-400 hover:text-blue-400"><Edit2 className="w-4 h-4 inline" /></button>
                      <button onClick={() => handleDeleteTransaction(t.id)} className="text-slate-400 hover:text-rose-400"><Trash2 className="w-4 h-4 inline" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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

      {/* MODAL */}
      <AnimatePresence>
        {modal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal({ isOpen: false, type: '', data: null })} />
            <div className="relative bg-[#151821] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
              <h3 className="text-xl font-bold text-white mb-6">Salvar Dados</h3>
              <form onSubmit={handleSave} className="space-y-4">
                {modal.type === 'client' && (
                  <>
                    <input name="name" defaultValue={modal.data?.name} placeholder="Nome do Cliente" className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-4 py-2.5" required />
                    <input name="amount" type="number" step="0.01" defaultValue={modal.data?.amount} placeholder="Valor" className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-4 py-2.5" required />
                    <input name="dueDate" type="date" defaultValue={modal.data?.due_date?.split('T')[0] || new Date().toISOString().split('T')[0]} className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-4 py-2.5" required style={{ colorScheme: 'dark' }} />
                    <select name="status" defaultValue={modal.data?.status || 'Pendente'} className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-4 py-2.5">
                      <option value="Pendente">Pendente</option>
                      <option value="Pago">Pago</option>
                      <option value="Atrasado">Atrasado</option>
                    </select>
                  </>
                )}
                {modal.type === 'employee' && (
                  <>
                    <input name="name" defaultValue={modal.data?.name} placeholder="Nome do Funcionário" className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-4 py-2.5" required />
                    <input name="role" defaultValue={modal.data?.role} placeholder="Cargo" className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-4 py-2.5" required />
                    <input name="salary" type="number" step="0.01" defaultValue={modal.data?.salary} placeholder="Salário" className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-4 py-2.5" required />
                    <select name="status" defaultValue={modal.data?.status || 'Pendente'} className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-4 py-2.5">
                      <option value="Pendente">Pendente</option>
                      <option value="Pago">Pago</option>
                    </select>
                  </>
                )}
                {modal.type === 'transaction' && (
                  <>
                    <input name="description" defaultValue={modal.data?.description} placeholder="Descrição da Transação" className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-4 py-2.5" required />
                    <input name="amount" type="number" step="0.01" defaultValue={modal.data?.amount} placeholder="Valor" className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-4 py-2.5" required />
                    <input name="date" type="date" defaultValue={modal.data?.date?.split('T')[0] || new Date().toISOString().split('T')[0]} className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-4 py-2.5" required style={{ colorScheme: 'dark' }} />
                    <select name="type" defaultValue={modal.data?.type || 'saida'} className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-4 py-2.5">
                      <option value="saida">Saída (Despesa)</option>
                      <option value="entrada">Entrada (Receita)</option>
                    </select>
                  </>
                )}
                <div className="pt-4 flex justify-end space-x-3">
                  <button type="button" onClick={() => setModal({ isOpen: false, type: '', data: null })} className="px-4 py-2 text-slate-300">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">Salvar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
