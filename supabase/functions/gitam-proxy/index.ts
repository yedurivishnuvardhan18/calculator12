import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE = "https://glearn.gitam.edu";
const API_MARKS = `${BASE}/Student/getsemmarksdata`;
const ATD_SUBJECT = `${BASE}/student/getsubject`;
const ATD_OVERALL = `${BASE}/student/getoverallatd`;
const ATD_PAGE = `${BASE}/Student/Attendance`;

const UPSTREAM_TIMEOUT_MS = 15000;

function makeHeaders(referer?: string): Record<string, string> {
  const cookie = Deno.env.get("GITAM_SESSION_COOKIE") || "";
  return {
    Cookie: cookie,
    Accept: "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: referer || `${BASE}/Student/Marks1`,
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    "X-Requested-With": "XMLHttpRequest",
    "sec-ch-ua": '"Not:A-Brand";v="99", "Google Chrome";v="145"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
  };
}

// Upstream fetch with timeout
async function fetchWithTimeout(url: string, opts: RequestInit, timeoutMs = UPSTREAM_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { ...opts, signal: controller.signal });
    return resp;
  } finally {
    clearTimeout(timer);
  }
}

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// ── Cache helpers ──
async function cacheGet(key: string): Promise<any | null> {
  const sb = getSupabase();
  const { data } = await sb
    .from("gitam_cache")
    .select("payload, fetched_at, ttl_seconds")
    .eq("key", key)
    .single();
  if (!data) return null;
  const age = (Date.now() - new Date(data.fetched_at).getTime()) / 1000;
  if (age > data.ttl_seconds) return null;
  return data.payload;
}

async function cacheSet(key: string, payload: any, ttl = 604800) {
  const sb = getSupabase();
  await sb.from("gitam_cache").upsert({
    key,
    payload,
    fetched_at: new Date().toISOString(),
    ttl_seconds: ttl,
  });
}

// ── Attendance status ──
function atdStatus(pct: number): string {
  if (pct >= 85) return "safe";
  if (pct >= 75) return "ok";
  if (pct >= 65) return "warning";
  return "danger";
}

// ── Pick helper ──
function pick(row: any, ...keys: string[]): any {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== "" && String(v) !== "0") return v;
  }
  return null;
}

// ── filter_by_sem ──
function nullCount(r: any): number {
  return Object.values(r).filter((v) => v === null || v === undefined).length;
}

function availableSems(data: any[]): string[] {
  const s = new Set<string>();
  for (const r of data) {
    const sem = String(r.semester ?? "").trim();
    if (sem) s.add(sem);
  }
  return [...s].sort((a, b) => {
    const na = parseInt(a), nb = parseInt(b);
    return (isNaN(na) ? 99 : na) - (isNaN(nb) ? 99 : nb);
  });
}

function bestRows(rows: any[]): any[] {
  const seen: Record<string, any> = {};
  for (const r of rows) {
    const k = r.subjectcode || r.subjectname || "?";
    if (!seen[k] || nullCount(r) < nullCount(seen[k])) seen[k] = r;
  }
  return Object.values(seen);
}

function filterBySem(rawData: any[], sem: string) {
  const semRows = rawData.filter((r) => String(r.semester ?? "").trim() === sem);
  if (!semRows.length) {
    return { error: `No data for semester ${sem}.`, available_semesters: availableSems(rawData) };
  }

  let resultRows = semRows.filter((r) => String(r.type ?? "").toUpperCase() === "R");
  let sessionalRows = semRows.filter((r) => String(r.type ?? "").toUpperCase() === "S");
  if (!resultRows.length && !sessionalRows.length) resultRows = semRows;

  resultRows = bestRows(resultRows);
  sessionalRows = bestRows(sessionalRows);

  const info = semRows.find((r) => r.sgpa) || semRows[0];
  const sname = semRows.find((r) => r.studentname)?.studentname;

  const semTable = resultRows.map((r) => ({
    course_name: r.subjectname || "",
    course_code: r.subjectcode || "",
    category: r.cbcs_category || "",
    credits: r.subject_credits || "",
    subject_type: r.subject_type || "",
    grade: r.grade || "",
    grade_points: r.grade_points,
    month: r.month || "",
    year: r.year || "",
  }));

  const sessionalTable = sessionalRows.map((r) => ({
    course_name: r.subjectname || "",
    course_code: r.subjectcode || "",
    category: r.cbcs_category || "",
    s1_grade: r.grade || "",
    s1_marks: r.mid1,
    s1_month: r.month || "",
    s1_year: r.year || "",
    s2_grade: null,
    s2_marks: r.mid2,
    s2_month: null,
    s2_year: null,
    final_grade: r.grade || "",
  }));

  // Internal marks
  const internalMarks: any[] = [];
  const seen = new Set<string>();
  for (const r of semRows) {
    const c = r.subjectcode || r.subjectname;
    if (!c || seen.has(c)) continue;
    const m1 = r.mid1, m2 = r.mid2, mi = r.int_marks;
    if (m1 !== null || m2 !== null || mi !== null) {
      seen.add(c);
      internalMarks.push({
        subject_name: r.subjectname || "",
        subject_code: r.subjectcode || "",
        internal_marks: mi ?? m1 ?? m2,
        mid1: m1,
        mid2: m2,
      });
    }
  }

  return {
    student_name: sname || info.regdno || "—",
    regid: info.regdno || "",
    semid: sem,
    sgpa: info.sgpa || "N/A",
    cgpa: info.cgpa || "N/A",
    sem_credits: info.semestercredits || "",
    cum_credits: info.cumulativecredits || "",
    result_type: sessionalRows.length && !resultRows.length ? "sessional" : "semester",
    sem_table: semTable,
    sessional_table: sessionalTable,
    internal_marks: internalMarks,
  };
}

