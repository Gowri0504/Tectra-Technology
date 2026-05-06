'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api, { setAccessToken } from '@/lib/api';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui/EliteComponents';

const registerSchema = z.object({
  orgName: z.string().min(2, 'Organization name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/register', data);
      setAccessToken(response.data.accessToken);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] right-[10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] left-[10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
      </div>

      <Card className="w-full max-w-lg p-8 lg:p-12 relative z-10 border-none shadow-2xl shadow-indigo-500/10 dark:shadow-none">
        <div className="flex flex-col items-center mb-10">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: -5 }}
            className="w-16 h-16 bg-emerald-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-emerald-500/40 mb-6"
          >
            <UserPlus className="text-white w-8 h-8" />
          </motion.div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2 text-center">Get Started</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Create your multi-tenant organization</p>
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
            label="Organization Name"
            placeholder="Tectra Technology Ltd."
            {...register('orgName')}
            error={errors.orgName?.message}
            required
          />

          <Input
            label="Admin Email"
            type="email"
            placeholder="admin@tectra.com"
            {...register('email')}
            error={errors.email?.message}
            required
          />
          
          <Input
            label="Master Password"
            type="password"
            placeholder="••••••••"
            {...register('password')}
            error={errors.password?.message}
            required
          />

          <Button 
            type="submit" 
            className="w-full py-4 text-lg mt-4 group"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <div className="flex items-center justify-center gap-2">
                Create Enterprise Instance
              </div>
            )}
          </Button>

          <p className="text-center text-slate-500 dark:text-slate-400 text-sm font-medium">
            Already have an account?{' '}
            <button 
              type="button" 
              onClick={() => router.push('/login')}
              className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
            >
              Sign in to dashboard
            </button>
          </p>
        </form>
      </Card>
    </div>
  );
}
