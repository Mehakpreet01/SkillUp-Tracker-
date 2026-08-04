"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import { useUser } from "../../lib/useUser";
import { supabase } from "../../lib/supabaseClient";

const SCORE_HISTORY_KEY = "revision_test_scores_v1";
const MAX_SCORE_HISTORY = 20;
const DIFFICULTY_LEVELS = ["easy", "medium", "hard"];

export default function Revision() {
  const { user, loading } = useUser();

  if (loading) return null;

  return (
    <Suspense fallback={null}>
      <RevisionContent user={user} />
    </Suspense>
  );
}

function RevisionContent({ user }) {
  const searchParams = useSearchParams();
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("hard");
  const [quizTopic, setQuizTopic] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [scoreHistory, setScoreHistory] = useState([]);
  const autoStarted = useRef(false);

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

  function saveScoreHistory(nextHistory) {
    if (!user) return;
    const historyKey = `${SCORE_HISTORY_KEY}_${user.id}`;
    setScoreHistory(nextHistory);
    localStorage.setItem(historyKey, JSON.stringify(nextHistory));
  }

  async function generateQuiz(overrides = {}) {
    try {
      setGenerating(true);
      setSubmitted(false);
      setAnswers({});
      setQuizTopic("");

      const difficultyToUse = DIFFICULTY_LEVELS.includes(overrides.difficulty)
        ? overrides.difficulty
        : difficulty;

      const { data: skills, error } = await supabase
        .from("skills")
        .select("title")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(15);

      if (error) {
        throw error;
      }

      const topicOverride = typeof overrides.topic === "string" ? overrides.topic.trim() : "";
      const topicToUse = topicOverride || topic.trim() || skills?.[0]?.title?.trim() || "your selected skills";
      const res = await fetch("/api/ai/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicToUse, skills: skills || [], difficulty: difficultyToUse }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Quiz generation failed");
      }

      setQuestions(data.questions || []);
      setQuizTopic(data.topic || topicToUse);
      if (topicOverride) {
        setTopic(topicToUse);
      }
      if (difficultyToUse !== difficulty) {
        setDifficulty(difficultyToUse);
      }
    } catch (error) {
      console.error("Quiz generation error:", error);
      setQuestions([]);
      alert(error.message || "Unable to generate a quiz right now.");
    } finally {
      setGenerating(false);
    }
  }

  function selectAnswer(qIndex, optIndex) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  }

  const score = questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0),
    0
  );

  function submitTest() {
    if (submitted || !questions.length) return;

    const selectedTopic = (quizTopic || topic || "Mixed Skills").trim();
    const historyEntry = {
      topic: selectedTopic,
      difficulty,
      score,
      total: questions.length,
      answered: Object.keys(answers).length,
      createdAt: new Date().toISOString(),
    };

    const nextHistory = [historyEntry, ...scoreHistory].slice(0, MAX_SCORE_HISTORY);
    saveScoreHistory(nextHistory);
    setSubmitted(true);
  }

  function clearHistory() {
    saveScoreHistory([]);
  }

  useEffect(() => {
    const paramTopic = searchParams.get("topic")?.trim() || "";
    const paramDifficulty = searchParams.get("difficulty")?.toLowerCase() || "";
    const shouldAutoStart = searchParams.get("auto") === "1";

    if (paramTopic) {
      setTopic(paramTopic);
    }

    if (DIFFICULTY_LEVELS.includes(paramDifficulty)) {
      setDifficulty(paramDifficulty);
    }

    if (!user || !shouldAutoStart || autoStarted.current || !paramTopic) {
      return;
    }

    autoStarted.current = true;
    generateQuiz({
      topic: paramTopic,
      difficulty: DIFFICULTY_LEVELS.includes(paramDifficulty) ? paramDifficulty : difficulty,
    });
  }, [searchParams, user]);

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-1 text-white">Revision / Quick Test</h1>
        <p className="text-slate-400 mb-8">
          Generate placement-focused quizzes (placement style) and test yourself.
        </p>

        <div className="flex flex-col gap-3 md:flex-row mb-8">
          <input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="Enter a topic like React, JavaScript, SQL"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
          />
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
          >
            {DIFFICULTY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </option>
            ))}
          </select>
          <button
            onClick={generateQuiz}
            disabled={generating}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60 transition"
          >
            {generating ? "Generating Quiz..." : "Generate New Quiz"}
          </button>
        </div>

        {questions.length > 0 && (
          <div className="space-y-4">
            {questions.map((q, qi) => (
              <div key={qi} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                {(q.company || q.domain) && (
                  <p className="text-xs text-slate-400 mb-2">
                    {q.company ? `${q.company}` : "Placement"}
                    {q.domain ? ` • ${q.domain}` : ""}
                  </p>
                )}
                <p className="font-semibold text-white mb-4">
                  {qi + 1}. {q.question}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    const isSelected = answers[qi] === oi;
                    const isCorrect = submitted && oi === q.correctIndex;
                    const isWrongSelected = submitted && isSelected && oi !== q.correctIndex;
                    return (
                      <button
                        key={oi}
                        onClick={() => selectAnswer(qi, oi)}
                        className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                          isCorrect
                            ? "border-emerald-500 bg-emerald-900/40 text-emerald-300"
                            : isWrongSelected
                            ? "border-red-500 bg-red-900/40 text-red-300"
                            : isSelected
                            ? "border-indigo-500 bg-indigo-900/40 text-indigo-200"
                            : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {submitted && q.explanation && (
                  <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                    💡 {q.explanation}
                  </p>
                )}
              </div>
            ))}

            {!submitted ? (
              <button
                onClick={submitTest}
                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition"
              >
                Submit Test
              </button>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
                <p className="text-4xl font-bold text-indigo-400">{score} / {questions.length}</p>
                <p className="text-slate-400 mt-2 text-sm">
                  {score === questions.length
                    ? "Perfect score! 🎉"
                    : score >= questions.length / 2
                    ? "Good job! Keep practicing. 👍"
                    : "Keep going, you'll get there! 💪"}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-10 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold text-white">Test Score History</h2>
            {scoreHistory.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-xs text-slate-400 hover:text-red-300 transition"
              >
                Clear History
              </button>
            )}
          </div>

          {scoreHistory.length === 0 ? (
            <p className="text-sm text-slate-400">No tests submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {scoreHistory.map((entry, index) => (
                <div
                  key={`${entry.createdAt}-${index}`}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3"
                >
                  <div>
                    <p className="text-sm text-white font-medium">{entry.topic}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(entry.createdAt).toLocaleString()} • {entry.difficulty ? entry.difficulty.toUpperCase() : "MEDIUM"} • Attempted {entry.answered}/{entry.total}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-indigo-300">
                    Score: {entry.score}/{entry.total}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
