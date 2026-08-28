"use client";

import React from "react";

const MOCK_TRANSACTIONS = [
  { id: "pay_merch_1001", amount: "₹1,499.00", method: "card", status: "failed", code: "BAD_REQUEST_PAYMENT_DECLINED_INSUFFICIENT_FUNDS", bank: "HDFC", timestamp: "2026-08-27 13:45:00 UTC" },
  { id: "pay_merch_1002", amount: "₹75,000.00", method: "card", status: "failed", code: "GATEWAY_TIMEOUT", bank: "SBI", timestamp: "2026-08-27 13:42:00 UTC" },
  { id: "sub_merch_2001", amount: "₹2,999.00", method: "mandate", status: "failed", code: "BANK_MAINTENANCE_OUTAGE", bank: "ICICI", timestamp: "2026-08-27 13:30:00 UTC" },
  { id: "pay_merch_1004", amount: "₹4,999.00", method: "card", status: "failed", code: "CARD_EXPIRED", bank: "AXIS", timestamp: "2026-08-27 13:15:00 UTC" }
];

export default function TransactionsPage() {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 font-sans bg-[#f6f9fc] text-[#32325d]">
      <div className="flex justify-between items-center border-b border-[#e6ebf1] pb-6">
        <div>
          <h1 className="text-xl font-bold text-[#32325d] tracking-tight">Transactions</h1>
          <p className="text-xs text-[#6b7c93] mt-1">Payment attempts, error responses, and gateway codes.</p>
        </div>
        <div className="text-xs font-mono text-[#6b7c93]">Total Payment Attempts: <span className="text-[#32325d] font-bold">15,583</span></div>
      </div>

      <div className="bg-white border border-[#e6ebf1] rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f6f9fc] text-[#6b7c93] font-semibold border-b border-[#e6ebf1] uppercase">
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
          <tbody className="divide-y divide-[#e6ebf1] text-[#32325d]">
            {MOCK_TRANSACTIONS.map((t) => (
              <tr key={t.id} className="hover:bg-[#f6f9fc] transition-all font-mono">
                <td className="p-4 font-bold text-[#32325d]">{t.id}</td>
                <td className="p-4 font-bold text-[#32325d]">{t.amount}</td>
                <td className="p-4 text-[#635bff] uppercase">{t.method}</td>
                <td className="p-4">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-700 border border-rose-200 uppercase">
                    {t.status}
                  </span>
                </td>
                <td className="p-4 text-[#6b7c93] max-w-xs truncate">{t.code}</td>
                <td className="p-4 font-bold text-[#32325d]">{t.bank}</td>
                <td className="p-4 text-[#6b7c93]">{t.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
