import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, RotateCcw, BookOpen, Plus, X, Info } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const STORAGE_KEY = "attendance_calculator_state";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DEFAULT_DAY_CLASSES = [6, 6, 6, 6, 6, 0];
const DEFAULT_DAY_ACTIVE = [true, true, true, true, true, false];

function getDefaultEndDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().split("T")[0];
}

interface SavedState {
  attended: number;
  total: number;
  dayActive: boolean[];
  dayClasses: number[];
  endDate: string;
  target: number;
  holidays: string[];
}

function loadState(): SavedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const attended = Math.max(0, Math.floor(Number(parsed.attended) || 0));
    const total = Math.max(0, Math.floor(Number(parsed.total) || 0));
    return {
      attended,
      total,
      dayActive: Array.isArray(parsed.dayActive) && parsed.dayActive.length === 6
        ? parsed.dayActive.map((v: unknown) => Boolean(v))
        : [...DEFAULT_DAY_ACTIVE],
      dayClasses: Array.isArray(parsed.dayClasses) && parsed.dayClasses.length === 6
        ? parsed.dayClasses.map((v: unknown) => Math.max(0, Math.min(12, Math.floor(Number(v) || 0))))
        : [...DEFAULT_DAY_CLASSES],
      endDate: typeof parsed.endDate === "string" && !isNaN(new Date(parsed.endDate).getTime())
        ? parsed.endDate
        : getDefaultEndDate(),
      target: Math.min(100, Math.max(50, Math.floor(Number(parsed.target) || 75))),
      holidays: Array.isArray(parsed.holidays)
        ? parsed.holidays.filter((h: unknown) => typeof h === "string" && !isNaN(new Date(h).getTime()))
        : [],
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function saveState(state: SavedState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function countRemainingClasses(endDate: string, dayActive: boolean[], dayClasses: number[], holidays: string[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const holidaySet = new Set(holidays);
  let totalClasses = 0;
  const d = new Date(today);
  d.setDate(d.getDate() + 1);
  while (d <= end) {
    const dateStr = d.toISOString().split("T")[0];
    if (!holidaySet.has(dateStr)) {
      const dow = d.getDay();
      const idx = dow - 1;
      if (idx >= 0 && idx <= 5 && dayActive[idx]) {
        totalClasses += dayClasses[idx];
      }
    }
    d.setDate(d.getDate() + 1);
  }
  return totalClasses;
}

function canBunk(present: number, total: number, target: number): number {
  if (total === 0) return 0;
  if ((present / total) * 100 < target) return 0;
  let b = 0;
  while ((present / (total + b + 1)) * 100 >= target) {
    b++;
    if (b > 9999) break;
  }
  return b;
}

function mustAttend(present: number, total: number, target: number): number {
  if (total === 0) return 0;
  if ((present / total) * 100 >= target) return 0;
  if (target >= 100) return Infinity;
  let a = 0;
  while (((present + a) / (total + a)) * 100 < target) {
    a++;
    if (a > 9999) break;
  }
  return a;
}

function getWeeksRemaining(endDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const diff = end.getTime() - today.getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
}

function getColor(pct: number, target: number): string {
  if (pct >= target) return "hsl(152, 60%, 42%)";
  if (pct >= target - 10) return "hsl(38, 92%, 50%)";
  return "hsl(0, 72%, 51%)";
}

function getColorClass(pct: number, target: number): string {
  if (pct >= target) return "text-green-400";
  if (pct >= target - 10) return "text-yellow-400";
  return "text-red-400";
}

function getBgClass(pct: number, target: number): string {
  if (pct >= target) return "bg-green-400/20 border-green-400/30";
  if (pct >= target - 10) return "bg-yellow-400/20 border-yellow-400/30";
  return "bg-red-400/20 border-red-400/30";
}

function CircularProgress({ percentage, target, size = 160 }: { percentage: number; target: number; size?: number }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(100, Math.max(0, percentage));
  const offset = circumference - (clampedPct / 100) * circumference;
  const color = getColor(percentage, target);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="hsl(var(--muted))" strokeWidth={strokeWidth} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{percentage.toFixed(1)}%</span>
        <span className="text-xs text-muted-foreground">Current</span>
      </div>
    </div>
  );
}

function getSmartInsight(
  currentPct: number, target: number, remClasses: number, safeBunksNow: number,
  mustAttendNow: number, projIfAllAttend: number, total: number
): string {
  if (total === 0) return "Enter your attendance data to get insights.";
  if (remClasses === 0) {
    if (currentPct >= target) return `Your final attendance is ${currentPct.toFixed(1)}% — you're above target! 🎉`;
    return `Your final attendance is ${currentPct.toFixed(1)}% — unfortunately below your ${target}% target.`;
  }
  if (currentPct >= target && safeBunksNow > 0) {
    return `You can safely bunk ${safeBunksNow} out of ${remClasses} remaining classes and still stay above ${target}%.`;
  }
  if (currentPct < target && mustAttendNow !== Infinity) {
    return `You are below target. Attend ${mustAttendNow} consecutive classes to recover to ${target}%.`;
  }
  if (currentPct < target && mustAttendNow === Infinity) {
    return `${target}% is no longer achievable even with perfect attendance. Consider lowering your target.`;
  }
  if (projIfAllAttend > target) {
    return `If you attend everything remaining, you'll finish at ${projIfAllAttend.toFixed(1)}% — well above target.`;
  }
  return `Keep attending regularly to maintain your attendance above ${target}%.`;
}

export default function AttendanceCalculator() {
  const [attended, setAttended] = useState(0);
  const [total, setTotal] = useState(0);
  const [dayActive, setDayActive] = useState<boolean[]>([...DEFAULT_DAY_ACTIVE]);
  const [dayClasses, setDayClasses] = useState<number[]>([...DEFAULT_DAY_CLASSES]);
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [target, setTarget] = useState(75);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [holidayPickerOpen, setHolidayPickerOpen] = useState(false);

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setAttended(saved.attended);
      setTotal(saved.total);
      setDayActive(saved.dayActive);
      setDayClasses(saved.dayClasses);
      setEndDate(saved.endDate);
      setTarget(saved.target);
      setHolidays(saved.holidays || []);
    }
  }, []);

  useEffect(() => {
    saveState({ attended, total, dayActive, dayClasses, endDate, target, holidays });
  }, [attended, total, dayActive, dayClasses, endDate, target, holidays]);

  const handleAttendedChange = useCallback((val: number) => {
    setAttended(Math.max(0, val));
  }, []);

  const handleTotalChange = useCallback((val: number) => {
    setTotal(Math.max(0, val));
  }, []);

  const toggleDay = useCallback((idx: number) => {
    setDayActive(prev => prev.map((v, i) => i === idx ? !v : v));
  }, []);

  const updateDayClasses = useCallback((idx: number, val: number) => {
    setDayClasses(prev => prev.map((v, i) => i === idx ? Math.max(0, val) : v));
  }, []);

  const addHoliday = useCallback((date: Date | undefined) => {
    if (!date) return;
    const dateStr = date.toISOString().split("T")[0];
    setHolidays(prev => prev.includes(dateStr) ? prev : [...prev, dateStr].sort());
    setHolidayPickerOpen(false);
  }, []);

  const removeHoliday = useCallback((dateStr: string) => {
    setHolidays(prev => prev.filter(h => h !== dateStr));
  }, []);

  const attendedInvalid = attended > total && total > 0;
  const currentPct = total > 0 && !attendedInvalid ? (attended / total) * 100 : 0;

  const remClasses = useMemo(() => countRemainingClasses(endDate, dayActive, dayClasses, holidays), [endDate, dayActive, dayClasses, holidays]);
  const weeksRemaining = useMemo(() => getWeeksRemaining(endDate), [endDate]);

  const projIfAllAttend = total + remClasses > 0 ? ((attended + remClasses) / (total + remClasses)) * 100 : 0;
  const projIfAllBunk = total + remClasses > 0 ? (attended / (total + remClasses)) * 100 : 0;
  const safeBunksNow = canBunk(attended, total, target);
  const mustAttendNow = mustAttend(attended, total, target);

  const safeBunksFromRemaining = useMemo(() => {
    if (remClasses === 0) return 0;
    const totalFuture = total + remClasses;
    let b = 0;
    while (((attended + remClasses - b) / totalFuture) * 100 >= target) {
      b++;
      if (b > remClasses) { b = remClasses; break; }
    }
    return Math.max(0, b - 1);
  }, [attended, total, remClasses, target]);

  const endDatePast = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    return end <= today;
  }, [endDate]);

  const insight = getSmartInsight(currentPct, target, remClasses, safeBunksNow, mustAttendNow, projIfAllAttend, total);

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAttended(0);
    setTotal(0);
    setDayActive([...DEFAULT_DAY_ACTIVE]);
    setDayClasses([...DEFAULT_DAY_CLASSES]);
    setEndDate(getDefaultEndDate());
    setTarget(75);
    setHolidays([]);
  };

  const selectedEndDate = useMemo(() => {
    const d = new Date(endDate + "T00:00:00");
    return isNaN(d.getTime()) ? undefined : d;
  }, [endDate]);

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold font-[var(--font-display)] text-foreground flex items-center justify-center gap-3">
          <BookOpen className="w-8 h-8 text-primary" />
          Attendance Calculator
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">Track your attendance and plan your bunks smartly</p>
      </motion.div>

      {/* Info Note */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Alert className="border-primary/30 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm text-muted-foreground">
            <strong className="text-foreground">Not sure where to find your attendance?</strong><br />
            Go to <span className="font-semibold text-primary">Gitam → G-Learn → Attendance → By Subject</span> to view total and attended classes.
          </AlertDescription>
        </Alert>
      </motion.div>

      {/* Section 1: Current Attendance */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-card-foreground">📊 Current Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 text-center">
                <Label className="text-muted-foreground">Classes Attended</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={attended || ""}
                  onChange={e => handleAttendedChange(parseInt(e.target.value) || 0)}
                  className={cn(
                    "text-2xl md:text-3xl font-bold text-center h-16",
                    attendedInvalid && "border-destructive ring-destructive"
                  )}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2 text-center">
                <Label className="text-muted-foreground">Total Classes Held</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={total || ""}
                  onChange={e => handleTotalChange(parseInt(e.target.value) || 0)}
                  className="text-2xl md:text-3xl font-bold text-center h-16"
                  placeholder="0"
                />
              </div>
            </div>
            {attendedInvalid && (
              <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-center">
                <p className="text-destructive text-sm font-medium">⚠️ Classes attended cannot be greater than total classes held. Please correct your input.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Section 2: Weekly Schedule */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-card-foreground">📅 Weekly Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {DAY_NAMES.map((day, idx) => (
                <div key={day} className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => toggleDay(idx)}
                    className={cn(
                      "w-full py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 border",
                      dayActive[idx]
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border opacity-60"
                    )}
                  >
                    {day}
                  </button>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={12}
                    value={dayActive[idx] ? dayClasses[idx] : 0}
                    onChange={e => updateDayClasses(idx, parseInt(e.target.value) || 0)}
                    disabled={!dayActive[idx]}
                    className="w-full text-center text-sm h-8"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">Click a day to toggle it on/off. Saturday is off by default.</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Section 3: Holidays */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}>
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-card-foreground">🎉 Holidays</CardTitle>
              <Popover open={holidayPickerOpen} onOpenChange={setHolidayPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Plus className="w-4 h-4" /> Add Holiday
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={undefined}
                    onSelect={addHoliday}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date <= today;
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent>
            {holidays.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">No holidays added. Click "Add Holiday" to mark days off.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {holidays.map(h => (
                  <span key={h} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                    {format(new Date(h + "T00:00:00"), "MMM d, yyyy")}
                    <button onClick={() => removeHoliday(h)} className="ml-1 hover:text-destructive transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Section 4: End Date & Target */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-card-foreground">🎯 Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">College working till</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !selectedEndDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedEndDate ? format(selectedEndDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedEndDate}
                      onSelect={(d) => d && setEndDate(d.toISOString().split("T")[0])}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Target: {target}%</Label>
                <Slider min={50} max={100} step={1} value={[target]} onValueChange={([v]) => setTarget(v)} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Results Panel */}
      {total > 0 && !attendedInvalid && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="space-y-4">
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <CircularProgress percentage={currentPct} target={target} />
                <div className="flex-1 grid grid-cols-3 gap-3 w-full">
                  <div className="text-center p-3 rounded-xl border border-border bg-muted/50">
                    <p className="text-2xl font-bold text-foreground">{attended}/{total}</p>
                    <p className="text-xs text-muted-foreground">Present / Total</p>
                  </div>
                  <div className="text-center p-3 rounded-xl border border-border bg-muted/50">
                    <p className="text-2xl font-bold text-foreground">{remClasses}</p>
                    <p className="text-xs text-muted-foreground">Classes Remaining</p>
                  </div>
                  <div className="text-center p-3 rounded-xl border border-border bg-muted/50">
                    <p className="text-2xl font-bold text-foreground">{weeksRemaining}</p>
                    <p className="text-xs text-muted-foreground">Weeks Left</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {!endDatePast && remClasses > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card className={cn("border", getBgClass(projIfAllAttend, target))}>
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">If you attend all remaining</p>
                  <p className={cn("text-3xl font-bold", getColorClass(projIfAllAttend, target))}>{projIfAllAttend.toFixed(1)}%</p>
                </CardContent>
              </Card>
              <Card className={cn("border", getBgClass(projIfAllBunk, target))}>
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">If you bunk all remaining</p>
                  <p className={cn("text-3xl font-bold", getColorClass(projIfAllBunk, target))}>{projIfAllBunk.toFixed(1)}%</p>
                </CardContent>
              </Card>
              <Card className={cn("border", currentPct >= target ? getBgClass(100, target) : getBgClass(0, target))}>
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">
                    {currentPct >= target ? "Can bunk right now" : "Must attend to reach target"}
                  </p>
                  <p className={cn("text-3xl font-bold", currentPct >= target ? "text-green-400" : "text-red-400")}>
                    {currentPct >= target ? safeBunksNow : mustAttendNow === Infinity ? "∞" : mustAttendNow}
                  </p>
                  <p className="text-xs text-muted-foreground">classes</p>
                </CardContent>
              </Card>
              <Card className={cn("border", getBgClass(safeBunksFromRemaining > 0 ? target : 0, target))}>
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Safe bunks from remaining</p>
                  <p className={cn("text-3xl font-bold", safeBunksFromRemaining > 0 ? "text-green-400" : "text-red-400")}>
                    {safeBunksFromRemaining} / {remClasses}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {endDatePast && (
            <Card className="border-border bg-card">
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-muted-foreground">No remaining classes — end date has passed.</p>
              </CardContent>
            </Card>
          )}

          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-card-foreground">📈 Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "Right now", pct: currentPct },
                { label: "End (all attended)", pct: projIfAllAttend },
                { label: "End (all bunked)", pct: projIfAllBunk },
              ].map(({ label, pct }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-36 shrink-0">{label}</span>
                  <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full transition-colors duration-500"
                      style={{ backgroundColor: getColor(pct, target) }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                    />
                  </div>
                  <span className={cn("text-sm font-semibold w-16 text-right", getColorClass(pct, target))}>
                    {pct.toFixed(1)}%
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-foreground text-center">💡 {insight}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {total === 0 && (
        <Card className="border-border bg-card">
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-muted-foreground">Enter your attendance data above to see projections.</p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center pb-8">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 text-muted-foreground">
              <RotateCcw className="w-4 h-4" /> Reset All Data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset all data?</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear all your attendance data and reset inputs to defaults. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}