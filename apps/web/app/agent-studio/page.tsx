"use client";

import React, { useState } from "react";

const FAILURE_CODES = [
  { code: "BAD_REQUEST_PAYMENT_DECLINED_INSUFFICIENT_FUNDS", label: "Insufficient Funds (Soft Decline)" },
  { code: "BANK_MAINTENANCE_OUTAGE", label: "Bank Maintenance / System Outage" },
  { code: "GATEWAY_TIMEOUT", label: "Gateway Network Timeout" },
  { code: "CARD_EXPIRED", label: "Card Instrument Expired" },
  { code: "CUSTOMER_CANCELLED_MANDATE", label: "Mandate Cancelled by Customer" },
];

export default function AgentStudioPage() {
  // Merchant & Scenario Form State
  const [merchantName, setMerchantName] = useState("SaaSify Technologies India Pvt Ltd");
  const [razorpayMerchantId, setRazorpayMerchantId] = useState("rzp_merch_live01");
  const [customerName, setCustomerName] = useState("Acme Software Pvt Ltd");
  const [customerEmail, setCustomerEmail] = useState("billing@acme.in");
  const [customerPhone, setCustomerPhone] = useState("+91 98765 43210");
  const [amountRupees, setAmountRupees] = useState<number>(1499);
  const [failureCode, setFailureCode] = useState("BAD_REQUEST_PAYMENT_DECLINED_INSUFFICIENT_FUNDS");
  const [issuerBank, setIssuerBank] = useState("HDFC");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [operatorApproved, setOperatorApproved] = useState(false);

  // Execution & Review State
  const [loading, setLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRunAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch("http://localhost:8000/api/v1/agent-studio/run-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_name: merchantName,
          razorpay_merchant_id: razorpayMerchantId,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          amount_in_rupees: amountRupees,
          currency: "INR",
          failure_code: failureCode,
          issuer_bank: issuerBank,
          payment_method: paymentMethod,
          attempts_count: attemptsCount,
          operator_approved: operatorApproved,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setReviewResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to execute agent scenario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Agent Studio & Scenario Tester</h1>
            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
              REAL PRODUCTION AGENT
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure merchant profiles and failure scenarios to understand exactly where revenue is leaking with a detailed, understandable review.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Merchant & Scenario Configurator Form */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleRunAgent} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">1. Merchant & Customer Context</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Merchant Organization Name</label>
                <input
                  type="text"
                  required
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Razorpay Account ID</label>
                <input
                  type="text"
                  required
                  value={razorpayMerchantId}
                  onChange={(e) => setRazorpayMerchantId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-300 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Customer Email</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>

            <div className="border-b border-slate-800 pb-3 pt-2">
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">2. Payment Failure Scenario</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Amount at Risk (₹ INR)</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={amountRupees}
                    onChange={(e) => setAmountRupees(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Issuing Bank</label>
                  <select
                    value={issuerBank}
                    onChange={(e) => setIssuerBank(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-medium"
                  >
                    <option value="HDFC">HDFC Bank</option>
                    <option value="SBI">State Bank of India (SBI)</option>
                    <option value="ICICI">ICICI Bank</option>
                    <option value="AXIS">Axis Bank</option>
                    <option value="KOTAK">Kotak Mahindra Bank</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Failure Reason Code</label>
                <select
                  value={failureCode}
                  onChange={(e) => setFailureCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono text-[11px]"
                >
                  {FAILURE_CODES.map((f) => (
                    <option key={f.code} value={f.code}>
                      {f.label} ({f.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white capitalize"
                  >
                    <option value="card">Card (Credit/Debit)</option>
                    <option value="mandate">e-Mandate / Auto-Debit</option>
                    <option value="upi">UPI Recurring</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Previous Retries</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={attemptsCount}
                    onChange={(e) => setAttemptsCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="opApprove"
                  checked={operatorApproved}
                  onChange={(e) => setOperatorApproved(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="opApprove" className="text-[11px] text-slate-300 cursor-pointer">
                  Grant Human Operator Approval (for high-value transactions &gt; ₹50,000)
                </label>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs rounded-lg">
                ⚠️ {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Running Agent Pipeline...
                </>
              ) : (
                <>⚡ Run Agent Pipeline & Analyze Scenario</>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Detailed Understandable Review Output */}
        <div className="lg:col-span-7 space-y-6">
          {!reviewResult && !loading && (
            <div className="bg-slate-900/40 border border-slate-800 border-dashed rounded-2xl p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-800/80 rounded-2xl flex items-center justify-center text-2xl mx-auto text-slate-400">
                🔍
              </div>
              <h3 className="text-base font-bold text-white">No Scenario Executed Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Configure your merchant and failure parameters on the left and click <strong>Run Agent Pipeline</strong> to inspect a detailed understandable review of where revenue is leaking.
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-4 shadow-xl">
              <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div>
                <div className="text-sm font-bold text-white">Executing Production Agent Chain...</div>
                <div className="text-xs text-slate-400 mt-1 font-mono">
                  Sentinel ➔ Diagnosis ➔ Strategist ➔ Policy Guard ➔ Executor
                </div>
              </div>
            </div>
          )}

          {reviewResult && !loading && (
            <div className="space-y-6 animate-fadeIn">
              {/* Scenario Summary Banner */}
              <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider">DETAILED REVIEW SUMMARY</span>
                    <h2 className="text-lg font-black text-white mt-0.5">{reviewResult.scenario_summary.merchant}</h2>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-[10px] text-slate-500 block">Pipeline Latency</span>
                    <span className="text-xs text-indigo-300 font-bold">{reviewResult.scenario_summary.latency_ms} ms</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs font-mono text-center">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="text-slate-500 text-[10px]">Amount At Risk</div>
                    <div className="text-white font-bold text-sm mt-1">{reviewResult.scenario_summary.amount_at_risk}</div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="text-slate-500 text-[10px]">Expected Recovery</div>
                    <div className="text-emerald-400 font-bold text-sm mt-1">{reviewResult.scenario_summary.expected_recovery_value}</div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="text-slate-500 text-[10px]">Opportunity Status</div>
                    <div className="text-cyan-400 font-bold text-sm mt-1 uppercase">{reviewResult.scenario_summary.status}</div>
                  </div>
                </div>
              </div>

              {/* Where Revenue is Leaking Card (Diagnosis) */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔎</span>
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Where Revenue is Leaking</h3>
                  </div>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                    Diagnostic Confidence: {reviewResult.detailed_review.leakage_diagnosis.confidence}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">Root Cause Category</div>
                    <div className="text-base font-black text-indigo-300 mt-0.5">
                      {reviewResult.detailed_review.leakage_diagnosis.cause_category}
                    </div>
                    <div className="text-slate-300 mt-2 leading-relaxed">
                      {reviewResult.detailed_review.leakage_diagnosis.human_explanation}
                    </div>
                  </div>
                </div>
              </div>

              {/* Deterministic Policy Guard Gate Card */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🛡️</span>
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Deterministic Policy Guard Verdict</h3>
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${
                    reviewResult.detailed_review.policy_guard_gate.verdict === "ALLOW"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : reviewResult.detailed_review.policy_guard_gate.verdict === "REQUIRE_HUMAN_APPROVAL"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  }`}>
                    VERDICT: {reviewResult.detailed_review.policy_guard_gate.verdict}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  {reviewResult.detailed_review.policy_guard_gate.guard_rule_breakdown.map((rule: string, i: number) => (
                    <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                      <span className="text-slate-300">{rule}</span>
                      <span className="text-emerald-400 font-bold">✓ VERIFIED</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Strategy Action Card */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚡</span>
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Recommended Recovery Action</h3>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    Expected Yield: {reviewResult.detailed_review.strategy_action.expected_recovery_value}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="text-slate-500 text-[10px]">Action Type</div>
                    <div className="text-white font-bold text-sm mt-1 uppercase">
                      {reviewResult.detailed_review.strategy_action.action_type}
                    </div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="text-slate-500 text-[10px]">Risk Level</div>
                    <div className="text-indigo-300 font-bold text-sm mt-1 uppercase">
                      {reviewResult.detailed_review.strategy_action.risk_level}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
                  <div className="text-[10px] text-slate-500 font-mono uppercase font-bold mb-1">Strategy Rationale</div>
                  <div>{reviewResult.detailed_review.strategy_action.strategy_reasoning}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