// ── Results handler ──
async function handleResults(body: any) {
  const reg = (body.reg || "").trim().toUpperCase();
  const sem = String(body.sem || "").trim();
  if (!reg) return json({ error: "Registration number is required" }, 400);
  if (!sem) return json({ error: "Semester is required" }, 400);

  const cached = await cacheGet(`marks:${reg}`);
  if (cached) {
    console.log(`[results] cache HIT for ${reg}`);
    const result = filterBySem(cached, sem);
    return json({ ...result, _cached: true });
  }

  console.log(`[results] cache MISS for ${reg}, fetching upstream`);
  const t0 = Date.now();
  try {
    const url = `${API_MARKS}?regdno=${encodeURIComponent(reg)}`;
    const resp = await fetchWithTimeout(url, { headers: makeHeaders() });
    const elapsed = Date.now() - t0;
    console.log(`[results] upstream responded in ${elapsed}ms, status=${resp.status}`);
    if (resp.status === 401 || resp.status === 403) {
      return json({ error: "Session expired. Update GITAM_SESSION_COOKIE secret." }, 401);
    }
    const ct = resp.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      return json({ error: "Non-JSON response — session likely expired.", hint: "Update GITAM_SESSION_COOKIE secret." }, 502);
    }
    const data = await resp.json();
    if (!Array.isArray(data)) {
      return json({ error: "Unexpected response from GITAM.", raw: String(data).slice(0, 300) }, 502);
    }
    await cacheSet(`marks:${reg}`, data);
    return json(filterBySem(data, sem));
  } catch (e: any) {
    const elapsed = Date.now() - t0;
    if (e.name === "AbortError") {
      console.log(`[results] upstream TIMEOUT after ${elapsed}ms`);
      return json({ error: "Upstream timeout. Please retry in a few seconds." }, 504);
    }
    console.log(`[results] upstream ERROR after ${elapsed}ms: ${e.message}`);
    return json({ error: `Request failed: ${e.message}` }, 502);
  }
}

