"use client";

import React, { useState, useEffect } from "react";
import OpportunityDetailPanel, { OpportunityDetailData } from "@/components/OpportunityDetailPanel";

export default function OpportunitiesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOpp, setSelectedOpp] = useState<OpportunityDetailData | null>(null);
  const [opportunities, setOpportunities] = useState<OpportunityDetailData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOpportunities = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/opportunities");
      if (res.ok) {
        const data = await res.json();
        // Map api response fields to panel props
        const mapped = data.map((o: any) => ({
          id: o.id,
          source_type: o.source_type,
          source_reference: o.source_reference,
          customer_name: o.customer_email || "Demo Customer",
          customer_email: o.customer_email || "N/A",
          customer_phone: "+91 98765 43210",
          amount_at_risk_formatted: o.amount_formatted,
          amount_at_risk_paise: o.amount_at_risk,
          currency: o.currency,
          probability_of_recovery: o.probability_of_recovery || 0.70,
          expected_recovery_formatted: o.recovered_formatted,
          expected_recovery_paise: o.recovered_amount_in_minor,
          priority_score: 80.0,
          status: o.status,
          reason: o.reason || "Soft decline",
          recommended_action: "Smart Retry",
          detected_at_formatted: o.created_at
        }));
        setOpportunities(mapped);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const filteredOpps = opportunities.filter((opp) => {
    const matchesSearch =
      opp.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || opp.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 font-sans bg-[#f6f9fc] text-[#32325d]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e6ebf1] pb-6">
        <div>
          <h1 className="text-xl font-bold text-[#32325d] tracking-tight">Revenue Opportunities</h1>
          <p className="text-xs text-[#6b7c93] mt-1">
            Real-time table of detected at-risk transactions, baseline recovery likelihoods, and EV prioritization.
          </p>
        </div>
        <div className="text-xs font-mono text-[#6b7c93] bg-white border border-[#e6ebf1] px-3 py-1.5 rounded-lg">
          Opportunities: <span className="text-[#32325d] font-bold">{opportunities.length}</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white border border-[#e6ebf1] p-4 rounded-xl shadow-sm">
        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="Search customer, ID, or cause code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#f6f9fc] border border-[#e6ebf1] rounded-lg px-3 py-2 text-xs text-[#32325d] placeholder-[#6b7c93] focus:outline-none focus:border-[#635bff]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs text-[#6b7c93] font-semibold">Status Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#f6f9fc] border border-[#e6ebf1] rounded-lg px-3 py-2 text-xs text-[#32325d] focus:outline-none focus:border-[#635bff]"
          >
            <option value="all">All Statuses</option>
            <option value="detected">Detected</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="succeeded">Succeeded</option>
            <option value="suppressed">Suppressed</option>
          </select>
        </div>
      </div>

      {/* Compact Data Table */}
      <div className="bg-white border border-[#e6ebf1] rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-[#6b7c93] text-xs">Loading opportunities...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f6f9fc] text-[#6b7c93] font-semibold border-b border-[#e6ebf1] uppercase tracking-wider">
                <tr>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Amount at Risk</th>
                  <th className="p-4">Likelihood</th>
                  <th className="p-4">Reason / Cause</th>
                  <th className="p-4">Recommended Action</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6ebf1] text-[#32325d]">
                {filteredOpps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#6b7c93]">No opportunities found. Run a simulation scenario.</td>
                  </tr>
                ) : (
                  filteredOpps.map((opp) => (
                    <tr
                      key={opp.id}
                      onClick={() => setSelectedOpp(opp)}
                      className="hover:bg-[#f6f9fc] cursor-pointer transition-all"
                    >
                      <td className="p-4 font-semibold text-[#32325d]">
                        <div>{opp.customer_name}</div>
                        <div className="text-[10px] text-[#6b7c93] font-mono mt-0.5">{opp.id}</div>
                      </td>
                      <td className="p-4 font-mono font-bold text-[#32325d]">{opp.amount_at_risk_formatted}</td>
                      <td className="p-4 font-mono text-[#635bff] font-bold">
                        {(opp.probability_of_recovery * 100).toFixed(0)}%
                      </td>
                      <td className="p-4 font-mono text-[11px] text-[#6b7c93] max-w-xs truncate">
                        {opp.reason}
                      </td>
                      <td className="p-4 font-medium text-[#32325d]">{opp.recommended_action}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                            opp.status === "succeeded"
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : "bg-amber-100 text-amber-700 border border-amber-200"
                          }`}
                        >
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

        <div className="p-4 border-t border-[#e6ebf1] text-xs text-[#6b7c93] flex items-center justify-between">
          <div>Showing {filteredOpps.length} of {opportunities.length} opportunities</div>
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
          fetchOpportunities();
        }}
      />
    </div>
  );
}
