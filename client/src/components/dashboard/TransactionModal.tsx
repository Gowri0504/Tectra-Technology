'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { Button, Input } from '@/components/ui/EliteComponents';
import api from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

const transactionSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  type: z.enum(['INCOME', 'EXPENSE']),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
  tags: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

export const TransactionModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: {
      type: 'EXPENSE',
      date: new Date().toISOString().split('T')[0],
      tags: ''
    } as any
  });

  const currentType = watch('type');

  const mutation = useMutation({
    mutationFn: (data: TransactionFormValues) => {
      const payload = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(s => s.trim()) : []
      };
      return api.post('/transactions', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      reset();
      onClose();
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 p-8 overflow-hidden"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">New Transaction</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl gap-1">
            {['EXPENSE', 'INCOME'].map((type) => (
              <label key={type} className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  value={type}
                  {...register('type')}
                  className="hidden"
                />
                <div className={cn(
                  "py-3 rounded-xl text-xs font-black text-center transition-all",
                  currentType === type 
                    ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700"
                )}>
                  {type}
                </div>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount ($)"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('amount')}
              error={errors.amount?.message}
            />
            <Input
              label="Date"
              type="date"
              {...register('date')}
              error={errors.date?.message}
            />
          </div>

          <Input
            label="Description"
            placeholder="e.g. Monthly Rent"
            {...register('description')}
            error={errors.description?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Category"
              placeholder="e.g. Housing"
              {...register('category')}
              error={errors.category?.message}
            />
            <Input
              label="Tags (comma separated)"
              placeholder="rent, home, fixed"
              {...register('tags')}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full py-4 mt-4"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Create Transaction'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};
