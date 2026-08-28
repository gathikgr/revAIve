"use client";

import React, { useState, useEffect } from "react";

export default function AuditLogPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/opportunities/audit-logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) =>
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.actor_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 font-sans bg-[#f6f9fc] text-[#32325d]">
      <div className="flex justify-between items-center border-b border-[#e6ebf1] pb-6">
        <div>
          <h1 className="text-xl font-bold text-[#32325d] tracking-tight">Audit Log</h1>
          <p className="text-xs text-[#6b7c93] mt-1">Immutable append-only trail of all system actions, policy evaluations, and agent executions.</p>
        </div>
        <div className="text-xs font-mono text-[#6b7c93]">Total Audit Events: <span className="text-[#32325d] font-bold">{logs.length}</span></div>
      </div>

      <div className="bg-white border border-[#e6ebf1] p-4 rounded-xl shadow-sm">
        <input
          type="text"
          placeholder="Search action, actor, or entity ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#f6f9fc] border border-[#e6ebf1] rounded-lg px-3 py-2 text-xs text-[#32325d] placeholder-[#6b7c93] focus:outline-none focus:border-[#635bff]"
        />
      </div>

      <div className="bg-white border border-[#e6ebf1] rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-[#6b7c93] text-xs">Loading audit trail...</div>
        ) : (
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#f6f9fc] text-[#6b7c93] font-semibold border-b border-[#e6ebf1] uppercase">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Action</th>
                <th className="p-4">Entity</th>
                <th className="p-4">Result</th>
                <th className="p-4">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6ebf1] text-[#32325d]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#6b7c93]">No audit logs found. Run a simulation scenario.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-[#f6f9fc] transition-all cursor-pointer" onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                      <td className="p-4 text-[#6b7c93]">{log.timestamp}</td>
                      <td className="p-4">
                        <span className="text-[#635bff] font-bold">{log.actor_type}</span>
                        <div className="text-[10px] text-[#6b7c93]">{log.actor_id}</div>
                      </td>
                      <td className="p-4 font-bold text-[#32325d]">{log.action}</td>
                      <td className="p-4 text-[#6b7c93]">
                        <div>{log.entity_type}</div>
                        <div className="text-[10px] text-[#6b7c93]">{log.entity_id}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-emerald-100 text-emerald-700 border border-emerald-200`}>
                          {log.result}
                        </span>
                      </td>
                      <td className="p-4 text-[#6b7c93]">
                        {expandedId === log.id ? "▼ Collapse" : "▶ Expand"}
                      </td>
                    </tr>
                    {expandedId === log.id && (
                      <tr className="bg-[#f6f9fc]">
                        <td colSpan={6} className="p-4 border-t border-b border-[#e6ebf1] text-xs">
                          <div className="text-[#6b7c93] font-bold mb-1">Raw Audit Event Payload</div>
                          <pre className="p-3 bg-white border border-[#e6ebf1] rounded-lg text-[#32325d] text-[11px] overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
