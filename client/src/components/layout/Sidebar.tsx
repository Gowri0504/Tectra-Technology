'use client';

import { 
  DollarSign, LayoutDashboard, Wallet, TrendingUp, 
  Settings, LogOut, Users, PieChart as PieIcon 
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/EliteComponents';
import api, { setAccessToken } from '@/lib/api';
import { useNotify } from '@/providers/NotificationProvider';

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Transactions', icon: Wallet, path: '/transactions' },
  { label: 'Analytics', icon: PieIcon, path: '/analytics' },
  { label: 'Users', icon: Users, path: '/users', adminOnly: true },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

export const Sidebar = ({ userRole }: { userRole?: string }) => {
  const pathname = usePathname();
  const router = useRouter();
  const notify = useNotify();

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

  return (
    <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-8 fixed h-screen" aria-label="Main Sidebar">
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <DollarSign className="text-white w-6 h-6" />
        </div>
        <span className="text-xl font-black tracking-tight dark:text-white">TECTRA</span>
      </div>
      
      <nav className="flex-1 space-y-2" role="navigation">
        {menuItems.map((item) => {
          if (item.adminOnly && userRole !== 'ADMIN') return null;
          
          const isActive = pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => router.push(item.path)}
              aria-label={`Go to ${item.label}`}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 font-bold",
                isActive 
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/20" 
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto">
        <Button 
          variant="ghost" 
          onClick={handleLogout} 
          className="w-full justify-start text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
        >
          <LogOut className="w-5 h-5" /> Logout
        </Button>
      </div>
    </aside>
  );
};
