// Gamification state management for Math Lock

type Level = "easy" | "medium" | "hard";

// ═══════════════ XP ═══════════════
const XP_VALUES: Record<Level, number> = { easy: 10, medium: 25, hard: 50 };

export function getXP(): number {
  return parseInt(localStorage.getItem("mathlock_xp") || "0", 10);
}

export function addXP(level: Level): { newXP: number; earned: number; oldRank: string; newRank: string; rankUp: boolean } {
  const earned = XP_VALUES[level];
  const oldXP = getXP();
  const newXP = oldXP + earned;
  localStorage.setItem("mathlock_xp", String(newXP));
  const oldRank = getRank(oldXP).name;
  const newRank = getRank(newXP).name;
  return { newXP, earned, oldRank, newRank, rankUp: oldRank !== newRank };
}

// ═══════════════ RANK ═══════════════
export interface RankInfo {
  emoji: string;
  name: string;
  minXP: number;
  nextXP: number | null;
}

const RANKS: { emoji: string; name: string; min: number }[] = [
  { emoji: "🥉", name: "Bronze", min: 0 },
  { emoji: "🥈", name: "Silver", min: 101 },
  { emoji: "🥇", name: "Gold", min: 301 },
  { emoji: "💎", name: "Diamond", min: 601 },
  { emoji: "👑", name: "Legend", min: 1001 },
];

export function getRank(xp: number): RankInfo {
  let current = RANKS[0];
  let nextIdx = 1;
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].min) {
      current = RANKS[i];
      nextIdx = i + 1;
      break;
    }
  }
  return {
    emoji: current.emoji,
    name: current.name,
    minXP: current.min,
    nextXP: nextIdx < RANKS.length ? RANKS[nextIdx].min : null,
  };
}

