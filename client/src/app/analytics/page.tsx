'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  PieChart as PieIcon, BarChart3, TrendingUp, TrendingDown, 
  Calendar, Filter, ArrowUpRight, ArrowDownLeft, Info
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/providers/AuthProvider';
import { Card, Button, Skeleton } from '@/components/ui/EliteComponents';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
  Legend, LineChart, Line
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface DashboardSummary {
  typeSummary: Array<{ type: 'INCOME' | 'EXPENSE'; _sum: { amount: number } }>;
  monthlySummary: Array<{ month: string; type: 'INCOME' | 'EXPENSE'; total: number }>;
  categoryBreakdown: Array<{ category: string; type: 'INCOME' | 'EXPENSE'; _sum: { amount: number } }>;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [timeframe, setTimeframe] = useState('year');

  useEffect(() => setMounted(true), []);

  const { data: dashboardData, isLoading } = useQuery<ApiResponse<DashboardSummary>>({
    queryKey: ['summary'],
    queryFn: async () => {
      const { data } = await api.get('/transactions/summary');
      return data;
    },
  });

  const chartData = useMemo(() => {
    if (!dashboardData?.data?.monthlySummary) return [];
    return dashboardData.data.monthlySummary.map((item) => ({
      name: new Date(item.month).toLocaleString('default', { month: 'short' }),
      income: item.type === 'INCOME' ? Number(item.total) : 0,
      expense: item.type === 'EXPENSE' ? Number(item.total) : 0,
      total: Number(item.total)
    }));
  }, [dashboardData]);

  const categoryData = useMemo(() => {
    if (!dashboardData?.data?.categoryBreakdown) return [];
    return dashboardData.data.categoryBreakdown
      .filter((c) => c.type === 'EXPENSE')
      .map((c) => ({
        name: c.category,
        value: Number(c._sum.amount)
      }))
      .sort((a, b) => b.value - a.value);
  }, [dashboardData]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-black">
      <Sidebar userRole={user?.role} />
      
      <main className="flex-1 p-4 lg:p-12 lg:ml-72">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Advanced Analytics</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Deep dive into your organization's financial health.</p>
          </div>
          <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
            {['month', 'quarter', 'year'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-6 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
                  timeframe === t 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="lg:col-span-2 p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Revenue vs Expenses</h3>
                <p className="text-slate-500 text-sm font-medium mt-1">Monthly trend for the current year</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-600" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Income</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expense</span>
                </div>
              </div>
            </div>
            <div className="h-[400px]">
              {isLoading ? (
                <Skeleton className="w-full h-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} tickFormatter={(val) => `$${val}`} />
                    <Tooltip 
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                      itemStyle={{fontWeight: 700}}
                    />
                    <Area type="monotone" dataKey="income" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                    <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <Card className="p-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8">Expense Breakdown</h3>
            <div className="h-[300px]">
              {isLoading ? (
                <Skeleton className="w-full h-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((_entry, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" align="center" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <Card className="p-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Key Insights</h3>
            <div className="space-y-4">
              {[
                { label: 'Highest Spending', value: categoryData[0]?.name || 'N/A', icon: TrendingUp, color: 'indigo' },
                { label: 'Monthly Growth', value: '+14.2%', icon: ArrowUpRight, color: 'emerald' },
                { label: 'Avg. Transaction', value: '$420.00', icon: Info, color: 'amber' },
              ].map((insight) => (
                <div key={insight.label} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-${insight.color}-100 dark:bg-${insight.color}-500/10 text-${insight.color}-600 dark:text-${insight.color}-400`}>
                      <insight.icon className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-600 dark:text-slate-300">{insight.label}</span>
                  </div>
                  <span className="font-black text-slate-900 dark:text-white">{insight.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
