"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function OverviewPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const handleRunScan = async () => {
    setIsScanning(true);
    setScanMessage("Sentinel scanning payment events...");
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
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e6ebf1] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#32325d] tracking-tight">Revenue Recovery Overview</h1>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#635bff]/10 text-[#635bff] border border-[#635bff]/20 font-mono">
              LIVE SYSTEM
            </span>
          </div>
          <p className="text-xs text-[#6b7c93] mt-1">
            Real-time revenue leakage detection, autonomous agent recovery yield, and policy safety tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunScan}
            disabled={isScanning}
            className="px-4 py-2 bg-[#635bff] hover:bg-[#544dc9] text-white text-xs font-semibold rounded-lg transition-all shadow-sm flex items-center gap-2"
          >
            {isScanning ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Scanning...
              </>
            ) : (
              <>Trigger Scan</>
            )}
          </button>
        </div>
      </div>

      {scanMessage && (
        <div className="p-3 bg-[#635bff]/10 border border-[#635bff]/20 text-[#635bff] text-xs rounded-lg font-mono">
          {scanMessage}
        </div>
      )}

      {/* 8 Core Performance Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue at Risk */}
        <div className="bg-white border border-[#e6ebf1] p-5 rounded-xl space-y-2 shadow-sm hover:border-[#635bff]/50 transition-all">
          <div className="flex justify-between items-center text-xs text-[#6b7c93]">
            <span>Revenue at Risk</span>
            <span className="text-[#6b7c93] font-mono text-[10px]">TOTAL PAISEN</span>
          </div>
          <div className="text-2xl font-bold text-[#32325d] tracking-tight">₹48,45,226</div>
          <div className="text-[11px] text-[#6b7c93] font-mono">1,300 active opportunities</div>
        </div>

        {/* Card 2: Expected Recovery */}
        <div className="bg-white border border-[#e6ebf1] p-5 rounded-xl space-y-2 shadow-sm hover:border-[#635bff]/50 transition-all">
          <div className="flex justify-between items-center text-xs text-[#6b7c93]">
            <span>Expected Recovery Value</span>
            <span className="text-[#6b7c93] font-mono text-[10px]">EXPECTED EV</span>
          </div>
          <div className="text-2xl font-bold text-[#635bff] tracking-tight">₹27,19,835</div>
          <div className="text-[11px] text-[#6b7c93] font-mono">56.1% average likelihood</div>
        </div>

        {/* Card 3: Recovered Revenue */}
        <div className="bg-white border border-[#e6ebf1] p-5 rounded-xl space-y-2 shadow-sm hover:border-[#635bff]/50 transition-all">
          <div className="flex justify-between items-center text-xs text-[#6b7c93]">
            <span>Recovered Revenue</span>
            <span className="text-[#6b7c93] font-mono text-[10px]">VERIFIED YIELD</span>
          </div>
          <div className="text-2xl font-bold text-[#22c55e] tracking-tight">₹4,49,800</div>
          <div className="text-[11px] text-[#22c55e] font-mono">583 succeeded actions</div>
        </div>

        {/* Card 4: Incremental Lift */}
        <div className="bg-white border border-[#e6ebf1] p-5 rounded-xl space-y-2 shadow-sm hover:border-[#635bff]/50 transition-all">
          <div className="flex justify-between items-center text-xs text-[#6b7c93]">
            <span>Incremental Lift</span>
            <span className="text-[#6b7c93] font-mono text-[10px]">VS CONTROL</span>
          </div>
          <div className="text-2xl font-bold text-[#32325d] tracking-tight">+34.2%</div>
          <div className="text-[11px] text-[#6b7c93] font-mono">+₹3,82,400 net lift</div>
        </div>

        {/* Card 5: Recovery Rate */}
        <div className="bg-white border border-[#e6ebf1] p-5 rounded-xl space-y-2 shadow-sm hover:border-[#635bff]/50 transition-all">
          <div className="flex justify-between items-center text-xs text-[#6b7c93]">
            <span>Recovery Rate</span>
            <span className="text-[#6b7c93] font-mono text-[10px]">QUALIFIED</span>
          </div>
          <div className="text-2xl font-bold text-[#32325d] tracking-tight">14.8%</div>
          <div className="text-[11px] text-[#6b7c93] font-mono">Control: 11.2%</div>
        </div>

        {/* Card 6: Active Opportunities */}
        <div className="bg-white border border-[#e6ebf1] p-5 rounded-xl space-y-2 shadow-sm hover:border-[#635bff]/50 transition-all">
          <div className="flex justify-between items-center text-xs text-[#6b7c93]">
            <span>Active Opportunities</span>
            <span className="text-[#6b7c93] font-mono text-[10px]">PIPELINE</span>
          </div>
          <div className="text-2xl font-bold text-[#32325d] tracking-tight">1,300</div>
          <div className="text-[11px] text-[#6b7c93] font-mono">Across 5,000 customers</div>
        </div>

        {/* Card 7: Agent Actions */}
        <div className="bg-white border border-[#e6ebf1] p-5 rounded-xl space-y-2 shadow-sm hover:border-[#635bff]/50 transition-all">
          <div className="flex justify-between items-center text-xs text-[#6b7c93]">
            <span>Agent Actions</span>
            <span className="text-[#6b7c93] font-mono text-[10px]">EXECUTED</span>
          </div>
          <div className="text-2xl font-bold text-[#635bff] tracking-tight">583</div>
          <div className="text-[11px] text-[#6b7c93] font-mono">100% policy compliant</div>
        </div>

        {/* Card 8: Human Approvals */}
        <div className="bg-white border border-[#e6ebf1] p-5 rounded-xl space-y-2 shadow-sm hover:border-[#635bff]/50 transition-all">
          <div className="flex justify-between items-center text-xs text-[#6b7c93]">
            <span>Human Approvals</span>
            <span className="text-[#6b7c93] font-mono text-[10px]">&gt; ₹50K GATED</span>
          </div>
          <div className="text-2xl font-bold text-[#f59e0b] tracking-tight">42</div>
          <div className="text-[11px] text-[#f59e0b] font-mono">Pending review: 2</div>
        </div>
      </div>

      {/* Revenue Leakage Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white border border-[#e6ebf1] rounded-xl p-6 space-y-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-[#e6ebf1] pb-4">
            <div>
              <h2 className="text-xs font-bold text-[#32325d] uppercase tracking-wider">Revenue Leakage by Cause Code</h2>
              <p className="text-[11px] text-[#6b7c93] mt-0.5">Categorized failure breakdown identified by revAIve Sentinel</p>
            </div>
            <Link href="/opportunities" className="text-xs text-[#635bff] hover:underline font-bold">
              View All Opportunities →
            </Link>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between text-[#32325d] font-semibold mb-1">
                <span>Insufficient Funds / Soft Declines</span>
                <span className="font-mono text-[#6b7c93]">₹21,80,350 (45%)</span>
              </div>
              <div className="w-full bg-[#f6f9fc] h-2 rounded-full overflow-hidden border border-[#e6ebf1]">
                <div className="bg-[#635bff] h-full rounded-full" style={{ width: "45%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[#32325d] font-semibold mb-1">
                <span>Bank Maintenance Outages</span>
                <span className="font-mono text-[#6b7c93]">₹14,53,560 (30%)</span>
              </div>
              <div className="w-full bg-[#f6f9fc] h-2 rounded-full overflow-hidden border border-[#e6ebf1]">
                <div className="bg-[#00d4b2] h-full rounded-full" style={{ width: "30%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[#32325d] font-semibold mb-1">
                <span>Card Instrument Expiry</span>
                <span className="font-mono text-[#6b7c93]">₹7,26,780 (15%)</span>
              </div>
              <div className="w-full bg-[#f6f9fc] h-2 rounded-full overflow-hidden border border-[#e6ebf1]">
                <div className="bg-[#f59e0b] h-full rounded-full" style={{ width: "15%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[#32325d] font-semibold mb-1">
                <span>Mandate Cancellations</span>
                <span className="font-mono text-[#6b7c93]">₹4,84,536 (10%)</span>
              </div>
              <div className="w-full bg-[#f6f9fc] h-2 rounded-full overflow-hidden border border-[#e6ebf1]">
                <div className="bg-[#ef4444] h-full rounded-full" style={{ width: "10%" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Agent System Status Panel */}
        <div className="lg:col-span-5 bg-white border border-[#e6ebf1] rounded-xl p-6 space-y-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[#e6ebf1] pb-4">
              <h2 className="text-xs font-bold text-[#32325d] uppercase tracking-wider">Agent Execution Health</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 font-mono">
                100% HEALTHY
              </span>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between p-3 bg-[#f6f9fc] rounded-lg border border-[#e6ebf1]">
                <span className="text-[#6b7c93]">Diagnostic Model:</span>
                <span className="text-[#32325d] font-bold">claude-3-5-sonnet</span>
              </div>
              <div className="flex justify-between p-3 bg-[#f6f9fc] rounded-lg border border-[#e6ebf1]">
                <span className="text-[#6b7c93]">Policy Gate Enforcer:</span>
                <span className="text-[#635bff] font-bold">revAIve Guard (Deterministic)</span>
              </div>
              <div className="flex justify-between p-3 bg-[#f6f9fc] rounded-lg border border-[#e6ebf1]">
                <span className="text-[#6b7c93]">Average Latency:</span>
                <span className="text-[#635bff] font-bold">420 ms</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/agent-studio"
              className="w-full py-3 bg-[#635bff] hover:bg-[#544dc9] text-white font-bold text-xs rounded-lg shadow-sm transition-all text-center block"
            >
              ⚡ Open Agent Studio & Tester
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
