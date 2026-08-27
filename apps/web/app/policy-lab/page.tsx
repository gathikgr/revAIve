"use client";

import React, { useState } from "react";

export default function PolicyLabPage() {
  // Configurable Proposed Policy state
  const [maxRetries, setMaxRetries] = useState<number>(3);
  const [cooldownHours, setCooldownHours] = useState<number>(24);
  const [maxContacts, setMaxContacts] = useState<number>(2);
  const [minEvPaise, setMinEvPaise] = useState<number>(50000); // ₹500
  const [approvalThresholdPaise, setApprovalThresholdPaise] = useState<number>(5000000); // ₹50,000

  // Apply Modal state
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [confirmationReason, setConfirmationReason] = useState<string>("");
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);

  // Computed Counterfactual Simulation Metrics
  const currentExpectedEv = 48200000; // ₹4.82L
  const currentContacts = 3102;
  const currentInterventions = 4250;
  const currentEscalations = 42;

  // Dynamic simulation multipliers based on policy sliders
  const evMultiplier = 1.0 + (maxRetries - 3) * 0.08 - (cooldownHours - 24) * 0.003;
  const contactMultiplier = 1.0 + (maxContacts - 2) * 0.22 + (maxRetries - 3) * 0.12;

  const proposedExpectedEv = Math.round(currentExpectedEv * Math.max(0.7, evMultiplier));
  const proposedContacts = Math.round(currentContacts * Math.max(0.5, contactMultiplier));
  const proposedInterventions = Math.round(currentInterventions * (maxRetries / 3));
  const proposedEscalations = Math.round(currentEscalations * (5000000 / approvalThresholdPaise));

  const diffEv = proposedExpectedEv - currentExpectedEv;
  const diffContacts = proposedContacts - currentContacts;

  let recommendation = "RECOMMENDED";
  let recColor = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (diffEv > 0 && diffContacts > 500) {
    recommendation = "REVIEW";
    recColor = "bg-amber-500/20 text-amber-400 border-amber-500/30";
  } else if (diffEv <= 0) {
    recommendation = "HIGH_RISK";
    recColor = "bg-rose-500/20 text-rose-400 border-rose-500/30";
  }

  const handleApplyPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationReason.trim()) return;

    setIsApplying(true);
    // Simulate API call to /api/v1/policy-lab/apply
    setTimeout(() => {
      setIsApplying(false);
      setAppliedSuccess(true);
      setTimeout(() => {
        setShowApplyModal(false);
        setAppliedSuccess(false);
        setConfirmationReason("");
      }, 2000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black tracking-tight text-white">
              rev<span className="text-cyan-400">AI</span>ve
            </span>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
              POLICY LAB
            </span>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-950 text-purple-400 border border-purple-800 animate-pulse">
              SIMULATED MODE
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Simulate counterfactual recovery consequences before applying changes to production.
          </p>
        </div>
        <button
          onClick={() => setShowApplyModal(true)}
          className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg transition-all shadow-lg shadow-cyan-500/20 text-sm flex items-center justify-center gap-2"
        >
          Apply Policy Changes
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Policy Editor Controls (Left Column - 5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl space-y-6">
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
            <span>Policy Parameters</span>
            <span className="text-xs font-normal text-slate-400">Interactive Editor</span>
          </h2>

          {/* Slider 1: Max Retries */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <label className="text-slate-300 font-medium">Maximum Retries</label>
              <span className="font-mono text-cyan-400 font-bold">{maxRetries} attempts</span>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              value={maxRetries}
              onChange={(e) => setMaxRetries(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <p className="text-xs text-slate-500">Maximum retry attempt budget allocated per opportunity.</p>
          </div>

          {/* Slider 2: Cooldown Hours */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <label className="text-slate-300 font-medium">Retry Cooldown</label>
              <span className="font-mono text-cyan-400 font-bold">{cooldownHours} hours</span>
            </div>
            <input
              type="range"
              min="6"
              max="72"
              step="6"
              value={cooldownHours}
              onChange={(e) => setCooldownHours(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <p className="text-xs text-slate-500">Minimum quiet delay required between automated retry attempts.</p>
          </div>

          {/* Slider 3: Max Contacts */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <label className="text-slate-300 font-medium">Max Customer Contacts</label>
              <span className="font-mono text-cyan-400 font-bold">{maxContacts} messages</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={maxContacts}
              onChange={(e) => setMaxContacts(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <p className="text-xs text-slate-500">Messaging cap per customer to prevent notification fatigue.</p>
          </div>

          {/* Slider 4: High Value Threshold */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <label className="text-slate-300 font-medium">Human Approval Gate Threshold</label>
              <span className="font-mono text-cyan-400 font-bold">₹{(approvalThresholdPaise / 100).toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="1000000"
              max="10000000"
              step="1000000"
              value={approvalThresholdPaise}
              onChange={(e) => setApprovalThresholdPaise(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <p className="text-xs text-slate-500">Amounts exceeding this threshold require operator approval.</p>
          </div>

          {/* Slider 5: Min Expected Value */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <label className="text-slate-300 font-medium">Min EV Qualification Threshold</label>
              <span className="font-mono text-cyan-400 font-bold">₹{(minEvPaise / 100).toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="10000"
              max="200000"
              step="10000"
              value={minEvPaise}
              onChange={(e) => setMinEvPaise(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <p className="text-xs text-slate-500">Minimum expected value needed to clear intervention cost.</p>
          </div>
        </div>

        {/* Counterfactual Simulation Cards (Right Column - 7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Header Banner */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">SIMULATED COMPARISON</span>
              <h3 className="text-xl font-extrabold text-white mt-1">Policy Impact Counterfactual</h3>
            </div>
            <div className={`px-4 py-1.5 rounded-full border text-xs font-black tracking-wider uppercase ${recColor}`}>
              RECOMMENDATION: {recommendation}
            </div>
          </div>

          {/* Current vs Proposed Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Policy Card */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-sm font-bold text-slate-400">CURRENT POLICY</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800 text-slate-300">ACTIVE</span>
              </div>
              <div>
                <div className="text-xs text-slate-400">Expected Recovery</div>
                <div className="text-3xl font-black text-white mt-1">₹{(currentExpectedEv / 100000).toFixed(2)}L</div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <div className="text-slate-400">Customer Contacts</div>
                  <div className="text-lg font-bold text-white mt-0.5">{currentContacts.toLocaleString()}</div>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <div className="text-slate-400">Human Escalations</div>
                  <div className="text-lg font-bold text-white mt-0.5">{currentEscalations}</div>
                </div>
              </div>
            </div>

            {/* Proposed Policy Card */}
            <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-2xl p-6 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-cyan-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-bl-lg">
                SIMULATED
              </div>
              <div className="flex items-center justify-between border-b border-cyan-800/50 pb-3">
                <span className="text-sm font-bold text-cyan-400">PROPOSED POLICY</span>
                <span className="text-[10px] font-mono text-cyan-300">COUNTERFACTUAL</span>
              </div>
              <div>
                <div className="text-xs text-cyan-300/80">Expected Recovery</div>
                <div className="text-3xl font-black text-cyan-300 mt-1">₹{(proposedExpectedEv / 100000).toFixed(2)}L</div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="bg-slate-950/80 p-3 rounded-lg border border-cyan-800/40">
                  <div className="text-slate-400">Customer Contacts</div>
                  <div className="text-lg font-bold text-cyan-200 mt-0.5">{proposedContacts.toLocaleString()}</div>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-lg border border-cyan-800/40">
                  <div className="text-slate-400">Human Escalations</div>
                  <div className="text-lg font-bold text-cyan-200 mt-0.5">{proposedEscalations}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Delta Summary Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
            <h4 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4">COUNTERFACTUAL DIFFERENCE SUMMARY</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Incremental Expected Recovery</div>
                  <div className={`text-2xl font-black mt-1 ${diffEv >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {diffEv >= 0 ? "+" : ""}₹{(diffEv / 1000).toFixed(1)}K
                  </div>
                </div>
                <span className="text-2xl">{diffEv >= 0 ? "📈" : "📉"}</span>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Contact Frequency Delta</div>
                  <div className={`text-2xl font-black mt-1 ${diffContacts <= 500 ? "text-cyan-400" : "text-amber-400"}`}>
                    {diffContacts >= 0 ? "+" : ""}{diffContacts} contacts
                  </div>
                </div>
                <span className="text-2xl">{diffContacts <= 500 ? "💬" : "⚠️"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Policy Confirmation Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>Confirm Policy Application</span>
              <span className="text-xs text-cyan-400 font-mono">REV-POLICY-SET</span>
            </h3>

            <p className="text-sm text-slate-300">
              Applying this policy will update production Guard parameters and generate an immutable AuditEvent record.
            </p>

            <form onSubmit={handleApplyPolicy} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                  Confirmation Reason Statement (Required)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Approved policy tuning for Q3 recovery optimization"
                  value={confirmationReason}
                  onChange={(e) => setConfirmationReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {appliedSuccess && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-lg text-sm font-semibold text-center">
                  ✓ Policy change applied successfully & logged in Audit Trail.
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isApplying || !confirmationReason.trim()}
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-sm font-bold disabled:opacity-50"
                >
                  {isApplying ? "Applying..." : "Confirm & Apply"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
