import { useState, useRef } from "react";
import { Search, Loader2, BookOpen, ClipboardList, RefreshCw } from "lucide-react";

const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"];

// Resilient fetch wrapper with timeout + retry
async function invokeProxy(
  endpoint: "results" | "attendance",
  body: Record<string, string>,
  signal?: AbortSignal
): Promise<{ data: any; error: string | null }> {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const url = `https://${projectId}.supabase.co/functions/v1/gitam-proxy/${endpoint}`;

  const maxRetries = 2;
  const timeoutMs = 25000;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    // Merge external signal
    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }

    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ ...body, action: endpoint }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      const json = await resp.json();
      if (!resp.ok && json?.error) {
        return { data: null, error: json.error + (json.hint ? ` (${json.hint})` : "") };
      }
      if (json?.error) {
        return { data: null, error: json.error + (json.hint ? ` (${json.hint})` : "") };
      }
      return { data: json, error: null };
    } catch (e: any) {
      clearTimeout(timer);
      const isTransient =
        e.name === "AbortError" ||
        e.message?.includes("Failed to fetch") ||
        e.message?.includes("NetworkError") ||
        e.message?.includes("network");

      if (isTransient && attempt < maxRetries) {
        // backoff: 1s, 2s
        await new Promise((r) => setTimeout(r, (attempt + 1) * 1000));
        continue;
      }

      if (e.name === "AbortError") {
        return { data: null, error: "Request timed out. Please try again." };
      }
      return { data: null, error: "Network error. Check your connection and try again." };
    }
  }
  return { data: null, error: "Request failed after retries. Please try again." };
}

// Grade badge color map
const gradeClass: Record<string, string> = {
  O: "bg-emerald-400/15 text-emerald-400",
  "A+": "bg-emerald-500/12 text-emerald-500",
  A: "bg-emerald-400/10 text-emerald-400",
  "B+": "bg-blue-400/12 text-blue-400",
  B: "bg-blue-300/10 text-blue-300",
  C: "bg-amber-400/10 text-amber-400",
  F: "bg-red-400/12 text-red-400",
};

const catClass: Record<string, string> = {
  FC: "bg-emerald-400/12 text-emerald-400",
  UC: "bg-indigo-400/12 text-indigo-400",
  PC: "bg-blue-400/12 text-blue-400",
  PE: "bg-amber-400/10 text-amber-400",
  OE: "bg-red-400/10 text-red-400",
  SEC: "bg-violet-400/12 text-violet-400",
  AEC: "bg-orange-400/10 text-orange-400",
  VAC: "bg-emerald-500/10 text-emerald-500",
};

const statusColor: Record<string, { text: string; fill: string; border: string }> = {
  safe: { text: "text-emerald-400", fill: "bg-emerald-400", border: "border-emerald-400" },
  ok: { text: "text-blue-400", fill: "bg-blue-400", border: "border-blue-400" },
  warning: { text: "text-amber-400", fill: "bg-amber-400", border: "border-amber-400" },
  danger: { text: "text-red-400", fill: "bg-red-400", border: "border-red-400" },
};

function GradeBadge({ grade }: { grade: string }) {
  const cls = gradeClass[grade] || "text-muted-foreground";
  return (
    <span className={`inline-flex items-center justify-center min-w-[2.2rem] px-2 py-0.5 rounded font-bold text-xs font-mono ${cls}`}>
      {grade || "—"}
    </span>
  );
}

