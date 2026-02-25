import { AlertTriangle } from "lucide-react";
import type { AttendanceItem } from "@/lib/gitam-data-parser";

interface AttendanceWarningProps {
  subjects: AttendanceItem[];
}

export function AttendanceWarning({ subjects }: AttendanceWarningProps) {
  const lowAttendance = subjects.filter((s) => s.percentage < 75);
  if (lowAttendance.length === 0) return null;

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2">
      <div className="flex items-center gap-2 text-destructive font-display font-semibold">
        <AlertTriangle className="w-5 h-5" />
        <span>Attendance Below 75%</span>
      </div>
      <ul className="space-y-1">
        {lowAttendance.map((s) => (
          <li key={s.code} className="text-sm text-muted-foreground flex justify-between">
            <span>{s.code} — {s.name}</span>
            <span className="font-semibold text-destructive">{s.percentage.toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
