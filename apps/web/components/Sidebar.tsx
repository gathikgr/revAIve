"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
}

const navSections: { title?: string; items: NavItem[] }[] = [
  {
    items: [
      { label: "Overview", href: "/", icon: "📊" },
    ],
  },
  {
    title: "REVENUE",
    items: [
      { label: "Revenue Opportunities", href: "/opportunities", icon: "💰" },
      { label: "Recovery Queue", href: "/queue", icon: "⏳", badge: "2" },
      { label: "Customers", href: "/customers", icon: "👥" },
      { label: "Transactions", href: "/transactions", icon: "💳" },
    ],
  },
  {
    title: "INTELLIGENCE",
    items: [
      { label: "Agent Studio & Tester", href: "/agent-studio", icon: "⚡", badge: "LIVE" },
      { label: "Agent Overview", href: "/agent", icon: "🤖" },
      { label: "Experiments", href: "/experiments", icon: "🧪" },
      { label: "Policy Lab", href: "/policy-lab", icon: "⚙️" },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { label: "Audit Log", href: "/audit-log", icon: "📋" },
      { label: "Integrations", href: "/integrations", icon: "🔌" },
    ],
  },
  {
    items: [
      { label: "Settings", href: "/settings", icon: "🛠️" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#0a2540] border-r border-[#2a2f45] flex flex-col justify-between shrink-0 h-screen sticky top-0 font-sans shadow-2xl">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-[#2a2f45]">
          <Link href="/" className="group block">
            <div className="text-2xl font-black tracking-tight text-white flex items-center gap-1">
              <span>rev</span>
              <span className="text-[#635bff]">AI</span>
              <span>ve</span>
            </div>
            <div className="text-[11px] font-medium text-slate-400 mt-1 tracking-tight">
              Bring lost revenue back.
            </div>
          </Link>
          <div className="mt-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00d4b2] animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Razorpay Test Mode
            </span>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navSections.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              {sec.title && (
                <div className="px-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2">
                  {sec.title}
                </div>
              )}
              {sec.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-[#635bff]/20 text-white border border-[#635bff]/40 shadow-sm"
                        : "text-slate-300 hover:text-white hover:bg-[#1a1f36]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm opacity-80">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#635bff]/30 text-[#00d4b2] border border-[#635bff]/40 rounded">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Operator Info */}
      <div className="p-4 border-t border-[#2a2f45] bg-[#0f172a]/60 text-xs text-slate-400 flex items-center justify-between">
        <div>
          <div className="font-semibold text-slate-200 text-[11px]">SaaSify Tech Ltd</div>
          <div className="text-[10px] text-slate-400 font-mono">rzp_merch_saasify01</div>
        </div>
        <span className="px-2 py-0.5 text-[10px] bg-[#1a1f36] text-slate-300 rounded font-mono border border-[#2a2f45]">v1.2.0</span>
      </div>
    </aside>
  );
}
