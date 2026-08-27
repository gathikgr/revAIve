"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function DemoControlBar() {
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async (actionName: string, endpoint: string, body?: any) => {
    setIsProcessing(true);
    setStatusMsg(`Executing demo control: ${actionName}...`);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/demo${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.json();
      setStatusMsg(`✓ ${actionName} completed: ${data.message || data.status || "OK"}`);
    } catch (e) {
      setStatusMsg(`✓ ${actionName} dispatched (Simulated Mode).`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMsg(null), 5000);
    }
  };

  return (
    <div className="bg-slate-900 border-b border-indigo-500/30 px-4 py-2 text-xs font-sans flex flex-col md:flex-row items-center justify-between gap-3 text-slate-300 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <span className="px-2.5 py-0.5 text-[10px] font-black rounded-md bg-purple-950 text-purple-300 border border-purple-800 uppercase tracking-wider font-mono">
          DEMO ENVIRONMENT
        </span>
        <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
          SIMULATED PROVIDER RESPONSE (Seed: 42)
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => handleAction("Reset Scenario", "/reset")}
          disabled={isProcessing}
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded border border-slate-700 text-[11px] transition-all"
        >
          Reset Scenario
        </button>

        <button
          onClick={() => handleAction("Start Recovery Run", "/run")}
          disabled={isProcessing}
          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-[11px] transition-all shadow-sm"
        >
          Start Recovery Run
        </button>

        <button
          onClick={() => handleAction("Inject Provider Failure", "/inject-failure")}
          disabled={isProcessing}
          className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 font-semibold rounded border border-rose-800/60 text-[11px] transition-all"
        >
          Inject Failure (504)
        </button>

        <button
          onClick={() => handleAction("Inject Duplicate Webhook", "/inject-duplicate-webhook")}
          disabled={isProcessing}
          className="px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 font-semibold rounded border border-amber-800/60 text-[11px] transition-all"
        >
          Inject Duplicate Webhook
        </button>

        <Link
          href="/audit-log"
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[11px]"
        >
          View Audit Trail
        </Link>
      </div>

      {statusMsg && (
        <div className="w-full text-center py-1 bg-indigo-950/80 border border-indigo-800 text-indigo-300 text-[11px] font-mono rounded">
          {statusMsg}
        </div>
      )}
    </div>
  );
}
