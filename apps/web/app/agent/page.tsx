"use client";

import React from "react";

export default function AgentPage() {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">revAIve Agent System</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              ● ACTIVE & MONITORED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Autonomous decision pipeline operating on structured RevenueOpportunity records.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          Agent Version: <span className="text-white font-bold">v1.2.0 (claude-3-5-sonnet)</span>
        </div>
      </div>

      {/* Metric Cards (8 Agent Metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="text-slate-400 font-medium">Agent Status</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">OPERATIONAL</div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">100% Policy Compliant</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="text-slate-400 font-medium">Total Runs Evaluated</div>
          <div className="text-2xl font-black text-white mt-1">1,300</div>
          <div className="text-[10px] text-indigo-400 mt-1 font-mono">Deterministic Intelligence</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="text-slate-400 font-medium">Decisions Recorded</div>
          <div className="text-2xl font-black text-white mt-1">3,917</div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">DB Logged</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="text-slate-400 font-medium">Action Outcomes</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">583</div>
          <div className="text-[10px] text-emerald-300 mt-1 font-mono">Idempotent dispatches</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="text-slate-400 font-medium">Average Latency</div>
          <div className="text-xl font-bold text-white mt-1">420 ms</div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">End-to-End Pipeline</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="text-slate-400 font-medium">Failure Rate</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">0.0%</div>
          <div className="text-[10px] text-emerald-300 mt-1 font-mono">Zero un-handled errors</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="text-slate-400 font-medium">Tool Allowlist</div>
          <div className="text-xl font-bold text-indigo-300 mt-1">8 Tools</div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">Strict Allowlist</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="text-slate-400 font-medium">Prompt Defense</div>
          <div className="text-xl font-bold text-cyan-400 mt-1">ACTIVE</div>
          <div className="text-[10px] text-cyan-300 mt-1 font-mono">XML Data Blocks</div>
        </div>
      </div>

      {/* Allowlisted Tools Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white">Allowlisted Agent Tools</h2>
          <span className="text-xs font-mono text-slate-400">Strict Security Sandbox</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-indigo-300">get_customer_context</div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-indigo-300">get_payment_context</div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-indigo-300">get_recovery_history</div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-indigo-300">get_policy</div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-emerald-300">create_payment_link</div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-emerald-300">send_notification</div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-emerald-300">schedule_retry</div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-amber-300">request_human_approval</div>
        </div>
      </div>

      {/* Structured Decision Audit Log (NO chain of thought) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white">Recent Structured Decisions</h2>
          <span className="text-xs font-mono text-slate-400">No Chain-of-Thought Exposed</span>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="font-mono text-indigo-400 font-bold">Decision #dec_9901 (opp_merch_001)</span>
              <span className="text-slate-500 font-mono">2026-08-27 13:45:10 UTC</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-slate-500 font-bold block mb-1">WHY / DIAGNOSIS</span>
                <p className="text-slate-300">Categorized as INSUFFICIENT_FUNDS (Confidence 88%). Soft decline eligible for salary alignment retry.</p>
              </div>
              <div>
                <span className="text-slate-500 font-bold block mb-1">EVIDENCE</span>
                <p className="text-slate-300 font-mono">Error: BAD_REQUEST_PAYMENT_DECLINED_INSUFFICIENT_FUNDS | Bank: HDFC</p>
              </div>
              <div>
                <span className="text-slate-500 font-bold block mb-1">DECISION & POLICY</span>
                <p className="text-emerald-400 font-semibold">Guard Verdict: ALLOW (Passed max retries, quiet period, & EV threshold)</p>
              </div>
              <div>
                <span className="text-slate-500 font-bold block mb-1">ACTION & OUTCOME</span>
                <p className="text-slate-300 font-mono">Dispatched DELAYED_RETRY (Key: rev_act_opp_merch_001_att1) → SUCCESS</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
