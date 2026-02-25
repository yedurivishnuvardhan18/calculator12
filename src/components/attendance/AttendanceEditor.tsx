import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ClipboardPaste } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { parseAttendanceText } from "@/lib/attendance-text-parser";
import type { SubjectAttendance } from "@/types/attendance";

interface AttendanceEditorProps {
  subjects: SubjectAttendance[];
  onChange: (subjects: SubjectAttendance[]) => void;
}

export function AttendanceEditor({ subjects, onChange }: AttendanceEditorProps) {
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const updateField = (index: number, field: keyof SubjectAttendance, value: string) => {
    const updated = [...subjects];
    if (field === "present" || field === "total" || field === "percentage") {
      (updated[index] as any)[field] = Number(value) || 0;
      if (field === "present" || field === "total") {
        const total = updated[index].total;
        updated[index].percentage = total > 0 ? Math.round((updated[index].present / total) * 100) : 0;
      }
    } else {
      (updated[index] as any)[field] = value;
    }
    onChange(updated);
  };

  const addSubject = () => {
    onChange([...subjects, { code: "", name: "", present: 0, total: 0, percentage: 0 }]);
  };

  const removeSubject = (index: number) => {
    onChange(subjects.filter((_, i) => i !== index));
  };

  const handlePaste = () => {
    if (!pasteText.trim()) {
      toast({ title: "Nothing to parse", description: "Paste your attendance data first.", variant: "destructive" });
      return;
    }
    const result = parseAttendanceText(pasteText);
    if (result) {
      onChange(result);
      setPasteText("");
      setShowPaste(false);
      toast({ title: "Attendance parsed!", description: `Found ${result.length} subjects.` });
    } else {
      toast({
        title: "Couldn't parse",
        description: "Use format like: CS101  Computer Science  45  60  75 (one subject per line)",
        variant: "destructive",
      });
    }
  };

  const handleClipboardRead = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setPasteText(text);
        setShowPaste(true);
        // Auto-try parsing
        const result = parseAttendanceText(text);
        if (result) {
          onChange(result);
          setPasteText("");
          setShowPaste(false);
          toast({ title: "Attendance parsed from clipboard!", description: `Found ${result.length} subjects.` });
        }
      }
    } catch {
      setShowPaste(true);
    }
  };

  return (
    <Card className="border-2 border-border pop-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-display flex items-center justify-between flex-wrap gap-2">
          <span>📊 Attendance Data</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleClipboardRead}>
              <ClipboardPaste className="w-4 h-4 mr-1" /> Paste
            </Button>
            <Button variant="outline" size="sm" onClick={addSubject}>
              <Plus className="w-4 h-4 mr-1" /> Subject
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {showPaste && (
          <div className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">
              Paste your attendance below. Format: <code className="bg-muted px-1 rounded">CS101  Computer Science  45  60  75</code>
            </p>
            <Textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={"CS101  Computer Science  45  60  75\nMA101  Mathematics  38  50  76\nPH101  Physics  42  55  76.36"}
              className="text-xs font-mono min-h-[100px]"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handlePaste}>Parse</Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowPaste(false); setPasteText(""); }}>Cancel</Button>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-display">Code</TableHead>
                <TableHead className="font-display">Subject Name</TableHead>
                <TableHead className="font-display text-center">Present</TableHead>
                <TableHead className="font-display text-center">Total</TableHead>
                <TableHead className="font-display text-center">%</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((sub, i) => (
                <TableRow key={i}>
                  <TableCell className="p-1">
                    <Input
                      value={sub.code}
                      onChange={(e) => updateField(i, "code", e.target.value.toUpperCase())}
                      className="h-8 text-xs font-mono w-28"
                      placeholder="CODE"
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      value={sub.name}
                      onChange={(e) => updateField(i, "name", e.target.value)}
                      className="h-8 text-xs min-w-[150px]"
                      placeholder="Subject Name"
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      type="number"
                      value={sub.present}
                      onChange={(e) => updateField(i, "present", e.target.value)}
                      className="h-8 text-xs text-center w-16"
                      min={0}
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      type="number"
                      value={sub.total}
                      onChange={(e) => updateField(i, "total", e.target.value)}
                      className="h-8 text-xs text-center w-16"
                      min={0}
                    />
                  </TableCell>
                  <TableCell className="p-1 text-center text-xs font-semibold">
                    {sub.percentage}%
                  </TableCell>
                  <TableCell className="p-1">
                    <button onClick={() => removeSubject(i)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {subjects.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-6">No subjects yet. Use Paste, upload a file, or add manually.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
