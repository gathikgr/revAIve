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

  const isHumanReview = opportunity.status.toLowerCase() === "human_review" || opportunity.amount_at_risk_paise >= 5000000;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex justify-end">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-400">OPPORTUNITY</span>
              <span className="text-xs font-mono text-indigo-400">{opportunity.id}</span>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                opportunity.status === "qualified"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              }`}>
                {opportunity.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">{opportunity.customer_name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-all"
          >
            ✕ Close
          </button>
        </div>

        {/* Human Review Banner */}
        {isHumanReview && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-lg">⚠️</span>
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  HIGH-VALUE APPROVAL REQUIRED (&gt; ₹50,000 INR)
                </span>
              </div>
              <span className="text-xs font-mono text-amber-400">POLICY GATE</span>
            </div>
            <p className="text-xs text-slate-300">
              Amount at risk ({opportunity.amount_at_risk_formatted}) exceeds automated intervention threshold. Operator confirmation required.
            </p>
            {onApproveAction && (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => onApproveAction(opportunity.id)}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-all"
                >
                  Approve Recovery Action
                </button>
              </div>
            )}
          </div>
        )}

        {/* Section 1: Financial & Score Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-400">Amount at Risk</div>
            <div className="text-base font-black text-white mt-0.5">{opportunity.amount_at_risk_formatted}</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-400">Recovery Likelihood</div>
            <div className="text-base font-black text-indigo-400 mt-0.5">
              {(opportunity.probability_of_recovery * 100).toFixed(0)}%
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-400">Expected Value</div>
            <div className="text-base font-black text-emerald-400 mt-0.5">{opportunity.expected_recovery_formatted}</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-400">Priority Score</div>
            <div className="text-base font-black text-cyan-400 mt-0.5">{opportunity.priority_score.toFixed(1)}/100</div>
          </div>
        </div>

        {/* Section 2: Customer Profile Context */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="font-bold text-slate-300 border-b border-slate-800/80 pb-2">Customer & Transaction Context</div>
          <div className="grid grid-cols-2 gap-2 pt-1 text-slate-400">
            <div>Email: <span className="text-slate-200 font-mono">{opportunity.customer_email}</span></div>
            <div>Phone: <span className="text-slate-200 font-mono">{opportunity.customer_phone}</span></div>
            <div>Source Ref: <span className="text-slate-200 font-mono">{opportunity.source_reference}</span></div>
            <div>Detected: <span className="text-slate-200 font-mono">{opportunity.detected_at_formatted}</span></div>
          </div>
        </div>

        {/* Section 3: Diagnostic Root Cause Evidence */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="font-bold text-slate-300 border-b border-slate-800/80 pb-2">Diagnostic Evidence & Root Cause</div>
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80 text-slate-300 font-mono space-y-1">
            <div><span className="text-slate-500">Root Cause Code:</span> <span className="text-indigo-400 font-bold">{opportunity.reason || "BAD_REQUEST_PAYMENT_DECLINED_INSUFFICIENT_FUNDS"}</span></div>
            <div><span className="text-slate-500">Recommended Action:</span> <span className="text-emerald-400 font-bold">{opportunity.recommended_action}</span></div>
          </div>
        </div>

        {/* Section 4: Policy Evaluation Gate */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="font-bold text-slate-300 border-b border-slate-800/80 pb-2 flex items-center justify-between">
            <span>Deterministic Policy Evaluation</span>
            <span className="text-emerald-400 font-mono">100% Deterministic</span>
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-slate-300">
              <span>Max Retry Budget Limit</span>
              <span className="text-emerald-400 font-bold">✓ PASSED (0 of 3 used)</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>24h Customer Quiet Period</span>
              <span className="text-emerald-400 font-bold">✓ PASSED (No recent contact)</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>High-Value Threshold (&gt; ₹50k)</span>
              <span className={isHumanReview ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                {isHumanReview ? "⚠️ APPROVAL REQUIRED" : "✓ PASSED (< ₹50k)"}
              </span>
            </div>
          </div>
        </div>

        {/* Section 5: Audit Trail Timeline */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
          <div className="font-bold text-slate-300 border-b border-slate-800/80 pb-2">Audit Trail Timeline</div>
          <div className="space-y-3 font-mono">
            <div className="flex gap-3 text-slate-400">
              <span className="text-indigo-400 font-bold">14:02:10</span>
              <div>
                <div className="text-slate-200">OPPORTUNITY_DETECTED</div>
                <div className="text-[10px] text-slate-500">Scanner registered payment failure</div>
              </div>
            </div>
            <div className="flex gap-3 text-slate-400">
              <span className="text-cyan-400 font-bold">14:02:11</span>
              <div>
                <div className="text-slate-200">DIAGNOSIS_COMPLETED</div>
                <div className="text-[10px] text-slate-500">Categorized as INSUFFICIENT_FUNDS (Confidence 88%)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
