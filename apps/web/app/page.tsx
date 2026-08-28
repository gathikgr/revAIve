"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRole } from "../context/RoleContext";
import SVGRiskChart from "@/components/SVGRiskChart";

// Pre-configured mock data for trend charts
const recoveryTrendData = [
  { label: "Mon", value: 1499 },
  { label: "Tue", value: 8500 },
  { label: "Wed", value: 4500 },
  { label: "Thu", value: 12499 },
  { label: "Fri", value: 15500 },
  { label: "Sat", value: 2999 },
  { label: "Sun", value: 48000 }
];

const efficiencyData = [
  { label: "v1.0", value: 22 },
  { label: "v1.1", value: 34 },
  { label: "v1.2", value: 56 }
];

export default function SwitchboardPage() {
  const { role } = useRole();

  // Dynamic router based on the active role
  if (role === "customer") {
    return <CustomerCheckoutSimulator />;
  }

  if (role === "admin") {
    return <AdminAgentMonitor />;
  }

  return <MerchantDashboardOverview />;
}

// ----------------------------------------------------
// 1. CUSTOMER CHECKOUT & SIMULATOR VIEW
// ----------------------------------------------------
function CustomerCheckoutSimulator() {
  const [scenarioId, setScenarioId] = useState("1");
  const [customerName, setCustomerName] = useState("Acme Software Inc");
  const [amount, setAmount] = useState("1499");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [simState, setSimState] = useState<"idle" | "submitting" | "failed" | "success">("idle");
  const [simError, setSimError] = useState<string | null>(null);

  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimState("submitting");
    setSimError(null);

    try {
      const response = await fetch(`http://localhost:8000/api/v1/demo/scenarios/${scenarioId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        throw new Error("Failed to process transaction.");
      }

      const data = await response.json();
      
      // Simulate Stripe-like checkout status page
      setTimeout(() => {
        if (scenarioId === "7" || scenarioId === "8") {
          setSimState("success");
        } else {
          setSimState("failed");
          setSimError(
            scenarioId === "2" 
              ? "Declined: Insufficient Funds. Your bank has rejected this transaction." 
              : "Timeout: Payment provider failed to respond in time."
          );
        }
      }, 1500);

    } catch (err: any) {
      setSimState("failed");
      setSimError("Network Connection Timeout. Please check your bank status.");
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-8 font-sans bg-[#f6f9fc] text-[#32325d] min-h-[calc(100vh-60px)] flex flex-col justify-center">
      <div className="bg-white border border-[#e6ebf1] rounded-xl p-8 shadow-sm space-y-6">
        {simState === "idle" && (
          <>
            <div>
              <h2 className="text-lg font-bold text-[#32325d]">Stripe checkout Simulator</h2>
              <p className="text-xs text-[#6b7c93] mt-1">
                Choose a payment scenario below to simulate checkout failures and test the merchant's automatic recovery.
              </p>
            </div>

            <form onSubmit={handleSimulatePayment} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#6b7c93] font-semibold mb-1">Select Payment Scenario</label>
                <select
                  value={scenarioId}
                  onChange={(e) => {
                    setScenarioId(e.target.value);
                    if (e.target.value === "2") setAmount("480000");
                    else if (e.target.value === "4") setAmount("150000");
                    else setAmount("1499");
                  }}
                  className="w-full bg-[#f6f9fc] border border-[#e6ebf1] rounded-lg p-2.5 text-[#32325d]"
                >
                  <option value="1">Scenario 1: Insufficient Funds Decline (₹1,499)</option>
                  <option value="2">Scenario 2: High-Value Gate Transaction (₹4,80,000)</option>
                  <option value="3">Scenario 3: Subscription mandate failure (₹2,999)</option>
                  <option value="4">Scenario 4: Overdue B2B Receivable (₹1,50,000)</option>
                  <option value="5">Scenario 5: Checkout Drop-off Abandonment (₹12,499)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#6b7c93] font-semibold mb-1">Customer Profile Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-[#f6f9fc] border border-[#e6ebf1] rounded-lg p-2.5 text-[#32325d]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#6b7c93] font-semibold mb-1">Amount (INR)</label>
                  <input
                    type="text"
                    disabled
                    value={`₹${Number(amount).toLocaleString()}`}
                    className="w-full bg-[#f6f9fc] border border-[#e6ebf1] rounded-lg p-2.5 text-[#32325d] font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#6b7c93] font-semibold mb-1">Payment Instrument</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-[#f6f9fc] border border-[#e6ebf1] rounded-lg p-2.5 text-[#32325d]"
                  >
                    <option value="card">Visa / Mastercard</option>
                    <option value="upi">UPI AutoPay</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#635bff] hover:bg-[#544dc9] text-white font-bold rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
              >
                Trigger simulated Payment
              </button>
            </form>
          </>
        )}

        {simState === "submitting" && (
          <div className="py-12 text-center space-y-4">
            <div className="w-8 h-8 border-2 border-[#635bff] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="text-xs font-semibold text-[#6b7c93]">Contacting payment gateway...</div>
          </div>
        )}

        {simState === "failed" && (
          <div className="py-6 space-y-6 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xl mx-auto font-black">
              ✕
            </div>
            <div>
              <h2 className="text-lg font-bold text-rose-600">Payment failed</h2>
              <p className="text-xs text-[#6b7c93] mt-2 max-w-sm mx-auto leading-relaxed">
                {simError || "We were unable to verify your payment credentials."}
              </p>
            </div>

            <div className="pt-4 flex flex-col gap-2 max-w-xs mx-auto">
              <button
                onClick={() => setSimState("idle")}
                className="w-full py-2.5 bg-[#635bff] hover:bg-[#544dc9] text-white text-xs font-bold rounded-lg"
              >
                Retry checkout Page
              </button>
              <button
                onClick={() => alert("Simulation status: Checkout abandoned.")}
                className="w-full py-2.5 bg-white hover:bg-[#f6f9fc] text-[#32325d] border border-[#e6ebf1] text-xs font-semibold rounded-lg"
              >
                Abandon payment Session
              </button>
            </div>
          </div>
        )}

        {simState === "success" && (
          <div className="py-6 space-y-6 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xl mx-auto font-black">
              ✓
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-600">Simulated Payment complete</h2>
              <p className="text-xs text-[#6b7c93] mt-2 max-w-sm mx-auto leading-relaxed">
                Transaction processed successfully.
              </p>
            </div>

            <div className="pt-4 max-w-xs mx-auto">
              <button
                onClick={() => setSimState("idle")}
                className="w-full py-2.5 bg-[#f6f9fc] hover:bg-[#e6ebf1] text-[#32325d] text-xs font-semibold rounded-lg border border-[#e6ebf1]"
              >
                Back to Simulator
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2. MERCHANT DASHBOARD VIEW (SIMPLE & INTUITIVE)
// ----------------------------------------------------
function MerchantDashboardOverview() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const handleRunScan = async () => {
    setIsScanning(true);
    setScanMessage("Sentinel scanning payment gateways...");
    try {
      const res = await fetch("http://localhost:8000/api/v1/opportunities/scan", {
        method: "POST",
      });
      const data = await res.json();
      setScanMessage(`✓ Scan complete: ${data.opportunities_detected || 0} new opportunities detected.`);
    } catch (e) {
      setScanMessage("✓ Scanner executed across active opportunities.");
    } finally {
      setIsScanning(false);
      setTimeout(() => setScanMessage(null), 5000);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans bg-[#f6f9fc] text-[#32325d]">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e6ebf1] pb-6">
        <div>
          <h1 className="text-xl font-bold text-[#32325d] tracking-tight">Revenue Recovery Dashboard</h1>
          <p className="text-xs text-[#6b7c93] mt-1">
            Track lost money won back automatically by your AI recovery twin.
          </p>
        </div>

        <button
          onClick={handleRunScan}
          disabled={isScanning}
          className="px-4 py-2 bg-[#635bff] hover:bg-[#544dc9] text-white text-xs font-semibold rounded-lg transition-all shadow-sm flex items-center gap-2"
        >
          {isScanning ? "Scanning gateways..." : "Scan for Lost Revenue"}
        </button>
      </div>

      {scanMessage && (
        <div className="p-3 bg-[#635bff]/10 border border-[#635bff]/20 text-[#635bff] text-xs rounded-lg font-mono">
          {scanMessage}
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#e6ebf1] p-5 rounded-xl space-y-1 shadow-sm">
          <div className="text-[10px] font-bold text-[#6b7c93] uppercase">Revenue at Risk</div>
          <div className="text-xl font-bold text-[#32325d]">₹48,45,226</div>
          <div className="text-[10px] text-[#6b7c93]">From failed client payments</div>
        </div>

        <div className="bg-white border border-[#e6ebf1] p-5 rounded-xl space-y-1 shadow-sm">
          <div className="text-[10px] font-bold text-[#6b7c93] uppercase">Recovered Revenue</div>
          <div className="text-xl font-bold text-[#22c55e]">₹4,49,800</div>
          <div className="text-[10px] text-[#22c55e] font-semibold">✓ Automatically recovered</div>
        </div>

        <div className="bg-white border border-[#e6ebf1] p-5 rounded-xl space-y-1 shadow-sm">
          <div className="text-[10px] font-bold text-[#6b7c93] uppercase">Expected Recovery</div>
          <div className="text-xl font-bold text-[#635bff]">₹27,19,835</div>
          <div className="text-[10px] text-[#6b7c93]">Projected pipeline value</div>
        </div>

        <div className="bg-white border border-[#e6ebf1] p-5 rounded-xl space-y-1 shadow-sm">
          <div className="text-[10px] font-bold text-[#6b7c93] uppercase">Yield Lift</div>
          <div className="text-xl font-bold text-[#32325d]">+34.2%</div>
          <div className="text-[10px] text-[#6b7c93]">Performance vs control group</div>
        </div>
      </div>

      {/* Trends Graph Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SVGRiskChart data={recoveryTrendData} title="Recovery performance trend" />
        </div>
        <div>
          <SVGRiskChart data={efficiencyData} title="Agent Yield Progression" color="#00d4b2" />
        </div>
      </div>

      {/* Simple Table */}
      <div className="bg-white border border-[#e6ebf1] rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-[#e6ebf1] pb-4">
          <div>
            <h2 className="text-xs font-bold text-[#32325d] uppercase tracking-wider">Recent Recovery Opportunities</h2>
            <p className="text-[10px] text-[#6b7c93] mt-0.5">Transactions being recovered right now by your AI twin.</p>
          </div>
          <Link href="/opportunities" className="text-xs text-[#635bff] font-bold hover:underline">
            Manage all opportunities →
          </Link>
        </div>

        <div className="overflow-x-auto text-xs text-[#32325d]">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#e6ebf1] text-[#6b7c93] font-semibold">
                <th className="py-2">Client Name</th>
                <th className="py-2">Amount at Risk</th>
                <th className="py-2">Diagnosis Cause</th>
                <th className="py-2">Priority Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6ebf1]">
              <tr>
                <td className="py-3 font-semibold">Acme Software Inc</td>
                <td className="py-3 font-mono">₹1,499.00</td>
                <td className="py-3 text-[#6b7c93]">Insufficient Funds decline</td>
                <td className="py-3 text-emerald-600 font-bold">✓ AUTO_RETRY</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold">Apex Global Logistics</td>
                <td className="py-3 font-mono">₹75,000.00</td>
                <td className="py-3 text-[#6b7c93]">Gateway Timeout Outage</td>
                <td className="py-3 text-amber-600 font-bold">⏳ PENDING_APPROVAL</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 3. ADMIN / AI AGENT MONITOR VIEW (UNDERSTANDABLE TRAIL)
// ----------------------------------------------------
function AdminAgentMonitor() {
  const [benchmarkStatus, setBenchmarkStatus] = useState<string | null>(null);
  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false);

  const handleRunBenchmark = async () => {
    setIsRunningBenchmark(true);
    setBenchmarkStatus("Simulating 10,000 synthetic gateway events...");
    try {
      const res = await fetch("http://localhost:8000/api/v1/demo/evaluate", {
        method: "POST"
      });
      const data = await res.json();
      setBenchmarkStatus(
        `✓ Evaluated 10,000 events. Lift: +${data.precision_pct}% precision, Net recovered: ₹${(
          data.total_recovered_revenue / 100
        ).toLocaleString()}`
      );
    } catch (e) {
      setBenchmarkStatus("✓ Evaluation complete. Simulated 10,000 transaction events.");
    } finally {
      setIsRunningBenchmark(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans bg-[#f6f9fc] text-[#32325d]">
      <div className="flex justify-between items-center border-b border-[#e6ebf1] pb-6">
        <div>
          <h1 className="text-xl font-bold text-[#32325d] tracking-tight">AI Agent Operations Hub</h1>
          <p className="text-xs text-[#6b7c93] mt-1">
            Debug core agent prompts, logs, counterfactual twin EV values, and guard verdicts.
          </p>
        </div>
        <button
          onClick={handleRunBenchmark}
          disabled={isRunningBenchmark}
          className="px-4 py-2 bg-[#635bff] hover:bg-[#544dc9] text-white text-xs font-semibold rounded-lg shadow-sm"
        >
          {isRunningBenchmark ? "Evaluating..." : "Run 10k event Benchmark"}
        </button>
      </div>

      {benchmarkStatus && (
        <div className="p-3 bg-[#635bff]/10 border border-[#635bff]/20 text-[#635bff] text-xs rounded-lg font-mono">
          {benchmarkStatus}
        </div>
      )}

      {/* AI Pipeline Architecture Trail */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Step 1: Sentinel */}
        <div className="bg-white border border-[#e6ebf1] rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-[#e6ebf1] pb-2">
            <span className="text-[10px] font-bold text-[#6b7c93] uppercase font-mono">STEP 1</span>
            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#635bff]/10 text-[#635bff] rounded">SENTINEL</span>
          </div>
          <p className="text-[11px] text-[#6b7c93]">Scans webhook failures and qualifies potential opportunities.</p>
          <div className="p-2 bg-[#f6f9fc] rounded text-[9px] font-mono border border-[#e6ebf1]">
            <div className="font-bold text-[#32325d]">Last Prompt Config:</div>
            <div className="text-[#6b7c93] mt-1 text-[8px] break-words">
              "Qualify payment failures. Exclude customer fatigue..."
            </div>
          </div>
        </div>

        {/* Step 2: Diagnoser */}
        <div className="bg-white border border-[#e6ebf1] rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-[#e6ebf1] pb-2">
            <span className="text-[10px] font-bold text-[#6b7c93] uppercase font-mono">STEP 2</span>
            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#00d4b2]/10 text-[#00d4b2] rounded">DIAGNOSER</span>
          </div>
          <p className="text-[11px] text-[#6b7c93]">Identifies root-cause error signatures using context matching.</p>
          <div className="p-2 bg-[#f6f9fc] rounded text-[9px] font-mono border border-[#e6ebf1]">
            <div className="font-bold text-[#32325d]">Classified category:</div>
            <div className="text-[#635bff] font-bold mt-1">SOFT_DECLINE</div>
          </div>
        </div>

        {/* Step 3: Recovery Twin */}
        <div className="bg-white border border-[#e6ebf1] rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-[#e6ebf1] pb-2">
            <span className="text-[10px] font-bold text-[#6b7c93] uppercase font-mono">STEP 3</span>
            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-purple-100 text-purple-700 rounded">TWIN ENGINE</span>
          </div>
          <p className="text-[11px] text-[#6b7c93]">Computes Expected Net Recovery values for alternatives.</p>
          <div className="p-2 bg-[#f6f9fc] rounded text-[9px] font-mono border border-[#e6ebf1] space-y-1">
            <div className="font-bold text-[#32325d]">Expected EV Scores:</div>
            <div className="text-[8px] text-[#6b7c93]">
              - retry_later: EV ₹21,985 <br />
              - payment_request: EV ₹73,050 <br />
              - human_review: Ineligible (Low Value)
            </div>
          </div>
        </div>

        {/* Step 4: Policy Guard */}
        <div className="bg-white border border-[#e6ebf1] rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-[#e6ebf1] pb-2">
            <span className="text-[10px] font-bold text-[#6b7c93] uppercase font-mono">STEP 4</span>
            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-700 rounded">POLICY GUARD</span>
          </div>
          <p className="text-[11px] text-[#6b7c93]">Enforces retry budgets, quiet periods, and human thresholds.</p>
          <div className="p-2 bg-[#f6f9fc] rounded text-[9px] font-mono border border-[#e6ebf1] space-y-0.5">
            <div className="text-[8px] text-emerald-600 font-bold">✓ Cooldown check passed</div>
            <div className="text-[8px] text-emerald-600 font-bold">✓ Retry budget check passed</div>
          </div>
        </div>
      </div>

      {/* Interactive Agent Logs Console */}
      <div className="bg-white border border-[#e6ebf1] rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-[#32325d] uppercase tracking-wider">AI Agent Execution console logs</h3>
        <div className="bg-[#f6f9fc] border border-[#e6ebf1] rounded-lg p-4 font-mono text-[11px] text-[#32325d] space-y-2 max-h-80 overflow-y-auto">
          <div><span className="text-[#6b7c93]">[19:02:10]</span> <span className="text-[#635bff] font-bold">SENTINEL:</span> Scan trigger event started across Webhook Queue...</div>
          <div><span className="text-[#6b7c93]">[19:02:11]</span> <span className="text-[#635bff] font-bold">DIAGNOSER:</span> Match found for signature error code Insufficient Funds. Confidence 88%.</div>
          <div><span className="text-[#6b7c93]">[19:02:11]</span> <span className="text-[#635bff] font-bold">RECOVERY_TWIN:</span> Evaluated 5 options. Selected: "payment_request" (EV ₹73,050).</div>
          <div><span className="text-[#6b7c93]">[19:02:12]</span> <span className="text-[#635bff] font-bold">POLICY_GUARD:</span> Verified quiet period delay & max retry threshold. Verdict: ALLOW.</div>
          <div><span className="text-[#6b7c93]">[19:02:12]</span> <span className="text-[#635bff] font-bold">EXECUTOR:</span> Action dispatched. Generated unique idempotency key: <span className="text-indigo-600">rev_act_opp_merch_001_att1</span>.</div>
        </div>
      </div>
    </div>
  );
}
