"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { useUser } from "../../lib/useUser";
import { supabase } from "../../lib/supabaseClient";
import { useGlobalContext } from "../../lib/GlobalContext";

const SCORE_HISTORY_KEY = "revision_test_scores_v1";

function currentWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

function formatDateToDayMonth(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + (dateStr.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function getTimeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr + (dateStr.length === 10 ? "T00:00:00" : ""));
  const diffInHours = Math.abs(now - date) / 36e5;

  if (diffInHours < 24) {
    const hrs = Math.floor(diffInHours);
    return hrs === 0 ? "Just now" : `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  }
  const days = Math.floor(diffInHours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

// ═══════════════════════════════════════════════════════
// SVG CHARTS
// ═══════════════════════════════════════════════════════

function DonutChart({ completed, total }) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const r = 35;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex items-center gap-4">
      <div className="relative" style={{ width: 90, height: 90 }}>
        <svg width="90" height="90" viewBox="0 0 90 90" className="transform -rotate-90">
          <circle cx="45" cy="45" r={r} fill="none" stroke="#1e293b" strokeWidth="10" />
          <circle
            cx="45" cy="45" r={r} fill="none"
            stroke="#4f46e5" strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ - dash}`}
            style={{ transition: "stroke-dasharray 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-slate-100">{pct}%</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-white">Target Completion</p>
        <p className="text-xs text-slate-400 mt-0.5">{completed} of {total} targets done</p>
      </div>
    </div>
  );
}

function MiniBarChart({ easy, medium, hard }) {
  const total = easy + medium + hard;
  const easyPct = total === 0 ? 0 : Math.round((easy / total) * 100);
  const medPct = total === 0 ? 0 : Math.round((medium / total) * 100);
  const hardPct = total === 0 ? 0 : Math.round((hard / total) * 100);

  return (
    <div className="flex flex-col justify-center h-full space-y-2.5">
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-slate-300 font-medium">Difficulty Split</span>
        <span className="text-slate-500">{total} solved</span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden bg-slate-800">
        <div style={{ width: `${easyPct}%` }} className="bg-emerald-500 transition-all duration-700" title={`Easy: ${easy}`} />
        <div style={{ width: `${medPct}%` }} className="bg-amber-500 transition-all duration-700" title={`Medium: ${medium}`} />
        <div style={{ width: `${hardPct}%` }} className="bg-red-500 transition-all duration-700" title={`Hard: ${hard}`} />
      </div>
      <div className="flex justify-between text-[10px] uppercase font-semibold tracking-wider text-slate-500">
        <span className="text-emerald-500">E: {easyPct}%</span>
        <span className="text-amber-500">M: {medPct}%</span>
        <span className="text-red-500">H: {hardPct}%</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════

export default function Dashboard() {
  const { user, loading, skills: allSkills, targets: allTargets, leetcodeProfile } = useGlobalContext();
  const dataLoaded = !loading;

  // States
  const [quizHistory, setQuizHistory] = useState([]);


  const leetcodeStats = useMemo(() => {
    let total = leetcodeProfile?.problems_solved || 0;
    return {
      total,
      easy: total > 0 ? Math.round(total * 0.5) : 0,
      medium: total > 0 ? Math.round(total * 0.35) : 0,
      hard: total > 0 ? Math.round(total * 0.15) : 0,
    };
  }, [leetcodeProfile]);

  useEffect(() => {
    if (user) {
      const historyKey = `${SCORE_HISTORY_KEY}_${user.id}`;
      let quizzes = [];
      try {
        const raw = localStorage.getItem(historyKey);
        quizzes = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(quizzes)) quizzes = [];
      } catch { }
      setQuizHistory(quizzes);
    }
  }, [user]);



  // ── CALCULATIONS ──

  const { streak, activityFeed, thisWeekSummary, upcomingDeadlines, targetMetrics } = useMemo(() => {
    if (!dataLoaded) return { streak: 0, activityFeed: [], thisWeekSummary: {}, upcomingDeadlines: [], targetMetrics: { completed: 0, total: 0 } };

    const todayStr = new Date().toISOString().slice(0, 10);
    const weekStart = currentWeekStart();

    // 1. Gather all activity dates & items
    let activities = [];

    allSkills.forEach(s => {
      activities.push({
        id: `s_${s.id}`,
        type: 'skill',
        title: `Added skill: ${s.title}`,
        dateStr: s.created_at,
        icon: '🧠',
        color: 'text-indigo-400 bg-indigo-500/10'
      });
    });

    allTargets.filter(t => t.is_completed).forEach(t => {
      activities.push({
        id: `t_${t.id}`,
        type: 'target',
        title: `Completed target: ${t.title}`,
        dateStr: t.created_at, // Ideally we'd use a completion timestamp, using created_at as fallback
        icon: '🎯',
        color: 'text-emerald-400 bg-emerald-500/10'
      });
    });

    quizHistory.forEach((q, idx) => {
      activities.push({
        id: `q_${idx}`,
        type: 'quiz',
        title: `Completed quiz: ${q.topic} (Score: ${q.score}/${q.total})`,
        dateStr: q.timestamp || new Date().toISOString(),
        icon: '📝',
        color: 'text-amber-400 bg-amber-500/10'
      });
    });

    // Sort all activities by date desc
    activities.sort((a, b) => new Date(b.dateStr) - new Date(a.dateStr));

    // 2. Calculate Streak
    const activeDates = new Set(activities.map(a => a.dateStr.slice(0, 10)));
    const sortedUniqueDates = Array.from(activeDates).sort((a, b) => b.localeCompare(a));
    
    let currentStreak = 0;
    let checkDate = new Date();
    
    // Check if there's activity today or yesterday to start the streak
    if (activeDates.has(todayStr) || activeDates.has(new Date(Date.now() - 86400000).toISOString().slice(0, 10))) {
      // Find consecutive days
      for (let i = 0; i < sortedUniqueDates.length; i++) {
        const d = new Date(sortedUniqueDates[i] + "T00:00:00");
        // If it's the first element, check if it's today or yesterday
        if (i === 0) {
          const diffDays = Math.floor(Math.abs(checkDate - d) / 86400000);
          if (diffDays <= 1) {
            currentStreak++;
            checkDate = d;
          } else {
            break;
          }
        } else {
          // Check if previous date is exactly 1 day before
          const diffDays = Math.round(Math.abs(checkDate - d) / 86400000);
          if (diffDays === 1) {
            currentStreak++;
            checkDate = d;
          } else {
            break;
          }
        }
      }
    }

    // 3. Weekly Summary
    const thisWeekSkills = allSkills.filter(s => s.created_at >= weekStart).length;
    const thisWeekTargetsAll = allTargets.filter(t => t.week_start === weekStart);
    const thisWeekTargetsDone = thisWeekTargetsAll.filter(t => t.is_completed).length;

    // 4. Upcoming Deadlines
    const now = new Date();
    now.setHours(0,0,0,0);
    const deadlines = allTargets
      .filter(t => !t.is_completed && t.deadline)
      .map(t => {
        const d = new Date(t.deadline + "T00:00:00");
        const diffDays = Math.ceil((d - now) / 86400000);
        return { ...t, diffDays };
      })
      .filter(t => t.diffDays >= 0 && t.diffDays <= 3)
      .sort((a, b) => a.diffDays - b.diffDays);

    return {
      streak: currentStreak,
      activityFeed: activities.slice(0, 5),
      thisWeekSummary: { skills: thisWeekSkills, targetsDone: thisWeekTargetsDone, targetsTotal: thisWeekTargetsAll.length },
      upcomingDeadlines: deadlines,
      targetMetrics: { completed: thisWeekTargetsDone, total: thisWeekTargetsAll.length }
    };
  }, [allSkills, allTargets, quizHistory, dataLoaded]);

  if (loading || !user) return null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ── TOP HEADER & QUICK ACTIONS ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1 text-white flex items-center gap-3">
              Welcome back 👋 
              {streak > 0 && (
                <span className="text-sm font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                  🔥 {streak} Day Streak
                </span>
              )}
            </h1>
            <p className="text-slate-400 text-sm">Here is your learning progress overview.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/skills" className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/30 px-4 py-2 rounded-lg text-sm font-semibold transition-all">
              + Add Skill
            </Link>
            <Link href="/targets" className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 px-4 py-2 rounded-lg text-sm font-semibold transition-all">
              + Add Target
            </Link>
            <Link href="/revision" className="bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white border border-amber-500/30 px-4 py-2 rounded-lg text-sm font-semibold transition-all">
              Take Quiz
            </Link>
          </div>
        </div>

        {/* ── MAIN STATS ROW ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-5 flex flex-col justify-center">
            <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">This Week Summary</h3>
            <div className="space-y-1.5 text-sm text-slate-300">
              <p className="flex justify-between"><span>Skills Learned:</span> <span className="font-bold text-white">{thisWeekSummary.skills}</span></p>
              <p className="flex justify-between"><span>Targets Hit:</span> <span className="font-bold text-white">{thisWeekSummary.targetsDone} / {thisWeekSummary.targetsTotal}</span></p>
            </div>
          </div>
          <StatCard label="Total Skills Added" value={allSkills.length} icon="🧠" color="text-indigo-400" />
          <StatCard label="LeetCode Solved" value={leetcodeStats.total} icon="💻" color="text-emerald-400" />
          <StatCard label="Weekly Targets" value={allTargets.length} icon="🎯" color="text-amber-400" />
        </div>

        {/* ── CHARTS ROW ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700 transition-colors">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Current Week Targets</h2>
            <DonutChart completed={targetMetrics.completed} total={targetMetrics.total} />
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700 transition-colors">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">LeetCode Distribution</h2>
            <MiniBarChart easy={leetcodeStats.easy} medium={leetcodeStats.medium} hard={leetcodeStats.hard} />
          </div>
        </div>

        {/* ── BOTTOM SECTIONS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Activity Feed */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Recent Activity</h2>
            </div>
            
            {activityFeed.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-700/50 rounded-xl">
                <p className="text-slate-500 text-sm">No recent activity found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activityFeed.map((activity, idx) => (
                  <div key={activity.id} className="flex gap-4 group">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${activity.color}`}>
                        {activity.icon}
                      </div>
                      {idx !== activityFeed.length - 1 && (
                        <div className="w-0.5 h-full bg-slate-800 mt-2 group-hover:bg-slate-700 transition-colors" />
                      )}
                    </div>
                    <div className="pt-2 pb-4">
                      <p className="text-sm font-medium text-slate-200">{activity.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{getTimeAgo(activity.dateStr)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Deadlines */}
          <div className="flex flex-col h-full">
            
            {/* Upcoming Deadlines */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex-1">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                ⏰ Upcoming Deadlines
              </h2>
              {upcomingDeadlines.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4 bg-slate-950/30 rounded-xl border border-slate-800/50">
                  No upcoming deadlines for the next 3 days.
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingDeadlines.map(t => (
                    <div key={t.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3.5 flex justify-between items-start gap-3">
                      <p className="text-sm text-slate-200 font-medium leading-snug">{t.title}</p>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md whitespace-nowrap ${
                        t.diffDays === 0 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {t.diffDays === 0 ? 'Due Today' : `In ${t.diffDays} day${t.diffDays > 1 ? 's' : ''}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="text-2xl">{icon}</div>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
      </div>
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</p>
    </div>
  );
}
