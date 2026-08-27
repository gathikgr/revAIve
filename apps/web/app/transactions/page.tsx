"use client";

import React from "react";

const MOCK_TRANSACTIONS = [
  { id: "pay_saas_1001", amount: "₹1,499.00", method: "card", status: "failed", code: "BAD_REQUEST_PAYMENT_DECLINED_INSUFFICIENT_FUNDS", bank: "HDFC", timestamp: "2026-08-27 13:45:00 UTC" },
  { id: "pay_saas_1002", amount: "₹75,000.00", method: "card", status: "failed", code: "GATEWAY_TIMEOUT", bank: "SBI", timestamp: "2026-08-27 13:42:00 UTC" },
  { id: "sub_saas_2001", amount: "₹2,999.00", method: "mandate", status: "failed", code: "BANK_MAINTENANCE_OUTAGE", bank: "ICICI", timestamp: "2026-08-27 13:30:00 UTC" },
  { id: "pay_saas_1004", amount: "₹4,999.00", method: "card", status: "failed", code: "CARD_EXPIRED", bank: "AXIS", timestamp: "2026-08-27 13:15:00 UTC" }
];

export default function TransactionsPage() {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Transactions</h1>
          <p className="text-xs text-slate-400 mt-1">Raw Razorpay payment attempts, error responses, and bank codes.</p>
        </div>
        <div className="text-xs font-mono text-slate-400">Total Payment Attempts: <span className="text-white font-bold">15,583</span></div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase">
            <tr>
              <th className="p-4">Payment ID</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Method</th>
              <th className="p-4">Status</th>
              <th className="p-4">Gateway Error Code</th>
              <th className="p-4">Bank</th>
              <th className="p-4">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {MOCK_TRANSACTIONS.map((t) => (
              <tr key={t.id} className="hover:bg-slate-800/50 transition-all font-mono">
                <td className="p-4 font-bold text-white">{t.id}</td>
                <td className="p-4 font-bold text-white">{t.amount}</td>
                <td className="p-4 text-indigo-300 uppercase">{t.method}</td>
                <td className="p-4">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                    {t.status}
                  </span>
                </td>
                <td className="p-4 text-slate-400 max-w-xs truncate">{t.code}</td>
                <td className="p-4 font-bold text-slate-200">{t.bank}</td>
                <td className="p-4 text-slate-500">{t.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
