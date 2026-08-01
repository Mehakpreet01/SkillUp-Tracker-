"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push("/dashboard");
      setChecked(true);
    });
  }, [router]);

  if (!checked) return null;

  return (
    <main className="min-h-screen bg-[#0a0f1c] flex items-center justify-center relative overflow-hidden px-4">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="text-center max-w-3xl relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          The Ultimate Developer Workspace
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight">
          Master your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Engineering</span> Journey
        </h1>
        
        <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Track your learned skills, synchronize your LeetCode progress in real-time, conquer weekly targets, and let AI craft your professional resume automatically.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/signup" className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)]">
            Start Building Free
          </Link>
          <Link href="/login" className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#111827] border border-slate-700 hover:border-slate-500 text-slate-300 font-semibold transition-all">
            Sign In to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
