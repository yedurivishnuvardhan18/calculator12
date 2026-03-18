import React, { useState, useEffect, useCallback, useRef } from "react";
import { easyQuestions, mediumQuestions, hardQuestions, type MathQuestion } from "@/data/mathQuestions";
import { memes } from "@/data/mathlock-memes";
import {
  getXP, addXP, getRank, getStreak, updateStreak,
  getBestTime, setBestTime, getLives, loseLife, refillLives,
  recordSolve, getStats, getAutoLevel, checkAdaptive, getNextMemeIndex,
} from "@/lib/mathlock-gamification";
import {
  playCorrectSound, playWrongSound, playUnlockFanfare,
  playTickSound, playStreakSound, playRecordSound,
  playOutOfLivesSound,
  isMuted, toggleMute,
} from "@/lib/mathlock-sounds";
import { launchConfetti } from "@/lib/mathlock-confetti";
import { toast } from "sonner";

type Level = "easy" | "medium" | "hard";
type Screen = "level" | "question" | "granted";

const STORAGE_KEYS = {
  unlocked: "math_lock_unlocked",
  usedPrefix: "math_lock_used_",
  cooldownUntil: "math_lock_cooldown_until",
  level: "math_lock_level",
};

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
  } catch { return []; }
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

interface MathPuzzleLockProps { children: React.ReactNode; }

export function MathPuzzleLock({ children }: MathPuzzleLockProps) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(STORAGE_KEYS.unlocked) === "true");
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

// ═══════════════ MEME POPUP ═══════════════
function MemePopup({ memeIndex, onDismiss }: { memeIndex: number; onDismiss: () => void }) {
  const meme = memes[memeIndex];
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setExiting(true), 3500);
    const t2 = setTimeout(onDismiss, 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDismiss]);

  const handleShare = () => {
    navigator.clipboard.writeText(`${meme.caption}\n${meme.roast}`).then(() => {
      toast.success("Roast copied to clipboard! 😂");
    }).catch(() => {});
  };

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className={`max-w-md w-full bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-white/20 rounded-2xl p-8 text-center shadow-2xl ${exiting ? "animate-slide-out-down" : "animate-bounce-in"}`}>
        <div className="text-6xl mb-4">{meme.emoji}</div>
        <div className="text-[10px] text-white/30 mb-3 uppercase tracking-[0.2em] font-medium">{meme.keyword}</div>
        <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-3 leading-tight">{meme.caption}</h3>
        <div className="w-12 h-0.5 bg-white/20 mx-auto mb-3" />
        <p className="text-base italic text-white/70 mb-5 leading-relaxed">{meme.roast}</p>
        <div className="flex justify-center gap-4 text-3xl mb-5">
          <span className="hover:scale-125 transition-transform cursor-default">🤣</span>
          <span className="hover:scale-125 transition-transform cursor-default">💀</span>
          <span className="hover:scale-125 transition-transform cursor-default">😤</span>
          <span className="hover:scale-125 transition-transform cursor-default">🔥</span>
        </div>
        <button onClick={handleShare} className="text-sm text-white/50 hover:text-white/90 transition-colors bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg">
          Share this roast 😂
        </button>
      </div>
    </div>
  );
}

// ═══════════════ STATS PANEL ═══════════════
function StatsPanel({ level }: { level?: Level }) {
  const [open, setOpen] = useState(false);
  const stats = getStats();
  const streak = getStreak();
  const rank = getRank(getXP());

  return (
    <div className="w-full mt-4">
      <button onClick={() => setOpen(!open)} className="w-full text-xs text-white/40 hover:text-white/60 transition-colors flex items-center justify-center gap-1">
        📊 {open ? "Hide" : "Show"} Stats
      </button>
      {open && (
        <div className="mt-2 p-3 rounded-xl bg-white/5 border border-white/10 grid grid-cols-2 gap-2 text-xs text-white/60 animate-fade-in">
          <div>⚡ Avg Time: {stats.avgTime}s</div>
          <div>✅ Accuracy: {stats.accuracy}%</div>
          <div>🎯 Auto Level: {stats.autoLevel || "—"}</div>
          <div>🔥 Streak: {streak.count} days</div>
          <div>📊 Total Solved: {stats.totalSolved}</div>
          <div>👑 {rank.emoji} {rank.name} ({getXP()} XP)</div>
          {level && <div className="col-span-2">🏆 Best: {getBestTime(level) ? `${getBestTime(level)}s` : "—"}</div>}
          <div className="col-span-2 text-center text-white/30 mt-1">🧠 Adaptive Mode: ON</div>
        </div>
      )}
    </div>
  );
}

