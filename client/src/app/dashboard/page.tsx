'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { DollarSign, TrendingUp, TrendingDown, Download, Plus } from 'lucide-react';

export default function Dashboard() {
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

  if (isSummaryLoading || isTransactionsLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Financial Dashboard</h1>
        <div className="flex space-x-4">
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition font-medium"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition font-medium">
            <Plus className="w-4 h-4 mr-2" />
            New Transaction
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-lg border-t-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Total Balance</p>
              <h3 className="text-3xl font-bold mt-1 text-gray-900">${summary?.balance || 0}</h3>
            </div>
            <div className="bg-indigo-100 p-3 rounded-xl">
              <DollarSign className="text-indigo-600 w-8 h-8" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg border-t-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Income</p>
              <h3 className="text-3xl font-bold mt-1 text-green-600">+${summary?.income || 0}</h3>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <TrendingUp className="text-green-600 w-8 h-8" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg border-t-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Expenses</p>
              <h3 className="text-3xl font-bold mt-1 text-red-600">-${summary?.expense || 0}</h3>
            </div>
            <div className="bg-red-100 p-3 rounded-xl">
              <TrendingDown className="text-red-600 w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 uppercase text-xs font-bold tracking-widest">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactionsData?.transactions?.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                    {new Date(tx.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-800">{tx.description}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase tracking-tighter">
                      {tx.category}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm font-bold text-right ${
                    tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tx.type === 'INCOME' ? '+' : '-'}${tx.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {transactionsData?.transactions?.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg">No transactions found. Start by adding one!</p>
          </div>
        )}
      </div>
    </div>
  );
}
