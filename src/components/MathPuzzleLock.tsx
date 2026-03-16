import React, { useState, useEffect, useCallback, useRef } from "react";
import { easyQuestions, mediumQuestions, hardQuestions, type MathQuestion } from "@/data/mathQuestions";

type Level = "easy" | "medium" | "hard";
type Screen = "level" | "question" | "granted";

const STORAGE_KEYS = {
  unlocked: "math_lock_unlocked",
  usedPrefix: "math_lock_used_",
  cooldownUntil: "math_lock_cooldown_until",
  level: "math_lock_level",
};

const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 60;
const HINT_AFTER = 2;

function getQuestionBank(level: Level): MathQuestion[] {
  switch (level) {
    case "easy": return easyQuestions;
    case "medium": return mediumQuestions;
    case "hard": return hardQuestions;
  }
}

function getUsedIndexes(level: Level): number[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.usedPrefix + level);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n: unknown) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

function setUsedIndexes(level: Level, indexes: number[]) {
  sessionStorage.setItem(STORAGE_KEYS.usedPrefix + level, JSON.stringify(indexes));
}

function pickNextIndex(level: Level): { index: number; questionNumber: number } {
  const bank = getQuestionBank(level);
  let used = getUsedIndexes(level);

  if (used.length >= bank.length) {
    used = [];
    setUsedIndexes(level, []);
  }

  const available = Array.from({ length: bank.length }, (_, i) => i).filter((i) => !used.includes(i));
  const randomIdx = available[Math.floor(Math.random() * available.length)];
  return { index: randomIdx, questionNumber: used.length + 1 };
}

function generateHint(answer: number): string {
  if (Number.isInteger(answer)) {
    if (answer < 10) return `It's a single digit number`;
    if (answer < 100) return `It's between ${Math.floor(answer / 10) * 10} and ${Math.floor(answer / 10) * 10 + 9}`;
    return `It starts with ${String(answer)[0]}`;
  }
  return `The answer is a decimal number around ${Math.round(answer)}`;
}

interface MathPuzzleLockProps {
  children: React.ReactNode;
}

export function MathPuzzleLock({ children }: MathPuzzleLockProps) {
  const [unlocked, setUnlocked] = useState(() => {
    return sessionStorage.getItem(STORAGE_KEYS.unlocked) === "true";
  });

  if (unlocked) return <>{children}</>;

  return (
    <>
      {children}
      <LockOverlay onUnlock={() => {
        sessionStorage.setItem(STORAGE_KEYS.unlocked, "true");
        setUnlocked(true);
      }} />
    </>
  );
}

function LockOverlay({ onUnlock }: { onUnlock: () => void }) {
  const [screen, setScreen] = useState<Screen>("level");
  const [level, setLevel] = useState<Level | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [shake, setShake] = useState(false);
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(() => {
    const stored = sessionStorage.getItem(STORAGE_KEYS.cooldownUntil);
    if (stored) {
      const ts = parseInt(stored);
      if (ts > Date.now()) return ts;
    }
    return null;
  });
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cooldown timer
  useEffect(() => {
    if (!cooldownEnd) {
      setCooldownRemaining(0);
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((cooldownEnd - Date.now()) / 1000));
      setCooldownRemaining(remaining);
      if (remaining <= 0) {
        setCooldownEnd(null);
        sessionStorage.removeItem(STORAGE_KEYS.cooldownUntil);
        setAttempts(0);
        setShowHint(false);
        // Load next question
        if (level) {
          const { index, questionNumber: qn } = pickNextIndex(level);
          setQuestionIndex(index);
          setQuestionNumber(qn);
          setAnswer("");
        }
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [cooldownEnd, level]);

  const selectLevel = (l: Level) => {
    setLevel(l);
    sessionStorage.setItem(STORAGE_KEYS.level, l);
    const { index, questionNumber: qn } = pickNextIndex(l);
    setQuestionIndex(index);
    setQuestionNumber(qn);
    setAttempts(0);
    setAnswer("");
    setShowHint(false);
    setScreen("question");
  };

  const currentQuestion = level ? getQuestionBank(level)[questionIndex] : null;

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion || !level || cooldownEnd) return;

    const trimmed = answer.trim();
    if (!trimmed || isNaN(Number(trimmed))) return;

    const userAnswer = parseFloat(trimmed);

    if (Math.abs(userAnswer - currentQuestion.a) < 0.01) {
      // Correct!
      const used = getUsedIndexes(level);
      used.push(questionIndex);
      setUsedIndexes(level, used);
      setScreen("granted");
      setTimeout(onUnlock, 1500);
    } else {
      // Wrong
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setAnswer("");

      if (newAttempts >= HINT_AFTER) {
        setShowHint(true);
      }

      if (newAttempts >= MAX_ATTEMPTS) {
        const until = Date.now() + COOLDOWN_SECONDS * 1000;
        setCooldownEnd(until);
        sessionStorage.setItem(STORAGE_KEYS.cooldownUntil, String(until));
      }
    }
  }, [answer, currentQuestion, level, questionIndex, attempts, cooldownEnd, onUnlock]);

  const goBackToLevels = () => {
    setScreen("level");
    setLevel(null);
    setAttempts(0);
    setShowHint(false);
    setAnswer("");
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      style={{ fontFamily: "var(--font-body)" }}>
      {screen === "level" && <LevelSelection onSelect={selectLevel} />}
      {screen === "question" && currentQuestion && level && (
        <QuestionScreen
          level={level}
          question={currentQuestion}
          questionNumber={questionNumber}
          totalQuestions={100}
          answer={answer}
          setAnswer={setAnswer}
          onSubmit={handleSubmit}
          attempts={attempts}
          maxAttempts={MAX_ATTEMPTS}
          shake={shake}
          showHint={showHint}
          cooldownRemaining={cooldownRemaining}
          onBack={goBackToLevels}
          inputRef={inputRef}
        />
      )}
      {screen === "granted" && <AccessGranted />}
    </div>
  );
}