// ═══════════════ LOCK OVERLAY ═══════════════
function LockOverlay({ onUnlock }: { onUnlock: () => void }) {
  const [screen, setScreen] = useState<Screen>("level");
  const [level, setLevel] = useState<Level | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [shake, setShake] = useState(false);
  const [muted, setMuted] = useState(isMuted);
  const [showMeme, setShowMeme] = useState(false);
  const [currentMemeIdx, setCurrentMemeIdx] = useState(0);
  const [xpFloat, setXpFloat] = useState<{ amount: number; show: boolean }>({ amount: 0, show: false });
  const [rankUpMsg, setRankUpMsg] = useState<string | null>(null);
  const [newRecord, setNewRecord] = useState(false);
  const [lives, setLivesState] = useState(() => getLives().lives);
  const [heartLost, setHeartLost] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const solveStartRef = useRef(Date.now());
  const confettiRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [cooldownEnd, setCooldownEnd] = useState<number | null>(() => {
    const stored = sessionStorage.getItem(STORAGE_KEYS.cooldownUntil);
    if (stored) { const ts = parseInt(stored); if (ts > Date.now()) return ts; }
    return null;
  });
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Refresh lives periodically
  useEffect(() => {
    const id = setInterval(() => {
      const { lives: l } = getLives();
      setLivesState(l);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (!cooldownEnd) { setCooldownRemaining(0); return; }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((cooldownEnd - Date.now()) / 1000));
      setCooldownRemaining(remaining);
      if (remaining > 0 && !muted) playTickSound();
      if (remaining <= 0) {
        setCooldownEnd(null);
        sessionStorage.removeItem(STORAGE_KEYS.cooldownUntil);
        setAttempts(0);
        setShowHint(false);
        refillLives();
        setLivesState(3);
        if (level) {
          const { index, questionNumber: qn } = pickNextIndex(level);
          setQuestionIndex(index);
          setQuestionNumber(qn);
          setAnswer("");
          solveStartRef.current = Date.now();
        }
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [cooldownEnd, level, muted]);

  // Show adaptive suggestion on level select screen
  useEffect(() => {
    if (screen === "level") {
      const autoLvl = getAutoLevel();
      if (autoLvl) {
        toast.info(`🧠 Suggested level: ${autoLvl.charAt(0).toUpperCase() + autoLvl.slice(1)}`, { duration: 3000 });
      }
    }
  }, [screen]);

  const selectLevel = (l: Level) => {
    setLevel(l);
    sessionStorage.setItem(STORAGE_KEYS.level, l);
    const { index, questionNumber: qn } = pickNextIndex(l);
    setQuestionIndex(index);
    setQuestionNumber(qn);
    setAttempts(0);
    setAnswer("");
    setShowHint(false);
    solveStartRef.current = Date.now();
    setScreen("question");
  };

  const currentQuestion = level ? getQuestionBank(level)[questionIndex] : null;

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion || !level || cooldownEnd || showMeme) return;

    const trimmed = answer.trim();
    if (!trimmed || isNaN(Number(trimmed))) return;

    const userAnswer = parseFloat(trimmed);
    const solveTimeMs = Date.now() - solveStartRef.current;
    const solveTimeSec = solveTimeMs / 1000;

    if (Math.abs(userAnswer - currentQuestion.a) < 0.01) {
      // ═══ CORRECT ═══
      playCorrectSound();

      // Mark used
      const used = getUsedIndexes(level);
      used.push(questionIndex);
      setUsedIndexes(level, used);

      // XP
      const xpResult = addXP(level);
      setXpFloat({ amount: xpResult.earned, show: true });
      setTimeout(() => setXpFloat(p => ({ ...p, show: false })), 1500);

      // Rank up
      if (xpResult.rankUp) {
        const newRankInfo = getRank(xpResult.newXP);
        setRankUpMsg(`🎉 RANK UP! You are now ${newRankInfo.emoji} ${newRankInfo.name}!`);
        setTimeout(() => setRankUpMsg(null), 3000);
      }

      // Best time
      const isRecord = setBestTime(level, solveTimeSec);
      if (isRecord) {
        setNewRecord(true);
        playRecordSound();
        setTimeout(() => setNewRecord(false), 3000);
      }

      // Streak
      const streakResult = updateStreak();
      if (streakResult.milestone) {
        playStreakSound();
        toast.success(`🔥 ${streakResult.milestone} Day Streak! You're on fire!`, { duration: 3000 });
      }

      // Performance + adaptive
      recordSolve(level, solveTimeMs, true);
      const adaptive = checkAdaptive(level);
      if (adaptive.message) {
        setTimeout(() => toast.info(adaptive.message!, { duration: 4000 }), 1500);
      }

      // Confetti + unlock
      setScreen("granted");
      playUnlockFanfare();
      if (confettiRef.current) launchConfetti(confettiRef.current);
      setTimeout(onUnlock, 2500);
    } else {
      // ═══ WRONG ═══
      playWrongSound();
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setAnswer("");

      if (newAttempts >= HINT_AFTER) setShowHint(true);

      // Lose life
      const lifeResult = loseLife();
      setLivesState(lifeResult.lives);
      setHeartLost(true);
      setTimeout(() => setHeartLost(false), 500);

      // Record performance
      recordSolve(level, solveTimeMs, false);

      // Show meme
      const memeIdx = getNextMemeIndex(newAttempts);
      setCurrentMemeIdx(memeIdx);
      setShowMeme(true);

      if (lifeResult.triggerCooldown) {
        playOutOfLivesSound();
        const until = Date.now() + COOLDOWN_SECONDS * 1000;
        setCooldownEnd(until);
        sessionStorage.setItem(STORAGE_KEYS.cooldownUntil, String(until));
      }
    }
  }, [answer, currentQuestion, level, questionIndex, attempts, cooldownEnd, onUnlock, showMeme]);

  const goBackToLevels = () => {
    setScreen("level");
    setLevel(null);
    setAttempts(0);
    setShowHint(false);
    setAnswer("");
  };

  const handleToggleMute = () => {
    const newMuted = toggleMute();
    setMuted(newMuted);
  };

  const { lives: livesCount, refillInMs } = getLives();
  const refillMin = refillInMs ? Math.ceil(refillInMs / 60000) : null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      style={{ fontFamily: "var(--font-body)" }}>

      {/* Confetti canvas */}
      <canvas ref={confettiRef} className="fixed inset-0 z-[10002] pointer-events-none" style={{ width: "100%", height: "100%" }} />

      {/* Mute button */}
      <button onClick={handleToggleMute}
        className="fixed top-4 right-4 z-[10003] text-2xl p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
        {muted ? "🔇" : "🔊"}
      </button>

      {/* Floating XP */}
      {xpFloat.show && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-[10003] text-2xl font-bold text-yellow-400 animate-float-up pointer-events-none">
          +{xpFloat.amount} XP! ✨
        </div>
      )}

      {/* Rank up */}
      {rankUpMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[10003] bg-gradient-to-r from-yellow-500/20 to-purple-500/20 border border-yellow-500/40 rounded-xl px-6 py-3 text-white font-bold text-lg animate-bounce-in pointer-events-none">
          {rankUpMsg}
        </div>
      )}

      {/* New record */}
      {newRecord && (
        <div className="fixed top-36 left-1/2 -translate-x-1/2 z-[10003] text-xl font-bold text-emerald-400 animate-bounce-in pointer-events-none">
          🏆 NEW RECORD!
        </div>
      )}

      {/* Meme popup */}
      {showMeme && <MemePopup memeIndex={currentMemeIdx} onDismiss={() => setShowMeme(false)} />}

      {screen === "level" && <LevelSelection onSelect={selectLevel} onSkip={onUnlock} />}
      {screen === "question" && currentQuestion && level && (
        <QuestionScreen
          level={level} question={currentQuestion}
          questionNumber={questionNumber} totalQuestions={100}
          answer={answer} setAnswer={setAnswer}
          onSubmit={handleSubmit} attempts={attempts}
          shake={shake} showHint={showHint}
          cooldownRemaining={cooldownRemaining}
          onBack={goBackToLevels} inputRef={inputRef}
          lives={livesCount} heartLost={heartLost}
          refillMin={refillMin}
        />
      )}
      {screen === "granted" && <AccessGranted xpFloat={xpFloat} rankUpMsg={rankUpMsg} newRecord={newRecord} />}
    </div>
  );
}

