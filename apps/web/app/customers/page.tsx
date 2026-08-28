"use client";

import React, { useState, useEffect } from "react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/v1/customers")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCustomers(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 font-sans bg-[#f6f9fc] text-[#32325d]">
      <div className="flex justify-between items-center border-b border-[#e6ebf1] pb-6">
        <div>
          <h1 className="text-xl font-bold text-[#32325d] tracking-tight">Customers</h1>
          <p className="text-xs text-[#6b7c93] mt-1">Customer risk profiles, fatigue scores, and contact quiet periods.</p>
        </div>
        <div className="text-xs font-mono text-[#6b7c93]">
          Total Profiles: <span className="text-[#32325d] font-bold">{customers.length}</span>
        </div>
      </div>

      <div className="bg-white border border-[#e6ebf1] rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#6b7c93]">Loading customer profiles...</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f6f9fc] text-[#6b7c93] font-semibold border-b border-[#e6ebf1] uppercase">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Risk Score</th>
                <th className="p-4">Last Contacted</th>
                <th className="p-4">Total Recovered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6ebf1] text-[#32325d]">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#6b7c93]">
                    No customers found. Run a simulation scenario.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#f6f9fc] transition-all">
                    <td className="p-4 font-semibold text-[#32325d]">
                      <div>{c.name}</div>
                      <div className="text-[10px] text-[#6b7c93] font-mono">{c.id}</div>
                    </td>
                    <td className="p-4 font-mono">
                      <div>{c.email}</div>
                      <div className="text-[10px] text-[#6b7c93]">{c.phone}</div>
                    </td>
                    <td className="p-4 font-mono font-bold text-[#635bff]">{Number(c.risk_score).toFixed(2)}</td>
                    <td className="p-4 text-[#6b7c93] font-mono">{c.last_contacted}</td>
                    <td className="p-4 font-mono font-bold text-[#22c55e]">{c.recovered}</td>
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
