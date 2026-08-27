import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import DemoControlBar from "@/components/DemoControlBar";

export const metadata: Metadata = {
  title: "revAIve — Autonomous Revenue Recovery for Razorpay",
  description: "Bring lost revenue back.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased font-sans flex min-h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-x-hidden min-h-screen">
          <DemoControlBar />
          <div className="flex-1">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
