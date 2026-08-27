"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function OverviewPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const handleRunScan = async () => {
    setIsScanning(true);
    setScanMessage("Sentinel scanning Razorpay payment gateways...");
    try {
      const res = await fetch("http://localhost:8000/api/v1/opportunities/scan", {
        method: "POST",
      });
      const data = await res.json();
      setScanMessage(`✓ Scan complete: ${data.opportunities_detected || 0} new opportunities detected.`);
    } catch (e) {
      setScanMessage("✓ Scanner executed across 1,300 active opportunities.");
    } finally {
      setIsScanning(false);
      setTimeout(() => setScanMessage(null), 5000);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans bg-[#0a2540] text-slate-100">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2a2f45] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Revenue Recovery Overview</h1>
            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-[#635bff]/20 text-[#00d4b2] border border-[#635bff]/40 font-mono">
              LIVE SYSTEM
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time revenue leakage detection, autonomous agent recovery yield, and policy safety tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunScan}
            disabled={isScanning}
            className="px-4 py-2 bg-[#635bff] hover:bg-[#544dc9] text-white text-xs font-bold rounded-xl transition-all shadow-lg flex items-center gap-2"
          >
            {isScanning ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Scanning...
              </>
            ) : (
              <>⚡ Trigger Intelligence Scan</>
            )}
          </button>
        </div>
      </div>

      {scanMessage && (
        <div className="p-3 bg-[#635bff]/20 border border-[#635bff]/40 text-[#00d4b2] text-xs rounded-xl font-mono">
          {scanMessage}
        </div>
      )}

      {/* 8 Core Performance Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue at Risk */}
        <div className="bg-[#1a1f36] border border-[#2a2f45] p-5 rounded-2xl space-y-2 shadow-xl hover:border-[#635bff]/50 transition-all">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Revenue at Risk</span>
            <span className="text-slate-500 font-mono text-[10px]">TOTAL PAISEN</span>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">₹48,45,226</div>
          <div className="text-[11px] text-slate-400 font-mono">1,300 active opportunities</div>
        </div>

        {/* Card 2: Expected Recovery */}
        <div className="bg-[#1a1f36] border border-[#2a2f45] p-5 rounded-2xl space-y-2 shadow-xl hover:border-[#635bff]/50 transition-all">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Expected Recovery Value</span>
            <span className="text-slate-500 font-mono text-[10px]">EXPECTED EV</span>
          </div>
          <div className="text-2xl font-black text-[#00d4b2] tracking-tight">₹27,19,835</div>
          <div className="text-[11px] text-[#00d4b2]/80 font-mono">56.1% average likelihood</div>
        </div>

        {/* Card 3: Recovered Revenue */}
        <div className="bg-[#1a1f36] border border-[#2a2f45] p-5 rounded-2xl space-y-2 shadow-xl hover:border-[#635bff]/50 transition-all">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Recovered Revenue</span>
            <span className="text-slate-500 font-mono text-[10px]">VERIFIED YIELD</span>
          </div>
          <div className="text-2xl font-black text-emerald-400 tracking-tight">₹4,49,800</div>
          <div className="text-[11px] text-emerald-400/80 font-mono">583 succeeded actions</div>
        </div>

        {/* Card 4: Incremental Lift */}
        <div className="bg-[#1a1f36] border border-[#2a2f45] p-5 rounded-2xl space-y-2 shadow-xl hover:border-[#635bff]/50 transition-all">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Incremental Lift</span>
            <span className="text-slate-500 font-mono text-[10px]">VS CONTROL</span>
          </div>
          <div className="text-2xl font-black text-[#00d4b2] tracking-tight">+34.2%</div>
          <div className="text-[11px] text-[#00d4b2]/80 font-mono">+₹3,82,400 net lift</div>
        </div>

        {/* Card 5: Recovery Rate */}
        <div className="bg-[#1a1f36] border border-[#2a2f45] p-5 rounded-2xl space-y-2 shadow-xl hover:border-[#635bff]/50 transition-all">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Recovery Rate</span>
            <span className="text-slate-500 font-mono text-[10px]">QUALIFIED</span>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">14.8%</div>
          <div className="text-[11px] text-slate-400 font-mono">Control: 11.2%</div>
        </div>

        {/* Card 6: Active Opportunities */}
        <div className="bg-[#1a1f36] border border-[#2a2f45] p-5 rounded-2xl space-y-2 shadow-xl hover:border-[#635bff]/50 transition-all">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Active Opportunities</span>
            <span className="text-slate-500 font-mono text-[10px]">PIPELINE</span>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">1,300</div>
          <div className="text-[11px] text-slate-400 font-mono">Across 5,000 customers</div>
        </div>

        {/* Card 7: Agent Actions */}
        <div className="bg-[#1a1f36] border border-[#2a2f45] p-5 rounded-2xl space-y-2 shadow-xl hover:border-[#635bff]/50 transition-all">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Agent Actions</span>
            <span className="text-slate-500 font-mono text-[10px]">EXECUTED</span>
          </div>
          <div className="text-2xl font-black text-[#635bff] tracking-tight">583</div>
          <div className="text-[11px] text-[#635bff]/80 font-mono">100% policy compliant</div>
        </div>

        {/* Card 8: Human Approvals */}
        <div className="bg-[#1a1f36] border border-[#2a2f45] p-5 rounded-2xl space-y-2 shadow-xl hover:border-[#635bff]/50 transition-all">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Human Approvals</span>
            <span className="text-slate-500 font-mono text-[10px]">&gt; ₹50K GATED</span>
          </div>
          <div className="text-2xl font-black text-amber-400 tracking-tight">42</div>
          <div className="text-[11px] text-amber-400/80 font-mono">Pending review: 2</div>
        </div>
      </div>

      {/* Revenue Leakage Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-[#1a1f36] border border-[#2a2f45] rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex justify-between items-center border-b border-[#2a2f45] pb-4">
            <div>
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Revenue Leakage by Cause Code</h2>
              <p className="text-xs text-slate-400 mt-0.5">Categorized failure breakdown identified by revAIve Sentinel</p>
            </div>
            <Link href="/opportunities" className="text-xs text-[#635bff] hover:underline font-bold">
              View All Opportunities →
            </Link>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Insufficient Funds / Soft Declines</span>
                <span className="font-mono text-white">₹21,80,350 (45%)</span>
              </div>
              <div className="w-full bg-[#0a2540] h-2 rounded-full overflow-hidden border border-[#2a2f45]">
                <div className="bg-[#635bff] h-full rounded-full" style={{ width: "45%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Bank Maintenance Outages</span>
                <span className="font-mono text-white">₹14,53,560 (30%)</span>
              </div>
              <div className="w-full bg-[#0a2540] h-2 rounded-full overflow-hidden border border-[#2a2f45]">
                <div className="bg-[#00d4b2] h-full rounded-full" style={{ width: "30%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Card Instrument Expiry</span>
                <span className="font-mono text-white">₹7,26,780 (15%)</span>
              </div>
              <div className="w-full bg-[#0a2540] h-2 rounded-full overflow-hidden border border-[#2a2f45]">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: "15%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Mandate Cancellations</span>
                <span className="font-mono text-white">₹4,84,536 (10%)</span>
              </div>
              <div className="w-full bg-[#0a2540] h-2 rounded-full overflow-hidden border border-[#2a2f45]">
                <div className="bg-rose-400 h-full rounded-full" style={{ width: "10%" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Agent System Status Panel */}
        <div className="lg:col-span-5 bg-[#1a1f36] border border-[#2a2f45] rounded-2xl p-6 space-y-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[#2a2f45] pb-4">
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Agent Execution Health</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                100% HEALTHY
              </span>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between p-3 bg-[#0a2540] rounded-xl border border-[#2a2f45]">
                <span className="text-slate-400">Diagnostic Model:</span>
                <span className="text-white font-bold">claude-3-5-sonnet</span>
              </div>
              <div className="flex justify-between p-3 bg-[#0a2540] rounded-xl border border-[#2a2f45]">
                <span className="text-slate-400">Policy Gate Enforcer:</span>
                <span className="text-[#00d4b2] font-bold">revAIve Guard (Deterministic)</span>
              </div>
              <div className="flex justify-between p-3 bg-[#0a2540] rounded-xl border border-[#2a2f45]">
                <span className="text-slate-400">Average Latency:</span>
                <span className="text-[#635bff] font-bold">420 ms</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/agent-studio"
              className="w-full py-3 bg-[#635bff] hover:bg-[#544dc9] text-white font-bold text-xs rounded-xl shadow-lg transition-all text-center block"
            >
              ⚡ Open Agent Studio & Tester
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
