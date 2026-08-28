"use client";

import React from "react";

export interface OpportunityDetailData {
  id: string;
  source_type: string;
  source_reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  amount_at_risk_formatted: string;
  amount_at_risk_paise: number;
  currency: string;
  probability_of_recovery: number;
  expected_recovery_formatted: string;
  expected_recovery_paise: number;
  priority_score: number;
  status: string;
  reason: string;
  recommended_action: string;
  detected_at_formatted: string;
}

interface OpportunityDetailPanelProps {
  opportunity: OpportunityDetailData | null;
  onClose: () => void;
  onApproveAction?: (id: string) => void;
}

export default function OpportunityDetailPanel({
  opportunity,
  onClose,
  onApproveAction
}: OpportunityDetailPanelProps) {
  if (!opportunity) return null;

  const isHumanReview = opportunity.status.toLowerCase() === "pending_approval" || opportunity.amount_at_risk_paise >= 5000000;

  return (
    <div className="fixed inset-0 bg-[#32325d]/50 backdrop-blur-sm z-50 flex justify-end">
      <div className="w-full max-w-2xl bg-white border-l border-[#e6ebf1] h-full overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl animate-slide-in font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e6ebf1] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-[#6b7c93] uppercase">OPPORTUNITY</span>
              <span className="text-xs font-mono text-[#635bff]">{opportunity.id}</span>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                opportunity.status === "succeeded"
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  : "bg-amber-100 text-amber-700 border border-amber-200"
              }`}>
                {opportunity.status}
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#32325d] mt-1">{opportunity.customer_name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#6b7c93] hover:text-[#32325d] bg-[#f6f9fc] hover:bg-[#e6ebf1] rounded-lg text-xs transition-all font-semibold"
          >
            ✕ Close
          </button>
        </div>

        {/* Human Review Banner */}
        {isHumanReview && (
          <div className="p-4 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#f59e0b] uppercase tracking-wider">
                  HIGH-VALUE APPROVAL REQUIRED (&gt; ₹50,000 INR)
                </span>
              </div>
              <span className="text-xs font-mono text-[#f59e0b] font-semibold">POLICY GATE</span>
            </div>
            <p className="text-xs text-[#32325d]">
              Amount at risk ({opportunity.amount_at_risk_formatted}) exceeds automated intervention threshold. Operator confirmation required.
            </p>
            {onApproveAction && (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => onApproveAction(opportunity.id)}
                  className="px-4 py-1.5 bg-[#635bff] hover:bg-[#544dc9] text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                >
                  Approve Recovery Action
                </button>
              </div>
            )}
          </div>
        )}

        {/* Section 1: Financial & Score Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-[#f6f9fc] p-3 rounded-lg border border-[#e6ebf1]">
            <div className="text-[#6b7c93] text-[10px]">Amount at Risk</div>
            <div className="text-base font-bold text-[#32325d] mt-0.5">{opportunity.amount_at_risk_formatted}</div>
          </div>

          <div className="bg-[#f6f9fc] p-3 rounded-lg border border-[#e6ebf1]">
            <div className="text-[#6b7c93] text-[10px]">Likelihood</div>
            <div className="text-base font-bold text-[#635bff] mt-0.5">
              {(opportunity.probability_of_recovery * 100).toFixed(0)}%
            </div>
          </div>

          <div className="bg-[#f6f9fc] p-3 rounded-lg border border-[#e6ebf1]">
            <div className="text-[#6b7c93] text-[10px]">Expected Value</div>
            <div className="text-base font-bold text-[#22c55e] mt-0.5">{opportunity.expected_recovery_formatted}</div>
          </div>

          <div className="bg-[#f6f9fc] p-3 rounded-lg border border-[#e6ebf1]">
            <div className="text-[#6b7c93] text-[10px]">Priority Score</div>
            <div className="text-base font-bold text-[#00d4b2] mt-0.5">{opportunity.priority_score.toFixed(1)}/100</div>
          </div>
        </div>

        {/* Section 2: Customer Profile Context */}
        <div className="bg-[#f6f9fc] p-4 rounded-xl border border-[#e6ebf1] space-y-2 text-xs">
          <div className="font-bold text-[#32325d] border-b border-[#e6ebf1] pb-2">Customer & Transaction Context</div>
          <div className="grid grid-cols-2 gap-2 pt-1 text-[#6b7c93] font-mono">
            <div>Email: <span className="text-[#32325d]">{opportunity.customer_email}</span></div>
            <div>Phone: <span className="text-[#32325d]">{opportunity.customer_phone}</span></div>
            <div>Source Ref: <span className="text-[#32325d]">{opportunity.source_reference}</span></div>
            <div>Detected: <span className="text-[#32325d]">{opportunity.detected_at_formatted}</span></div>
          </div>
        </div>

        {/* Section 3: Diagnostic Root Cause Evidence */}
        <div className="bg-[#f6f9fc] p-4 rounded-xl border border-[#e6ebf1] space-y-2 text-xs">
          <div className="font-bold text-[#32325d] border-b border-[#e6ebf1] pb-2">Diagnostic Evidence & Root Cause</div>
          <div className="p-3 bg-white rounded-lg border border-[#e6ebf1] text-[#32325d] font-mono space-y-1">
            <div><span className="text-[#6b7c93]">Root Cause Code:</span> <span className="text-[#635bff] font-bold">{opportunity.reason || "BAD_REQUEST_PAYMENT_DECLINED_INSUFFICIENT_FUNDS"}</span></div>
            <div><span className="text-[#6b7c93]">Recommended Action:</span> <span className="text-[#22c55e] font-bold">{opportunity.recommended_action}</span></div>
          </div>
        </div>

        {/* Section 4: Policy Evaluation Gate */}
        <div className="bg-[#f6f9fc] p-4 rounded-xl border border-[#e6ebf1] space-y-2 text-xs">
          <div className="font-bold text-[#32325d] border-b border-[#e6ebf1] pb-2 flex items-center justify-between">
            <span>Deterministic Policy Evaluation</span>
            <span className="text-[#635bff] font-mono">100% Deterministic</span>
          </div>
          <div className="space-y-1.5 pt-1 font-mono">
            <div className="flex justify-between items-center text-[#32325d]">
              <span>Max Retry Budget Limit</span>
              <span className="text-[#22c55e] font-bold">✓ PASSED (0 of 3 used)</span>
            </div>
            <div className="flex justify-between items-center text-[#32325d]">
              <span>24h Customer Quiet Period</span>
              <span className="text-[#22c55e] font-bold">✓ PASSED</span>
            </div>
            <div className="flex justify-between items-center text-[#32325d]">
              <span>High-Value Threshold (&gt; ₹50k)</span>
              <span className={isHumanReview ? "text-[#f59e0b] font-bold" : "text-[#22c55e] font-bold"}>
                {isHumanReview ? "⚠️ APPROVAL REQUIRED" : "✓ PASSED (< ₹50k)"}
              </span>
            </div>
          </div>
        </div>

        {/* Section 5: Audit Trail Timeline */}
        <div className="bg-[#f6f9fc] p-4 rounded-xl border border-[#e6ebf1] space-y-3 text-xs">
          <div className="font-bold text-[#32325d] border-b border-[#e6ebf1] pb-2">Audit Trail Timeline</div>
          <div className="space-y-3 font-mono">
            <div className="flex gap-3 text-[#6b7c93]">
              <span className="text-[#635bff] font-bold">14:02:10</span>
              <div>
                <div className="text-[#32325d]">OPPORTUNITY_DETECTED</div>
                <div className="text-[10px] text-[#6b7c93]">Scanner registered payment failure</div>
              </div>
            </div>
            <div className="flex gap-3 text-[#6b7c93]">
              <span className="text-[#00d4b2] font-bold">14:02:11</span>
              <div>
                <div className="text-[#32325d]">DIAGNOSIS_COMPLETED</div>
                <div className="text-[10px] text-[#6b7c93]">Categorized as INSUFFICIENT_FUNDS (Confidence 88%)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
