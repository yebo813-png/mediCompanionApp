import React, { useState } from 'react';
import {
  Users, CreditCard, BarChart3, Shield,
  UserCheck, Settings, Activity,
} from 'lucide-react';

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'billing' | 'settings'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
        <p className="text-sm text-slate-500 mt-1">MmediCompannion System Administration</p>
      </div>

      <div className="flex space-x-1 bg-slate-100 rounded-lg p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-white shadow-sm text-teal-700'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Users" value="2" color="teal" />
          <StatCard icon={UserCheck} label="Active Trials" value="1" color="emerald" />
          <StatCard icon={CreditCard} label="Active Subscriptions" value="1" color="blue" />
          <StatCard icon={Shield} label="System Status" value="Live" color="green" />
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-3 font-medium">System Admin</td>
                <td className="px-4 py-3 text-slate-500">admin@mmmedi.com</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">Admin</span></td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">Active</span></td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">Dr. Thabo Ndlovu</td>
                <td className="px-4 py-3 text-slate-500">demo@demo.com</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">Demo</span></td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">Trial</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Payment Gateways</h3>
          <div className="space-y-3">
            {['PayFast', 'Peach Payments', 'Yoco', 'Ozow', 'PayGate', 'Netcash'].map(gw => (
              <div key={gw} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <span className="text-sm font-medium">{gw}</span>
                <span className="text-xs text-slate-400">Not configured</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Supabase URL</p>
              <p className="text-xs text-slate-500 font-mono">jsccrvbqikypddwrexdv.supabase.co</p>
            </div>
            <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700">Connected</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Render Deployment</p>
              <p className="text-xs text-slate-500 font-mono">medicompanionapp.onrender.com</p>
            </div>
            <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700">Live</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Rate Limiting</p>
              <p className="text-xs text-slate-500">100 req/min per IP</p>
            </div>
            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">Active</span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    teal: 'bg-teal-100 text-teal-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}
