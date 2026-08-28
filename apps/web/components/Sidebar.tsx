"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole, UserRole } from "../context/RoleContext";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { role, setRole } = useRole();
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  // Define navigation items dynamically based on the active role
  const getNavSections = (): { title?: string; items: NavItem[] }[] => {
    if (role === "customer") {
      return [
        {
          title: "CUSTOMER PORTAL",
          items: [
            { label: "Checkout Simulator", href: "/", icon: "🛒" },
            { label: "My Transactions", href: "/transactions", icon: "💳" }
          ]
        }
      ];
    }

    if (role === "admin") {
      return [
        {
          title: "AI OPERATIONS ENGINE",
          items: [
            { label: "AI Agent Operations", href: "/", icon: "🤖", badge: "CORE" },
            { label: "Evaluation Suite", href: "/agent-studio", icon: "⚡" },
            { label: "System Config", href: "/policy-lab", icon: "⚙️" },
            { label: "System Settings", href: "/settings", icon: "🛠️" }
          ]
        }
      ];
    }

    // Default: Merchant
    return [
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
          { label: "Policy Lab", href: "/policy-lab", icon: "⚙️" },
        ],
      },
      {
        title: "OPERATIONS",
        items: [
          { label: "Audit Log", href: "/audit-log", icon: "📋" },
        ],
      }
    ];
  };

  const currentProfileName = () => {
    if (role === "customer") return "Acme Customer Account";
    if (role === "admin") return "revAIve Core AI Admin";
    return "SaaSify Merchant Account";
  };

  const currentProfileIcon = () => {
    if (role === "customer") return "👤";
    if (role === "admin") return "🤖";
    return "🏢";
  };

  return (
    <aside className="w-64 bg-white border-r border-[#e6ebf1] flex flex-col justify-between shrink-0 h-screen sticky top-0 font-sans shadow-sm z-40">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-[#e6ebf1]">
          <Link href="/" className="group block">
            <div className="text-2xl font-black tracking-tight text-[#32325d] flex items-center gap-1">
              <span>rev</span>
              <span className="text-[#635bff]">AI</span>
              <span>ve</span>
            </div>
            <div className="text-[11px] font-semibold text-[#6b7c93] mt-1 tracking-tight">
              Bring lost revenue back.
            </div>
          </Link>
        </div>

        {/* Dynamic Instagram-style Account Switcher */}
        <div className="px-4 py-3 border-b border-[#e6ebf1] bg-[#f6f9fc]/50 relative">
          <button
            onClick={() => setShowRoleSelector(!showRoleSelector)}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-white border border-[#e6ebf1] shadow-sm hover:bg-[#f6f9fc] transition-all text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{currentProfileIcon()}</span>
              <div>
                <div className="text-[11px] font-bold text-[#32325d] leading-none">
                  {currentProfileName()}
                </div>
                <span className="text-[9px] font-mono text-[#6b7c93] uppercase">
                  Active Mode
                </span>
              </div>
            </div>
            <span className="text-[10px] text-[#6b7c93]">▼</span>
          </button>

          {showRoleSelector && (
            <div className="absolute left-4 right-4 top-14 bg-white border border-[#e6ebf1] rounded-lg shadow-lg z-50 overflow-hidden font-sans">
              <div className="p-1.5 text-[9px] font-bold text-[#6b7c93] uppercase bg-[#f6f9fc] border-b border-[#e6ebf1]">
                Switch Active Account
              </div>
              <button
                onClick={() => {
                  setRole("merchant");
                  setShowRoleSelector(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#32325d] hover:bg-[#f6f9fc] text-left ${
                  role === "merchant" ? "bg-[#635bff]/5 text-[#635bff]" : ""
                }`}
              >
                <span>🏢</span> SaaSify Merchant Account
              </button>
              <button
                onClick={() => {
                  setRole("customer");
                  setShowRoleSelector(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#32325d] hover:bg-[#f6f9fc] text-left ${
                  role === "customer" ? "bg-[#635bff]/5 text-[#635bff]" : ""
                }`}
              >
                <span>👤</span> Acme Customer Account
              </button>
              <button
                onClick={() => {
                  setRole("admin");
                  setShowRoleSelector(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#32325d] hover:bg-[#f6f9fc] text-left ${
                  role === "admin" ? "bg-[#635bff]/5 text-[#635bff]" : ""
                }`}
              >
                <span>🤖</span> revAIve Core AI Admin
              </button>
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className="p-4 space-y-5 overflow-y-auto max-h-[calc(100vh-210px)]">
          {getNavSections().map((sec, idx) => (
            <div key={idx} className="space-y-1">
              {sec.title && (
                <div className="px-3 text-[10px] font-bold text-[#6b7c93] tracking-wider uppercase mb-1.5 font-mono">
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
                        ? "bg-[#635bff]/10 text-[#635bff] border border-[#635bff]/20 shadow-sm"
                        : "text-[#6b7c93] hover:text-[#32325d] hover:bg-[#f6f9fc]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm opacity-80">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#635bff]/10 text-[#635bff] border border-[#635bff]/20 rounded">
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
      <div className="p-4 border-t border-[#e6ebf1] bg-[#f6f9fc] text-xs text-[#6b7c93] flex items-center justify-between">
        <div>
          <div className="font-semibold text-[#32325d] text-[11px]">SaaSify Tech Ltd</div>
          <div className="text-[10px] text-[#6b7c93] font-mono">Mode: {role.toUpperCase()}</div>
        </div>
        <span className="px-2 py-0.5 text-[10px] bg-white text-[#6b7c93] rounded font-mono border border-[#e6ebf1]">v1.2.0</span>
      </div>
    </aside>
  );
}
