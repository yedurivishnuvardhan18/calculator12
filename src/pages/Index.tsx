import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { Plus, Download, Eye, KeyRound, UserPlus, LogOut, Zap, Flame, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { generateExcel } from "@/lib/excel-generator";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AuthDialog from "@/components/AuthDialog";
import WelcomeDialog from "@/components/WelcomeDialog";
import YearlyChart from "@/components/YearlyChart";
import WeekSelector from "@/components/WeekSelector";
import HabitRow from "@/components/HabitRow";
import { format, startOfWeek, addWeeks, addDays, isSameWeek, differenceInCalendarDays, isBefore, isEqual } from "date-fns";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const chartConfig = {
  percentage: { label: "Completion %", color: "hsl(var(--primary))" },
};

function getCurrentWeekStart() {
  return startOfWeek(new Date(), { weekStartsOn: 1 });
}

/** Calculate streak: consecutive completed days ending at the latest completed day */
function calcStreak(checkRow: boolean[]): number {
  // Find rightmost checked day, then count consecutive backwards
  let lastChecked = -1;
  for (let i = 6; i >= 0; i--) {
    if (checkRow[i]) { lastChecked = i; break; }
  }
  if (lastChecked === -1) return 0;
  let streak = 0;
  for (let i = lastChecked; i >= 0; i--) {
    if (checkRow[i]) streak++;
    else break;
  }
  return streak;
}

const Index = () => {
  const [habits, setHabits] = useState<string[]>([]);
  const [newHabit, setNewHabit] = useState("");
  const [checkData, setCheckData] = useState<boolean[][]>([]);
  const statsRef = useRef<HTMLDivElement>(null);

  // Auth state
  const [userCodeId, setUserCodeId] = useState<string | null>(null);
  const [userCode, setUserCode] = useState<string | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [welcomeDialogOpen, setWelcomeDialogOpen] = useState(false);
  const [welcomeShown, setWelcomeShown] = useState(false);

  // Week navigation
  const [selectedWeek, setSelectedWeek] = useState<Date>(getCurrentWeekStart());
  const currentWeekDate = useMemo(() => getCurrentWeekStart(), []);
  const selectedWeekStart = useMemo(() => format(selectedWeek, "yyyy-MM-dd"), [selectedWeek]);
  const canGoNext = !isSameWeek(selectedWeek, currentWeekDate, { weekStartsOn: 1 });

  // Yearly data
  const [yearlyData, setYearlyData] = useState<{ weekLabel: string; percentage: number }[]>([]);

  // Drag state
  const dragIdx = useRef<number | null>(null);

  // Restore auth session on mount
  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // User is signed in - fetch their code
        const { data } = await supabase
          .from("user_codes")
          .select("id, code")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (data) {
          setUserCodeId(data.id);
          setUserCode(data.code);
        }
      } else if (event === "SIGNED_OUT") {
        setUserCodeId(null);
        setUserCode(null);
        setHabits([]);
        setCheckData([]);
        setYearlyData([]);
      }
    });

    // Check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data } = await supabase
          .from("user_codes")
          .select("id, code")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (data) {
          setUserCodeId(data.id);
          setUserCode(data.code);
          setWelcomeShown(true);
        }
      }
    });

    if (!welcomeShown) {
      const stored = localStorage.getItem("ht_welcome_shown");
      if (!stored) {
        setWelcomeDialogOpen(true);
      }
      setWelcomeShown(true);
    }

    return () => subscription.unsubscribe();
  }, [welcomeShown]);

  // Load habits from DB when authenticated or week changes
  useEffect(() => {
    if (!userCodeId) return;
    const load = async () => {
      const { data: habitsData } = await supabase
        .from("user_habits")
        .select("habit_name, sort_order")
        .eq("user_code_id", userCodeId)
        .order("sort_order", { ascending: true });
      const habitNames = habitsData?.map((h) => h.habit_name) ?? [];
      setHabits(habitNames);

      const { data: entries } = await supabase
        .from("habit_entries")
        .select("habit_name, day_of_week, completed")
        .eq("user_code_id", userCodeId)
        .eq("week_start", selectedWeekStart);

      const grid = habitNames.map((habit) => {
        return DAYS.map((_, dIdx) => {
          const entry = entries?.find((e) => e.habit_name === habit && e.day_of_week === dIdx);
          return entry?.completed ?? false;
        });
      });
      setCheckData(grid);

      const { data: allEntries } = await supabase
        .from("habit_entries")
        .select("week_start, completed")
        .eq("user_code_id", userCodeId)
        .order("week_start", { ascending: true });

      if (allEntries && allEntries.length > 0 && habitNames.length > 0) {
        const weekMap = new Map<string, { completed: number; total: number }>();
        allEntries.forEach((e) => {
          const w = e.week_start;
          if (!weekMap.has(w)) weekMap.set(w, { completed: 0, total: 0 });
          const entry = weekMap.get(w)!;
          entry.total++;
          if (e.completed) entry.completed++;
        });
        const yearly = Array.from(weekMap.entries()).map(([ws, v]) => ({
          weekLabel: format(new Date(ws), "MMM d"),
          percentage: Math.round((v.completed / v.total) * 100),
        }));
        setYearlyData(yearly);
      }
    };
    load();
  }, [userCodeId, selectedWeekStart]);

  const saveHabitToDB = useCallback(async (habitName: string, sortOrder: number) => {
    if (!userCodeId) return;
    await supabase.from("user_habits").upsert({
      user_code_id: userCodeId,
      habit_name: habitName,
      sort_order: sortOrder,
    });
  }, [userCodeId]);

  const removeHabitFromDB = useCallback(async (habitName: string) => {
    if (!userCodeId) return;
    await supabase.from("user_habits").delete().eq("user_code_id", userCodeId).eq("habit_name", habitName);
    await supabase.from("habit_entries").delete().eq("user_code_id", userCodeId).eq("habit_name", habitName);
  }, [userCodeId]);

  const saveEntryToDB = useCallback(async (habitName: string, dayIdx: number, completed: boolean) => {
    if (!userCodeId) return;
    await supabase.from("habit_entries").upsert({
      user_code_id: userCodeId,
      habit_name: habitName,
      day_of_week: dayIdx,
      week_start: selectedWeekStart,
      completed,
    }, { onConflict: "user_code_id,habit_name,day_of_week,week_start" });
  }, [userCodeId, selectedWeekStart]);

  const addHabit = useCallback(() => {
    const trimmed = newHabit.trim();
    if (!trimmed) return;
    if (habits.includes(trimmed)) {
      toast({ title: "Duplicate habit", description: "This habit already exists.", variant: "destructive" });
      return;
    }
    const newOrder = habits.length;
    setHabits((prev) => [...prev, trimmed]);
    setCheckData((prev) => [...prev, Array(7).fill(false)]);
    setNewHabit("");
    saveHabitToDB(trimmed, newOrder);
  }, [newHabit, habits, saveHabitToDB]);

  const removeHabit = useCallback((index: number) => {
    const habitName = habits[index];
    setHabits((prev) => prev.filter((_, i) => i !== index));
    setCheckData((prev) => prev.filter((_, i) => i !== index));
    removeHabitFromDB(habitName);
  }, [habits, removeHabitFromDB]);

  const renameHabit = useCallback(async (index: number, newName: string) => {
    if (habits.includes(newName)) {
      toast({ title: "Duplicate", description: "A habit with that name already exists.", variant: "destructive" });
      return;
    }
    const oldName = habits[index];
    setHabits((prev) => prev.map((h, i) => (i === index ? newName : h)));
    if (!userCodeId) return;
    // Update habit name
    await supabase.from("user_habits")
      .update({ habit_name: newName })
      .eq("user_code_id", userCodeId)
      .eq("habit_name", oldName);
    // Update all entries with old name
    await supabase.from("habit_entries")
      .update({ habit_name: newName })
      .eq("user_code_id", userCodeId)
      .eq("habit_name", oldName);
  }, [habits, userCodeId]);

  const toggleCheck = useCallback((hIdx: number, dIdx: number) => {
    setCheckData((prev) => {
      const next = prev.map((row) => [...row]);
      next[hIdx][dIdx] = !next[hIdx][dIdx];
      saveEntryToDB(habits[hIdx], dIdx, next[hIdx][dIdx]);
      return next;
    });
  }, [habits, saveEntryToDB]);

  // Drag reorder
  const handleDragStart = useCallback((idx: number) => { dragIdx.current = idx; }, []);
  const handleDragOver = useCallback((e: React.DragEvent, _idx: number) => { e.preventDefault(); }, []);
  const handleDrop = useCallback(async (dropIdx: number) => {
    const from = dragIdx.current;
    if (from === null || from === dropIdx) return;
    const newHabits = [...habits];
    const newCheck = [...checkData];
    const [movedH] = newHabits.splice(from, 1);
    const [movedC] = newCheck.splice(from, 1);
    newHabits.splice(dropIdx, 0, movedH);
    newCheck.splice(dropIdx, 0, movedC);
    setHabits(newHabits);
    setCheckData(newCheck);
    dragIdx.current = null;

    if (!userCodeId) return;
    // Save new order
    await Promise.all(
      newHabits.map((name, i) =>
        supabase.from("user_habits")
          .update({ sort_order: i })
          .eq("user_code_id", userCodeId)
          .eq("habit_name", name)
      )
    );
  }, [habits, checkData, userCodeId]);

  const streaks = useMemo(() =>
    checkData.map((row) => calcStreak(row)),
    [checkData]
  );

  const dailyPcts = useMemo(() => {
    if (habits.length === 0) return DAYS.map(() => 0);
    return DAYS.map((_, dIdx) => {
      const completed = checkData.filter((row) => row[dIdx]).length;
      return Math.round((completed / habits.length) * 100);
    });
  }, [checkData, habits.length]);

  const weeklyPct = useMemo(() => {
    if (habits.length === 0) return 0;
    return Math.round(dailyPcts.reduce((a, b) => a + b, 0) / 7);
  }, [dailyPcts, habits.length]);

  const chartData = useMemo(
    () => DAYS.map((day, i) => ({ day, percentage: dailyPcts[i] })),
    [dailyPcts]
  );

  const handlePreview = () => {
    statsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDownload = async () => {
    if (habits.length === 0) {
      toast({ title: "No habits", description: "Add at least one habit before downloading.", variant: "destructive" });
      return;
    }
    try {
      await generateExcel(habits, checkData);
      toast({ title: "Downloaded!", description: "Your Excel file has been saved." });
    } catch {
      toast({ title: "Error", description: "Failed to generate Excel file.", variant: "destructive" });
    }
  };

  const handleAuthenticated = (codeId: string, code: string) => {
    setUserCodeId(codeId);
    setUserCode(code);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserCodeId(null);
    setUserCode(null);
    setHabits([]);
    setCheckData([]);
    setYearlyData([]);
    toast({ title: "Logged out", description: "You are now using a temporary page." });
  };

  const getPctColor = (pct: number) => {
    if (pct >= 80) return "border-success/50 bg-success/5";
    if (pct >= 50) return "border-warning/50 bg-warning/5";
    return "border-destructive/30 bg-destructive/5";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-gradient-to-r from-primary/5 via-card to-accent/5 py-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="animate-fade-in">
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              <Zap className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
              Weekly Habit Tracker
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track your habits, visualize progress, and download a professional Excel report.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {userCode ? (
              <>
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  Code: <strong className="text-foreground">{userCode}</strong>
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-1 h-4 w-4" /> Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setAuthDialogOpen(true)}>
                  <KeyRound className="mr-1 h-4 w-4" /> Enter Code
                </Button>
                <Button size="sm" onClick={() => setAuthDialogOpen(true)}>
                  <UserPlus className="mr-1 h-4 w-4" /> Create Code
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:space-y-8 sm:py-8">
        {/* Week Selector */}
        <div className="animate-fade-in">
          <WeekSelector
            weekStart={selectedWeek}
            onPrevious={() => setSelectedWeek((w) => addWeeks(w, -1))}
            onNext={() => setSelectedWeek((w) => addWeeks(w, 1))}
            canGoNext={canGoNext}
            isAuthenticated={!!userCodeId}
          />
        </div>

        {/* Add Habit */}
        <Card className="animate-fade-in transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Add Habits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="e.g. Exercise, Read, Meditate..."
                value={newHabit}
                onChange={(e) => setNewHabit(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addHabit()}
                className="sm:max-w-md"
              />
              <Button onClick={addHabit} className="w-full sm:w-auto">
                <Plus className="mr-1 h-4 w-4" /> Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tracking Table */}
        {habits.length > 0 && (
          <Card className="animate-fade-in transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Weekly Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Desktop: Table layout */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px]">Habit</TableHead>
                      {DAYS.map((d) => (
                        <TableHead key={d} className="w-[80px] text-center">{d}</TableHead>
                      ))}
                      <TableHead className="w-[70px] text-center">Streak</TableHead>
                      <TableHead className="w-[50px] text-center"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {habits.map((habit, hIdx) => (
                      <HabitRow
                        key={`${habit}-${hIdx}`}
                        habit={habit}
                        hIdx={hIdx}
                        checkRow={checkData[hIdx] ?? []}
                        streak={streaks[hIdx] ?? 0}
                        onToggle={toggleCheck}
                        onRemove={removeHabit}
                        onRename={renameHabit}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile: Card layout */}
              <div className="sm:hidden space-y-4">
                {habits.map((habit, hIdx) => (
                  <div
                    key={`${habit}-${hIdx}`}
                    className="rounded-xl border bg-card p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-foreground truncate max-w-[200px]">{habit}</span>
                      <div className="flex items-center gap-2">
                        {(streaks[hIdx] ?? 0) > 0 && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-warning">
                            <Flame className="h-3.5 w-3.5" />
                            {streaks[hIdx]}d
                          </span>
                        )}
                        <button
                          onClick={() => removeHabit(hIdx)}
                          className="rounded-full p-1.5 transition-colors hover:bg-destructive/20"
                          aria-label={`Remove ${habit}`}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {DAYS.map((d, dIdx) => (
                        <button
                          key={dIdx}
                          onClick={() => toggleCheck(hIdx, dIdx)}
                          className={`flex flex-col items-center gap-1 rounded-lg py-2 text-xs font-medium transition-all ${
                            checkData[hIdx]?.[dIdx]
                              ? "bg-primary/15 text-primary border border-primary/30"
                              : "bg-muted/50 text-muted-foreground border border-transparent hover:bg-muted"
                          }`}
                        >
                          <span className="text-[10px]">{d}</span>
                          <span className="text-sm">{checkData[hIdx]?.[dIdx] ? "✓" : "○"}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Dashboard */}
        <div ref={statsRef} className="space-y-6">
          {habits.length > 0 && (
            <>
              <Card className="animate-fade-in transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Daily Completion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7 sm:gap-2">
                    {DAYS.map((day, i) => (
                      <div
                        key={day}
                        className={`rounded-lg border p-3 text-center transition-all hover:shadow-sm ${getPctColor(dailyPcts[i])}`}
                      >
                        <div className="text-[10px] sm:text-xs font-medium text-muted-foreground">{day}</div>
                        <div className="mt-1 text-base font-bold text-foreground sm:text-xl">{dailyPcts[i]}%</div>
                      </div>
                    ))}
                  </div>
                  <div className={`mt-4 flex items-center justify-center rounded-lg border p-4 transition-all ${getPctColor(weeklyPct)}`}>
                    <div className="text-center">
                      <div className="text-sm font-medium text-muted-foreground">Weekly Average</div>
                      <div className="text-3xl font-bold text-foreground">{weeklyPct}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="animate-fade-in transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Progress Chart</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[250px] w-full sm:h-[300px]">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="percentage" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </>
          )}

          {userCodeId && <YearlyChart data={yearlyData} />}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pb-12 sm:flex-row">
          <Button variant="outline" onClick={handlePreview} disabled={habits.length === 0} className="w-full sm:w-auto">
            <Eye className="mr-1 h-4 w-4" /> Preview
          </Button>
          <Button onClick={handleDownload} disabled={habits.length === 0} className="w-full sm:w-auto">
            <Download className="mr-1 h-4 w-4" /> Download Excel
          </Button>
        </div>
      </main>

      {/* Dialogs */}
      <WelcomeDialog
        open={welcomeDialogOpen}
        onOpenChange={setWelcomeDialogOpen}
        onPersonal={() => {
          setWelcomeDialogOpen(false);
          setAuthDialogOpen(true);
          localStorage.setItem("ht_welcome_shown", "1");
        }}
        onTemporary={() => {
          setWelcomeDialogOpen(false);
          localStorage.setItem("ht_welcome_shown", "1");
        }}
      />
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onAuthenticated={handleAuthenticated}
      />
    </div>
  );
};

export default Index;
