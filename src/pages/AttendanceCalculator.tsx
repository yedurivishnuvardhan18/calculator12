import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Download } from "lucide-react";
import { addMonths } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AttendanceStepIndicator } from "@/components/attendance/AttendanceStepIndicator";
import { ImageUploader } from "@/components/attendance/ImageUploader";
import { TimetableEditor } from "@/components/attendance/TimetableEditor";
import { AttendanceEditor } from "@/components/attendance/AttendanceEditor";
import { DateRangeConfig } from "@/components/attendance/DateRangeConfig";
import { ResultsDashboard } from "@/components/attendance/ResultsDashboard";
import { WhatIfSimulator } from "@/components/attendance/WhatIfSimulator";
import { calculateSubjectResults, calculateOverallResult } from "@/lib/attendance-calculator";
import { generateAttendancePDF } from "@/lib/attendance-pdf";
import type { TimetableSchedule, SubjectAttendance, AttendanceConfig, DayOfWeek } from "@/types/attendance";

const defaultConfig: AttendanceConfig = {
  fromDate: new Date(),
  toDate: addMonths(new Date(), 2),
  workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as DayOfWeek[],
  holidays: [],
  targetPercentage: 75,
};

export default function AttendanceCalculator() {
  const [step, setStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Step 1
  const [timetable, setTimetable] = useState<TimetableSchedule>({});
  const [ttImage, setTtImage] = useState<string | null>(null);
  const [ttLoading, setTtLoading] = useState(false);

  // Step 2
  const [attendance, setAttendance] = useState<SubjectAttendance[]>([]);
  const [attImage, setAttImage] = useState<string | null>(null);
  const [attLoading, setAttLoading] = useState(false);

  // Step 3
  const [config, setConfig] = useState<AttendanceConfig>(defaultConfig);

  // Calculations
  const subjectResults = useMemo(
    () => (attendance.length > 0 ? calculateSubjectResults(attendance, timetable, config) : []),
    [attendance, timetable, config]
  );
  const overallResult = useMemo(
    () => calculateOverallResult(subjectResults, config.targetPercentage),
    [subjectResults, config.targetPercentage]
  );

  const extractTimetable = async ({ base64, mimeType }: { base64: string; mimeType: string }) => {
    setTtLoading(true);
    setTtImage(base64);
    try {
      const { data, error } = await supabase.functions.invoke("extract-timetable", {
        body: { imageBase64: base64, mimeType },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setTimetable(data);
      toast({ title: "Timetable extracted!", description: "Review and edit below." });
    } catch (e: any) {
      const msg = e.message?.includes("fetch") || e.message?.includes("network")
        ? "Network error — try a smaller/cropped image or check your connection."
        : e.message || "Extraction failed";
      toast({ title: "Extraction failed", description: msg, variant: "destructive" });
    } finally {
      setTtLoading(false);
    }
  };

  const extractAttendance = async ({ base64, mimeType }: { base64: string; mimeType: string }) => {
    setAttLoading(true);
    setAttImage(base64);
    try {
      const { data, error } = await supabase.functions.invoke("extract-attendance", {
        body: { imageBase64: base64, mimeType },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAttendance(data);
      toast({ title: "Attendance extracted!", description: "Review and edit below." });
    } catch (e: any) {
      const msg = e.message?.includes("fetch") || e.message?.includes("network")
        ? "Network error — try a smaller/cropped image or check your connection."
        : e.message || "Extraction failed";
      toast({ title: "Extraction failed", description: msg, variant: "destructive" });
    } finally {
      setAttLoading(false);
    }
  };

  const goNext = () => {
    if (step === 1 && Object.keys(timetable).length === 0) {
      toast({ title: "Add timetable first", variant: "destructive" });
      return;
    }
    if (step === 2 && attendance.length === 0) {
      toast({ title: "Add attendance data first", variant: "destructive" });
      return;
    }
    setCompletedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
    setStep((s) => Math.min(s + 1, 4));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleDownloadPDF = () => {
    generateAttendancePDF(subjectResults, overallResult, config);
    toast({ title: "PDF downloaded!" });
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-4xl py-6 px-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-2">
          <h1 className="text-2xl sm:text-3xl font-display font-bold">
            <span className="text-pop-cyan">Smart</span> Attendance Calculator
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Upload → Edit → Calculate → Download</p>
        </motion.div>

        <AttendanceStepIndicator currentStep={step} completedSteps={completedSteps} />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Step 1: Timetable */}
            {step === 1 && (
              <>
                <ImageUploader
                  label="Upload Timetable Image"
                  description="Drag & drop or click to upload your weekly timetable"
                  onImageSelected={extractTimetable}
                  isLoading={ttLoading}
                  preview={ttImage}
                  onClear={() => { setTtImage(null); setTimetable({}); }}
                />
                {Object.keys(timetable).length > 0 && (
                  <TimetableEditor schedule={timetable} onChange={setTimetable} />
                )}
              </>
            )}

            {/* Step 2: Attendance */}
            {step === 2 && (
              <>
                <ImageUploader
                  label="Upload Attendance Image"
                  description="Drag & drop or click to upload your attendance summary"
                  onImageSelected={extractAttendance}
                  isLoading={attLoading}
                  preview={attImage}
                  onClear={() => { setAttImage(null); setAttendance([]); }}
                />
                <AttendanceEditor subjects={attendance} onChange={setAttendance} />
              </>
            )}

            {/* Step 3: Config */}
            {step === 3 && <DateRangeConfig config={config} onChange={setConfig} />}

            {/* Step 4: Results */}
            {step === 4 && subjectResults.length > 0 && (
              <>
                <ResultsDashboard
                  subjectResults={subjectResults}
                  overallResult={overallResult}
                  targetPercentage={config.targetPercentage}
                />
                <WhatIfSimulator subjectResults={subjectResults} targetPercentage={config.targetPercentage} />
                <div className="flex justify-center pt-2">
                  <Button onClick={handleDownloadPDF} size="lg" className="pop-shadow">
                    <Download className="w-4 h-4 mr-2" /> Download PDF Report
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-6 pb-8">
          <Button variant="outline" onClick={goBack} disabled={step === 1}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          {step < 4 ? (
            <Button onClick={goNext}>
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button variant="outline" onClick={() => { setStep(1); setCompletedSteps([]); }}>
              Start Over
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
