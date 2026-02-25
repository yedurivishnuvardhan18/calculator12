import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import type { SubjectResult, OverallResult } from "@/types/attendance";

interface ResultsDashboardProps {
  subjectResults: SubjectResult[];
  overallResult: OverallResult;
  targetPercentage: number;
}

const statusColors = {
  safe: "text-success",
  warning: "text-warning",
  critical: "text-destructive",
};

const statusBg = {
  safe: "bg-success/10 border-success/30",
  warning: "bg-warning/10 border-warning/30",
  critical: "bg-destructive/10 border-destructive/30",
};

const statusLabels = {
  safe: "✅ Safe",
  warning: "⚠️ Warning",
  critical: "🔴 Critical",
};

const PIE_COLORS = ["hsl(152,60%,42%)", "hsl(0,72%,51%)"];

export function ResultsDashboard({ subjectResults, overallResult, targetPercentage }: ResultsDashboardProps) {
  const pieData = [
    { name: "Attended", value: overallResult.totalAttended },
    { name: "Missed", value: overallResult.totalConducted - overallResult.totalAttended },
  ];

  return (
    <div className="space-y-6">
      {/* Overall stats */}
      <Card className="border-2 border-primary/30 pop-shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display">📈 Overall Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <Stat label="Conducted" value={overallResult.totalConducted} />
            <Stat label="Attended" value={overallResult.totalAttended} />
            <Stat label="Overall %" value={`${overallResult.overallPercentage.toFixed(1)}%`}
              color={overallResult.overallPercentage >= targetPercentage ? "text-success" : "text-destructive"} />
            <Stat label="Safe Bunks" value={overallResult.safeBunkLimit} />
          </div>
          <div className="flex justify-center">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" strokeWidth={2}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Subject cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subjectResults.map((r) => (
          <Card key={r.code} className={cn("border-2 hover-lift", statusBg[r.status])}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display font-semibold text-sm">{r.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{r.code}</p>
                </div>
                <span className={cn("text-xs font-bold", statusColors[r.status])}>{statusLabels[r.status]}</span>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>{r.present}/{r.total} classes</span>
                  <span className={cn("font-bold", statusColors[r.status])}>{r.currentPercentage.toFixed(1)}%</span>
                </div>
                <Progress value={r.currentPercentage} className="h-2" />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <MiniStat label="Future" value={r.futureClasses} />
                <MiniStat label="Required" value={r.requiredClasses} color={r.requiredClasses > 0 ? "text-destructive" : "text-success"} />
                <MiniStat label="Bunkable" value={r.bunkableClasses} color={r.bunkableClasses > 0 ? "text-success" : "text-destructive"} />
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Projected: <span className="font-bold">{r.projectedPercentage.toFixed(1)}%</span> (if attending all)
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-xl font-display font-bold", color)}>{value}</p>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-bold font-display", color)}>{value}</p>
    </div>
  );
}
