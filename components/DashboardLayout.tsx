'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { cn } from '@/lib/utils';
import { adminPremiumUi } from '@/lib/admin/admin-theme';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <div className={cn('flex min-h-screen bg-slate-50', isAdminRoute && adminPremiumUi.pageBackground)}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className={cn('p-8', isAdminRoute && 'text-slate-100')}>
          {children}
        </main>
      </div>
    </div>
  );
}
