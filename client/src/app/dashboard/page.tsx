'use client';

import { useQuery } from '@tanstack/react-query';
import api, { setAccessToken } from '@/lib/api';
import { 
  DollarSign, TrendingUp, TrendingDown, Download, Plus, 
  Moon, Sun, Tag as TagIcon, LayoutDashboard, Wallet, 
  Settings, LogOut, ArrowUpRight, ArrowDownLeft, Calendar,
  PieChart as PieIcon, BarChart3, Filter
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, cn } from '@/lib/utils';
import { Card, Button, Badge, Skeleton } from '@/components/ui/EliteComponents';
import { TransactionModal } from '@/components/dashboard/TransactionModal';
import { useNotify } from '@/providers/NotificationProvider';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Dashboard() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const notify = useNotify();
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  const { data: dashboardData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['summary'],
    queryFn: async () => {
      const { data } = await api.get('/transactions/summary');
      return data;
    },
  });

  const { data: auditLogs, isLoading: isLogsLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data } = await api.get('/transactions/audit');
      return data;
    },
    enabled: activeTab === 'activity'
  });

  const summary = useMemo(() => {
    if (!dashboardData) return { income: 0, expense: 0, balance: 0 };
    const income = dashboardData.typeSummary.find((s: any) => s.type === 'INCOME')?._sum?.amount || 0;
    const expense = dashboardData.typeSummary.find((s: any) => s.type === 'EXPENSE')?._sum?.amount || 0;
    const balance = Number(income) - Number(expense);
    return { income, expense, balance };
  }, [dashboardData]);

  const chartData = useMemo(() => {
    if (!dashboardData?.monthlySummary) return [];
    const months: any = {};
    dashboardData.monthlySummary.forEach((item: any) => {
      const date = new Date(item.month);
      const monthLabel = date.toLocaleString('default', { month: 'short' });
      if (!months[monthLabel]) months[monthLabel] = { name: monthLabel, income: 0, expense: 0 };
      if (item.type === 'INCOME') months[monthLabel].income = Number(item.total);
      else months[monthLabel].expense = Number(item.total);
    });
    return Object.values(months);
  }, [dashboardData]);

  const pieData = useMemo(() => {
    if (!dashboardData?.categoryBreakdown) return [];
    return dashboardData.categoryBreakdown
      .filter((c: any) => c.type === 'EXPENSE')
      .map((c: any) => ({
        name: c.category,
        value: Number(c._sum.amount)
      }))
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 5);
  }, [dashboardData]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const { data: transactionsData, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['transactions', activeTab, search],
    queryFn: async () => {
      const params: any = { search };
      if (activeTab !== 'all' && activeTab !== 'activity') params.type = activeTab.toUpperCase();
      const { data } = await api.get('/transactions', { params });
      return data;
    },
    enabled: activeTab !== 'activity'
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
      notify('success', 'CSV Export started');
    } catch (err) {
      notify('error', 'CSV Export failed');
    }
  };

  const handlePdfExport = () => {
    try {
      if (!transactionsData?.transactions) return;
      const doc = new jsPDF();
      doc.text('Transaction Report', 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
      const tableData = transactionsData.transactions.map((tx: any) => [
        new Date(tx.date).toLocaleDateString(),
        tx.description,
        tx.category,
        tx.type,
        `${tx.type === 'INCOME' ? '+' : '-'}${tx.amount}`
      ]);
      autoTable(doc, {
        head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
        body: tableData,
        startY: 30,
      });
      doc.save('transactions_report.pdf');
      notify('success', 'PDF Report generated');
    } catch (err) {
      notify('error', 'PDF Export failed');
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      setAccessToken(null);
      notify('info', 'Logged out successfully');
      router.push('/login');
    } catch (err) {
      notify('error', 'Logout failed');
    }
  };

  if (!mounted) return null;

  const stats = [
    { label: 'Total Balance', value: summary?.balance || 0, icon: Wallet, color: 'indigo', trend: '+12.5%' },
    { label: 'Total Income', value: summary?.income || 0, icon: ArrowUpRight, color: 'emerald', trend: '+8.2%' },
    { label: 'Total Expenses', value: summary?.expense || 0, icon: ArrowDownLeft, color: 'rose', trend: '-2.4%' }
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-black transition-colors duration-500">
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
            <button key={item.label} className={cn("w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 font-bold", item.active ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/20" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900")}>
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto">
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10">
            <LogOut className="w-5 h-5" /> Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-4 lg:p-12 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Hello, Admin 👋</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Here's your financial overview for May 2026.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:scale-105 transition-transform shadow-sm">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Button variant="outline" onClick={handleExport} className="hidden md:flex"><Download className="w-4 h-4" /> CSV</Button>
            <Button variant="outline" onClick={handlePdfExport} className="hidden md:flex"><Download className="w-4 h-4" /> PDF</Button>
            <Button className="px-6" onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4" /> New Transaction</Button>
          </div>
        </header>

        <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {isSummaryLoading ? [1, 2, 3].map((i) => <Card key={i} className="p-8"><Skeleton className="h-6 w-24 mb-4" /><Skeleton className="h-10 w-32" /></Card>) : stats.map((stat, idx) => (
            <Card key={idx} className="relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              <div className="flex items-center justify-between mb-6">
                <div className={cn("p-3.5 rounded-2xl", stat.color === 'indigo' && "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600", stat.color === 'emerald' && "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600", stat.color === 'rose' && "bg-rose-50 dark:bg-rose-500/10 text-rose-600")}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <Badge variant={stat.color === 'rose' ? 'danger' : 'success'}>{stat.trend}</Badge>
              </div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(stat.value)}</h3>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div><h3 className="text-xl font-black text-slate-900 dark:text-white">Revenue vs Expenses</h3><p className="text-sm text-slate-500 font-medium">Monthly performance overview</p></div>
              <BarChart3 className="w-6 h-6 text-indigo-500" />
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs><linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} tickFormatter={(val) => `$${val}`} />
                  <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', border: 'none', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="income" stroke="#6366f1" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} />
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="none" strokeWidth={3} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div><h3 className="text-xl font-black text-slate-900 dark:text-white">Expense Categories</h3><p className="text-sm text-slate-500 font-medium">Top 5 spending areas</p></div>
              <PieIcon className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="h-[300px] w-full flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={100} paddingAngle={8} dataKey="value">
                    {pieData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', border: 'none', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-4 pr-8">
                {pieData.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-0 border-none bg-transparent dark:bg-transparent shadow-none">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Recent Activity</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input type="text" placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 pr-4 py-2 rounded-xl bg-slate-200/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm w-64" />
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
              <div className="flex bg-slate-200/50 dark:bg-slate-900/50 p-1.5 rounded-2xl gap-1 border border-slate-200 dark:border-slate-800">
                {['all', 'income', 'expense', 'activity'].map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={cn("px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all", activeTab === tab ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none">
            {activeTab === 'activity' ? (
              <div className="p-8">
                {isLogsLoading ? <div className="space-y-4">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div> : (
                  <div className="space-y-6">
                    {auditLogs?.map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-4">
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", log.action === 'CREATE' ? "bg-emerald-500/10 text-emerald-500" : log.action === 'DELETE' ? "bg-rose-500/10 text-rose-500" : "bg-indigo-500/10 text-indigo-500")}>
                            <div className="w-2 h-2 rounded-full bg-current" />
                          </div>
                          <div><p className="text-sm font-bold text-slate-900 dark:text-white">{log.action} {log.entityType}</p><p className="text-xs text-slate-500 font-medium">By {log.user?.email || 'System'} • {new Date(log.createdAt).toLocaleString()}</p></div>
                        </div>
                        <Badge variant="neutral">#{log.id.slice(0, 8)}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
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
                    {isTransactionsLoading ? [1, 2, 3, 4, 5].map((i) => <tr key={i}><td colSpan={4} className="px-8 py-6"><Skeleton className="h-12 w-full" /></td></tr>) : transactionsData?.transactions?.map((tx: any) => (
                      <motion.tr layout key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-indigo-500/5 transition-colors group cursor-pointer">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", tx.type === 'INCOME' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600" : "bg-rose-50 dark:bg-rose-500/10 text-rose-600")}>
                              {tx.type === 'INCOME' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                            </div>
                            <div><p className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{tx.description}</p><p className="text-xs text-slate-400 dark:text-slate-500 mt-1">ID: #{tx.id.slice(0, 8)}</p></div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="neutral">{tx.category}</Badge>
                            {tx.tags?.map((tag: any) => <Badge key={tag.id} variant="info"><TagIcon className="w-2.5 h-2.5 mr-1" />{tag.name}</Badge>)}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400"><Calendar className="w-4 h-4" />{new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        </td>
                        <td className={cn("px-8 py-6 text-right font-black text-xl tabular-nums", tx.type === 'INCOME' ? "text-emerald-600" : "text-rose-600")}>
                          {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {activeTab !== 'activity' && (!transactionsData?.transactions || transactionsData.transactions.length === 0) && !isTransactionsLoading && (
              <div className="py-32 text-center">
                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6"><DollarSign className="w-10 h-10 text-slate-300" /></div>
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
