"use client";

import React from "react";

export default function ExperimentsPage() {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans">
      <div className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Experiments</h1>
          <p className="text-xs text-slate-400 mt-1">A/B trial benchmarks comparing revAIve autonomous recovery vs baseline dunning.</p>
        </div>
        <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs font-bold font-mono">
          ● 1 Active Experiment
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-mono text-indigo-400 font-bold">EXP-2026-01</span>
            <h2 className="text-xl font-extrabold text-white mt-1">Smart Retry Delay Alignment vs Standard 24h Dunning</h2>
          </div>
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            CONCLUSION: SIGNIFICANT LIFT (+34.2%)
          </span>
        </div>

        {/* Experiment Cards: Control vs Treatment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Control Variant Card */}
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-400">CONTROL VARIANT</span>
              <span className="text-xs font-mono text-slate-500">Standard Dunning</span>
            </div>
            <div>
              <div className="text-xs text-slate-400">Recovery Rate</div>
              <div className="text-3xl font-black text-slate-300 mt-1">11.2%</div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs pt-2">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-500">Recovered Revenue</div>
                <div className="text-base font-bold text-slate-200 mt-0.5">₹67,400</div>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-500">Sample Size</div>
                <div className="text-base font-bold text-slate-200 mt-0.5">2,500 opps</div>
              </div>
            </div>
          </div>

          {/* Treatment Variant Card (revAIve) */}
          <div className="bg-indigo-950/20 p-6 rounded-xl border border-indigo-500/40 space-y-4">
            <div className="flex justify-between items-center border-b border-indigo-800/50 pb-3">
              <span className="text-xs font-bold text-indigo-400">TREATMENT VARIANT</span>
              <span className="text-xs font-mono text-indigo-300">revAIve Autonomous</span>
            </div>
            <div>
              <div className="text-xs text-indigo-300/80">Recovery Rate</div>
              <div className="text-3xl font-black text-indigo-300 mt-1">15.0%</div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs pt-2">
              <div className="bg-slate-950/80 p-3 rounded-lg border border-indigo-800/40">
                <div className="text-slate-400">Recovered Revenue</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">₹3,82,400</div>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-lg border border-indigo-800/40">
                <div className="text-slate-400">Incremental Lift</div>
                <div className="text-base font-bold text-cyan-400 mt-0.5">+34.2%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistical Summary Bar */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono text-center">
          <div>
            <div className="text-slate-500">Total Sample Size</div>
            <div className="text-white font-bold text-sm mt-1">5,000 opps</div>
          </div>
          <div>
            <div className="text-slate-500">Incremental Recovered</div>
            <div className="text-emerald-400 font-bold text-sm mt-1">+₹3,15,000</div>
          </div>
          <div>
            <div className="text-slate-500">Statistical Confidence</div>
            <div className="text-cyan-400 font-bold text-sm mt-1">98.5% (p &lt; 0.01)</div>
          </div>
          <div>
            <div className="text-slate-500">Status</div>
            <div className="text-indigo-400 font-bold text-sm mt-1">WINNER DECLARED</div>
          </div>
        </div>
      </div>
    </div>
  );
}
