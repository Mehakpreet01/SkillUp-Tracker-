"use client";
import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";

import { supabase } from "../../lib/supabaseClient";
import { useGlobalContext } from "../../lib/GlobalContext";

export default function LeetCodePage() {
  const { refreshData } = useGlobalContext();
  const [username, setUsername] = useState("");
  const [stats, setStats] = useState({ total: 0, easy: 0, medium: 0, hard: 0 });
  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingBoard, setLoadingBoard] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  async function fetchLeaderboard() {
    try {
      setLoadingBoard(true);
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      if (data.success) {
        setLeaderboard(data.leaderboard || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBoard(false);
    }
  }

  async function handleSync() {
    if (!username.trim()) return;
    setSyncing(true);
    setStatusMessage("");
    setIsError(false);
    
    try {
      const res = await fetch("/api/leetcode-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leetcodeUser: username }),
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        setIsError(true);
        setStatusMessage(data.error || "Sync failed");
      } else {
        // Now update Supabase directly from frontend
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              username: user.user_metadata?.full_name || user.email.split('@')[0],
              leetcode_username: data.data.leetcodeUser,
              problems_solved: data.data.totalSolved,
              updated_at: new Date().toISOString()
            });
            
          if (upsertError) {
            console.error("Supabase Error:", upsertError);
            setIsError(true);
            setStatusMessage("Failed to update leaderboard profile.");
            return;
          }
        }

        setStatusMessage("Profile synced successfully!");
        setStats({
          total: data.data.totalSolved,
          easy: data.data.easySolved,
          medium: data.data.mediumSolved,
          hard: data.data.hardSolved,
        });
        fetchLeaderboard(); // Refresh leaderboard
        refreshData(); // Refresh global context for dashboard
      }
    } catch (err) {
      setIsError(true);
      setStatusMessage("Internal Server Error");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0f1c] text-slate-100 font-sans">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Side: LeetCode Profile Integration */}
        <div className="bg-[#111827] border border-slate-800/60 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-indigo-400 mb-2">LeetCode Profile Integration</h2>
          <p className="text-sm text-slate-400 mb-8">
            Synchronize live quantitative metrics directly from your official LeetCode handle.
          </p>
          
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              LEETCODE USERNAME
            </label>
            <input
              type="text"
              className="w-full bg-[#0a0f1c] border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. uM8a9vh4Ro"
            />
          </div>
          
          {statusMessage && (
            <div className={`text-sm mb-4 font-medium ${isError ? 'text-red-400' : 'text-emerald-500'}`}>
              {statusMessage}
            </div>
          )}
          
          <button
            onClick={handleSync}
            disabled={syncing || !username.trim()}
            className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors mb-10"
          >
            {syncing ? "Syncing..." : "Sync Profile Progress"}
          </button>
          
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            LIVE DISTRIBUTION
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0a0f1c] border border-slate-800/80 rounded-xl p-6 text-center">
              <p className="text-4xl font-bold text-white mb-2">{stats.total}</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">TOTAL SOLVED</p>
            </div>
            <div className="bg-[#0a0f1c] border border-slate-800/80 rounded-xl p-6 text-center">
              <p className="text-4xl font-bold text-emerald-400 mb-2">{stats.easy}</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">EASY</p>
            </div>
            <div className="bg-[#0a0f1c] border border-slate-800/80 rounded-xl p-6 text-center">
              <p className="text-4xl font-bold text-amber-400 mb-2">{stats.medium}</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">MEDIUM</p>
            </div>
            <div className="bg-[#0a0f1c] border border-slate-800/80 rounded-xl p-6 text-center">
              <p className="text-4xl font-bold text-red-400 mb-2">{stats.hard}</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">HARD</p>
            </div>
          </div>
        </div>

        {/* Right Side: SkillUp Peer Standings */}
        <div className="bg-[#111827] border border-slate-800/60 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-indigo-400 mb-2">SkillUp Peer Standings</h2>
          <p className="text-sm text-slate-400 mb-8">
            Real-time competitive metrics tracking total problem solving distribution among friends.
          </p>
          
          {loadingBoard ? (
            <div className="border border-dashed border-slate-700/50 rounded-xl p-10 flex items-center justify-center">
              <p className="text-slate-500 text-sm">Loading leaderboard...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="border border-dashed border-slate-700/50 rounded-xl p-10 flex items-center justify-center">
              <p className="text-slate-500 text-sm text-center">
                No peers registered yet. Sync your profile to join!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((peer, idx) => (
                <div key={peer.id} className="flex items-center justify-between bg-[#0a0f1c] border border-slate-800/80 rounded-xl p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-400">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200">{peer.username}</p>
                      {peer.leetcode_username && (
                        <p className="text-xs text-slate-500">@{peer.leetcode_username}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-indigo-400">{peer.problems_solved || 0}</p>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Solved</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </main>
  );
}