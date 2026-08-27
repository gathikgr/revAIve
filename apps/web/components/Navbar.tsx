'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  TrendingUp, 
  Layers, 
  ShieldCheck, 
  FileText, 
  Sliders, 
  Activity,
  CheckCircle2
} from 'lucide-react';

const navItems = [
  { label: 'Overview', href: '/', icon: TrendingUp },
  { label: 'Revenue Opportunities', href: '/opportunities', icon: Layers },
  { label: 'Recovery Queue', href: '/queue', icon: ShieldCheck },
  { label: 'Policy Lab', href: '/policy-lab', icon: Sliders },
  { label: 'Audit Log', href: '/audit-log', icon: FileText },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-800 bg-[#0c121e]/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white">
                  rev<span className="text-emerald-400">AI</span>ve
                </span>
                <span className="hidden md:inline-block ml-3 text-xs font-medium text-slate-400 border-l border-slate-700 pl-3">
                  Autonomous Revenue Recovery
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Razorpay Test Mode Badge */}
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              Razorpay Test Mode
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
