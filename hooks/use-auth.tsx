'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { MOCK_ADMINS, MOCK_STUDENTS } from '@/lib/mock-data';

interface User {
  id: string;
  studentId: string;
  name: string;
  role: 'student' | 'admin';
}

interface AuthContextType {
  user: User | null;
  login: (studentId: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initAuth = () => {
      const storedUser = localStorage.getItem('jobtrack_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error('Failed to parse stored user', e);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (!isLoading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, isLoading, pathname, router]);

  const login = async (studentId: string, password: string) => {
    // Mock login logic
    const admin = MOCK_ADMINS.find(a => a.adminId === studentId && password === 'admin');
    const student = MOCK_STUDENTS.find(s => s.studentId === studentId && password === 'password');

    if (admin) {
      const adminUser: User = { id: admin.id, studentId: admin.adminId, name: admin.name, role: 'admin' };
      setUser(adminUser);
      localStorage.setItem('jobtrack_user', JSON.stringify(adminUser));
      router.push('/dashboard');
    } else if (student) {
      const studentUser: User = { id: student.id, studentId: student.studentId, name: student.name, role: 'student' };
      setUser(studentUser);
      localStorage.setItem('jobtrack_user', JSON.stringify(studentUser));
      router.push('/dashboard');
    } else {
      throw new Error('Invalid credentials');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('jobtrack_user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
