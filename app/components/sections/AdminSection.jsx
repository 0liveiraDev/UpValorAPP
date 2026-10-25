'use client';

import React from 'react';
import { Settings, Trash2 } from 'lucide-react';

function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AD';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function AdminSection({
  users = [],
  currentUserId,
  onDeleteUser,
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-[28px] font-semibold text-fg tracking-tight">
          Administração
        </h1>
        <p className="text-sm text-muted mt-0.5">
          Gerenciamento de contas e permissões de acesso do sistema
        </p>
      </div>

      <div className="uv-card overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-line">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-surface-2 border border-line inline-flex items-center justify-center text-accent-fg">
              <Settings className="w-4 h-4" aria-hidden="true" />
            </span>
            <h2 className="text-base font-semibold text-fg">
              Usuários Cadastrados
            </h2>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-2 text-muted border border-line uv-num">
            {users.length} {users.length === 1 ? 'usuário' : 'usuários'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-2/60 text-muted text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Nome</th>
                <th className="p-4 font-semibold">E-mail</th>
                <th className="p-4 font-semibold">Função</th>
                <th className="p-4 font-semibold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-sm">
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-surface-2/40 transition-colors"
                >
                  <td className="p-4 text-fg font-medium">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-full bg-accent/15 border border-accent/25 text-accent-fg text-xs font-semibold inline-flex items-center justify-center shrink-0">
                        {getInitials(u.name)}
                      </span>
                      <span>{u.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-muted">{u.email}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-2 text-fg border border-line capitalize">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {u.id !== currentUserId && (
                      <button
                        type="button"
                        onClick={() => onDeleteUser(u.id)}
                        aria-label="Excluir usuário"
                        className="text-muted hover:text-neg p-1.5 rounded-lg hover:bg-surface transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
