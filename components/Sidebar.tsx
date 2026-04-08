'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  ChevronRight,
  User,
  CalendarDays,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminPremiumUi } from '@/lib/admin/admin-theme';

const Sidebar = () => {
  const pathname = usePathname();

  const isAdminRoute = pathname.startsWith('/admin');

  const links: Array<{
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    children?: Array<{ name: string; href: string }>;
  }> = isAdminRoute
    ? [
        {
          name: 'Jobs',
          href: '/admin/jobs',
          icon: Briefcase,
          children: [
            { name: 'Add Jobs', href: '/admin/jobs/add' },
            { name: 'Saved Jobs', href: '/admin/jobs/view' },
          ],
        },
        {
          name: 'Applications',
          href: '/admin/applications',
          icon: FileText,
          children: [
            { name: 'Generate Resume', href: '/admin/applications' },
            { name: 'Applied Jobs Records', href: '/admin/applications/records' },
          ],
        },
        { name: 'Students', href: '/admin/students', icon: User },
        { name: 'Files', href: '/admin/files', icon: FolderOpen },
      ]
    : [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Applications', href: '/applications', icon: Briefcase },
        { name: 'Calendar', href: '/calendar', icon: CalendarDays },
        { name: 'Profile', href: '/profile', icon: User },
      ];

  return (
    <aside
      className={cn(
        'w-64 border-r border-slate-200 bg-white flex flex-col h-screen sticky top-0',
        isAdminRoute && adminPremiumUi.sidebar
      )}
    >
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2">
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold',
              isAdminRoute ? 'bg-gradient-to-br from-lime-300 to-lime-400 text-slate-950' : 'bg-indigo-600'
            )}
          >
            C
          </div>
          <span className={cn('text-xl font-display font-bold tracking-tight', isAdminRoute && 'text-slate-100')}>
            CareerOrbit
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {links.map((link) => {
          const isParentWithChildren = !!link.children;
          const isActive = isParentWithChildren ? pathname.startsWith(link.href) : pathname === link.href;
          const showChildren = !!link.children && pathname.startsWith(link.href);
          return (
            <div key={link.name}>
              <Link
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? isAdminRoute
                      ? 'bg-lime-300/15 text-lime-100'
                      : "bg-indigo-50 text-indigo-700"
                    : isAdminRoute
                      ? 'text-slate-300 hover:bg-white/[0.04] hover:text-slate-100'
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <link.icon
                  className={cn(
                    "w-5 h-5",
                    isActive
                      ? isAdminRoute
                        ? 'text-lime-200'
                        : "text-indigo-600"
                      : isAdminRoute
                        ? 'text-slate-500'
                        : "text-slate-400"
                  )}
                />
                <span className="flex-1">{link.name}</span>
                {showChildren && (
                  <ChevronRight className={cn('w-4 h-4 rotate-90', isAdminRoute ? 'text-lime-300' : 'text-indigo-500')} />
                )}
              </Link>

              {showChildren && (
                <div className={cn('mt-1 ml-4 pl-4 border-l space-y-1', isAdminRoute ? 'border-white/10' : 'border-slate-200')}>
                  {link.children!.map((child) => {
                    const childActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "block rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                          childActive
                            ? isAdminRoute
                              ? 'bg-lime-300/15 text-lime-100'
                              : "bg-indigo-50 text-indigo-700"
                            : isAdminRoute
                              ? 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        )}
                      >
                        {child.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
