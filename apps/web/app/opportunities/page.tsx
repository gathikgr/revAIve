"use client";

import React, { useState } from "react";
import OpportunityDetailPanel, { OpportunityDetailData } from "@/components/OpportunityDetailPanel";

const MOCK_OPPORTUNITIES: OpportunityDetailData[] = [
  {
    id: "opp_saas_001",
    source_type: "failed_payment",
    source_reference: "pay_saas_1001",
    customer_name: "Acme Software Pvt Ltd",
    customer_email: "billing@acme.in",
    customer_phone: "+91 98765 43210",
    amount_at_risk_formatted: "₹1,499.00",
    amount_at_risk_paise: 149900,
    currency: "INR",
    probability_of_recovery: 0.88,
    expected_recovery_formatted: "₹1,314.00",
    expected_recovery_paise: 131400,
    priority_score: 84.5,
    status: "qualified",
    reason: "BAD_REQUEST_PAYMENT_DECLINED_INSUFFICIENT_FUNDS",
    recommended_action: "Smart Delayed Retry",
    detected_at_formatted: "2026-08-27 13:45:00 UTC"
  },
  {
    id: "opp_saas_002",
    source_type: "failed_payment",
    source_reference: "pay_saas_1002",
    customer_name: "Apex Global Logistics",
    customer_email: "finance@apex.com",
    customer_phone: "+91 99887 76655",
    amount_at_risk_formatted: "₹75,000.00",
    amount_at_risk_paise: 7500000,
    currency: "INR",
    probability_of_recovery: 0.92,
    expected_recovery_formatted: "₹68,995.00",
    expected_recovery_paise: 6899500,
    priority_score: 96.2,
    status: "human_review",
    reason: "GATEWAY_TIMEOUT",
    recommended_action: "Manual Operator Approval Required (> ₹50k)",
    detected_at_formatted: "2026-08-27 13:42:00 UTC"
  },
  {
    id: "opp_saas_003",
    source_type: "subscription_failure",
    source_reference: "sub_saas_2001",
    customer_name: "Nexus Digital Agency",
    customer_email: "accounts@nexus.agency",
    customer_phone: "+91 91234 56789",
    amount_at_risk_formatted: "₹2,999.00",
    amount_at_risk_paise: 299900,
    currency: "INR",
    probability_of_recovery: 0.95,
    expected_recovery_formatted: "₹2,829.00",
    expected_recovery_paise: 282900,
    priority_score: 91.0,
    status: "qualified",
    reason: "BANK_MAINTENANCE_OUTAGE",
    recommended_action: "Smart Retry Post Maintenance",
    detected_at_formatted: "2026-08-27 13:30:00 UTC"
  },
  {
    id: "opp_saas_004",
    source_type: "failed_payment",
    source_reference: "pay_saas_1004",
    customer_name: "Starlight Retail Ventures",
    customer_email: "contact@starlight.store",
    customer_phone: "+91 97654 32109",
    amount_at_risk_formatted: "₹4,999.00",
    amount_at_risk_paise: 499900,
    currency: "INR",
    probability_of_recovery: 0.40,
    expected_recovery_formatted: "₹1,980.00",
    expected_recovery_paise: 198000,
    priority_score: 45.0,
    status: "qualified",
    reason: "CARD_EXPIRED",
    recommended_action: "Issue SMS/WhatsApp Payment Link",
    detected_at_formatted: "2026-08-27 13:15:00 UTC"
  },
  {
    id: "opp_saas_005",
    source_type: "checkout_abandonment",
    source_reference: "order_saas_3001",
    customer_name: "Vanguard Tech Labs",
    customer_email: "support@vanguard.io",
    customer_phone: "+91 94567 89012",
    amount_at_risk_formatted: "₹12,499.00",
    amount_at_risk_paise: 1249900,
    currency: "INR",
    probability_of_recovery: 0.75,
    expected_recovery_formatted: "₹9,354.00",
    expected_recovery_paise: 935400,
    priority_score: 78.4,
    status: "qualified",
    reason: "CHECKOUT_ABANDONED",
    recommended_action: "Send Checkout Reminder Link",
    detected_at_formatted: "2026-08-27 12:50:00 UTC"
  }
];

export default function OpportunitiesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOpp, setSelectedOpp] = useState<OpportunityDetailData | null>(null);

  const filteredOpps = MOCK_OPPORTUNITIES.filter((opp) => {
    const matchesSearch =
      opp.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || opp.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Revenue Opportunities</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time table of detected at-risk transactions, baseline recovery likelihoods, and EV prioritization.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          Total At Risk: <span className="text-white font-bold">₹48,45,226.00</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/60 border border-slate-800 p-4 rounded-xl backdrop-blur-xl">
        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="Search customer, ID, or cause code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs text-slate-400 font-medium">Status Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="qualified">Qualified</option>
            <option value="human_review">Human Review (&gt; ₹50k)</option>
            <option value="recovered">Recovered</option>
            <option value="suppressed">Suppressed</option>
          </select>
        </div>
      </div>

      {/* Compact Data Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4">Amount at Risk</th>
                <th className="p-4">Likelihood</th>
                <th className="p-4">Expected Recovery</th>
                <th className="p-4">Reason / Cause</th>
                <th className="p-4">Recommended Action</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredOpps.map((opp) => (
                <tr
                  key={opp.id}
                  onClick={() => setSelectedOpp(opp)}
                  className="hover:bg-slate-800/50 cursor-pointer transition-all"
                >
                  <td className="p-4 font-semibold text-white">
                    <div>{opp.customer_name}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{opp.id}</div>
                  </td>
                  <td className="p-4 font-mono font-bold text-white">{opp.amount_at_risk_formatted}</td>
                  <td className="p-4 font-mono text-indigo-400 font-bold">
                    {(opp.probability_of_recovery * 100).toFixed(0)}%
                  </td>
                  <td className="p-4 font-mono text-emerald-400 font-bold">{opp.expected_recovery_formatted}</td>
                  <td className="p-4 font-mono text-[11px] text-slate-400 max-w-xs truncate">
                    {opp.reason}
                  </td>
                  <td className="p-4 font-medium text-slate-200">{opp.recommended_action}</td>
                  <td className="p-4 font-mono text-cyan-400 font-bold">{opp.priority_score.toFixed(1)}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                        opp.status === "qualified"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {opp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <div>Showing {filteredOpps.length} of {MOCK_OPPORTUNITIES.length} opportunities</div>
          <div className="font-mono">Page 1 of 1</div>
        </div>
      </div>

      {/* Opportunity Detail Slide-Over Panel */}
      <OpportunityDetailPanel
        opportunity={selectedOpp}
        onClose={() => setSelectedOpp(null)}
        onApproveAction={(id) => {
          alert(`Approved recovery action for opportunity '${id}'. Audit event logged.`);
          setSelectedOpp(null);
        }}
      />
    </div>
  );
}
