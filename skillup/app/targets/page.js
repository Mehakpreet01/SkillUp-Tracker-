"use client";
import { useEffect, useState, useMemo } from "react";
import Navbar from "../../components/Navbar";
import { useUser } from "../../lib/useUser";
import { supabase } from "../../lib/supabaseClient";
import { useGlobalContext } from "../../lib/GlobalContext";

function currentWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

function currentWeekEnd() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 0 : 7);
  const sunday = new Date(d.setDate(diff));
  return sunday.toISOString().slice(0, 10);
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function isOverdue(deadline, isCompleted) {
  if (!deadline || isCompleted) return false;
  return new Date(deadline + "T00:00:00") < new Date(new Date().toDateString());
}

// Mini SVG bar chart
function BarChart({ completed, pending, overdue }) {
  const total = completed + pending;
  const completedPct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const pendingPct = total === 0 ? 0 : Math.round((pending / total) * 100);
  const overduePct = total === 0 ? 0 : Math.round((overdue / total) * 100);

  return (
    <div className="space-y-3">
      <BarRow label="Completed" value={completed} pct={completedPct} color="bg-emerald-500" />
      <BarRow label="Pending" value={pending} pct={pendingPct} color="bg-amber-500" />
      <BarRow label="Overdue" value={overdue} pct={overduePct} color="bg-red-500" />
    </div>
  );
}

function BarRow({ label, value, pct, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span>
        <span>{value} task{value !== 1 ? "s" : ""} ({pct}%)</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2.5">
        <div
          className={`${color} h-2.5 rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// Donut chart using SVG
function DonutChart({ completed, total }) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#1e293b" strokeWidth="12" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke="#4f46e5" strokeWidth="12"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dasharray 0.7s ease" }}
        />
        <text x="50" y="53" textAnchor="middle" fill="#f1f5f9" fontSize="18" fontWeight="bold">
          {pct}%
        </text>
      </svg>
      <p className="text-xs text-slate-400 mt-1">{completed} of {total} done</p>
    </div>
  );
}

export default function Targets() {
  const { user, loading, targets: globalTargets, refreshData } = useGlobalContext();
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [adding, setAdding] = useState(false);

  const targets = useMemo(() => {
    return globalTargets.filter(t => t.week_start === currentWeekStart());
  }, [globalTargets]);

  async function addTarget(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    await supabase.from("weekly_targets").insert({
      user_id: user.id,
      title,
      target_count: 1,
      done_count: 0,
      week_start: currentWeekStart(),
      deadline: deadline || null,
      is_completed: false,
    });
    setTitle("");
    setDeadline("");
    setAdding(false);
    refreshData();
  }

  async function toggleComplete(t) {
    const newVal = !t.is_completed;
    await supabase
      .from("weekly_targets")
      .update({ is_completed: newVal, done_count: newVal ? 1 : 0 })
      .eq("id", t.id);
    refreshData();
  }

  async function removeTarget(id) {
    await supabase.from("weekly_targets").delete().eq("id", id);
    refreshData();
  }

  const stats = useMemo(() => {
    const completed = targets.filter((t) => t.is_completed).length;
    const overdue = targets.filter((t) => isOverdue(t.deadline, t.is_completed)).length;
    const pending = targets.length - completed;
    return { completed, pending, overdue, total: targets.length };
  }, [targets]);

  const weekLabel = `Week of ${formatDate(currentWeekStart())} – ${formatDate(currentWeekEnd())}`;

  if (loading || !user) return null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Weekly Targets</h1>
          <p className="text-slate-400 mt-1">{weekLabel}</p>
        </div>

        {/* TOP GRID: Add form + Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* Add Task Form */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Add New Target
            </h2>
            <form onSubmit={addTarget} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Task Description</label>
                <input
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  placeholder="e.g. Solve 15 LeetCode problems"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Deadline (optional)</label>
                <input
                  type="date"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  value={deadline}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={adding || !title.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition text-sm"
              >
                {adding ? "Adding..." : "Add Target"}
              </button>
            </form>
          </div>

          {/* Donut Progress */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Weekly Progress
            </h2>
            <DonutChart completed={stats.completed} total={stats.total} />
          </div>
        </div>

        {/* WEEKLY REPORT */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">
            Weekly Report
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard label="Completed" value={stats.completed} color="text-emerald-400" icon="✅" />
            <StatCard label="Pending" value={stats.pending} color="text-amber-400" icon="⏳" />
            <StatCard label="Overdue" value={stats.overdue} color="text-red-400" icon="🚨" />
          </div>
          <BarChart
            completed={stats.completed}
            pending={stats.pending}
            overdue={stats.overdue}
          />
        </div>

        {/* TASK LIST */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">
            This Week's Tasks
          </h2>

          {targets.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-500 text-sm">No targets set for this week yet.</p>
              <p className="text-slate-600 text-xs mt-1">Add your first target above to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {targets.map((t) => {
                const overdue = isOverdue(t.deadline, t.is_completed);
                return (
                  <div
                    key={t.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      t.is_completed
                        ? "bg-emerald-950/30 border-emerald-900/50 opacity-75"
                        : overdue
                        ? "bg-red-950/30 border-red-900/50"
                        : "bg-slate-800 border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleComplete(t)}
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        t.is_completed
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-slate-500 hover:border-indigo-400"
                      }`}
                    >
                      {t.is_completed && (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${t.is_completed ? "line-through text-slate-500" : "text-slate-100"}`}>
                        {t.title}
                      </p>
                      {t.deadline && (
                        <p className={`text-xs mt-0.5 ${
                          t.is_completed
                            ? "text-slate-600"
                            : overdue
                            ? "text-red-400 font-semibold"
                            : "text-slate-500"
                        }`}>
                          {overdue ? "⚠ Overdue · " : "📅 Due: "}
                          {formatDate(t.deadline)}
                        </p>
                      )}
                    </div>

                    {/* Status Badge */}
                    {t.is_completed && (
                      <span className="text-xs bg-emerald-900/50 text-emerald-400 px-2.5 py-1 rounded-full font-medium">
                        Done
                      </span>
                    )}
                    {!t.is_completed && overdue && (
                      <span className="text-xs bg-red-900/50 text-red-400 px-2.5 py-1 rounded-full font-medium">
                        Overdue
                      </span>
                    )}
                    {!t.is_completed && !overdue && (
                      <span className="text-xs bg-slate-700 text-slate-400 px-2.5 py-1 rounded-full font-medium">
                        Pending
                      </span>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => removeTarget(t.id)}
                      className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/30 transition-colors text-lg leading-none"
                      title="Delete task"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
      <div className="text-2xl mb-1">{icon}</div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}
