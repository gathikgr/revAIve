"use client";

import React, { useState } from "react";

export default function SettingsPage() {
  const [merchantName, setMerchantName] = useState("SaaSify Technologies India Pvt Ltd");
  const [razorpayMerchantId, setRazorpayMerchantId] = useState("rzp_merch_saasify01");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 font-sans">
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-black text-white tracking-tight">Organization Settings</h1>
        <p className="text-xs text-slate-400 mt-1">Configure merchant profile, notification preferences, and system parameters.</p>
      </div>

      <form onSubmit={handleSave} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Merchant Organization Name</label>
            <input
              type="text"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Razorpay Account Merchant ID</label>
            <input
              type="text"
              disabled
              value={razorpayMerchantId}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-500 font-mono"
            />
          </div>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs rounded-lg font-semibold">
            ✓ Settings saved cleanly.
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
