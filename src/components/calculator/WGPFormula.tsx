import { Assessment } from "@/types/calculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, FlaskConical } from "lucide-react";

interface WGPFormulaProps {
  assessments: Assessment[];
  wgp: number;
  hasLab?: boolean;
  labMarks?: number | null;
  finalGradePoint?: number | null;
}

export function WGPFormula({
  assessments,
  wgp,
  hasLab = false,
  labMarks = null,
  finalGradePoint = null,
}: WGPFormulaProps) {
  const rawWGP = assessments.reduce((sum, a) => sum + a.gradePoint! * a.weight, 0);
  const theoryContribution = (rawWGP / 10) * 100 * 0.70;
  const labContribution = labMarks !== null ? labMarks * 0.30 : null;
  const finalPercentage = labContribution !== null ? theoryContribution + labContribution : null;

  const ceiledWGP = Math.min(10, Math.ceil(rawWGP));

  return (
    <Card className="bg-muted/30 border-dashed border-2 border-primary/20 rounded-2xl overflow-hidden">
      <CardHeader className="pb-2 px-4 sm:px-5">
        <CardTitle className="text-sm flex items-center gap-2 text-primary font-display">
          <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calculator className="w-4 h-4 text-primary" />
          </div>
          Step-by-Step Calculation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm px-4 sm:px-5">
        <div className="font-mono bg-card p-3 sm:p-4 rounded-xl border-2 border-foreground/10 space-y-1.5 overflow-x-auto text-xs sm:text-sm">
          <div className="text-muted-foreground whitespace-nowrap">
            WGP = (S1 × 0.30) + (S2 × 0.45) + (LE × 0.25)
          </div>
          <div className="text-muted-foreground whitespace-nowrap">
            WGP = ({assessments[0].gradePoint?.toFixed(1)} × 0.30) + (
            {assessments[1].gradePoint?.toFixed(1)} × 0.45) + (
            {assessments[2].gradePoint?.toFixed(1)} × 0.25)
          </div>
          <div className="text-muted-foreground whitespace-nowrap">
            WGP = {(assessments[0].gradePoint! * 0.30).toFixed(2)} +{" "}
            {(assessments[1].gradePoint! * 0.45).toFixed(2)} +{" "}
            {(assessments[2].gradePoint! * 0.25).toFixed(2)}
          </div>
          <div className="text-muted-foreground">WGP = {rawWGP.toFixed(2)}</div>
          <div className="text-muted-foreground">WGP = ceil({rawWGP.toFixed(2)})</div>
          <div className="text-foreground font-bold text-base sm:text-lg">
            WGP = <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{ceiledWGP.toFixed(2)}</span>
          </div>
        </div>

        {hasLab && labMarks !== null && finalGradePoint !== null && (
          <div className="font-mono bg-card p-3 sm:p-4 rounded-xl border-2 border-pop-cyan/20 space-y-1.5 overflow-x-auto text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-pop-cyan font-bold font-display text-sm not-italic">
              <FlaskConical className="w-4 h-4" />
              Lab + Theory Calculation
            </div>
            <div className="text-muted-foreground whitespace-nowrap">
              Final GP = [(WGP ÷ 10 × 100 × 0.70) + (Lab × 0.30)] ÷ 10
            </div>
            <div className="text-muted-foreground whitespace-nowrap">
              Theory = ({rawWGP.toFixed(2)} ÷ 10) × 100 × 0.70 = {theoryContribution.toFixed(2)}
            </div>
            <div className="text-muted-foreground whitespace-nowrap">
              Lab = {labMarks} × 0.30 = {labContribution?.toFixed(2)}
            </div>
            <div className="text-muted-foreground whitespace-nowrap">
              Final % = {theoryContribution.toFixed(2)} + {labContribution?.toFixed(2)} = {finalPercentage?.toFixed(2)}
            </div>
            <div className="text-foreground font-bold text-base sm:text-lg">
              Final Grade Point = <span className="text-pop-cyan bg-pop-cyan/10 px-2 py-0.5 rounded-lg">{finalGradePoint.toFixed(2)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
