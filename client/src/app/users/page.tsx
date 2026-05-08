'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Users, UserPlus, Trash2, Shield, Mail, Calendar, 
  MoreVertical, Check, X, Loader2 
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/providers/AuthProvider';
import { Card, Button, Badge, Skeleton, Input } from '@/components/ui/EliteComponents';
import { useNotify } from '@/providers/NotificationProvider';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'ACCOUNTANT' | 'USER';
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export default function UsersPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const notify = useNotify();
  const queryClient = useQueryClient();

  useEffect(() => setMounted(true), []);

  const { data: usersResponse, isLoading } = useQuery<ApiResponse<User[]>>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
    enabled: user?.role === 'ADMIN'
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      notify('success', 'User deleted successfully');
    },
    onError: (error: unknown) => {
      notify('error', (error as any).response?.data?.message || 'Failed to delete user');
    }
  });

  if (!mounted) return null;
  if (user?.role !== 'ADMIN') return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="max-w-md text-center p-12">
        <Shield className="w-16 h-16 text-rose-500 mx-auto mb-6" />
        <h2 className="text-2xl font-black mb-4">Access Denied</h2>
        <p className="text-slate-500 font-medium mb-8">Only administrators can manage users in this organization.</p>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </Card>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-black">
      <Sidebar userRole={user?.role} />
      
      <main className="flex-1 p-4 lg:p-12 lg:ml-72">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">User Management</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Manage team members and their access levels.</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <UserPlus className="w-5 h-5" /> Add Team Member
          </Button>
        </header>

        <div className="grid gap-6">
          {isLoading ? (
            Array(3).fill(0).map((_item, i: number) => <Skeleton key={i} className="h-24 w-full" />)
          ) : (
            usersResponse?.data?.map((u) => (
              <Card key={u.id} className="p-4 flex items-center justify-between hover:border-indigo-500/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                    <Users className="text-slate-500 w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 dark:text-white">{u.email}</p>
                      {u.id === user?.userId && <Badge variant="info">You</Badge>}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <Shield className="w-3.5 h-3.5" />
                        {u.role}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        Joined {new Date(u.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                    disabled={u.id === user?.userId || deleteMutation.isPending}
                    onClick={() => {
                      if (confirm('Are you sure you want to remove this user?')) {
                        deleteMutation.mutate(u.id);
                      }
                    }}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
