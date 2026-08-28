"use client";

import React, { useState } from "react";

export default function RecoveryQueuePage() {
  const [activeTab, setActiveTab] = useState<"human_review" | "automatic" | "scheduled" | "failed" | "completed">("human_review");
  const [approvedItems, setApprovedItems] = useState<string[]>([]);

  const handleApprove = (id: string) => {
    setApprovedItems([...approvedItems, id]);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 font-sans bg-[#f6f9fc] text-[#32325d]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e6ebf1] pb-6">
        <div>
          <h1 className="text-xl font-bold text-[#32325d] tracking-tight">Recovery Queue</h1>
          <p className="text-xs text-[#6b7c93] mt-1">
            Dispatch queue for automated and operator-approved recovery actions.
          </p>
        </div>
        <div className="px-3 py-1.5 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-lg text-[#f59e0b] text-xs font-bold font-mono">
          2 Pending Human Approvals
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e6ebf1] space-x-6 text-xs font-semibold">
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
                ? "border-[#635bff] text-[#635bff] font-bold"
                : "border-transparent text-[#6b7c93] hover:text-[#32325d]"
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.5 text-[10px] rounded font-mono ${
              tab.key === "human_review" ? "bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20" : "bg-[#f6f9fc] text-[#6b7c93]"
            }`}>
              {tab.badge}
            </span>
          </button>
        ))}
      </div>

      {/* Human Review Tab Content */}
      {activeTab === "human_review" && (
        <div className="space-y-4">
          <div className="p-4 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-xl text-xs text-[#b45309]">
            ⚠️ <strong>Human Review Gate Triggered:</strong> These transactions exceed the automated threshold (&gt; ₹50,000 INR). Review risk profile and click Approve to dispatch.
          </div>

          <div className="bg-white border border-[#e6ebf1] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f6f9fc] text-[#6b7c93] font-semibold border-b border-[#e6ebf1] uppercase">
                <tr>
                  <th className="p-4">Opportunity</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Amount at Risk</th>
                  <th className="p-4">Likelihood</th>
                  <th className="p-4">Policy Gate Reason</th>
                  <th className="p-4">Action Required</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6ebf1] text-[#32325d]">
                {!approvedItems.includes("opp_merch_002") && (
                  <tr className="hover:bg-[#f6f9fc] transition-all">
                    <td className="p-4 font-mono font-bold text-[#f59e0b]">opp_merch_002</td>
                    <td className="p-4 font-bold text-[#32325d]">Apex Global Logistics</td>
                    <td className="p-4 font-mono font-bold text-[#32325d]">₹75,000.00</td>
                    <td className="p-4 font-mono text-[#635bff] font-bold">92%</td>
                    <td className="p-4 text-[#f59e0b]">HIGH_VALUE_THRESHOLD (&gt; ₹50k)</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleApprove("opp_merch_002")}
                        className="px-3 py-1.5 bg-[#635bff] hover:bg-[#544dc9] text-white font-bold rounded-lg text-xs transition-all shadow-sm"
                      >
                        ✓ Approve Action
                      </button>
                    </td>
                  </tr>
                )}

                {!approvedItems.includes("opp_merch_008") && (
                  <tr className="hover:bg-[#f6f9fc] transition-all">
                    <td className="p-4 font-mono font-bold text-[#f59e0b]">opp_merch_008</td>
                    <td className="p-4 font-bold text-[#32325d]">Zenith Financial Infrastructure</td>
                    <td className="p-4 font-mono font-bold text-[#32325d]">₹1,20,000.00</td>
                    <td className="p-4 font-mono text-[#635bff] font-bold">85%</td>
                    <td className="p-4 text-[#f59e0b]">HIGH_VALUE_THRESHOLD (&gt; ₹50k)</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleApprove("opp_merch_008")}
                        className="px-3 py-1.5 bg-[#635bff] hover:bg-[#544dc9] text-white font-bold rounded-lg text-xs transition-all shadow-sm"
                      >
                        ✓ Approve Action
                      </button>
                    </td>
                  </tr>
                )}

                {approvedItems.length === 2 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#6b7c93] font-semibold">
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
        <div className="bg-white border border-[#e6ebf1] rounded-xl p-6 text-xs text-[#6b7c93] shadow-sm">
          14 automated retry actions cleared by Policy Guard and queued for dispatch.
        </div>
      )}
    </div>
  );
}
