import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { loadImportedData, calculateSGPA } from "@/lib/gitam-data-parser";
import { GradeCard } from "@/components/dashboard/GradeCard";
import { AttendanceWarning } from "@/components/dashboard/AttendanceWarning";
import { SemesterFilter } from "@/components/dashboard/SemesterFilter";
import { ExportButtons } from "@/components/dashboard/ExportButtons";
import { Upload, GraduationCap, CalendarCheck, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const PIE_COLORS = ["hsl(152,60%,42%)", "hsl(0,72%,51%)"];

export default function Dashboard() {
  const { grades, attendance } = loadImportedData();
  const [selectedSemester, setSelectedSemester] = useState("all");

  const semesters = useMemo(() => {
    if (!grades) return [];
    return [grades.semester].filter(Boolean);
  }, [grades]);

  const filteredGrades = useMemo(() => {
    if (!grades) return [];
    if (selectedSemester === "all") return grades.data;
    return grades.data;
  }, [grades, selectedSemester]);

  const attendanceData = attendance?.data ?? [];

  const sgpa = useMemo(() => calculateSGPA(filteredGrades), [filteredGrades]);

  // Build attendance lookup by code
  const attendanceMap = useMemo(() => {
    const map: Record<string, number> = {};
    attendanceData.forEach((a) => { map[a.code] = a.percentage; });
    return map;
  }, [attendanceData]);

  // Chart data
  const gradeChartData = filteredGrades.map((g) => ({
    name: g.code,
    gp: g.gradePoint ?? 0,
  }));

  const totalPresent = attendanceData.reduce((s, a) => s + a.present, 0);
  const totalClasses = attendanceData.reduce((s, a) => s + a.total, 0);
  const overallAttendance = totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 0;
  const attendancePieData = totalClasses > 0
    ? [{ name: "Present", value: totalPresent }, { name: "Absent", value: totalClasses - totalPresent }]
    : [];

  if (!grades && !attendance) {
    return (
      <main className="container max-w-2xl py-16 text-center space-y-4">
        <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
        <h1 className="font-display text-2xl font-bold">No Data Imported</h1>
        <p className="text-muted-foreground">Import your GITAM grades and attendance first.</p>
        <Button asChild><Link to="/import">Go to Import</Link></Button>
      </main>
    );
  }

  return (
    <main className="container max-w-6xl py-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Academic Dashboard</h1>
          {grades && <p className="text-muted-foreground text-sm">Semester: {grades.semester} • Extracted {new Date(grades.extractedAt).toLocaleDateString()}</p>}
        </div>
        <div className="flex items-center gap-3">
          {semesters.length > 0 && <SemesterFilter semesters={semesters} selected={selectedSemester} onChange={setSelectedSemester} />}
          <ExportButtons grades={filteredGrades} attendance={attendanceData} semester={selectedSemester === "all" ? "All" : selectedSemester} />
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <GraduationCap className="w-6 h-6 mx-auto text-primary mb-1" />
            <p className="text-2xl font-display font-bold">{sgpa !== null ? sgpa.toFixed(2) : "—"}</p>
            <p className="text-xs text-muted-foreground">SGPA</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto text-accent mb-1" />
            <p className="text-2xl font-display font-bold">{filteredGrades.length}</p>
            <p className="text-xs text-muted-foreground">Subjects</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CalendarCheck className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
            <p className="text-2xl font-display font-bold">{overallAttendance > 0 ? `${overallAttendance.toFixed(1)}%` : "—"}</p>
            <p className="text-xs text-muted-foreground">Overall Attendance</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Badge variant="outline" className={`text-lg font-bold ${overallAttendance >= 75 ? "border-emerald-500/30 text-emerald-500" : "border-destructive/30 text-destructive"}`}>
              {overallAttendance >= 75 ? "✓ Safe" : "⚠ Low"}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">Attendance Status</p>
          </CardContent>
        </Card>
      </div>

      {/* Warnings */}
      {attendanceData.length > 0 && <AttendanceWarning subjects={attendanceData} />}

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {gradeChartData.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Grade Points by Subject</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={gradeChartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="gp" fill="hsl(243,75%,59%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        {attendancePieData.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Attendance Overview</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={attendancePieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {attendancePieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Grade Cards Grid */}
      {filteredGrades.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold">Subject-wise Grades</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGrades.map((g) => (
              <GradeCard key={g.code} grade={g} attendancePercentage={attendanceMap[g.code]} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
