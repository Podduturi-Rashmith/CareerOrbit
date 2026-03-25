'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Briefcase, 
  Calendar, 
  User, 
  Settings, 
  LogOut,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [newUserCount, setNewUserCount] = React.useState(0);

  React.useEffect(() => {
    const loadNewUserCount = async () => {
      if (user?.role !== 'admin') return;
      try {
        const response = await fetch('/api/admin/new-users?countOnly=1', { credentials: 'include' });
        if (!response.ok) return;
        const data = await response.json();
        setNewUserCount(data.count || 0);
      } catch {
        setNewUserCount(0);
      }
    };

    loadNewUserCount().catch(() => undefined);
  }, [user]);

  const studentLinks: { name: string; href: string; icon: React.ElementType; badge?: number }[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Applications', href: '/applications', icon: Briefcase },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const adminLinks = [
    { name: 'New Users', href: '/admin/new-users', icon: UserPlus, badge: newUserCount },
    { name: 'Admin Panel', href: '/admin', icon: ShieldCheck },
  ];

  const links = user?.role === 'admin' ? [...studentLinks, ...adminLinks] : studentLinks;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
            C
          </div>
          <span className="text-xl font-display font-bold tracking-tight">CareerOrbit</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-indigo-50 text-indigo-700" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <link.icon className={cn("w-5 h-5", isActive ? "text-indigo-600" : "text-slate-400")} />
              <span className="flex-1">{link.name}</span>
              {link.badge && link.badge > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-rose-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1.5">
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
