import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import type { SubjectResult, OverallResult, AttendanceConfig } from "@/types/attendance";

export function generateAttendancePDF(
  subjectResults: SubjectResult[],
  overallResult: OverallResult,
  config: AttendanceConfig
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Smart Attendance Report", pageWidth / 2, 20, { align: "center" });

  // Date range
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Period: ${format(config.fromDate, "dd MMM yyyy")} — ${format(config.toDate, "dd MMM yyyy")}  |  Target: ${config.targetPercentage}%`,
    pageWidth / 2,
    28,
    { align: "center" }
  );

  // Overall summary
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Overall Summary", 14, 40);

  autoTable(doc, {
    startY: 44,
    head: [["Total Conducted", "Total Attended", "Overall %", "Safe Bunk Limit", "Required Classes"]],
    body: [[
      overallResult.totalConducted,
      overallResult.totalAttended,
      `${overallResult.overallPercentage.toFixed(1)}%`,
      overallResult.safeBunkLimit,
      overallResult.requiredClasses,
    ]],
    theme: "grid",
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 9 },
  });

  // Subject-wise breakdown
  const finalY = (doc as any).lastAutoTable?.finalY ?? 70;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Subject-wise Breakdown", 14, finalY + 10);

  autoTable(doc, {
    startY: finalY + 14,
    head: [["Code", "Subject", "Present", "Total", "Current %", "Future", "Required", "Bunkable", "Projected %", "Status"]],
    body: subjectResults.map((r) => [
      r.code,
      r.name.length > 25 ? r.name.slice(0, 22) + "..." : r.name,
      r.present,
      r.total,
      `${r.currentPercentage.toFixed(1)}%`,
      r.futureClasses,
      r.requiredClasses,
      r.bunkableClasses,
      `${r.projectedPercentage.toFixed(1)}%`,
      r.status.toUpperCase(),
    ]),
    theme: "grid",
    headStyles: { fillColor: [99, 102, 241], fontSize: 7 },
    styles: { fontSize: 7 },
    columnStyles: { 1: { cellWidth: 35 } },
  });

  doc.save("attendance-report.pdf");
}
