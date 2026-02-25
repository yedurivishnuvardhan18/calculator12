import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { GradeItem, AttendanceItem } from "@/lib/gitam-data-parser";

interface ExportButtonsProps {
  grades: GradeItem[];
  attendance: AttendanceItem[];
  semester: string;
}

export function ExportButtons({ grades, attendance, semester }: ExportButtonsProps) {
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`GITAM Academic Report — ${semester}`, 14, 20);

    if (grades.length > 0) {
      doc.setFontSize(13);
      doc.text("Grades", 14, 32);
      autoTable(doc, {
        startY: 36,
        head: [["Code", "Subject", "Credits", "Internal", "External", "Grade", "GP"]],
        body: grades.map((g) => [g.code, g.name.slice(0, 30), g.credits, g.internal, g.external, g.grade, g.gradePoint ?? "—"]),
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241] },
        styles: { fontSize: 8 },
      });
    }

    if (attendance.length > 0) {
      const y = (doc as any).lastAutoTable?.finalY ?? 50;
      doc.setFontSize(13);
      doc.text("Attendance", 14, y + 10);
      autoTable(doc, {
        startY: y + 14,
        head: [["Code", "Subject", "Present", "Total", "Percentage"]],
        body: attendance.map((a) => [a.code, a.name.slice(0, 30), a.present, a.total, `${a.percentage.toFixed(1)}%`]),
        theme: "grid",
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 8 },
      });
    }

    doc.save(`gitam-report-${semester.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  };

  const exportCSV = () => {
    const lines: string[] = [];
    if (grades.length > 0) {
      lines.push("Code,Subject,Credits,Internal,External,Grade,GradePoint");
      grades.forEach((g) => lines.push(`${g.code},"${g.name}",${g.credits},${g.internal},${g.external},${g.grade},${g.gradePoint ?? ""}`));
      lines.push("");
    }
    if (attendance.length > 0) {
      lines.push("Code,Subject,Present,Total,Percentage");
      attendance.forEach((a) => lines.push(`${a.code},"${a.name}",${a.present},${a.total},${a.percentage}`));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gitam-report-${semester.replace(/\s+/g, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={exportPDF}>
        <Download className="w-4 h-4 mr-1" /> PDF
      </Button>
      <Button variant="outline" size="sm" onClick={exportCSV}>
        <Download className="w-4 h-4 mr-1" /> CSV
      </Button>
    </div>
  );
}
