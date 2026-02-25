import { format, eachDayOfInterval, isSameDay } from "date-fns";
import type {
  DayOfWeek,
  TimetableSchedule,
  SubjectAttendance,
  AttendanceConfig,
  SubjectResult,
  OverallResult,
} from "@/types/attendance";

const DAY_NAMES: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getDayName(date: Date): DayOfWeek {
  const jsDay = date.getDay(); // 0=Sun
  return DAY_NAMES[(jsDay + 6) % 7] ?? 'Monday'; // shift so 0=Mon
}

export function countWorkingDays(
  from: Date,
  to: Date,
  workingDays: DayOfWeek[],
  holidays: Date[]
): Map<DayOfWeek, number> {
  const counts = new Map<DayOfWeek, number>();
  workingDays.forEach((d) => counts.set(d, 0));

  if (from > to) return counts;

  const days = eachDayOfInterval({ start: from, end: to });
  for (const day of days) {
    const name = getDayName(day);
    if (!workingDays.includes(name)) continue;
    if (holidays.some((h) => isSameDay(h, day))) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return counts;
}

export function getSubjectClassesInRange(
  timetable: TimetableSchedule,
  workingDayCounts: Map<DayOfWeek, number>
): Map<string, number> {
  const subjectFuture = new Map<string, number>();

  for (const [day, subjects] of Object.entries(timetable)) {
    const dayCount = workingDayCounts.get(day as DayOfWeek) ?? 0;
    for (const code of subjects) {
      if (!code || code.trim() === '') continue;
      subjectFuture.set(code, (subjectFuture.get(code) ?? 0) + dayCount);
    }
  }
  return subjectFuture;
}

export function calculateSubjectResults(
  attendance: SubjectAttendance[],
  timetable: TimetableSchedule,
  config: AttendanceConfig
): SubjectResult[] {
  const dayCounts = countWorkingDays(config.fromDate, config.toDate, config.workingDays, config.holidays);
  const futureMap = getSubjectClassesInRange(timetable, dayCounts);

  return attendance.map((sub) => {
    const futureClasses = futureMap.get(sub.code) ?? 0;
    const currentPercentage = sub.total > 0 ? (sub.present / sub.total) * 100 : 0;
    const target = config.targetPercentage;

    // Required to reach target considering future classes
    const totalAfter = sub.total + futureClasses;
    const needed = Math.ceil((target / 100) * totalAfter) - sub.present;
    const requiredClasses = Math.max(0, needed);

    // Bunkable: how many future classes can be skipped while staying at target
    const bunkable = futureClasses - requiredClasses;
    const bunkableClasses = Math.max(0, Math.min(bunkable, futureClasses));

    // Projected % if attending all future classes
    const projectedPercentage = totalAfter > 0 ? ((sub.present + futureClasses) / totalAfter) * 100 : 0;

    // Status
    let status: 'safe' | 'warning' | 'critical';
    if (currentPercentage >= target + 5) status = 'safe';
    else if (currentPercentage >= target) status = 'warning';
    else status = 'critical';

    return {
      code: sub.code,
      name: sub.name,
      currentPercentage,
      present: sub.present,
      total: sub.total,
      futureClasses,
      requiredClasses,
      bunkableClasses,
      projectedPercentage,
      status,
    };
  });
}

export function calculateOverallResult(
  results: SubjectResult[],
  targetPercentage: number
): OverallResult {
  const totalConducted = results.reduce((s, r) => s + r.total, 0);
  const totalAttended = results.reduce((s, r) => s + r.present, 0);
  const totalFutureClasses = results.reduce((s, r) => s + r.futureClasses, 0);
  const overallPercentage = totalConducted > 0 ? (totalAttended / totalConducted) * 100 : 0;

  const totalAfter = totalConducted + totalFutureClasses;
  const needed = Math.ceil((targetPercentage / 100) * totalAfter) - totalAttended;
  const requiredClasses = Math.max(0, needed);
  const safeBunkLimit = Math.max(0, totalFutureClasses - requiredClasses);

  return { totalConducted, totalAttended, overallPercentage, safeBunkLimit, requiredClasses, totalFutureClasses };
}

export function whatIfSkip(present: number, total: number, skipCount: number): number {
  const newTotal = total + skipCount;
  return newTotal > 0 ? (present / newTotal) * 100 : 0;
}

export function whatIfAttend(present: number, total: number, attendCount: number): number {
  const newTotal = total + attendCount;
  const newPresent = present + attendCount;
  return newTotal > 0 ? (newPresent / newTotal) * 100 : 0;
}