function LevelSelection({ onSelect }: { onSelect: (l: Level) => void }) {
  const levels: { level: Level; label: string; stars: string; emoji: string; color: string; borderColor: string; hoverBg: string }[] = [
    { level: "easy", label: "EASY", stars: "⭐", emoji: "😊", color: "text-emerald-400", borderColor: "border-emerald-500/50", hoverBg: "hover:bg-emerald-500/10" },
    { level: "medium", label: "MEDIUM", stars: "⭐⭐", emoji: "🤔", color: "text-orange-400", borderColor: "border-orange-500/50", hoverBg: "hover:bg-orange-500/10" },
    { level: "hard", label: "HARD", stars: "⭐⭐⭐", emoji: "🧠", color: "text-red-400", borderColor: "border-red-500/50", hoverBg: "hover:bg-red-500/10" },
  ];

  return (
    <div className="w-full max-w-lg animate-bounce-in">
      <h1 className="text-2xl sm:text-3xl font-bold text-center text-white mb-8" style={{ fontFamily: "var(--font-display)" }}>
        🔐 Select Your Challenge Level
      </h1>
      <div className="flex flex-col gap-4">
        {levels.map(({ level, label, stars, emoji, color, borderColor, hoverBg }) => (
          <button
            key={level}
            onClick={() => onSelect(level)}
            className={`w-full p-5 rounded-xl border-2 ${borderColor} bg-white/5 ${hoverBg} transition-all duration-200 cursor-pointer group`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{emoji}</span>
                <div className="text-left">
                  <div className={`font-bold text-lg ${color}`} style={{ fontFamily: "var(--font-display)" }}>
                    {stars} {label}
                  </div>
                  <div className="text-sm text-white/50">100 Unique Questions</div>
                </div>
              </div>
              <span className="text-white/30 group-hover:text-white/60 transition-colors text-xl">→</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

interface QuestionScreenProps {
  level: Level;
  question: MathQuestion;
  questionNumber: number;
  totalQuestions: number;
  answer: string;
  setAnswer: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  attempts: number;
  maxAttempts: number;
  shake: boolean;
  showHint: boolean;
  cooldownRemaining: number;
  onBack: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

function QuestionScreen({
  level, question, questionNumber, totalQuestions,
  answer, setAnswer, onSubmit, attempts, maxAttempts,
  shake, showHint, cooldownRemaining, onBack, inputRef,
}: QuestionScreenProps) {
  const isCoolingDown = cooldownRemaining > 0;
  const levelColors: Record<Level, string> = {
    easy: "text-emerald-400",
    medium: "text-orange-400",
    hard: "text-red-400",
  };

  useEffect(() => {
    if (!isCoolingDown) inputRef.current?.focus();
  }, [isCoolingDown, inputRef]);

  return (
    <div className={`w-full max-w-md ${shake ? "animate-wiggle" : "animate-bounce-in"}`}>
      <button
        onClick={onBack}
        className="text-white/50 hover:text-white/80 transition-colors text-sm mb-4 flex items-center gap-1"
      >
        ← Change Level
      </button>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <span className={`text-sm font-semibold uppercase ${levelColors[level]}`}>
            {level}
          </span>
          <span className="text-xs text-white/40">
            Question {questionNumber} of {totalQuestions}
          </span>
        </div>

        {/* Question */}
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-6" style={{ fontFamily: "var(--font-display)" }}>
          {question.q}
        </h2>

        {/* Hint */}
        {showHint && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm">
            💡 Hint: {generateHint(question.a)}
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit}>
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            inputMode="decimal"
            value={answer}
            onChange={(e) => {
              const val = e.target.value;
              if (/^-?\d*\.?\d*$/.test(val) || val === "") {
                setAnswer(val);
              }
            }}
            placeholder="Your answer..."
            disabled={isCoolingDown}
            className={`w-full px-4 py-3 rounded-xl bg-white/10 border text-white placeholder:text-white/30 text-lg focus:outline-none focus:ring-2 transition-all ${
              attempts > 0 && !isCoolingDown
                ? "border-red-500/50 focus:ring-red-500/50"
                : "border-white/20 focus:ring-white/30"
            } disabled:opacity-50`}
            autoComplete="off"
          />

          {/* Cooldown */}
          {isCoolingDown && (
            <div className="mt-3 text-center text-red-400 text-sm font-medium">
              ⏳ Try again in: {cooldownRemaining}s
            </div>
          )}

          {/* Attempt counter */}
          {attempts > 0 && !isCoolingDown && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-red-400 text-sm">❌ Wrong answer</span>
              <span className="text-white/40 text-xs">Attempts: {attempts}/{maxAttempts}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isCoolingDown || !answer.trim()}
            className="w-full mt-4 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Submit Answer
          </button>
        </form>
      </div>
    </div>
  );
}

function AccessGranted() {
  return (
    <div className="text-center animate-pop-in">
      <div className="text-7xl mb-4">✅</div>
      <h2 className="text-3xl font-bold text-emerald-400 mb-2" style={{ fontFamily: "var(--font-display)" }}>
        🎉 Access Granted!
      </h2>
      <p className="text-white/50">Unlocking website...</p>
    </div>
  );
}