// ═══════════════ STREAK ═══════════════
interface StreakData {
  count: number;
  lastDate: string;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function getStreak(): StreakData {
  try {
    const raw = localStorage.getItem("mathlock_streak");
    if (raw) {
      const data = JSON.parse(raw) as StreakData;
      // Check if streak is still valid
      if (data.lastDate === today() || data.lastDate === yesterday()) {
        return data;
      }
      // Streak broken
      return { count: 0, lastDate: "" };
    }
  } catch {}
  return { count: 0, lastDate: "" };
}

export function updateStreak(): { streak: number; milestone: number | null } {
  const current = getStreak();
  const t = today();
  let newCount = current.count;

  if (current.lastDate === t) {
    // Already solved today
    return { streak: newCount, milestone: null };
  } else if (current.lastDate === yesterday()) {
    newCount = current.count + 1;
  } else {
    newCount = 1;
  }

  localStorage.setItem("mathlock_streak", JSON.stringify({ count: newCount, lastDate: t }));

  const milestones = [3, 7, 14, 30];
  const milestone = milestones.includes(newCount) ? newCount : null;

  return { streak: newCount, milestone };
}

// ═══════════════ BEST TIMES ═══════════════
export function getBestTime(level: Level): number | null {
  const raw = localStorage.getItem(`mathlock_best_${level}`);
  return raw ? parseFloat(raw) : null;
}

export function setBestTime(level: Level, seconds: number): boolean {
  const current = getBestTime(level);
  if (current === null || seconds < current) {
    localStorage.setItem(`mathlock_best_${level}`, String(Math.round(seconds * 10) / 10));
    return true; // new record
  }
  return false;
}

// ═══════════════ LIVES ═══════════════
interface LivesData {
  lives: number;
  lastLostAll: number | null; // timestamp when lives hit 0
}

const MAX_LIVES = 3;
const REFILL_MS = 10 * 60 * 1000; // 10 minutes

function getLivesData(): LivesData {
  try {
    const raw = localStorage.getItem("mathlock_lives");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { lives: MAX_LIVES, lastLostAll: null };
}

function saveLives(data: LivesData) {
  localStorage.setItem("mathlock_lives", JSON.stringify(data));
}

export function getLives(): { lives: number; refillInMs: number | null } {
  const data = getLivesData();

  if (data.lives < MAX_LIVES && data.lastLostAll) {
    const elapsed = Date.now() - data.lastLostAll;
    if (elapsed >= REFILL_MS) {
      // Refill
      data.lives = MAX_LIVES;
      data.lastLostAll = null;
      saveLives(data);
      return { lives: MAX_LIVES, refillInMs: null };
    }
    return { lives: data.lives, refillInMs: REFILL_MS - elapsed };
  }

  return { lives: data.lives, refillInMs: null };
}

export function loseLife(): { lives: number; triggerCooldown: boolean } {
  const data = getLivesData();
  data.lives = Math.max(0, data.lives - 1);

  if (data.lives === 0) {
    data.lastLostAll = Date.now();
  }

  saveLives(data);
  return { lives: data.lives, triggerCooldown: data.lives === 0 };
}

export function refillLives() {
  saveLives({ lives: MAX_LIVES, lastLostAll: null });
}

// ═══════════════ PERFORMANCE / ADAPTIVE ═══════════════
interface SolveRecord {
  level: Level;
  timeMs: number;
  correct: boolean;
  timestamp: number;
}

function getPerformance(): SolveRecord[] {
  try {
    const raw = localStorage.getItem("mathlock_performance");
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function recordSolve(level: Level, timeMs: number, correct: boolean) {
  const records = getPerformance();
  records.push({ level, timeMs, correct, timestamp: Date.now() });
  // Keep last 100 records
  if (records.length > 100) records.splice(0, records.length - 100);
  localStorage.setItem("mathlock_performance", JSON.stringify(records));
}

export function getStats(): {
  avgTime: number;
  accuracy: number;
  totalSolved: number;
  autoLevel: Level | null;
} {
  const records = getPerformance();
  const correct = records.filter((r) => r.correct);
  const avgTime = correct.length > 0 ? correct.reduce((s, r) => s + r.timeMs, 0) / correct.length / 1000 : 0;
  const accuracy = records.length > 0 ? (correct.length / records.length) * 100 : 0;

  return {
    avgTime: Math.round(avgTime * 10) / 10,
    accuracy: Math.round(accuracy),
    totalSolved: correct.length,
    autoLevel: getAutoLevel(),
  };
}

export function getAutoLevel(): Level | null {
  const raw = localStorage.getItem("mathlock_autolevel");
  if (raw === "easy" || raw === "medium" || raw === "hard") return raw;
  return null;
}

export function checkAdaptive(level: Level): { suggest: Level | null; message: string | null } {
  const records = getPerformance();
  const levelRecords = records.filter((r) => r.level === level);
  const last5 = levelRecords.slice(-5);

  if (last5.length < 5) return { suggest: null, message: null };

  if (level === "easy") {
    const allCorrect = last5.every((r) => r.correct);
    const avgTime = last5.reduce((s, r) => s + r.timeMs, 0) / 5 / 1000;
    if (allCorrect && avgTime < 10) {
      localStorage.setItem("mathlock_autolevel", "medium");
      return { suggest: "medium", message: "You're too good for Easy! 😎 Moving to Medium..." };
    }
  }

  if (level === "medium") {
    const allCorrect = last5.every((r) => r.correct);
    const avgTime = last5.reduce((s, r) => s + r.timeMs, 0) / 5 / 1000;
    if (allCorrect && avgTime < 15) {
      localStorage.setItem("mathlock_autolevel", "hard");
      return { suggest: "hard", message: "BEAST MODE! 🔥 Moving to Hard..." };
    }
  }

  if (level === "hard") {
    const last3 = levelRecords.slice(-3);
    if (last3.length >= 3 && last3.every((r) => !r.correct)) {
      localStorage.setItem("mathlock_autolevel", "medium");
      return { suggest: "medium", message: "No shame in Medium... 😅 Moving you down." };
    }
  }

  return { suggest: null, message: null };
}

// ═══════════════ MEME SHUFFLE ═══════════════
function fisherYatesShuffle(arr: number[]): number[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getNextMemeIndex(attemptNumber: number): number {
  let order: number[];
  try {
    const raw = sessionStorage.getItem("mathlock_meme_order");
    order = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(order) || order.length !== 100) throw new Error();
  } catch {
    order = fisherYatesShuffle(Array.from({ length: 100 }, (_, i) => i));
    sessionStorage.setItem("mathlock_meme_order", JSON.stringify(order));
  }

  let idx = parseInt(sessionStorage.getItem("mathlock_meme_index") || "0", 10);
  if (idx >= 100) {
    order = fisherYatesShuffle(Array.from({ length: 100 }, (_, i) => i));
    sessionStorage.setItem("mathlock_meme_order", JSON.stringify(order));
    idx = 0;
  }

  // Pool filtering by attempt severity
  let pool: number[];
  if (attemptNumber <= 2) {
    pool = order.filter((i) => i < 20); // mild (0-19)
  } else if (attemptNumber <= 4) {
    pool = order.filter((i) => i >= 20 && i < 60); // medium (20-59)
  } else {
    pool = order.filter((i) => i >= 60); // savage (60-99)
  }

  // If pool exhausted, use any available
  if (pool.length === 0) pool = order;

  const memeIdx = pool[idx % pool.length];
  sessionStorage.setItem("mathlock_meme_index", String(idx + 1));
  return memeIdx;
}
