'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { MOCK_STUDENTS } from '@/lib/mock-data';
import { 
  User, 
  Mail, 
  GraduationCap, 
  BookOpen, 
  Shield
} from 'lucide-react';

export default function ProfilePage() {
  const student = MOCK_STUDENTS[0];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-500">Manage your personal information and preferences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 mx-auto mb-4">
                <User className="w-12 h-12" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">{student.name}</h2>
              
              <div className="mt-6 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 italic">
                  Contact your career advisor to update your profile details.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Account Status</h3>
              <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium">Verified Account</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</p>
                  <div className="flex items-center gap-2 text-slate-900 font-medium">
                    <User className="w-4 h-4 text-slate-400" />
                    {student.name}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</p>
                  <div className="flex items-center gap-2 text-slate-900 font-medium">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {student.email}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Major</p>
                  <div className="flex items-center gap-2 text-slate-900 font-medium">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    {student.major}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Graduation Year</p>
                  <div className="flex items-center gap-2 text-slate-900 font-medium">
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    {student.graduationYear}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Security</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Password</p>
                    <p className="text-xs text-slate-500">Last changed 3 months ago</p>
                  </div>
                  <button className="text-sm font-medium text-indigo-600 hover:underline">Change Password</button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Two-Factor Authentication</p>
                    <p className="text-xs text-slate-500">Add an extra layer of security</p>
                  </div>
                  <button className="text-sm font-medium text-indigo-600 hover:underline">Enable</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
