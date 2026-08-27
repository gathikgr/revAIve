"use client";

import React from "react";

const MOCK_CUSTOMERS = [
  { id: "cust_101", name: "Acme Software Pvt Ltd", email: "billing@acme.in", phone: "+91 98765 43210", risk_score: 0.12, last_contacted: "2 days ago", recovered: "₹45,200" },
  { id: "cust_102", name: "Apex Global Logistics", email: "finance@apex.com", phone: "+91 99887 76655", risk_score: 0.05, last_contacted: "5 days ago", recovered: "₹1,50,000" },
  { id: "cust_103", name: "Nexus Digital Agency", email: "accounts@nexus.agency", phone: "+91 91234 56789", risk_score: 0.25, last_contacted: "1 day ago", recovered: "₹28,990" },
  { id: "cust_104", name: "Starlight Retail Ventures", email: "contact@starlight.store", phone: "+91 97654 32109", risk_score: 0.45, last_contacted: "12 hours ago", recovered: "₹9,990" },
  { id: "cust_105", name: "Vanguard Tech Labs", email: "support@vanguard.io", phone: "+91 94567 89012", risk_score: 0.18, last_contacted: "3 days ago", recovered: "₹62,490" }
];

export default function CustomersPage() {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Customers</h1>
          <p className="text-xs text-slate-400 mt-1">Customer profiles, risk scores, and quiet period tracking.</p>
        </div>
        <div className="text-xs font-mono text-slate-400">Total Customers: <span className="text-white font-bold">5,000</span></div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase">
            <tr>
              <th className="p-4">Customer</th>
              <th className="p-4">Contact Info</th>
              <th className="p-4">Risk Score</th>
              <th className="p-4">Last Contacted</th>
              <th className="p-4">Total Recovered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {MOCK_CUSTOMERS.map((c) => (
              <tr key={c.id} className="hover:bg-slate-800/50 transition-all">
                <td className="p-4 font-bold text-white">
                  <div>{c.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{c.id}</div>
                </td>
                <td className="p-4 font-mono">
                  <div>{c.email}</div>
                  <div className="text-[10px] text-slate-500">{c.phone}</div>
                </td>
                <td className="p-4 font-mono font-bold text-indigo-400">{c.risk_score.toFixed(2)}</td>
                <td className="p-4 text-slate-400">{c.last_contacted}</td>
                <td className="p-4 font-mono font-bold text-emerald-400">{c.recovered}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
