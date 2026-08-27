"use client";

import React from "react";

export default function IntegrationsPage() {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans">
      <div className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Integrations & Connectors</h1>
          <p className="text-xs text-slate-400 mt-1">Manage Razorpay Test Mode API keys, webhook endpoints, and connection health.</p>
        </div>
        <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs font-bold font-mono">
          ● ALL CONNECTIONS HEALTHY
        </div>
      </div>

      {/* Razorpay Test Mode Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-between justify-center font-bold text-indigo-400 text-lg">
              💳
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Razorpay Payment Gateway</h2>
              <p className="text-xs text-slate-400">Official Razorpay Test Mode API Adapter & Webhook Ingestion</p>
            </div>
          </div>
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            CONNECTED
          </span>
        </div>

        {/* Integration Status Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="text-slate-500 text-[11px]">Environment Mode</div>
            <div className="text-white font-bold text-sm mt-1">RAZORPAY_TEST</div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="text-slate-500 text-[11px]">API Health</div>
            <div className="text-emerald-400 font-bold text-sm mt-1">100% Operational</div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="text-slate-500 text-[11px]">Webhook Signature</div>
            <div className="text-cyan-400 font-bold text-sm mt-1">HMAC-SHA256 (200 OK)</div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="text-slate-500 text-[11px]">Key ID Masked</div>
            <div className="text-slate-300 font-bold text-sm mt-1">rzp_test_••••••••</div>
          </div>
        </div>

        {/* Recent Connection Timestamps */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2 font-mono">
          <div className="flex justify-between text-slate-400">
            <span>Last Successful Webhook Ingest:</span>
            <span className="text-white font-bold">2026-08-27 13:45:00 UTC (payment.failed)</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Last API Dispatch (Payment Link):</span>
            <span className="text-white font-bold">2026-08-27 13:40:12 UTC (HTTP 200 OK)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
