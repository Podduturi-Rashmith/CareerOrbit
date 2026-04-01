'use client';

import React from 'react';
import { Show, UserButton, SignInButton } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { Bell, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminPremiumUi } from '@/lib/admin/admin-theme';

const Topbar = () => {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <header
      className={cn(
        'h-16 border-bottom border-slate-200 bg-white flex items-center justify-between px-8 sticky top-0 z-10',
        isAdminRoute && adminPremiumUi.topbar
      )}
    >
      <div
        className={cn(
          'flex items-center bg-slate-100 rounded-lg px-3 py-1.5 w-96',
          isAdminRoute && 'border border-white/10 bg-white/[0.03]'
        )}
      >
        <Search className={cn('w-4 h-4 text-slate-400 mr-2', isAdminRoute && 'text-slate-500')} />
        <input
          type="text"
          placeholder="Search applications..."
          className={cn('bg-transparent border-none outline-none text-sm w-full', isAdminRoute && 'text-slate-200 placeholder:text-slate-500')}
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          className={cn(
            'p-2 text-slate-400 hover:text-slate-600 relative',
            isAdminRoute && 'rounded-lg border border-transparent hover:border-white/10 hover:bg-white/[0.03] hover:text-slate-200'
          )}
        >
          <Bell className="w-5 h-5" />
          <span
            className={cn(
              'absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white',
              isAdminRoute && 'border-[#0b1118]'
            )}
          />
        </button>

        <div className={cn('h-8 w-px bg-slate-200 mx-2', isAdminRoute && 'bg-white/10')} />

        <Show when="signed-in">
          <UserButton />
        </Show>
        <Show when="signed-out">
          <SignInButton mode="modal" />
        </Show>
      </div>
    </header>
  );
};

export default Topbar;
