"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/skills", label: "Skills" },
  { href: "/targets", label: "Weekly Targets" },
  { href: "/leetcode", label: "LeetCode" },
  { href: "/revision", label: "Revision / Test" },
  { href: "/resume", label: "ATS Checker" },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <span className="font-bold text-indigo-400 text-lg tracking-tight">
          SkillUp Tracker
        </span>
        <div className="hidden md:flex gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-md transition-colors font-medium ${
                pathname === l.href
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <button
          onClick={logout}
          className="text-sm bg-slate-800 hover:bg-red-900/60 hover:text-red-400 text-slate-300 px-3 py-1.5 rounded-md transition-colors border border-slate-700"
        >
          Logout
        </button>
      </div>
      {/* Mobile nav */}
      <div className="md:hidden flex gap-1 overflow-x-auto px-4 pb-2 text-sm">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap px-3 py-1 rounded-md transition-colors ${
              pathname === l.href
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
