import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Course, GRADE_MAPPINGS } from "@/types/calculator";

const COLORS = ["#6ee7b7", "#818cf8", "#f472b6", "#fbbf24", "#38bdf8", "#a78bfa", "#fb923c", "#ef4444"];

interface Props {
  courses: Course[];
}

export function InteractiveCharts({ courses }: Props) {
  const validCourses = useMemo(
    () => courses.filter((c) => c.finalGradePoint !== null && c.name.trim()),
    [courses]
  );

  const barData = useMemo(
    () => validCourses.map((c) => ({
      name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
      credits: c.credits,
      gradePoint: c.finalGradePoint ?? 0,
    })),
    [validCourses]
  );

  const lineData = useMemo(
    () => validCourses.map((c, i) => ({
      index: i + 1,
      name: c.name.length > 10 ? c.name.slice(0, 10) + "…" : c.name,
      gp: c.finalGradePoint ?? 0,
    })),
    [validCourses]
  );

  const pieData = useMemo(() => {
    const dist: Record<string, number> = {};
    validCourses.forEach((c) => {
      const grade = c.letterGrade || "N/A";
      dist[grade] = (dist[grade] || 0) + 1;
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }, [validCourses]);

  if (validCourses.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader><CardTitle className="text-sm">—</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[200px] rounded-lg skeleton-shimmer" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const chartConfig = {
    gradePoint: { label: "Grade Point", color: "hsl(var(--primary))" },
    credits: { label: "Credits", color: "hsl(var(--accent))" },
    gp: { label: "Grade Point", color: "hsl(168 72% 40%)" },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Bar: Credits per grade */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display">Credits & Grade Points</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="gradePoint" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Line: GP trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display">Grade Point Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="gp" stroke="hsl(168 72% 40%)" strokeWidth={2} dot={{ r: 4, fill: "hsl(168 72% 40%)" }} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Donut: Grade distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display">Grade Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}(${value})`}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
