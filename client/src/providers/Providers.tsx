'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProviders } from './ThemeProviders';
import { NotificationProvider } from './NotificationProvider';
import { AuthProvider } from './AuthProvider';
import { useState } from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AuthProvider>
          <ThemeProviders>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </ThemeProviders>
        </AuthProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
