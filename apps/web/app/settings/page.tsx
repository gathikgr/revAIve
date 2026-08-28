"use client";

import React, { useState } from "react";

export default function SettingsPage() {
  const [merchantName, setMerchantName] = useState("Meridian Retail Commerce Pvt Ltd");
  const [razorpayMerchantId, setRazorpayMerchantId] = useState("rzp_merch_meridian01");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 font-sans bg-[#f6f9fc] text-[#32325d]">
      <div className="border-b border-[#e6ebf1] pb-6">
        <h1 className="text-xl font-bold text-[#32325d] tracking-tight">Organization Settings</h1>
        <p className="text-xs text-[#6b7c93] mt-1">Configure merchant profile, notification preferences, and system parameters.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-[#e6ebf1] rounded-xl p-6 space-y-6 shadow-sm">
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-[#6b7c93] font-semibold mb-1">Merchant Organization Name</label>
            <input
              type="text"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              className="w-full bg-[#f6f9fc] border border-[#e6ebf1] rounded-lg p-3 text-[#32325d] font-medium focus:outline-none focus:border-[#635bff]"
            />
          </div>

          <div>
            <label className="block text-[#6b7c93] font-semibold mb-1">Razorpay Account Merchant ID</label>
            <input
              type="text"
              disabled
              value={razorpayMerchantId}
              className="w-full bg-[#f6f9fc] border border-[#e6ebf1] rounded-lg p-3 text-[#6b7c93] font-mono"
            />
          </div>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs rounded-lg font-semibold">
            ✓ Settings saved cleanly.
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2 bg-[#635bff] hover:bg-[#544dc9] text-white text-xs font-bold rounded-lg transition-all shadow-sm"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
