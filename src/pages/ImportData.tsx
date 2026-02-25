import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BookOpen, ClipboardPaste, GraduationCap, CalendarCheck, CheckCircle2, ArrowRight, Info } from "lucide-react";
import { getGradesBookmarklet, getAttendanceBookmarklet } from "@/lib/bookmarklet-scripts";
import { autoDetectAndParse, saveImportedData, loadImportedData } from "@/lib/gitam-data-parser";
import { motion } from "framer-motion";

export default function ImportData() {
  const navigate = useNavigate();
  const [jsonText, setJsonText] = useState("");
  const [importedGrades, setImportedGrades] = useState(!!loadImportedData().grades);
  const [importedAttendance, setImportedAttendance] = useState(!!loadImportedData().attendance);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJsonText(text);
      handleImport(text);
    } catch {
      toast.error("Clipboard access blocked. Please paste manually in the text area below.");
    }
  };

  const handleImport = (text?: string) => {
    const raw = text || jsonText;
    if (!raw.trim()) { toast.error("Paste your extracted JSON data first."); return; }

    const result = autoDetectAndParse(raw);
    if (result.type === "error") { toast.error(result.error); return; }

    if (result.type === "grades") {
      saveImportedData({ grades: result.data });
      setImportedGrades(true);
      toast.success(`Imported ${result.data.data.length} subjects' grades (${result.data.semester})`);
    } else {
      saveImportedData({ attendance: result.data });
      setImportedAttendance(true);
      toast.success(`Imported ${result.data.data.length} subjects' attendance`);
    }
    setJsonText("");
  };

  const gradesBookmarklet = getGradesBookmarklet();
  const attendanceBookmarklet = getAttendanceBookmarklet();

  const steps = [
    { num: 1, text: "Log in to your GITAM portal at login.gitam.edu" },
    { num: 2, text: "Navigate to the Grades or Attendance page" },
    { num: 3, text: "Click the bookmarklet button in your bookmarks bar" },
    { num: 4, text: "Come back here and paste the extracted data" },
  ];

  return (
    <main className="container max-w-4xl py-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
        <h1 className="font-display text-3xl font-bold">Import GITAM Data</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Extract your grades and attendance from the GITAM portal using bookmarklets — your credentials never leave your browser.
        </p>
      </motion.div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Info className="w-5 h-5 text-primary" /> How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {steps.map((s) => (
              <li key={s.num} className="flex items-start gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-display font-bold text-sm shrink-0">{s.num}</span>
                <span className="text-sm text-muted-foreground pt-0.5">{s.text}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Bookmarklets */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" /> Extract Grades
            </CardTitle>
            <CardDescription>Drag this to your bookmarks bar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <a
              href={gradesBookmarklet}
              onClick={(e) => e.preventDefault()}
              draggable
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm cursor-grab active:cursor-grabbing hover:bg-primary/90 transition-colors"
            >
              <BookOpen className="w-4 h-4" /> 📎 Extract Grades
            </a>
            <p className="text-xs text-muted-foreground">Drag this button to your bookmarks bar. Then click it while on the GITAM grades page.</p>
            {importedGrades && <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Grades imported</Badge>}
          </CardContent>
        </Card>

        <Card className="border-accent/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-accent" /> Extract Attendance
            </CardTitle>
            <CardDescription>Drag this to your bookmarks bar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <a
              href={attendanceBookmarklet}
              onClick={(e) => e.preventDefault()}
              draggable
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground font-semibold text-sm cursor-grab active:cursor-grabbing hover:bg-accent/90 transition-colors"
            >
              <BookOpen className="w-4 h-4" /> 📎 Extract Attendance
            </a>
            <p className="text-xs text-muted-foreground">Drag this button to your bookmarks bar. Then click it while on the GITAM attendance page.</p>
            {importedAttendance && <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Attendance imported</Badge>}
          </CardContent>
        </Card>
      </div>

      {/* Paste Area */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2"><ClipboardPaste className="w-5 h-5" /> Paste Extracted Data</CardTitle>
          <CardDescription>After running the bookmarklet, paste the JSON here</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button onClick={handlePaste} variant="outline" className="shrink-0">
              <ClipboardPaste className="w-4 h-4 mr-1" /> Paste from Clipboard
            </Button>
            <Button onClick={() => handleImport()} disabled={!jsonText.trim()}>
              Import Data
            </Button>
          </div>
          <Textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder='{"type":"gitam-grades","version":1,...}'
            className="min-h-[120px] font-mono text-xs"
          />
        </CardContent>
      </Card>

      {/* Go to Dashboard */}
      {(importedGrades || importedAttendance) && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <Button size="lg" onClick={() => navigate("/dashboard")} className="font-display">
            View Dashboard <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </motion.div>
      )}
    </main>
  );
}
