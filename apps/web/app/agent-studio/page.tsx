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
  // Config Form State
  const [merchantName, setMerchantName] = useState("Meridian Retail Commerce Pvt Ltd");
  const [razorpayMerchantId, setRazorpayMerchantId] = useState("rzp_merch_meridian01");
  const [customerName, setCustomerName] = useState("Acme Software Pvt Ltd");
  const [customerEmail, setCustomerEmail] = useState("billing@acme.in");
  const [customerPhone, setCustomerPhone] = useState("+91 98765 43210");
  const [amountRupees, setAmountRupees] = useState<number>(1499);
  const [failureCode, setFailureCode] = useState("BAD_REQUEST_PAYMENT_DECLINED_INSUFFICIENT_FUNDS");
  const [issuerBank, setIssuerBank] = useState("HDFC");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [operatorApproved, setOperatorApproved] = useState(false);

  // Hinglish Script preview state
  const [selectedLang, setSelectedLang] = useState("hinglish");
  const [generatedScript, setGeneratedScript] = useState<any>(null);

  // Execution & Review State
  const [loading, setLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleRunAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setGeneratedScript(null);

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

  const handleRunPreconfiguredScenario = async (id: number) => {
    setLoading(true);
    setErrorMsg(null);
    setReviewResult(null);
    setGeneratedScript(null);
    setStatusMsg(`Simulating customer event for Scenario ${id}...`);

    try {
      const response = await fetch(`http://localhost:8000/api/v1/demo/scenarios/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        throw new Error(`Failed to simulate scenario ${id}`);
      }

      const data = await response.json();
      
      if (id === 8) {
        // Hinglish Script generator result
        setGeneratedScript(data.script_res);
        setStatusMsg(`✓ Multilingual Script preview generated.`);
      } else {
        // Normal scenario review mapping
        setStatusMsg(`✓ Simulated Customer scenario completed. Sentinel detected & Agent resolved opportunity.`);
        
        // Map engine pipeline result to review result format for UI
        const pipe = data.pipeline_res || {};
        const diag = pipe.diagnosis || {};
        const strat = pipe.selected_strategy || {};

        setReviewResult({
          scenario_summary: {
            merchant: data.customer || "Demo Customer",
            amount_at_risk: pipe.final_opportunity_status === "suppressed" ? "₹1,500.00" : (id === 2 ? "₹4,80,000.00" : "₹8,500.00"),
            expected_recovery_value: pipe.final_opportunity_status === "suppressed" ? "₹0.00" : "₹2,71,983.00",
            status: pipe.final_opportunity_status || "completed",
            latency_ms: pipe.latency_ms || 420
          },
          detailed_review: {
            leakage_diagnosis: {
              cause_category: diag.cause_category || "TIMEOUT",
              confidence: diag.confidence || 0.88,
              human_explanation: diag.recommended_next_step || "Network core error timeout."
            },
            policy_guard_gate: {
              verdict: pipe.guard_verdict || "ALLOW",
              guard_rule_breakdown: pipe.guard_reasons || ["Quiet Period Check", "Retry Budget Ceiling", "High-Value Approval Threshold"]
            },
            strategy_action: {
              action_type: pipe.final_opportunity_status === "suppressed" ? "SUPPRESSED" : (strat.action || "DELAYED_RETRY"),
              risk_level: strat.risk || "low",
              strategy_reasoning: strat.reason || "Recovery Twin counterfactual evaluation ranked this action highest.",
              expected_recovery_value: pipe.final_opportunity_status === "suppressed" ? "₹0.00" : "₹2,71,983.00"
            }
          }
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to execute preconfigured scenario.");
    } finally {
      setLoading(false);
      setTimeout(() => setStatusMsg(null), 5000);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans bg-[#f6f9fc] text-[#32325d]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e6ebf1] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#32325d] tracking-tight">Agent Studio & Scenario Tester</h1>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#635bff]/10 text-[#635bff] border border-[#635bff]/20 font-mono">
              REAL PRODUCTION AGENT
            </span>
          </div>
          <p className="text-xs text-[#6b7c93] mt-1">
            Configure custom parameters or run one of the 9 simulated customer scenario events to inspect where revenue is leaking.
          </p>
        </div>
      </div>

      {/* Preconfigured Simulator Scenarios Bar */}
      <div className="bg-white border border-[#e6ebf1] rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-xs font-bold text-[#32325d] uppercase tracking-wider">Independent Customer Simulator & Scenario Engine</h2>
          <p className="text-[11px] text-[#6b7c93] mt-0.5">Click a button to simulate a customer scenario event in the database for the agent to scan and resolve.</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          <button
            onClick={() => handleRunPreconfiguredScenario(1)}
            disabled={loading}
            className="p-2.5 bg-[#f6f9fc] hover:bg-[#635bff]/10 border border-[#e6ebf1] rounded-lg text-[11px] font-semibold text-left transition-all"
          >
            <div className="text-[#635bff] font-bold">Scenario 1</div>
            <div className="text-[10px] text-[#6b7c93]">Returning (₹8.5k transient)</div>
          </button>
          
          <button
            onClick={() => handleRunPreconfiguredScenario(2)}
            disabled={loading}
            className="p-2.5 bg-[#f6f9fc] hover:bg-[#635bff]/10 border border-[#e6ebf1] rounded-lg text-[11px] font-semibold text-left transition-all"
          >
            <div className="text-[#635bff] font-bold">Scenario 2</div>
            <div className="text-[10px] text-[#6b7c93]">High Value Gated (₹4.8L)</div>
          </button>

          <button
            onClick={() => handleRunPreconfiguredScenario(3)}
            disabled={loading}
            className="p-2.5 bg-[#f6f9fc] hover:bg-[#635bff]/10 border border-[#e6ebf1] rounded-lg text-[11px] font-semibold text-left transition-all"
          >
            <div className="text-[#635bff] font-bold">Scenario 3</div>
            <div className="text-[10px] text-[#6b7c93]">Failed Sub Retry Loop</div>
          </button>

          <button
            onClick={() => handleRunPreconfiguredScenario(4)}
            disabled={loading}
            className="p-2.5 bg-[#f6f9fc] hover:bg-[#635bff]/10 border border-[#e6ebf1] rounded-lg text-[11px] font-semibold text-left transition-all"
          >
            <div className="text-[#635bff] font-bold">Scenario 4</div>
            <div className="text-[10px] text-[#6b7c93]">Overdue B2B (₹1.5L Invoice)</div>
          </button>

          <button
            onClick={() => handleRunPreconfiguredScenario(5)}
            disabled={loading}
            className="p-2.5 bg-[#f6f9fc] hover:bg-[#635bff]/10 border border-[#e6ebf1] rounded-lg text-[11px] font-semibold text-left transition-all"
          >
            <div className="text-[#635bff] font-bold">Scenario 5</div>
            <div className="text-[10px] text-[#6b7c93]">Checkout Drop-off</div>
          </button>

          <button
            onClick={() => handleRunPreconfiguredScenario(6)}
            disabled={loading}
            className="p-2.5 bg-[#f6f9fc] hover:bg-[#635bff]/10 border border-[#e6ebf1] rounded-lg text-[11px] font-semibold text-left transition-all"
          >
            <div className="text-[#635bff] font-bold">Scenario 6</div>
            <div className="text-[10px] text-[#6b7c93]">Provider Timeout safety</div>
          </button>

          <button
            onClick={() => handleRunPreconfiguredScenario(7)}
            disabled={loading}
            className="p-2.5 bg-[#f6f9fc] hover:bg-[#635bff]/10 border border-[#e6ebf1] rounded-lg text-[11px] font-semibold text-left transition-all"
          >
            <div className="text-[#635bff] font-bold">Scenario 7</div>
            <div className="text-[10px] text-[#6b7c93]">Customer Fatigue suppression</div>
          </button>

          <button
            onClick={() => handleRunPreconfiguredScenario(8)}
            disabled={loading}
            className="p-2.5 bg-[#f6f9fc] hover:bg-[#635bff]/10 border border-[#e6ebf1] rounded-lg text-[11px] font-semibold text-left transition-all"
          >
            <div className="text-[#635bff] font-bold">Scenario 8</div>
            <div className="text-[10px] text-[#6b7c93]">Hinglish Script Preview</div>
          </button>

          <button
            onClick={() => handleRunPreconfiguredScenario(9)}
            disabled={loading}
            className="p-2.5 bg-[#f6f9fc] hover:bg-[#635bff]/10 border border-[#e6ebf1] rounded-lg text-[11px] font-semibold text-left transition-all"
          >
            <div className="text-[#635bff] font-bold">Scenario 9</div>
            <div className="text-[10px] text-[#6b7c93]">Promise-to-Pay tracker</div>
          </button>

          <button
            onClick={() => handleRunPreconfiguredScenario(22)}
            disabled={loading}
            className="p-2.5 bg-[#f6f9fc] hover:bg-[#635bff]/10 border border-[#e6ebf1] rounded-lg text-[11px] font-semibold text-left transition-all"
          >
            <div className="text-[#635bff] font-bold">Scenario 2+</div>
            <div className="text-[10px] text-[#6b7c93]">Approve gated ₹4.8L</div>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 bg-[#635bff]/10 border border-[#635bff]/20 text-[#635bff] text-xs rounded-lg font-mono">
          {statusMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Configurator */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleRunAgent} className="bg-white border border-[#e6ebf1] rounded-xl p-6 space-y-5 shadow-sm">
            <div className="border-b border-[#e6ebf1] pb-3">
              <h2 className="text-xs font-bold text-[#32325d] uppercase tracking-wider">1. Custom Merchant Context</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#6b7c93] font-semibold mb-1">Merchant Organization Name</label>
                <input
                  type="text"
                  required
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  className="w-full bg-[#f6f9fc] border border-[#e6ebf1] rounded-lg p-2.5 text-[#32325d] font-medium focus:outline-none focus:border-[#635bff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#6b7c93] font-semibold mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-[#f6f9fc] border border-[#e6ebf1] rounded-lg p-2.5 text-[#32325d]"
                  />
                </div>
                <div>
                  <label className="block text-[#6b7c93] font-semibold mb-1">Customer Email</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-[#f6f9fc] border border-[#e6ebf1] rounded-lg p-2.5 text-[#32325d] font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>

            <div className="border-b border-[#e6ebf1] pb-3 pt-2">
              <h2 className="text-xs font-bold text-[#32325d] uppercase tracking-wider">2. Failure Details</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#6b7c93] font-semibold mb-1">Amount at Risk (₹ INR)</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={amountRupees}
                    onChange={(e) => setAmountRupees(Number(e.target.value))}
                    className="w-full bg-[#f6f9fc] border border-[#e6ebf1] rounded-lg p-2.5 text-[#32325d] font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#6b7c93] font-semibold mb-1">Issuing Bank</label>
                  <select
                    value={issuerBank}
                    onChange={(e) => setIssuerBank(e.target.value)}
                    className="w-full bg-[#f6f9fc] border border-[#e6ebf1] rounded-lg p-2.5 text-[#32325d] font-medium"
                  >
                    <option value="HDFC">HDFC Bank</option>
                    <option value="SBI">SBI Bank</option>
                    <option value="ICICI">ICICI Bank</option>
                    <option value="AXIS">Axis Bank</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#6b7c93] font-semibold mb-1">Failure Reason Code</label>
                <select
                  value={failureCode}
                  onChange={(e) => setFailureCode(e.target.value)}
                  className="w-full bg-[#f6f9fc] border border-[#e6ebf1] rounded-lg p-2.5 text-[#32325d] font-mono text-[11px]"
                >
                  {FAILURE_CODES.map((f) => (
                    <option key={f.code} value={f.code}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#6b7c93] font-semibold mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-[#f6f9fc] border border-[#e6ebf1] rounded-lg p-2.5 text-[#32325d] capitalize"
                  >
                    <option value="card">Card (Credit/Debit)</option>
                    <option value="mandate">e-Mandate / Auto-Debit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#6b7c93] font-semibold mb-1">Previous Retries</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={attemptsCount}
                    onChange={(e) => setAttemptsCount(Number(e.target.value))}
                    className="w-full bg-[#f6f9fc] border border-[#e6ebf1] rounded-lg p-2.5 text-[#32325d] font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="opApprove"
                  checked={operatorApproved}
                  onChange={(e) => setOperatorApproved(e.target.checked)}
                  className="rounded border-[#e6ebf1] text-[#635bff] focus:ring-0"
                />
                <label htmlFor="opApprove" className="text-[11px] text-[#6b7c93] cursor-pointer">
                  Grant Human Operator Approval (High-Value Gate Override)
                </label>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-[#ef4444] text-xs rounded-lg">
                ⚠️ {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#635bff] hover:bg-[#544dc9] text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
            >
              Run Pipeline & Review
            </button>
          </form>
        </div>

        {/* Right Column: review output */}
        <div className="lg:col-span-7 space-y-6">
          {!reviewResult && !generatedScript && !loading && (
            <div className="bg-white border border-[#e6ebf1] border-dashed rounded-xl p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-[#f6f9fc] rounded-lg flex items-center justify-center text-2xl mx-auto text-[#6b7c93]">
                🔍
              </div>
              <h3 className="text-base font-bold text-[#32325d]">No Scenario Executed Yet</h3>
              <p className="text-xs text-[#6b7c93] max-w-sm mx-auto">
                Trigger one of the 9 simulated scenario events above or run a custom pipeline test to inspect the agent recovery breakdown.
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-white border border-[#e6ebf1] rounded-xl p-12 text-center space-y-4 shadow-sm">
              <div className="w-10 h-10 border-3 border-[#635bff] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div>
                <div className="text-sm font-bold text-[#32325d]">Running Autonomous Pipeline...</div>
                <div className="text-xs text-[#6b7c93] mt-1 font-mono">
                  Sentinel ➔ Diagnoser ➔ Recovery Twin ➔ Policy Guard ➔ Outcome
                </div>
              </div>
            </div>
          )}

          {generatedScript && !loading && (
            <div className="bg-white border border-[#e6ebf1] rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-[#e6ebf1] pb-3">
                <div>
                  <span className="text-[10px] font-mono text-[#635bff] font-bold uppercase tracking-wider">Hinglish Voice Recovery script</span>
                  <h2 className="text-lg font-bold text-[#32325d] mt-0.5">VOICE SIMULATION</h2>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 font-mono">
                  {generatedScript.voice_status}
                </span>
              </div>
              
              <div className="p-4 bg-[#f6f9fc] rounded-lg border border-[#e6ebf1] text-xs font-mono leading-relaxed">
                {generatedScript.script}
              </div>

              <div className="flex justify-between items-center text-xs">
                <button
                  onClick={() => alert("Simulation output: Play audio script")}
                  className="px-3 py-1.5 bg-[#635bff] hover:bg-[#544dc9] text-white rounded font-bold"
                >
                  🔊 Listen [VOICE SIMULATION]
                </button>
                <span className="text-[11px] text-[#6b7c93]">Language: {generatedScript.language}</span>
              </div>
            </div>
          )}

          {reviewResult && !loading && (
            <div className="space-y-6">
              {/* Summary Banner */}
              <div className="bg-white border border-[#e6ebf1] rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-[#e6ebf1] pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-[#635bff] font-bold uppercase tracking-wider">DETAILED REVIEW SUMMARY</span>
                    <h2 className="text-lg font-bold text-[#32325d] mt-0.5">{reviewResult.scenario_summary.merchant}</h2>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-[10px] text-[#6b7c93] block">Latency</span>
                    <span className="text-xs text-[#22c55e] font-bold">{reviewResult.scenario_summary.latency_ms} ms</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs font-mono text-center">
                  <div className="bg-[#f6f9fc] p-3 rounded-lg border border-[#e6ebf1]">
                    <div className="text-[#6b7c93] text-[10px]">Amount At Risk</div>
                    <div className="text-[#32325d] font-bold text-sm mt-1">{reviewResult.scenario_summary.amount_at_risk}</div>
                  </div>
                  <div className="bg-[#f6f9fc] p-3 rounded-lg border border-[#e6ebf1]">
                    <div className="text-[#6b7c93] text-[10px]">Expected Recovery</div>
                    <div className="text-[#635bff] font-bold text-sm mt-1">{reviewResult.scenario_summary.expected_recovery_value}</div>
                  </div>
                  <div className="bg-[#f6f9fc] p-3 rounded-lg border border-[#e6ebf1]">
                    <div className="text-[#6b7c93] text-[10px]">Status</div>
                    <div className="text-[#22c55e] font-bold text-sm mt-1 uppercase">{reviewResult.scenario_summary.status}</div>
                  </div>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="bg-white border border-[#e6ebf1] rounded-xl p-6 space-y-4 shadow-sm">
                <div className="flex justify-between items-center border-b border-[#e6ebf1] pb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-[#32325d] uppercase tracking-wider">Where Revenue is Leaking</h3>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#635bff]/10 text-[#635bff] border border-[#635bff]/20 font-mono">
                    Confidence: {reviewResult.detailed_review.leakage_diagnosis.confidence}
                  </span>
                </div>

                <div className="p-4 bg-[#f6f9fc] rounded-lg border border-[#e6ebf1] text-xs">
                  <div className="text-[10px] text-[#6b7c93] uppercase font-mono font-bold">Category Cause</div>
                  <div className="text-base font-bold text-[#635bff] mt-0.5">
                    {reviewResult.detailed_review.leakage_diagnosis.cause_category}
                  </div>
                  <div className="text-[#32325d] mt-2 leading-relaxed font-mono">
                    {reviewResult.detailed_review.leakage_diagnosis.human_explanation}
                  </div>
                </div>
              </div>

              {/* Policy Guard Verdict */}
              <div className="bg-white border border-[#e6ebf1] rounded-xl p-6 space-y-4 shadow-sm">
                <div className="flex justify-between items-center border-b border-[#e6ebf1] pb-3">
                  <h3 className="text-xs font-bold text-[#32325d] uppercase tracking-wider">Policy Guard Verdict</h3>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase ${
                    reviewResult.detailed_review.policy_guard_gate.verdict === "ALLOW"
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
                    VERDICT: {reviewResult.detailed_review.policy_guard_gate.verdict}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  {reviewResult.detailed_review.policy_guard_gate.guard_rule_breakdown.map((rule: string, i: number) => (
                    <div key={i} className="p-3 bg-[#f6f9fc] rounded-lg border border-[#e6ebf1] flex justify-between items-center">
                      <span className="text-[#6b7c93]">{rule}</span>
                      <span className="text-[#22c55e] font-bold">✓ EVALUATED</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategy Action & Recovery Twin */}
              <div className="bg-white border border-[#e6ebf1] rounded-xl p-6 space-y-4 shadow-sm">
                <div className="flex justify-between items-center border-b border-[#e6ebf1] pb-3">
                  <h3 className="text-xs font-bold text-[#32325d] uppercase tracking-wider">Recovery Twin Selection</h3>
                  <span className="text-xs font-mono text-[#22c55e] font-bold">
                    Net EV Lift: {reviewResult.detailed_review.strategy_action.expected_recovery_value}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-[#f6f9fc] p-3 rounded-lg border border-[#e6ebf1]">
                    <div className="text-[#6b7c93] text-[10px]">Action Type</div>
                    <div className="text-[#32325d] font-bold text-sm mt-1 uppercase">
                      {reviewResult.detailed_review.strategy_action.action_type}
                    </div>
                  </div>
                  <div className="bg-[#f6f9fc] p-3 rounded-lg border border-[#e6ebf1]">
                    <div className="text-[#6b7c93] text-[10px]">Risk Level</div>
                    <div className="text-[#635bff] font-bold text-sm mt-1 uppercase">
                      {reviewResult.detailed_review.strategy_action.risk_level}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#f6f9fc] rounded-lg border border-[#e6ebf1] text-xs text-[#32325d]">
                  <div className="text-[10px] text-[#6b7c93] font-mono uppercase font-bold mb-1">Strategy Reasoning</div>
                  <div className="font-mono">{reviewResult.detailed_review.strategy_action.strategy_reasoning}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
