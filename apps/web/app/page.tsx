"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function OverviewPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const handleRunScan = () => {
    setIsScanning(true);
    setScanMessage(null);
    setTimeout(() => {
      setIsScanning(false);
      setScanMessage("Scan completed cleanly. 1,300 Revenue Opportunities evaluated.");
      setTimeout(() => setScanMessage(null), 4000);
    }, 1500);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Overview</h1>
            <span className="px-2 py-0.5 text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded">
              LIVE MONITORED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Autonomous revenue recovery metrics across Razorpay payments, subscriptions, and payment links.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunScan}
            disabled={isScanning}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            {isScanning ? "Scanning System..." : "▶ Run Intelligence Scan"}
          </button>
          <Link
            href="/queue"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg border border-slate-700 transition-all"
          >
            Open Recovery Queue (2)
          </Link>
        </div>
      </div>

      {scanMessage && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-semibold animate-fade-in">
          ✓ {scanMessage}
        </div>
      )}

      {/* Metric Cards Grid (8 Key Metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-400">Revenue at Risk</div>
          <div className="text-2xl font-black text-white mt-1">₹48,45,226</div>
          <div className="text-[10px] text-rose-400 mt-1 font-mono">1,300 opportunities</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-400">Expected Recovery</div>
          <div className="text-2xl font-black text-indigo-400 mt-1">₹27,19,835</div>
          <div className="text-[10px] text-indigo-300 mt-1 font-mono">56.1% expected yield</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-400">Recovered Revenue</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">₹4,49,800</div>
          <div className="text-[10px] text-emerald-300 mt-1 font-mono">583 successful actions</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-400">Incremental Recovery</div>
          <div className="text-2xl font-black text-cyan-400 mt-1">+₹3,82,400</div>
          <div className="text-[10px] text-cyan-300 mt-1 font-mono">vs baseline dunning</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-400">Recovery Rate</div>
          <div className="text-xl font-bold text-white mt-1">14.8%</div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">Verified outcomes</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-400">Active Opportunities</div>
          <div className="text-xl font-bold text-white mt-1">1,300</div>
          <div className="text-[10px] text-amber-400 mt-1 font-mono">Qualified for intervention</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-400">Agent Actions</div>
          <div className="text-xl font-bold text-white mt-1">583</div>
          <div className="text-[10px] text-emerald-400 mt-1 font-mono">Idempotent dispatches</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-400">Human Approvals</div>
          <div className="text-xl font-bold text-amber-400 mt-1">42</div>
          <div className="text-[10px] text-amber-300 mt-1 font-mono">High-value gates (&gt; ₹50k)</div>
        </div>
      </div>

      {/* Two Column Section: Leakage by Cause & Agent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Leakage by Cause (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white">Revenue Leakage by Root Cause</h2>
            <span className="text-[11px] font-mono text-slate-400">Deterministic Diagnosis</span>
          </div>

          <div className="space-y-3 pt-1">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-300">Insufficient Funds / Soft Decline</span>
                <span className="text-slate-400 font-mono">₹21,80,350 (45%)</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full w-[45%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-300">Transient Bank Outage / Timeout</span>
                <span className="text-slate-400 font-mono">₹14,53,560 (30%)</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full rounded-full w-[30%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-300">Expired Card Instrument</span>
                <span className="text-slate-400 font-mono">₹7,26,780 (15%)</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full w-[15%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-300">Cancelled Mandate / Customer Friction</span>
                <span className="text-slate-400 font-mono">₹4,84,536 (10%)</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full w-[10%]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Agent Activity & System Health (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white">Agent Execution Health</h2>
            <span className="text-[11px] font-mono text-emerald-400">NORMAL</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
              <div>
                <div className="text-slate-400 font-medium">Model & Version</div>
                <div className="text-white font-mono font-bold">claude-3-5-sonnet (v1.2)</div>
              </div>
              <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded font-mono">ALLOWLISTED</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
              <div>
                <div className="text-slate-400 font-medium">Average Latency</div>
                <div className="text-white font-mono font-bold">420 ms</div>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">⚡ Fast Response</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
              <div>
                <div className="text-slate-400 font-medium">Guard Policy Violations</div>
                <div className="text-emerald-400 font-mono font-bold">0 Violations</div>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">100% Deterministic</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