function CatBadge({ cat }: { cat: string }) {
  const cls = catClass[cat] || "bg-muted/30 text-muted-foreground";
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-[0.68rem] font-bold font-mono ${cls}`}>
      {cat}
    </span>
  );
}

export default function GitamResults() {
  const [tab, setTab] = useState<"results" | "attendance">("results");
  const [reg, setReg] = useState("");
  const [sem, setSem] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);

  const prevResults = useRef<any>(null);
  const prevAttendance = useRef<any>(null);

  async function search() {
    if (!reg.trim()) return;
    setLoading(true);
    setError("");

    try {
      const endpoint = tab === "results" ? "results" : "attendance";
      const body = tab === "results" ? { reg, sem } : { reg };

      const { data, error: fetchErr } = await invokeProxy(endpoint, body);

      if (fetchErr) {
        setError(fetchErr);
      } else if (tab === "results") {
        setResults(data);
        prevResults.current = data;
      } else {
        setAttendance(data);
        prevAttendance.current = data;
      }
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative z-[1] max-w-[960px] mx-auto px-3 sm:px-6 pt-6 sm:pt-8 pb-24">
      {/* Grid background effect */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        backgroundImage: "linear-gradient(rgba(110,231,183,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(110,231,183,.04) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      {/* Header */}
      <header className="flex items-center gap-3 sm:gap-4 pb-6 sm:pb-8 border-b border-border mb-6 sm:mb-8">
        <div className="w-9 h-9 sm:w-11 sm:h-11 bg-emerald-400 flex-shrink-0" style={{ clipPath: "polygon(50% 0%,100% 38%,82% 100%,18% 100%,0% 38%)" }} />
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
            GITAM <span className="text-emerald-400">Portal</span>
          </h1>
          <p className="font-mono text-[0.7rem] text-muted-foreground tracking-widest uppercase mt-1">
            Results & Attendance · glearn.gitam.edu
          </p>
        </div>
      </header>

      {/* Search card */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-indigo-400" />

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          <button onClick={() => setTab("results")} className={`font-mono text-xs px-4 py-2 rounded-lg border transition-all ${tab === "results" ? "bg-emerald-400 border-emerald-400 text-black font-bold" : "border-border text-muted-foreground hover:border-emerald-400 hover:text-emerald-400"}`}>
            <BookOpen className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" /> Results
          </button>
          <button onClick={() => setTab("attendance")} className={`font-mono text-xs px-4 py-2 rounded-lg border transition-all ${tab === "attendance" ? "bg-emerald-400 border-emerald-400 text-black font-bold" : "border-border text-muted-foreground hover:border-emerald-400 hover:text-emerald-400"}`}>
            <ClipboardList className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" /> Attendance
          </button>
        </div>

        {/* Reg input */}
        <div className="mb-4">
          <label className="block font-mono text-[0.68rem] tracking-widest uppercase text-muted-foreground mb-1.5">Registration Number</label>
          <input
            value={reg}
            onChange={(e) => setReg(e.target.value.toUpperCase())}
            placeholder="e.g. 2023001075"
            className="w-full bg-background border border-border rounded-lg text-foreground font-mono text-sm px-4 py-3 outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 placeholder:text-muted-foreground"
            onKeyDown={(e) => e.key === "Enter" && search()}
          />
        </div>

        {/* Semester pills (results only) */}
        {tab === "results" && (
          <div className="mb-4">
            <label className="block font-mono text-[0.68rem] tracking-widest uppercase text-muted-foreground mb-1.5">Semester</label>
            <div className="flex flex-wrap gap-2">
              {SEMESTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSem(s)}
                  className={`font-mono text-sm px-3 py-2 rounded-lg border transition-all ${sem === s ? "bg-emerald-400 border-emerald-400 text-black font-bold" : "bg-background border-border text-muted-foreground hover:border-emerald-400 hover:text-emerald-400"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search button */}
        <button
          onClick={search}
          disabled={loading || !reg.trim()}
          className="w-full flex items-center justify-center gap-2 bg-emerald-400 text-black rounded-lg font-extrabold text-base py-3 mt-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-400/25 disabled:opacity-45 disabled:cursor-not-allowed disabled:translate-y-0"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          {loading ? "Searching..." : `Search ${tab === "results" ? "Results" : "Attendance"}`}
        </button>

        {/* Error */}
        {error && (
          <div className="mt-3 px-4 py-3 rounded-lg font-mono text-xs bg-destructive/10 border border-destructive text-destructive flex items-center justify-between gap-2">
            <span>{error}</span>
            <button onClick={search} className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded bg-destructive/20 hover:bg-destructive/30 transition-colors">
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}
      </div>

      {/* Results display */}
      {results && <ResultsView data={results} />}
      {attendance && <AttendanceView data={attendance} />}
    </main>
  );
}

