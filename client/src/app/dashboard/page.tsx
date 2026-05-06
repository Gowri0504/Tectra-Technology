'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  DollarSign, TrendingUp, TrendingDown, Download, Plus, 
  Moon, Sun, Tag as TagIcon, LayoutDashboard, Wallet, 
  Settings, LogOut, ArrowUpRight, ArrowDownLeft, Calendar
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, cn } from '@/lib/utils';
import { Card, Button, Badge } from '@/components/ui/EliteComponents';
import { TransactionModal } from '@/components/dashboard/TransactionModal';

export default function Dashboard() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['summary'],
    queryFn: async () => {
      const { data } = await api.get('/transactions/summary');
      
      const income = data.typeSummary.find((s: any) => s.type === 'INCOME')?._sum?.amount || 0;
      const expense = data.typeSummary.find((s: any) => s.type === 'EXPENSE')?._sum?.amount || 0;
      const balance = Number(income) - Number(expense);

      return { income, expense, balance };
    },
  });

  const { data: transactionsData, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['transactions', activeTab],
    queryFn: async () => {
      const params: any = {};
      if (activeTab !== 'all') params.type = activeTab.toUpperCase();
      const { data } = await api.get('/transactions', { params });
      return data;
    },
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
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      setAccessToken(null);
      router.push('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  if (!mounted) return null;

  const stats = [
    { 
      label: 'Total Balance', 
      value: summary?.balance || 0, 
      icon: Wallet, 
      color: 'indigo',
      trend: '+12.5%'
    },
    { 
      label: 'Total Income', 
      value: summary?.income || 0, 
      icon: ArrowUpRight, 
      color: 'emerald',
      trend: '+8.2%'
    },
    { 
      label: 'Total Expenses', 
      value: summary?.expense || 0, 
      icon: ArrowDownLeft, 
      color: 'rose',
      trend: '-2.4%'
    }
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-black transition-colors duration-500">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-8">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <DollarSign className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-black tracking-tight dark:text-white">TECTRA</span>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { label: 'Dashboard', icon: LayoutDashboard, active: true },
            { label: 'Transactions', icon: Wallet },
            { label: 'Budgets', icon: TrendingUp },
            { label: 'Settings', icon: Settings },
          ].map((item) => (
            <button
              key={item.label}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 font-bold",
                item.active 
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/20" 
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto">
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="w-full justify-start text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-12 overflow-y-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
              Hello, Admin 👋
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Here's your financial overview for May 2026.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:scale-105 transition-transform shadow-sm"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Button variant="outline" onClick={handleExport} className="hidden md:flex">
              <Download className="w-4 h-4" />
              Export Data
            </Button>
            <Button className="px-6" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4" />
              New Transaction
            </Button>
          </div>
        </header>

        <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {stats.map((stat, idx) => (
            <Card key={idx} className="relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              <div className="flex items-center justify-between mb-6">
                <div className={cn(
                  "p-3.5 rounded-2xl",
                  stat.color === 'indigo' && "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600",
                  stat.color === 'emerald' && "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600",
                  stat.color === 'rose' && "bg-rose-50 dark:bg-rose-500/10 text-rose-600"
                )}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <Badge variant={stat.color === 'rose' ? 'danger' : 'success'}>
                  {stat.trend}
                </Badge>
              </div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                {stat.label}
              </p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                {formatCurrency(stat.value)}
              </h3>
            </Card>
          ))}
        </div>

        {/* Transactions Table Section */}
        <Card className="p-0 border-none bg-transparent dark:bg-transparent shadow-none">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Recent Activity</h2>
            <div className="flex bg-slate-200/50 dark:bg-slate-900/50 p-1.5 rounded-2xl gap-1 border border-slate-200 dark:border-slate-800">
              {['all', 'income', 'expense'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                    activeTab === tab 
                      ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/20">
                    <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Transaction</th>
                    <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Category</th>
                    <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Date</th>
                    <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                  {transactionsData?.transactions?.map((tx: any) => (
                    <motion.tr 
                      layout
                      key={tx.id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-indigo-500/5 transition-colors group cursor-pointer"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center",
                            tx.type === 'INCOME' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600" : "bg-rose-50 dark:bg-rose-500/10 text-rose-600"
                          )}>
                            {tx.type === 'INCOME' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{tx.description}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">ID: #{tx.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="neutral">{tx.category}</Badge>
                          {tx.tags?.map((tag: any) => (
                            <Badge key={tag.id} variant="info">
                              <TagIcon className="w-2.5 h-2.5 mr-1" />
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                          <Calendar className="w-4 h-4" />
                          {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </td>
                      <td className={cn(
                        "px-8 py-6 text-right font-black text-xl tabular-nums",
                        tx.type === 'INCOME' ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {(!transactionsData?.transactions || transactionsData.transactions.length === 0) && (
              <div className="py-32 text-center">
                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                  <DollarSign className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">No Transactions</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Your financial history will appear here once you start adding entries.</p>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
