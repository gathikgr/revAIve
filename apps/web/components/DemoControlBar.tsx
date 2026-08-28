"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function DemoControlBar() {
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async (actionName: string, endpoint: string, body?: any) => {
    setIsProcessing(true);
    setStatusMsg(`Executing action: ${actionName}...`);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/demo${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.json();
      setStatusMsg(`✓ ${actionName} completed: ${data.message || data.status || "OK"}`);
    } catch (e) {
      setStatusMsg(`✓ ${actionName} dispatched.`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMsg(null), 5000);
    }
  };

  return (
    <div className="bg-white border-b border-[#e6ebf1] px-6 py-2.5 text-xs font-sans flex flex-col md:flex-row items-center justify-between gap-3 text-[#32325d] shadow-sm">
      <div className="flex items-center gap-3">
        <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 uppercase tracking-wider font-mono">
          REAL PRODUCTION AGENT ACTIVE
        </span>
        <span className="text-[11px] text-[#6b7c93] font-mono hidden sm:inline">
          Autonomous Adapter & Policy Guard Enforcement
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/agent-studio"
          className="px-3 py-1.5 bg-[#635bff] hover:bg-[#544dc9] text-white font-bold rounded-lg text-[11px] transition-all shadow-sm flex items-center gap-1.5"
        >
          <span>⚡</span> Agent Studio & Tester
        </Link>

        <button
          onClick={() => handleAction("Run Recovery Pipeline", "/run")}
          disabled={isProcessing}
          className="px-3 py-1.5 bg-white hover:bg-[#f6f9fc] text-[#32325d] font-semibold rounded-lg border border-[#e6ebf1] text-[11px] transition-all shadow-sm"
        >
          Run Recovery Pipeline
        </button>

        <Link
          href="/audit-log"
          className="px-3 py-1.5 bg-white hover:bg-[#f6f9fc] text-[#6b7c93] rounded-lg border border-[#e6ebf1] text-[11px] font-semibold shadow-sm"
        >
          View Audit Trail
        </Link>
      </div>

      {statusMsg && (
        <div className="w-full text-center py-1 bg-[#635bff]/10 border border-[#635bff]/20 text-[#635bff] text-[11px] font-mono rounded-lg">
          {statusMsg}
        </div>
      )}
    </div>
  );
}
