import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Course } from "@/types/calculator";

interface SGPAResult {
  sgpa: number;
  totalCredits: number;
  totalGradePoints: number;
}

interface CGPAData {
  cgpa: number;
  previousCGPA: number;
  previousCredits: number;
  newTotalCredits: number;
}

export function generateGradeCard(
  courses: Course[],
  sgpaResult: SGPAResult,
  cgpaData?: CGPAData
) {
  const doc = new jsPDF();
  const validCourses = courses.filter(c => c.finalGradePoint !== null && c.name.trim() !== "");

  // Title
  doc.setFillColor(255, 107, 157); // pop-pink
  doc.rect(0, 0, 210, 30, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("Grade Card", 105, 20, { align: "center" });

  // Table data
  const headers = [["Subject Name", "Sessional 1", "Sessional 2", "LE", "Final Grade", "Credits"]];
  const body = validCourses.map(course => [
    course.name,
    course.assessments[0]?.gradeLabel ?? "—",
    course.assessments[1]?.gradeLabel ?? "—",
    course.assessments[2]?.gradeLabel ?? "—",
    course.letterGrade ?? "—",
    String(course.credits),
  ]);

  autoTable(doc, {
    startY: 38,
    head: headers,
    body,
    theme: "grid",
    headStyles: {
      fillColor: [78, 205, 196], // pop-cyan
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 11,
      halign: "center",
    },
    bodyStyles: {
      fontSize: 10,
      halign: "center",
    },
    columnStyles: {
      0: { halign: "left", fontStyle: "bold" },
    },
    alternateRowStyles: {
      fillColor: [240, 244, 255],
    },
  });

  // Summary section
  const finalY = (doc as any).lastAutoTable.finalY + 12;

  // SGPA box
  doc.setFillColor(16, 185, 129); // green
  doc.roundedRect(14, finalY, 182, 18, 4, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("SGPA", 24, finalY + 12);
  doc.text(sgpaResult.sgpa.toFixed(2), 120, finalY + 12, { align: "center" });
  doc.setFontSize(11);
  doc.text(`Total Credits: ${sgpaResult.totalCredits}`, 186, finalY + 12, { align: "right" });

  // CGPA box if available
  let nextY = finalY + 24;
  if (cgpaData) {
    doc.setFillColor(168, 85, 247); // purple
    doc.roundedRect(14, nextY, 182, 18, 4, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text("CGPA", 24, nextY + 12);
    doc.text(cgpaData.cgpa.toFixed(2), 120, nextY + 12, { align: "center" });
    doc.setFontSize(11);
    doc.text(`Total Credits: ${cgpaData.newTotalCredits}`, 186, nextY + 12, { align: "right" });
    nextY += 24;
  }

  // Statistics Section
  if (validCourses.length > 0) {
    nextY += 8;

    // Check if we need a new page
    if (nextY > 240) {
      doc.addPage();
      nextY = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(80, 80, 80);
    doc.text("📊 Statistics", 14, nextY);
    nextY += 10;

    // Bar chart data - Credits & Grade Points
    const barWidth = 20;
    const chartHeight = 60;
    const chartStartX = 14;
    const chartStartY = nextY + chartHeight;
    const maxGP = 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text("Credits & Grade Points", chartStartX, nextY);
    nextY += 5;

    // Y-axis
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.5);
    doc.line(chartStartX, nextY, chartStartX, chartStartY + 2);
    // X-axis
    doc.line(chartStartX, chartStartY + 2, chartStartX + validCourses.length * (barWidth + 8) + 10, chartStartY + 2);

    // Y-axis labels
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    for (let v = 0; v <= maxGP; v += 2) {
      const yPos = chartStartY - (v / maxGP) * chartHeight;
      doc.setTextColor(150, 150, 150);
      doc.text(String(v), chartStartX - 1, yPos + 1, { align: "right" });
      doc.setDrawColor(220, 220, 220);
      doc.line(chartStartX + 1, yPos, chartStartX + validCourses.length * (barWidth + 8) + 5, yPos);
    }

    // Bars
    validCourses.forEach((c, i) => {
      const gp = c.finalGradePoint ?? 0;
      const barH = (gp / maxGP) * chartHeight;
      const x = chartStartX + 6 + i * (barWidth + 8);
      doc.setFillColor(129, 140, 248); // indigo
      doc.roundedRect(x, chartStartY - barH, barWidth, barH + 2, 2, 2, "F");
      // Label
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      const label = c.name.length > 6 ? c.name.slice(0, 6) + "…" : c.name;
      doc.text(label, x + barWidth / 2, chartStartY + 8, { align: "center" });
    });

    // Grade Distribution table
    const distY = chartStartY + 18;

    if (distY > 250) {
      doc.addPage();
      nextY = 20;
    } else {
      nextY = distY;
    }

    // Calculate grade distribution
    const gradeDist: Record<string, number> = {};
    validCourses.forEach((c) => {
      const grade = c.letterGrade || "N/A";
      gradeDist[grade] = (gradeDist[grade] || 0) + 1;
    });

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text("Grade Distribution", 14, nextY);

    const distHeaders = [["Grade", "Count", "Percentage"]];
    const distBody = Object.entries(gradeDist).map(([grade, count]) => [
      grade,
      String(count),
      ((count / validCourses.length) * 100).toFixed(1) + "%",
    ]);

    autoTable(doc, {
      startY: nextY + 4,
      head: distHeaders,
      body: distBody,
      theme: "grid",
      headStyles: {
        fillColor: [110, 231, 183],
        textColor: [30, 30, 30],
        fontStyle: "bold",
        fontSize: 9,
        halign: "center",
      },
      bodyStyles: { fontSize: 9, halign: "center" },
      tableWidth: 80,
      margin: { left: 14 },
    });
  }

  doc.save("grade-card.pdf");
}