// ── Attendance handler ──
async function handleAttendance(body: any) {
  const reg = (body.reg || "").trim().toUpperCase();
  if (!reg) return json({ error: "Registration number is required" }, 400);

  const cached = await cacheGet(`atd:${reg}`);
  if (cached) {
    console.log(`[attendance] cache HIT for ${reg}`);
    return json({ ...cached, _cached: true });
  }

  console.log(`[attendance] cache MISS for ${reg}, fetching upstream`);

  // 1. Subject-wise
  const subwise: any[] = [];
  let currentSem = "?";
  const t0 = Date.now();
  try {
    const r = await fetchWithTimeout(`${ATD_SUBJECT}?regno=${encodeURIComponent(reg)}`, {
      headers: makeHeaders(ATD_PAGE),
    });
    const elapsed = Date.now() - t0;
    console.log(`[attendance/subject] upstream responded in ${elapsed}ms, status=${r.status}`);
    const ct = r.headers.get("content-type") || "";
    if (r.status === 200 && ct.includes("application/json")) {
      const raw: any[] = await r.json();
      if (Array.isArray(raw) && raw.length) {
        const getSem = (row: any) => {
          for (const k of ["semester", "semid", "sem", "semno"]) {
            if (row[k] !== undefined) return String(row[k]).trim();
          }
          return "0";
        };
        const allSems = [...new Set(raw.map(getSem))].sort(
          (a, b) => (parseInt(a) || 0) - (parseInt(b) || 0)
        );
        currentSem = allSems[allSems.length - 1] || "?";
        const semRows = raw.filter((r) => getSem(r) === currentSem);

        for (const row of semRows) {
          const name = pick(row, "subjectname", "subject_name", "coursename", "course_name", "SubjectName", "sname");
          const code = pick(row, "subjectcode", "subject_code", "coursecode", "course_code", "SubjectCode", "scode");
          const rawPct = pick(row, "attendancepercentage", "percentage", "atdpercentage", "present_percentage", "atd_percentage", "Percentage");
          let pct = 0;
          try { pct = Math.round(parseFloat(rawPct)); } catch { pct = 0; }
          if (isNaN(pct)) pct = 0;
          subwise.push({
            subject_code: String(code || ""),
            subject_name: String(name || code || "—"),
            percentage: pct,
            status: atdStatus(pct),
          });
        }
      }
    }
  } catch (e: any) {
    const elapsed = Date.now() - t0;
    if (e.name === "AbortError") {
      console.log(`[attendance/subject] upstream TIMEOUT after ${elapsed}ms`);
      return json({ error: "Upstream timeout fetching attendance. Please retry in a few seconds." }, 504);
    }
    console.log(`[attendance/subject] upstream ERROR after ${elapsed}ms: ${e.message}`);
  }

  if (!subwise.length) {
    return json({
      error: "No subject-wise attendance data found.",
      hint: "Session may have expired. Update GITAM_SESSION_COOKIE secret.",
    }, 404);
  }
  subwise.sort((a, b) => a.percentage - b.percentage);

  // 2. Overall per semester
  const overallSems: any[] = [];
  try {
    const t1 = Date.now();
    const r2 = await fetchWithTimeout(`${ATD_OVERALL}?regno=${encodeURIComponent(reg)}`, {
      headers: makeHeaders(ATD_PAGE),
    });
    const elapsed2 = Date.now() - t1;
    console.log(`[attendance/overall] upstream responded in ${elapsed2}ms, status=${r2.status}`);
    const ct2 = r2.headers.get("content-type") || "";
    if (r2.status === 200 && ct2.includes("application/json")) {
      const raw2: any[] = await r2.json();
      if (Array.isArray(raw2)) {
        for (const row of raw2) {
          const semVal = pick(row, "semester", "semid", "sem", "semno") || "?";
          const ovrPct = pick(row, "overallatdpercentage", "percentage", "overall_percentage", "atdpercentage", "attendancepercentage", "Percentage");
          let opct = 0;
          try { opct = Math.round(parseFloat(ovrPct)); } catch { opct = 0; }
          if (isNaN(opct)) opct = 0;
          overallSems.push({ semester: String(semVal), overall_pct: opct, status: atdStatus(opct) });
        }
        overallSems.sort((a, b) => (parseInt(a.semester) || 0) - (parseInt(b.semester) || 0));
      }
    }
  } catch (e: any) {
    // Non-critical: overall sems is optional
    console.log(`[attendance/overall] error: ${e.message}`);
  }

  const pcts = subwise.map((s) => s.percentage);
  const avg = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;

  const result = {
    reg,
    semester: currentSem,
    subwise,
    overall_sems: overallSems,
    summary: {
      total_subjects: subwise.length,
      average_pct: avg,
      below_75: pcts.filter((p) => p < 75).length,
      below_85: pcts.filter((p) => p >= 75 && p < 85).length,
      safe: pcts.filter((p) => p >= 85).length,
      overall_status: atdStatus(avg),
    },
  };
  await cacheSet(`atd:${reg}`, result, 900); // 15 min
  return json(result);
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "POST required" }, 405);
  }

  try {
    const body = await req.json();

    // Determine action: path-based or body-based fallback
    const url = new URL(req.url);
    const pathAction = url.pathname.split("/").pop(); // "results" or "attendance"
    const action = (pathAction === "results" || pathAction === "attendance")
      ? pathAction
      : body.action; // fallback to body.action

    console.log(`[gitam-proxy] action=${action}`);

    if (action === "results") return await handleResults(body);
    if (action === "attendance") return await handleAttendance(body);
    return json({ error: "Unknown endpoint. Use /results or /attendance, or pass action in body." }, 404);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});