function ResultsView({ data }: { data: any }) {
  return (
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-2">
      {/* Student banner */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-indigo-400" />
        <div className="text-lg sm:text-2xl font-extrabold tracking-tight">{data.student_name}</div>
        <div className="font-mono text-xs text-muted-foreground mt-1">
          {data.regid} · Semester {data.semid}
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Pill label="SGPA" value={data.sgpa} highlight />
          <Pill label="CGPA" value={data.cgpa} highlight />
          {data.sem_credits && <Pill label="Sem Credits" value={data.sem_credits} />}
          {data.cum_credits && <Pill label="Total Credits" value={data.cum_credits} />}
        </div>
      </div>

      {/* Semester grades table */}
      {data.sem_table?.length > 0 && (
        <>
          <SectionTitle>Semester Grades</SectionTitle>
          <div className="border border-border rounded-xl overflow-hidden mb-2">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-card">
                    <th className="font-mono text-[0.64rem] tracking-wider uppercase text-muted-foreground text-left px-4 py-3">Course</th>
                    <th className="font-mono text-[0.64rem] tracking-wider uppercase text-muted-foreground text-left px-4 py-3">Category</th>
                    <th className="font-mono text-[0.64rem] tracking-wider uppercase text-muted-foreground text-left px-4 py-3">Credits</th>
                    <th className="font-mono text-[0.64rem] tracking-wider uppercase text-muted-foreground text-left px-4 py-3">Grade</th>
                    <th className="font-mono text-[0.64rem] tracking-wider uppercase text-muted-foreground text-left px-4 py-3 hidden sm:table-cell">GP</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sem_table.map((r: any, i: number) => (
                    <tr key={i} className="border-b border-border last:border-b-0 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-sm">{r.course_name}</div>
                        <div className="inline-block bg-background border border-border rounded px-1.5 py-0.5 text-[0.68rem] text-muted-foreground font-mono mt-1">{r.course_code}</div>
                      </td>
                      <td className="px-4 py-3"><CatBadge cat={r.category} /></td>
                      <td className="px-4 py-3 font-mono text-sm">{r.credits}</td>
                      <td className="px-4 py-3"><GradeBadge grade={r.grade} /></td>
                      <td className="px-4 py-3 font-mono text-sm hidden sm:table-cell">{r.grade_points ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Internal marks */}
      {data.internal_marks?.length > 0 && (
        <>
          <SectionTitle>Internal Marks</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {data.internal_marks.map((m: any, i: number) => (
              <div key={i} className="bg-card border border-border rounded-xl px-4 py-3 flex justify-between items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{m.subject_name}</div>
                  <div className="font-mono text-[0.65rem] text-muted-foreground">{m.subject_code}</div>
                </div>
                <div className="font-mono text-base font-bold flex-shrink-0">
                  {m.internal_marks ?? "—"}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AttendanceView({ data }: { data: any }) {
  const s = data.summary;
  const sc = statusColor[s?.overall_status] || statusColor.ok;

  return (
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-2">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
        <StatCard value={`${s.average_pct}%`} label="Average" className={sc.text} />
        <StatCard value={s.below_75} label="Below 75%" className="text-red-400" />
        <StatCard value={s.below_85} label="75-84%" className="text-amber-400" />
        <StatCard value={s.safe} label="Safe (≥85%)" className="text-emerald-400" />
      </div>

      {/* Subject-wise */}
      <SectionTitle>Subject-wise Attendance — Semester {data.semester}</SectionTitle>
      <div className="flex flex-col gap-2">
        {data.subwise.map((sub: any, i: number) => {
          const sc = statusColor[sub.status] || statusColor.ok;
          return (
            <div key={i} className={`bg-card border rounded-xl px-4 py-3 ${sc.border}`}>
              <div className="flex justify-between items-start mb-2 gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{sub.subject_name}</div>
                  <div className="font-mono text-[0.65rem] text-muted-foreground mt-0.5">{sub.subject_code}</div>
                </div>
                <div className={`font-mono text-lg font-bold flex-shrink-0 ${sc.text}`}>{sub.percentage}%</div>
              </div>
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${sc.fill} transition-all duration-700`} style={{ width: `${sub.percentage}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Pill({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`bg-background border rounded-full px-3 py-1 font-mono text-xs ${highlight ? "border-emerald-400" : "border-border"}`}>
      {label} <strong className="text-emerald-400 ml-1">{value}</strong>
    </div>
  );
}

function StatCard({ value, label, className }: { value: any; label: string; className?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 sm:p-4 flex-1 min-w-0 text-center">
      <div className={`font-mono text-xl sm:text-2xl font-bold leading-none ${className}`}>{value}</div>
      <div className="font-mono text-[0.6rem] sm:text-[0.65rem] text-muted-foreground mt-1 sm:mt-1.5 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[0.68rem] tracking-widest uppercase text-muted-foreground my-5 flex items-center gap-3">
      {children}
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
