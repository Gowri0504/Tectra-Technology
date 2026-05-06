'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api, { setAccessToken } from '@/lib/api';
import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui/EliteComponents';
import { useNotify } from '@/providers/NotificationProvider';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const notify = useNotify();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', data);
      setAccessToken(response.data.accessToken);
      notify('success', 'Successfully logged in!');
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(msg);
      notify('error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
      </div>

      <Card className="w-full max-w-lg p-8 lg:p-12 relative z-10 border-none shadow-2xl shadow-indigo-500/10 dark:shadow-none">
        <div className="flex flex-col items-center mb-10">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-indigo-500/40 mb-6"
          >
            <DollarSign className="text-white w-8 h-8" />
          </motion.div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Welcome Back</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Access your enterprise dashboard</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-bold flex items-center gap-3"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Corporate Email"
            type="email"
            placeholder="name@company.com"
            {...register('email')}
            error={errors.email?.message}
            required
            autoComplete="email"
          />
          
          <div className="space-y-1.5">
            <Input
              label="Secure Password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              error={errors.password?.message}
              required
              autoComplete="current-password"
            />
            <div className="flex justify-end">
              <button type="button" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Forgot password?
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full py-4 text-lg mt-4 group"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <div className="flex items-center justify-center gap-2">
                Sign In to Account
              </div>
            )}
          </Button>

          <p className="text-center text-slate-500 dark:text-slate-400 text-sm font-medium">
            Don't have an account?{' '}
            <button 
              type="button" 
              onClick={() => router.push('/register')}
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            >
              Register your organization
            </button>
          </p>
        </form>
      </Card>
    </div>
  );
}
