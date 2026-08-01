"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { useUser } from "../../lib/useUser";
import { supabase } from "../../lib/supabaseClient";
import { useGlobalContext } from "../../lib/GlobalContext";

const SCORE_HISTORY_KEY = "revision_test_scores_v1";

export default function Skills() {
  const { user, loading, skills, refreshData } = useGlobalContext();
  const [scoreHistory, setScoreHistory] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const [note, setNote] = useState("");
  const [noteType, setNoteType] = useState("success");


  useEffect(() => {
    if (!user) return;

    const historyKey = `${SCORE_HISTORY_KEY}_${user.id}`;
    try {
      const raw = localStorage.getItem(historyKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setScoreHistory(Array.isArray(parsed) ? parsed : []);
    } catch {
      setScoreHistory([]);
    }
  }, [user]);

  function normalizeText(value) {
    return (value || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getSkillStats(skillTitle) {
    const needle = normalizeText(skillTitle);
    if (!needle) {
      return { attempts: 0, avgPercent: 0, bestPercent: 0 };
    }

    const relatedAttempts = scoreHistory.filter((entry) => {
      const topic = normalizeText(entry?.topic);
      return topic.includes(needle) || needle.includes(topic);
    });

    if (!relatedAttempts.length) {
      return { attempts: 0, avgPercent: 0, bestPercent: 0 };
    }

    const percents = relatedAttempts.map((entry) => {
      const total = Number(entry?.total) || 0;
      const score = Number(entry?.score) || 0;
      if (!total) return 0;
      return Math.round((score / total) * 100);
    });

    const sum = percents.reduce((acc, value) => acc + value, 0);
    return {
      attempts: relatedAttempts.length,
      avgPercent: Math.round(sum / percents.length),
      bestPercent: Math.max(...percents),
    };
  }

  async function addSkill(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setNote("");

    const { error } = await supabase.from("skills").insert({
      user_id: user.id,
      title,
      description,
    });

    if (error) {
      setNote("Error: " + error.message);
      setNoteType("error");
      setSaving(false);
      return;
    }

    setNote("Skill added successfully ✅");
    setNoteType("success");
    setTitle("");
    setDescription("");
    setSaving(false);
    refreshData();
  }

  async function deleteSkill(id) {
    await supabase.from("skills").delete().eq("id", id);
    refreshData();
  }

  if (loading || !user) return null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-1 text-white">Skills</h1>
        <p className="text-slate-400 mb-8">
          Track everything you have learned. Check your resume's ATS score on the Resume page.
        </p>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Add New Skill</h2>
          <form onSubmit={addSkill} className="space-y-4">
            <input
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              placeholder="Skill or topic (e.g. React, DBMS Normalization, DSA - Trees)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <textarea
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none"
              placeholder="Describe what you learned in detail (optional)"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <button
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60 transition"
            >
              {saving ? "Saving..." : "Add Skill"}
            </button>
            {note && (
              <p className={`text-sm font-medium ${noteType === "error" ? "text-red-400" : "text-emerald-400"}`}>
                {note}
              </p>
            )}
          </form>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Your Skills ({skills.length})
          </h2>
          <div className="space-y-3">
            {skills.map((s) => {
              const stats = getSkillStats(s.title);
              return (
              <div key={s.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{s.title}</p>
                  {s.description && (
                    <p className="text-sm text-slate-400 mt-1 leading-relaxed">{s.description}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-2">
                    {stats.attempts > 0
                      ? `Attempts: ${stats.attempts} • Avg: ${stats.avgPercent}% • Best: ${stats.bestPercent}%`
                      : "No test attempts yet for this skill."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/revision?topic=${encodeURIComponent(s.title)}&difficulty=hard&auto=1`}
                    className="inline-flex items-center rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 transition"
                  >
                    Practice Now
                  </Link>
                  <button
                    onClick={() => deleteSkill(s.id)}
                    className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/30 transition-colors text-xl leading-none"
                    title="Delete skill"
                  >
                    ×
                  </button>
                </div>
              </div>
              );
            })}
            {skills.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-6">No skills added yet. Add your first skill above!</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
