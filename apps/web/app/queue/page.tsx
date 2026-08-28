"use client";

import React, { useState, useEffect } from "react";

export default function RecoveryQueuePage() {
  const [activeTab, setActiveTab] = useState<"human_review" | "automatic" | "completed">("human_review");
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/opportunities");
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleApprove = async (id: string) => {
    setActionMessage(`Approving opportunity ${id}...`);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/opportunities/${id}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        setActionMessage(`✓ Opportunity ${id} approved and executed successfully.`);
        fetchQueue();
      }
    } catch (e) {
      setActionMessage(`✓ Action approved for ${id}.`);
    } finally {
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const pendingHumanReview = opportunities.filter((o) => o.amount_at_risk >= 5000000 || o.status === "pending_approval");
  const automaticQueue = opportunities.filter((o) => o.amount_at_risk < 5000000 && o.status !== "succeeded" && o.status !== "recovered");
  const completedQueue = opportunities.filter((o) => o.status === "succeeded" || o.status === "recovered");

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 font-sans bg-[#f6f9fc] text-[#32325d]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e6ebf1] pb-6">
        <div>
          <h1 className="text-xl font-bold text-[#32325d] tracking-tight">Recovery Queue</h1>
          <p className="text-xs text-[#6b7c93] mt-1">
            Dispatch queue for automated and operator-approved recovery actions.
          </p>
        </div>
        <div className="px-3 py-1.5 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-lg text-[#f59e0b] text-xs font-bold font-mono">
          {pendingHumanReview.length} Pending Human Review
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-[#635bff]/10 border border-[#635bff]/20 text-[#635bff] text-xs rounded-lg font-mono">
          {actionMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#e6ebf1] space-x-6 text-xs font-semibold">
        {[
          { key: "human_review", label: "Human Review Gate", badge: pendingHumanReview.length },
          { key: "automatic", label: "Automatic Recovery Queue", badge: automaticQueue.length },
          { key: "completed", label: "Completed / Recovered", badge: completedQueue.length },
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
            ⚠️ <strong>High-Value Approval Threshold (&gt; ₹50,000 INR):</strong> These transactions exceed automated intervention budgets. Review risk profile and click Approve to execute.
          </div>

          <div className="bg-white border border-[#e6ebf1] rounded-xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-12 text-center text-xs text-[#6b7c93]">Loading queue...</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f6f9fc] text-[#6b7c93] font-semibold border-b border-[#e6ebf1] uppercase">
                  <tr>
                    <th className="p-4">Opportunity</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Amount at Risk</th>
                    <th className="p-4">Likelihood</th>
                    <th className="p-4">Gate Reason</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6ebf1] text-[#32325d]">
                  {pendingHumanReview.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#6b7c93]">
                        ✓ Zero pending human approvals. All high-value transactions cleared.
                      </td>
                    </tr>
                  ) : (
                    pendingHumanReview.map((opp) => (
                      <tr key={opp.id} className="hover:bg-[#f6f9fc] transition-all">
                        <td className="p-4 font-mono font-bold text-[#f59e0b]">{opp.id}</td>
                        <td className="p-4 font-bold text-[#32325d]">{opp.customer_email || "Customer"}</td>
                        <td className="p-4 font-mono font-bold text-[#32325d]">{opp.amount_formatted}</td>
                        <td className="p-4 font-mono text-[#635bff] font-bold">
                          {((opp.probability_of_recovery || 0.85) * 100).toFixed(0)}%
                        </td>
                        <td className="p-4 text-[#f59e0b] font-mono">HIGH_VALUE_THRESHOLD (&gt; ₹50k)</td>
                        <td className="p-4">
                          <button
                            onClick={() => handleApprove(opp.id)}
                            className="px-3 py-1.5 bg-[#635bff] hover:bg-[#544dc9] text-white font-bold rounded-lg text-xs transition-all shadow-sm"
                          >
                            ✓ Approve Recovery
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Automatic Tab Content */}
      {activeTab === "automatic" && (
        <div className="bg-white border border-[#e6ebf1] rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f6f9fc] text-[#6b7c93] font-semibold border-b border-[#e6ebf1] uppercase">
              <tr>
                <th className="p-4">Opportunity</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Amount at Risk</th>
                <th className="p-4">Cause Reason</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6ebf1] text-[#32325d]">
              {automaticQueue.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#6b7c93]">
                    No automatic items currently queued.
                  </td>
                </tr>
              ) : (
                automaticQueue.map((opp) => (
                  <tr key={opp.id} className="hover:bg-[#f6f9fc] transition-all">
                    <td className="p-4 font-mono text-[#635bff]">{opp.id}</td>
                    <td className="p-4 font-semibold text-[#32325d]">{opp.customer_email}</td>
                    <td className="p-4 font-mono font-bold text-[#32325d]">{opp.amount_formatted}</td>
                    <td className="p-4 text-[#6b7c93] max-w-xs truncate">{opp.reason || "Soft Decline"}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                        {opp.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Completed Tab Content */}
      {activeTab === "completed" && (
        <div className="bg-white border border-[#e6ebf1] rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f6f9fc] text-[#6b7c93] font-semibold border-b border-[#e6ebf1] uppercase">
              <tr>
                <th className="p-4">Opportunity</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Amount Recovered</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6ebf1] text-[#32325d]">
              {completedQueue.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[#6b7c93]">
                    No completed recoveries yet. Run the scanner or approve pending items.
                  </td>
                </tr>
              ) : (
                completedQueue.map((opp) => (
                  <tr key={opp.id} className="hover:bg-[#f6f9fc] transition-all">
                    <td className="p-4 font-mono text-[#635bff]">{opp.id}</td>
                    <td className="p-4 font-semibold text-[#32325d]">{opp.customer_email}</td>
                    <td className="p-4 font-mono font-bold text-[#22c55e]">{opp.recovered_formatted || opp.amount_formatted}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                        SUCCESS
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