function LevelSelection({ onSelect, onSkip }: { onSelect: (l: Level) => void; onSkip: () => void }) {
  const xp = getXP();
  const rank = getRank(xp);
  const streak = getStreak();

  const levels: { level: Level; label: string; stars: string; emoji: string; color: string; borderColor: string; hoverBg: string }[] = [
    { level: "easy", label: "EASY", stars: "⭐", emoji: "😊", color: "text-emerald-400", borderColor: "border-emerald-500/50", hoverBg: "hover:bg-emerald-500/10" },
    { level: "medium", label: "MEDIUM", stars: "⭐⭐", emoji: "🤔", color: "text-orange-400", borderColor: "border-orange-500/50", hoverBg: "hover:bg-orange-500/10" },
    { level: "hard", label: "HARD", stars: "⭐⭐⭐", emoji: "🧠", color: "text-red-400", borderColor: "border-red-500/50", hoverBg: "hover:bg-red-500/10" },
  ];

  const xpProgress = rank.nextXP ? ((xp - rank.minXP) / (rank.nextXP - rank.minXP)) * 100 : 100;

  return (
    <div className="w-full max-w-lg animate-bounce-in">
      {/* Top badges */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{rank.emoji}</span>
          <span className="text-sm text-white/70 font-semibold">{rank.name}</span>
        </div>
        {streak.count > 0 && (
          <div className="text-sm text-orange-400 font-semibold">🔥 {streak.count} Day Streak!</div>
        )}
      </div>

      {/* XP Bar */}
      <div className="mb-6 px-1">
        <div className="flex justify-between text-xs text-white/40 mb-1">
          <span>Total XP: {xp}</span>
          <span>{rank.nextXP ? `${rank.nextXP} XP for next rank` : "MAX RANK"}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-300 transition-all duration-500"
            style={{ width: `${xpProgress}%` }} />
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-center text-white mb-8" style={{ fontFamily: "var(--font-display)" }}>
        🔐 Select Your Challenge Level
      </h1>

      <div className="flex flex-col gap-4">
        {levels.map(({ level, label, stars, emoji, color, borderColor, hoverBg }) => {
          const best = getBestTime(level);
          return (
            <button key={level} onClick={() => onSelect(level)}
              className={`w-full p-5 rounded-xl border-2 ${borderColor} bg-white/5 ${hoverBg} transition-all duration-200 cursor-pointer group`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{emoji}</span>
                  <div className="text-left">
                    <div className={`font-bold text-lg ${color}`} style={{ fontFamily: "var(--font-display)" }}>
                      {stars} {label}
                    </div>
                    <div className="text-sm text-white/50">
                      100 Unique Questions
                      {best !== null && <span className="ml-2 text-yellow-400">⚡ Best: {best}s</span>}
                    </div>
                  </div>
                </div>
                <span className="text-white/30 group-hover:text-white/60 transition-colors text-xl">→</span>
              </div>
            </button>
          );
        })}
      </div>

      <button onClick={onSkip}
        className="w-full mt-6 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 text-sm font-medium transition-all">
        Skip Math Challenge →
      </button>

      <StatsPanel />
    </div>
  );
}

// ═══════════════ QUESTION SCREEN ═══════════════
interface QuestionScreenProps {
  level: Level;
  question: MathQuestion;
  questionNumber: number;
  totalQuestions: number;
  answer: string;
  setAnswer: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  attempts: number;
  shake: boolean;
  showHint: boolean;
  cooldownRemaining: number;
  onBack: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  lives: number;
  heartLost: boolean;
  refillMin: number | null;
}

function QuestionScreen({
  level, question, questionNumber, totalQuestions,
  answer, setAnswer, onSubmit, attempts,
  shake, showHint, cooldownRemaining, onBack, inputRef,
  lives, heartLost, refillMin,
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
      <button onClick={onBack} className="text-white/50 hover:text-white/80 transition-colors text-sm mb-4 flex items-center gap-1">
        ← Change Level
      </button>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className={`text-sm font-semibold uppercase ${levelColors[level]}`}>{level}</span>
          <span className="text-xs text-white/40">Question {questionNumber} of {totalQuestions}</span>
        </div>

        {/* Lives */}
        <div className="flex items-center gap-1 mb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={`text-xl transition-all duration-300 ${
              i < lives ? "" : "opacity-20 grayscale"
            } ${heartLost && i === lives ? "animate-heart-pop" : ""}`}>
              ❤️
            </span>
          ))}
          {refillMin !== null && lives < 3 && (
            <span className="text-xs text-white/30 ml-2">refills in {refillMin}m</span>
          )}
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
            type="text" inputMode="decimal"
            value={answer}
            onChange={(e) => {
              const val = e.target.value;
              if (/^-?\d*\.?\d*$/.test(val) || val === "") setAnswer(val);
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

          {/* Wrong answer feedback */}
          {attempts > 0 && !isCoolingDown && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-red-400 text-sm">❌ Wrong answer</span>
              <span className="text-white/40 text-xs">Attempts: {attempts}</span>
            </div>
          )}

          <button type="submit" disabled={isCoolingDown || !answer.trim()}
            className="w-full mt-4 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ fontFamily: "var(--font-display)" }}>
            Submit Answer
          </button>
        </form>

        <StatsPanel level={level} />
      </div>
    </div>
  );
}

// ═══════════════ ACCESS GRANTED ═══════════════
function AccessGranted({ xpFloat, rankUpMsg, newRecord }: {
  xpFloat: { amount: number; show: boolean };
  rankUpMsg: string | null;
  newRecord: boolean;
}) {
  return (
    <div className="text-center animate-pop-in">
      <div className="text-7xl mb-4 animate-bounce-in">✅</div>
      <h2 className="text-3xl font-bold text-emerald-400 mb-2" style={{ fontFamily: "var(--font-display)" }}>
        🎉 ACCESS GRANTED! 🎉
      </h2>
      <p className="text-white/50 mb-2">Unlocking website...</p>
      {xpFloat.amount > 0 && (
        <div className="text-yellow-400 font-bold text-xl animate-float-up">+{xpFloat.amount} XP! ✨</div>
      )}
      {rankUpMsg && <div className="text-lg text-purple-300 mt-2 animate-bounce-in">{rankUpMsg}</div>}
      {newRecord && <div className="text-emerald-300 mt-2 animate-bounce-in">🏆 NEW RECORD!</div>}
    </div>
  );
}
