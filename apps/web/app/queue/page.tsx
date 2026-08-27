"use client";

import React, { useState } from "react";

export default function RecoveryQueuePage() {
  const [activeTab, setActiveTab] = useState<"human_review" | "automatic" | "scheduled" | "failed" | "completed">("human_review");
  const [approvedItems, setApprovedItems] = useState<string[]>([]);

  const handleApprove = (id: string) => {
    setApprovedItems([...approvedItems, id]);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Recovery Queue</h1>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch queue for automated and operator-approved recovery actions.
          </p>
        </div>
        <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs font-bold font-mono">
          2 Pending Human Approvals
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-6 text-xs font-semibold">
        {[
          { key: "human_review", label: "Human Review", badge: "2" },
          { key: "automatic", label: "Automatic Queue", badge: "14" },
          { key: "scheduled", label: "Scheduled Retries", badge: "8" },
          { key: "completed", label: "Completed", badge: "583" },
          { key: "failed", label: "Failed / Expired", badge: "12" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === tab.key
                ? "border-indigo-400 text-indigo-400 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.5 text-[10px] rounded font-mono ${
              tab.key === "human_review" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-slate-800 text-slate-300"
            }`}>
              {tab.badge}
            </span>
          </button>
        ))}
      </div>

      {/* Human Review Tab Content */}
      {activeTab === "human_review" && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200">
            ⚠️ <strong>Human Review Gate Triggered:</strong> These transactions exceed the automated threshold (&gt; ₹50,000 INR). Review risk profile and click Approve to dispatch.
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase">
                <tr>
                  <th className="p-4">Opportunity</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Amount at Risk</th>
                  <th className="p-4">Likelihood</th>
                  <th className="p-4">Policy Gate Reason</th>
                  <th className="p-4">Action Required</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {!approvedItems.includes("opp_saas_002") && (
                  <tr className="bg-amber-500/5 hover:bg-amber-500/10 transition-all">
                    <td className="p-4 font-mono font-bold text-amber-300">opp_saas_002</td>
                    <td className="p-4 font-bold text-white">Apex Global Logistics</td>
                    <td className="p-4 font-mono font-bold text-white">₹75,000.00</td>
                    <td className="p-4 font-mono text-indigo-400 font-bold">92%</td>
                    <td className="p-4 text-amber-300">HIGH_VALUE_THRESHOLD (&gt; ₹50k)</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleApprove("opp_saas_002")}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-md"
                      >
                        ✓ Approve Action
                      </button>
                    </td>
                  </tr>
                )}

                {!approvedItems.includes("opp_saas_008") && (
                  <tr className="bg-amber-500/5 hover:bg-amber-500/10 transition-all">
                    <td className="p-4 font-mono font-bold text-amber-300">opp_saas_008</td>
                    <td className="p-4 font-bold text-white">Zenith Financial Infrastructure</td>
                    <td className="p-4 font-mono font-bold text-white">₹1,20,000.00</td>
                    <td className="p-4 font-mono text-indigo-400 font-bold">85%</td>
                    <td className="p-4 text-amber-300">HIGH_VALUE_THRESHOLD (&gt; ₹50k)</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleApprove("opp_saas_008")}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-md"
                      >
                        ✓ Approve Action
                      </button>
                    </td>
                  </tr>
                )}

                {approvedItems.length === 2 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                      ✓ All pending human approvals have been cleared.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Automatic Tab Content */}
      {activeTab === "automatic" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-xs text-slate-400">
          14 automated retry actions cleared by Policy Guard and queued for dispatch.
        </div>
      )}
    </div>
  );
}
