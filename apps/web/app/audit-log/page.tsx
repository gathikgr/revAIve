"use client";

import React, { useState } from "react";

const MOCK_AUDIT_LOGS = [
  { id: "aud_1001", timestamp: "2026-08-27 13:45:10 UTC", actor_type: "ai_agent", actor_id: "revaive_agent_executor", action: "ACTION_EXECUTED", entity_type: "RevenueOpportunity", entity_id: "opp_saas_001", result: "SUCCESS", metadata: { idempotency_key: "rev_act_opp_saas_001_att1", action_type: "retry_payment" } },
  { id: "aud_1002", timestamp: "2026-08-27 13:42:05 UTC", actor_type: "policy_engine", actor_id: "rev_guard_enforcer", action: "POLICY_EVALUATED", entity_type: "RevenueOpportunity", entity_id: "opp_saas_002", result: "REQUIRE_HUMAN_APPROVAL", metadata: { rule: "high_value_threshold", threshold: 5000000 } },
  { id: "aud_1003", timestamp: "2026-08-27 13:30:12 UTC", actor_type: "system_worker", actor_id: "revenue_intelligence_scanner", action: "OPPORTUNITY_QUALIFIED", entity_type: "RevenueOpportunity", entity_id: "opp_saas_003", result: "QUALIFIED", metadata: { recovery_likelihood: 0.95, expected_recovery_value: 282900 } },
  { id: "aud_1004", timestamp: "2026-08-27 13:10:00 UTC", actor_type: "merchant_operator", actor_id: "merchant_admin_101", action: "POLICY_APPLIED", entity_type: "Policy", entity_id: "pol_custom_99", result: "APPLIED", metadata: { confirmation_reason: "Approved Q3 Policy Update" } }
];

export default function AuditLogPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredLogs = MOCK_AUDIT_LOGS.filter((log) =>
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.actor_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Audit Log</h1>
          <p className="text-xs text-slate-400 mt-1">Immutable append-only trail of all system actions, policy evaluations, and agent executions.</p>
        </div>
        <div className="text-xs font-mono text-slate-400">Total Audit Events: <span className="text-white font-bold">3,917</span></div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
        <input
          type="text"
          placeholder="Search action, actor, or entity ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase">
            <tr>
              <th className="p-4">Timestamp</th>
              <th className="p-4">Actor</th>
              <th className="p-4">Action</th>
              <th className="p-4">Entity</th>
              <th className="p-4">Result</th>
              <th className="p-4">Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filteredLogs.map((log) => (
              <React.Fragment key={log.id}>
                <tr className="hover:bg-slate-800/50 transition-all cursor-pointer" onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                  <td className="p-4 text-slate-500">{log.timestamp}</td>
                  <td className="p-4">
                    <span className="text-indigo-300 font-bold">{log.actor_type}</span>
                    <div className="text-[10px] text-slate-500">{log.actor_id}</div>
                  </td>
                  <td className="p-4 font-bold text-white">{log.action}</td>
                  <td className="p-4 text-slate-400">
                    <div>{log.entity_type}</div>
                    <div className="text-[10px] text-slate-500">{log.entity_id}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                      log.result === "SUCCESS" || log.result === "QUALIFIED" || log.result === "APPLIED"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}>
                      {log.result}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">
                    {expandedId === log.id ? "▼ Collapse" : "▶ Expand"}
                  </td>
                </tr>
                {expandedId === log.id && (
                  <tr className="bg-slate-950/80">
                    <td colSpan={6} className="p-4 border-t border-b border-slate-800/80 text-xs">
                      <div className="text-slate-400 font-bold mb-1">Raw Audit Event Payload</div>
                      <pre className="p-3 bg-slate-900 rounded-lg text-slate-300 text-[11px] overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
