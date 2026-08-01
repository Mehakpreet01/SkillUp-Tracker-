"use client";

import { useState } from "react";
import Navbar from "../../components/Navbar";
import { useUser } from "../../lib/useUser";

export default function TestPage() {
  const { user, loading } = useUser();
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  async function handleGenerate(event) {
    event.preventDefault();

    if (!topic.trim()) {
      alert("Please enter a topic first!");
      return;
    }

    setLoadingQuiz(true);
    setSubmitted(false);
    setAnswers({});

    try {
      const res = await fetch("/api/ai/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Something went wrong!");
      }

      setQuestions(data.questions || []);
    } catch (error) {
      console.error("Fetch Error:", error);
      alert(error.message || "Network Error!");
    } finally {
      setLoadingQuiz(false);
    }
  }

  function selectAnswer(questionIndex, optionIndex) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  }

  const score = questions.reduce(
    (acc, question, index) => acc + (answers[index] === question.correctIndex ? 1 : 0),
    0
  );

  if (loading || !user) return null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2 text-white">Practice Quiz</h1>
        <p className="text-slate-400 mb-6">Enter a topic and generate a fresh AI-made quiz.</p>

        <form onSubmit={handleGenerate} className="flex flex-col gap-3 md:flex-row mb-8">
          <input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="Enter a topic like React, JavaScript, SQL"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={loadingQuiz}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg text-sm font-semibold disabled:opacity-60"
          >
            {loadingQuiz ? "Generating..." : "Generate New Quiz"}
          </button>
        </form>

        {questions.length > 0 && (
          <div className="space-y-4">
            {questions.map((question, questionIndex) => (
              <div key={questionIndex} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <p className="font-semibold text-white mb-4">
                  {questionIndex + 1}. {question.question}
                </p>
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => {
                    const isSelected = answers[questionIndex] === optionIndex;
                    const isCorrect = submitted && optionIndex === question.correctIndex;
                    const isWrongSelected = submitted && isSelected && optionIndex !== question.correctIndex;

                    return (
                      <button
                        key={optionIndex}
                        type="button"
                        onClick={() => selectAnswer(questionIndex, optionIndex)}
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
                        {option}
                      </button>
                    );
                  })}
                </div>
                {submitted && question.explanation && (
                  <p className="text-xs text-slate-500 mt-3 leading-relaxed">💡 {question.explanation}</p>
                )}
              </div>
            ))}

            {!submitted ? (
              <button
                type="button"
                onClick={() => setSubmitted(true)}
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
      </div>
    </main>
  );
}