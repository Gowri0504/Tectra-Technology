'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/providers/AuthProvider';
import { Card, Button, Input, Badge } from '@/components/ui/EliteComponents';
import { 
  Settings, Bell, Shield, Globe, Moon, Sun, 
  CreditCard, User, Mail, Lock 
} from 'lucide-react';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-black">
      <Sidebar userRole={user?.role} />
      
      <main className="flex-1 p-4 lg:p-12 lg:ml-72">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your personal preferences and organization settings.</p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            <Card className="p-8">
              <div className="flex items-center gap-3 mb-8">
                <User className="w-6 h-6 text-indigo-600" />
                <h3 className="text-xl font-black">Profile Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Email Address" defaultValue={user?.email} disabled />
                <Input label="Role" defaultValue={user?.role} disabled />
                <div className="md:col-span-2">
                  <Input label="Organization ID" defaultValue={user?.orgId} disabled />
                </div>
              </div>
              <Button className="mt-8" disabled>Update Profile</Button>
            </Card>

            <Card className="p-8">
              <div className="flex items-center gap-3 mb-8">
                <Lock className="w-6 h-6 text-indigo-600" />
                <h3 className="text-xl font-black">Security Settings</h3>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <div>
                    <p className="font-bold">Two-Factor Authentication</p>
                    <p className="text-sm text-slate-500">Add an extra layer of security to your account.</p>
                  </div>
                  <Badge variant="neutral">Disabled</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <div>
                    <p className="font-bold">Password Last Changed</p>
                    <p className="text-sm text-slate-500">Last updated 3 months ago.</p>
                  </div>
                  <Button variant="outline">Change Password</Button>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="p-8">
              <div className="flex items-center gap-3 mb-8">
                <Moon className="w-6 h-6 text-indigo-600" />
                <h3 className="text-xl font-black">Appearance</h3>
              </div>
              <div className="space-y-4">
                <button 
                  onClick={() => setTheme('light')}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                    theme === 'light' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10' : 'border-transparent bg-slate-50 dark:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Sun className="w-5 h-5" />
                    <span className="font-bold">Light Mode</span>
                  </div>
                  {theme === 'light' && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                </button>
                <button 
                  onClick={() => setTheme('dark')}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                    theme === 'dark' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10' : 'border-transparent bg-slate-50 dark:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Moon className="w-5 h-5" />
                    <span className="font-bold">Dark Mode</span>
                  </div>
                  {theme === 'dark' && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                </button>
              </div>
            </Card>

            <Card className="p-8">
              <div className="flex items-center gap-3 mb-8">
                <Bell className="w-6 h-6 text-indigo-600" />
                <h3 className="text-xl font-black">Notifications</h3>
              </div>
              <div className="space-y-4">
                {['Email Alerts', 'Weekly Reports', 'Budget Warnings'].map((notif) => (
                  <label key={notif} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl cursor-pointer">
                    <span className="font-bold">{notif}</span>
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                  </label>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
