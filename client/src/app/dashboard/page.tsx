'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { DollarSign, TrendingUp, TrendingDown, Download, Plus, Moon, Sun, Tag as TagIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['summary'],
    queryFn: async () => {
      const { data } = await api.get('/transactions/summary');
      return data;
    },
  });

  const { data: transactionsData, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data } = await api.get('/transactions');
      return data;
    },
  });

  const handleExport = async () => {
    const response = await api.get('/transactions/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'transactions.csv');
    document.body.appendChild(link);
    link.click();
  };

  if (!mounted) return null;

  if (isSummaryLoading || isTransactionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-indigo-200 dark:bg-indigo-900 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your organization's finances securely.</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition font-semibold"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition font-semibold transform hover:scale-105">
            <Plus className="w-4 h-4 mr-2" />
            New Entry
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
            <DollarSign className="w-24 h-24" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-2">Total Balance</p>
          <h3 className="text-4xl font-black text-gray-900 dark:text-white">${summary?.balance || 0}</h3>
          <div className="mt-4 flex items-center text-xs font-medium text-indigo-600 dark:text-indigo-400">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>Updated just now</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition text-green-500">
            <TrendingUp className="w-24 h-24" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-2 text-green-600">Total Income</p>
          <h3 className="text-4xl font-black text-green-600">+${summary?.income || 0}</h3>
          <div className="mt-4 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 w-full animate-progress"></div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition text-red-500">
            <TrendingDown className="w-24 h-24" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-2 text-red-600">Total Expenses</p>
          <h3 className="text-4xl font-black text-red-600">-${summary?.expense || 0}</h3>
          <div className="mt-4 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 w-full animate-progress"></div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <h2 className="text-2xl font-black text-gray-800 dark:text-white">Recent Activity</h2>
          <div className="flex space-x-2">
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold uppercase">All</span>
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-xs font-bold uppercase">Income</span>
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-xs font-bold uppercase">Expenses</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 dark:text-gray-500 uppercase text-[10px] font-black tracking-[0.2em]">
                <th className="px-8 py-6">Date</th>
                <th className="px-8 py-6">Description</th>
                <th className="px-8 py-6">Category & Tags</th>
                <th className="px-8 py-6 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {transactionsData?.transactions?.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition group">
                  <td className="px-8 py-6 text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-gray-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">{tx.description}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">ID: {tx.id.slice(0, 8)}...</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-[10px] font-black uppercase tracking-wider">
                        {tx.category}
                      </span>
                      {tx.tags?.map((tag: any) => (
                        <span key={tag.id} className="flex items-center px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 rounded-full text-[10px] font-bold">
                          <TagIcon className="w-3 h-3 mr-1" />
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className={`px-8 py-6 text-right font-black ${
                    tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <span className="text-lg">{tx.type === 'INCOME' ? '+' : '-'}${tx.amount}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {transactionsData?.transactions?.length === 0 && (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <DollarSign className="w-10 h-10 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No Transactions Yet</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">Get started by adding your first income or expense entry.</p>
          </div>
        )}
      </div>
    </div>
  );
}
