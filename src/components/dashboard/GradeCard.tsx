import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GradeItem } from "@/lib/gitam-data-parser";

interface GradeCardProps {
  grade: GradeItem;
  attendancePercentage?: number;
}

function gradeColor(grade: string): string {
  const g = grade.toUpperCase();
  if (g === "O") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (g === "A+" || g === "A") return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  if (g === "B+" || g === "B") return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  if (g === "C" || g === "P") return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  if (g === "F") return "bg-destructive/20 text-destructive border-destructive/30";
  return "bg-muted text-muted-foreground border-border";
}

export function GradeCard({ grade, attendancePercentage }: GradeCardProps) {
  return (
    <Card className="hover-lift transition-all">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground font-mono">{grade.code}</p>
            <h4 className="font-display text-sm font-semibold leading-tight truncate">{grade.name}</h4>
          </div>
          <Badge variant="outline" className={`shrink-0 text-base font-bold px-3 py-1 ${gradeColor(grade.grade)}`}>
            {grade.grade || "—"}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-muted/50 rounded-md p-2 text-center">
            <p className="text-muted-foreground">Internal</p>
            <p className="font-semibold">{grade.internal || "—"}</p>
          </div>
          <div className="bg-muted/50 rounded-md p-2 text-center">
            <p className="text-muted-foreground">External</p>
            <p className="font-semibold">{grade.external || "—"}</p>
          </div>
          <div className="bg-muted/50 rounded-md p-2 text-center">
            <p className="text-muted-foreground">Credits</p>
            <p className="font-semibold">{grade.credits}</p>
          </div>
        </div>

        {attendancePercentage !== undefined && (
          <div className={`text-xs font-medium px-2 py-1 rounded-md ${
            attendancePercentage < 75
              ? "bg-destructive/10 text-destructive"
              : "bg-emerald-500/10 text-emerald-500"
          }`}>
            Attendance: {attendancePercentage.toFixed(1)}%
            {attendancePercentage < 75 && " ⚠️"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
