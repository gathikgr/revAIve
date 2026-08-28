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
  let recColor = "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (diffEv > 0 && diffContacts > 500) {
    recommendation = "REVIEW";
    recColor = "bg-amber-100 text-amber-700 border-amber-200";
  } else if (diffEv <= 0) {
    recommendation = "HIGH_RISK";
    recColor = "bg-rose-100 text-rose-700 border-rose-200";
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
    <div className="min-h-screen bg-[#f6f9fc] text-[#32325d] p-6 md:p-10 font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e6ebf1] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight text-[#32325d]">
              rev<span className="text-[#635bff]">AI</span>ve
            </span>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-[#635bff]/10 text-[#635bff] border border-[#635bff]/20">
              POLICY LAB
            </span>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded bg-purple-100 text-purple-700 border border-purple-200">
              SIMULATED MODE
            </span>
          </div>
          <p className="text-[#6b7c93] text-xs mt-1">
            Simulate counterfactual recovery consequences before applying changes to production.
          </p>
        </div>
        <button
          onClick={() => setShowApplyModal(true)}
          className="px-4 py-2 bg-[#635bff] hover:bg-[#544dc9] text-white font-bold rounded-lg transition-all shadow-sm text-xs"
        >
          Apply Policy Changes
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Policy Editor Controls */}
        <div className="lg:col-span-5 bg-white border border-[#e6ebf1] rounded-xl p-6 space-y-6 shadow-sm">
          <h2 className="text-xs font-bold text-[#32325d] uppercase tracking-wider border-b border-[#e6ebf1] pb-3 flex items-center justify-between">
            <span>Policy Parameters</span>
            <span className="text-[10px] font-normal text-[#6b7c93]">Interactive Editor</span>
          </h2>

          {/* Slider 1: Max Retries */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="text-[#32325d] font-semibold">Maximum Retries</label>
              <span className="font-mono text-[#635bff] font-bold">{maxRetries} attempts</span>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              value={maxRetries}
              onChange={(e) => setMaxRetries(Number(e.target.value))}
              className="w-full h-2 bg-[#f6f9fc] rounded-lg appearance-none cursor-pointer accent-[#635bff]"
            />
            <p className="text-[10px] text-[#6b7c93]">Maximum retry attempt budget allocated per opportunity.</p>
          </div>

          {/* Slider 2: Cooldown Hours */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="text-[#32325d] font-semibold">Retry Cooldown</label>
              <span className="font-mono text-[#635bff] font-bold">{cooldownHours} hours</span>
            </div>
            <input
              type="range"
              min="6"
              max="72"
              step="6"
              value={cooldownHours}
              onChange={(e) => setCooldownHours(Number(e.target.value))}
              className="w-full h-2 bg-[#f6f9fc] rounded-lg appearance-none cursor-pointer accent-[#635bff]"
            />
            <p className="text-[10px] text-[#6b7c93]">Minimum quiet delay required between automated retry attempts.</p>
          </div>

          {/* Slider 3: Max Contacts */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="text-[#32325d] font-semibold">Max Customer Contacts</label>
              <span className="font-mono text-[#635bff] font-bold">{maxContacts} messages</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={maxContacts}
              onChange={(e) => setMaxContacts(Number(e.target.value))}
              className="w-full h-2 bg-[#f6f9fc] rounded-lg appearance-none cursor-pointer accent-[#635bff]"
            />
            <p className="text-[10px] text-[#6b7c93]">Messaging cap per customer to prevent notification fatigue.</p>
          </div>

          {/* Slider 4: High Value Threshold */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="text-[#32325d] font-semibold">Human Approval Gate Threshold</label>
              <span className="font-mono text-[#635bff] font-bold">₹{(approvalThresholdPaise / 100).toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="1000000"
              max="10000000"
              step="1000000"
              value={approvalThresholdPaise}
              onChange={(e) => setApprovalThresholdPaise(Number(e.target.value))}
              className="w-full h-2 bg-[#f6f9fc] rounded-lg appearance-none cursor-pointer accent-[#635bff]"
            />
            <p className="text-[10px] text-[#6b7c93]">Amounts exceeding this threshold require operator approval.</p>
          </div>

          {/* Slider 5: Min Expected Value */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="text-[#32325d] font-semibold">Min EV Qualification Threshold</label>
              <span className="font-mono text-[#635bff] font-bold">₹{(minEvPaise / 100).toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="10000"
              max="200000"
              step="10000"
              value={minEvPaise}
              onChange={(e) => setMinEvPaise(Number(e.target.value))}
              className="w-full h-2 bg-[#f6f9fc] rounded-lg appearance-none cursor-pointer accent-[#635bff]"
            />
            <p className="text-[10px] text-[#6b7c93]">Minimum expected value needed to clear intervention cost.</p>
          </div>
        </div>

        {/* Counterfactual Simulation Cards */}
        <div className="lg:col-span-7 space-y-6">
          {/* Header Banner */}
          <div className="bg-white border border-[#e6ebf1] rounded-xl p-6 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-[#6b7c93] uppercase">SIMULATED COMPARISON</span>
              <h3 className="text-base font-bold text-[#32325d] mt-1 font-mono">Policy Impact Counterfactual</h3>
            </div>
            <div className={`px-3 py-1.5 rounded-full border text-xs font-bold uppercase ${recColor}`}>
              RECOMMENDATION: {recommendation}
            </div>
          </div>

          {/* Current vs Proposed Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Policy Card */}
            <div className="bg-white border border-[#e6ebf1] rounded-xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#e6ebf1] pb-3">
                <span className="text-xs font-bold text-[#6b7c93]">CURRENT POLICY</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#f6f9fc] text-[#6b7c93]">ACTIVE</span>
              </div>
              <div>
                <div className="text-xs text-[#6b7c93]">Expected Recovery</div>
                <div className="text-2xl font-bold text-[#32325d] mt-1 font-mono">₹{(currentExpectedEv / 100000).toFixed(2)}L</div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
                <div className="bg-[#f6f9fc] p-3 rounded-lg border border-[#e6ebf1]">
                  <div className="text-[#6b7c93] text-[10px]">Contacts</div>
                  <div className="text-sm font-bold text-[#32325d] mt-0.5">{currentContacts.toLocaleString()}</div>
                </div>
                <div className="bg-[#f6f9fc] p-3 rounded-lg border border-[#e6ebf1]">
                  <div className="text-[#6b7c93] text-[10px]">Escalations</div>
                  <div className="text-sm font-bold text-[#32325d] mt-0.5">{currentEscalations}</div>
                </div>
              </div>
            </div>

            {/* Proposed Policy Card */}
            <div className="bg-white border border-[#e6ebf1] rounded-xl p-6 space-y-4 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 bg-[#635bff]/10 text-[#635bff] text-[10px] font-black px-3 py-1 rounded-bl-lg">
                SIMULATED
              </div>
              <div className="flex items-center justify-between border-b border-[#e6ebf1] pb-3">
                <span className="text-xs font-bold text-[#6b7c93]">PROPOSED POLICY</span>
                <span className="text-[10px] font-mono text-[#635bff]">COUNTERFACTUAL</span>
              </div>
              <div>
                <div className="text-xs text-[#6b7c93]">Expected Recovery</div>
                <div className="text-2xl font-bold text-[#635bff] mt-1 font-mono">₹{(proposedExpectedEv / 100000).toFixed(2)}L</div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
                <div className="bg-[#f6f9fc] p-3 rounded-lg border border-[#e6ebf1]">
                  <div className="text-[#6b7c93] text-[10px]">Contacts</div>
                  <div className="text-sm font-bold text-[#635bff] mt-0.5">{proposedContacts.toLocaleString()}</div>
                </div>
                <div className="bg-[#f6f9fc] p-3 rounded-lg border border-[#e6ebf1]">
                  <div className="text-[#6b7c93] text-[10px]">Escalations</div>
                  <div className="text-sm font-bold text-[#635bff] mt-0.5">{proposedEscalations}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Delta Summary Card */}
          <div className="bg-white border border-[#e6ebf1] rounded-xl p-6 shadow-sm">
            <h4 className="text-xs font-bold tracking-widest text-[#6b7c93] uppercase mb-4">COUNTERFACTUAL DIFFERENCE SUMMARY</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#f6f9fc] rounded-lg border border-[#e6ebf1] flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#6b7c93]">Incremental Expected Recovery</div>
                  <div className={`text-xl font-bold mt-1 font-mono ${diffEv >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {diffEv >= 0 ? "+" : ""}₹{(diffEv / 1000).toFixed(1)}K
                  </div>
                </div>
                <span className="text-xl">{diffEv >= 0 ? "📈" : "📉"}</span>
              </div>
              <div className="p-4 bg-[#f6f9fc] rounded-lg border border-[#e6ebf1] flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#6b7c93]">Contact Frequency Delta</div>
                  <div className={`text-xl font-bold mt-1 font-mono ${diffContacts <= 500 ? "text-emerald-600" : "text-amber-600"}`}>
                    {diffContacts >= 0 ? "+" : ""}{diffContacts} contacts
                  </div>
                </div>
                <span className="text-xl">{diffContacts <= 500 ? "💬" : "⚠️"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Policy Confirmation Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-[#32325d]/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#e6ebf1] rounded-xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <h3 className="text-base font-bold text-[#32325d] border-b border-[#e6ebf1] pb-3 flex items-center justify-between">
              <span>Confirm Policy Application</span>
              <span className="text-xs text-[#635bff] font-mono">REV-POLICY-SET</span>
            </h3>

            <p className="text-xs text-[#6b7c93]">
              Applying this policy will update production Guard parameters and generate an immutable AuditEvent record.
            </p>

            <form onSubmit={handleApplyPolicy} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-[#6b7c93] uppercase mb-2">
                  Confirmation Reason Statement (Required)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Approved policy tuning for Q3 recovery optimization"
                  value={confirmationReason}
                  onChange={(e) => setConfirmationReason(e.target.value)}
                  className="w-full bg-[#f6f9fc] border border-[#e6ebf1] rounded-lg p-3 text-xs text-[#32325d] focus:outline-none focus:border-[#635bff]"
                />
              </div>

              {appliedSuccess && (
                <div className="p-3 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold text-center">
                  ✓ Policy change applied successfully & logged in Audit Trail.
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 bg-[#f6f9fc] hover:bg-[#e6ebf1] text-[#6b7c93] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isApplying || !confirmationReason.trim()}
                  className="px-5 py-2 bg-[#635bff] hover:bg-[#544dc9] text-white rounded-lg disabled:opacity-50"
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
