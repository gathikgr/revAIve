"use client";

import React, { useState, useEffect } from "react";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/v1/transactions")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setTransactions(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 font-sans bg-[#f6f9fc] text-[#32325d]">
      <div className="flex justify-between items-center border-b border-[#e6ebf1] pb-6">
        <div>
          <h1 className="text-xl font-bold text-[#32325d] tracking-tight">Transactions</h1>
          <p className="text-xs text-[#6b7c93] mt-1">Live payment attempts, gateway error responses, and bank codes.</p>
        </div>
        <div className="text-xs font-mono text-[#6b7c93]">
          Recorded Transactions: <span className="text-[#32325d] font-bold">{transactions.length}</span>
        </div>
      </div>

      <div className="bg-white border border-[#e6ebf1] rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#6b7c93]">Loading transactions...</div>
        ) : (
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
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#6b7c93]">
                    No transactions recorded. Switch to Customer mode to simulate a checkout payment.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-[#f6f9fc] transition-all font-mono">
                    <td className="p-4 font-bold text-[#32325d]">{t.id}</td>
                    <td className="p-4 font-bold text-[#32325d]">{t.amount}</td>
                    <td className="p-4 text-[#635bff] uppercase">{t.method}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                        t.status === "captured" || t.status === "succeeded"
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : "bg-rose-100 text-rose-700 border border-rose-200"
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-4 text-[#6b7c93] max-w-xs truncate">{t.code}</td>
                    <td className="p-4 font-bold text-[#32325d]">{t.bank}</td>
                    <td className="p-4 text-[#6b7c93]">{t.timestamp}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
