'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Wallet, Plus, Download, Search, Filter, 
  ArrowUpRight, ArrowDownLeft, MoreHorizontal,
  Calendar, Tag as TagIcon
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/providers/AuthProvider';
import { Card, Button, Badge, Skeleton, Input } from '@/components/ui/EliteComponents';
import { TransactionModal } from '@/components/dashboard/TransactionModal';
import { formatCurrency, cn } from '@/lib/utils';
import { useNotify } from '@/providers/NotificationProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  category: string;
  date: string;
  tags?: Array<{ id: string; name: string }>;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const notify = useNotify();
  const queryClient = useQueryClient();

  useEffect(() => setMounted(true), []);

  const { data: transactionsResponse, isLoading } = useQuery<ApiResponse<{ transactions: Transaction[]; total: number }>>({
    queryKey: ['transactions', search, typeFilter],
    queryFn: async () => {
      const params: Record<string, string> = { search };
      if (typeFilter !== 'ALL') params.type = typeFilter;
      const { data } = await api.get('/transactions', { params });
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/transactions/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['transactions'] });
      const previousTransactions = queryClient.getQueryData(['transactions']);
      
      if (previousTransactions) {
        queryClient.setQueryData(['transactions'], (old: any) => {
          if (!old?.data?.transactions) return old;
          return {
            ...old,
            data: {
              ...old.data,
              transactions: old.data.transactions.filter((tx: Transaction) => tx.id !== id)
            }
          };
        });
      }
      return { previousTransactions };
    },
    onError: (err, id, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(['transactions'], context.previousTransactions);
      }
      notify('error', 'Failed to delete transaction');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    }
  });

  const handleExport = async () => {
    try {
      const response = await api.get('/transactions/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transactions.csv');
      document.body.appendChild(link);
      link.click();
      notify('success', 'Export started');
    } catch (err) {
      notify('error', 'Export failed');
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-black">
      <Sidebar userRole={user?.role} />
      
      <main className="flex-1 p-4 lg:p-12 lg:ml-72">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Transactions</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Detailed history of all your financial activities.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-5 h-5" /> Export CSV
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-5 h-5" /> New Transaction
            </Button>
          </div>
        </header>

        <Card className="p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search transactions..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {['ALL', 'INCOME', 'EXPENSE'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
                    typeFilter === t 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-4">
            <thead>
              <tr className="text-left text-slate-500 text-xs font-black uppercase tracking-widest px-4">
                <th className="pb-2 pl-6">Transaction</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Date</th>
                <th className="pb-2">Tags</th>
                <th className="pb-2 pr-6 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={5}><Skeleton className="h-16 w-full mb-4" /></td></tr>
                ))
              ) : (
                transactionsResponse?.data?.transactions?.map((tx) => (
                  <tr key={tx.id} className="bg-white dark:bg-slate-900 group cursor-pointer">
                    <td className="py-4 pl-6 rounded-l-2xl border-y border-l border-slate-100 dark:border-slate-800 group-hover:border-indigo-500/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${
                          tx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                        }`}>
                          {tx.type === 'INCOME' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">{tx.description}</span>
                      </div>
                    </td>
                    <td className="py-4 border-y border-slate-100 dark:border-slate-800 group-hover:border-indigo-500/50 transition-colors">
                      <Badge variant="neutral">{tx.category}</Badge>
                    </td>
                    <td className="py-4 border-y border-slate-100 dark:border-slate-800 group-hover:border-indigo-500/50 transition-colors">
                      <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                        <Calendar className="w-4 h-4" />
                        {new Date(tx.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 border-y border-slate-100 dark:border-slate-800 group-hover:border-indigo-500/50 transition-colors">
                      <div className="flex gap-1">
                        {tx.tags?.map((tag) => (
                          <span key={tag.id} className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md">
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 pr-6 rounded-r-2xl border-y border-r border-slate-100 dark:border-slate-800 text-right group-hover:border-indigo-500/50 transition-colors">
                      <div className="flex items-center justify-end gap-4">
                        <span className={`text-lg font-black ${
                          tx.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                          {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure?')) deleteMutation.mutate(tx.id);
                          }}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          aria-label="Delete transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </main>
    </div>
  );
}
