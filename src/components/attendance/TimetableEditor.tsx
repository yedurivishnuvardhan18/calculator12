import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ClipboardPaste } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { parseTimetableText } from "@/lib/attendance-text-parser";
import type { TimetableSchedule, DayOfWeek } from "@/types/attendance";

const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface TimetableEditorProps {
  schedule: TimetableSchedule;
  onChange: (schedule: TimetableSchedule) => void;
}

export function TimetableEditor({ schedule, onChange }: TimetableEditorProps) {
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const maxPeriods = Math.max(...DAYS.map((d) => schedule[d]?.length ?? 0), 1);

  const updateCell = (day: DayOfWeek, periodIndex: number, value: string) => {
    const updated = { ...schedule };
    if (!updated[day]) updated[day] = [];
    const arr = [...updated[day]];
    arr[periodIndex] = value;
    updated[day] = arr;
    onChange(updated);
  };

  const addPeriod = () => {
    const updated = { ...schedule };
    DAYS.forEach((d) => {
      if (!updated[d]) updated[d] = [];
      updated[d] = [...updated[d], ""];
    });
    onChange(updated);
  };

  const removePeriod = (index: number) => {
    const updated = { ...schedule };
    DAYS.forEach((d) => {
      if (updated[d]) {
        const arr = [...updated[d]];
        arr.splice(index, 1);
        updated[d] = arr;
      }
    });
    onChange(updated);
  };

  const handlePaste = () => {
    if (!pasteText.trim()) {
      toast({ title: "Nothing to parse", description: "Paste your timetable text first.", variant: "destructive" });
      return;
    }
    const result = parseTimetableText(pasteText);
    if (result) {
      onChange(result);
      setPasteText("");
      setShowPaste(false);
      toast({ title: "Timetable parsed!", description: `Found ${Object.keys(result).length} days.` });
    } else {
      toast({
        title: "Couldn't parse",
        description: "Use format like: Monday: CS101, MA101, PH101 (one line per day)",
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
        const result = parseTimetableText(text);
        if (result) {
          onChange(result);
          setPasteText("");
          setShowPaste(false);
          toast({ title: "Timetable parsed from clipboard!", description: `Found ${Object.keys(result).length} days.` });
        }
      }
    } catch {
      // Clipboard API denied, show textarea instead
      setShowPaste(true);
    }
  };

  return (
    <Card className="border-2 border-border pop-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-display flex items-center justify-between flex-wrap gap-2">
          <span>📅 Weekly Timetable</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleClipboardRead}>
              <ClipboardPaste className="w-4 h-4 mr-1" /> Paste
            </Button>
            <Button variant="outline" size="sm" onClick={addPeriod}>
              <Plus className="w-4 h-4 mr-1" /> Period
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {showPaste && (
          <div className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">
              Paste your timetable below. Format: <code className="bg-muted px-1 rounded">Monday: CS101, MA101, PH101</code>
            </p>
            <Textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={"Monday: CS101, MA101, PH101\nTuesday: CS102, MA102, EE101\nWednesday: ..."}
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
                <TableHead className="font-display w-24">Day</TableHead>
                {Array.from({ length: maxPeriods }, (_, i) => (
                  <TableHead key={i} className="font-display text-center min-w-[100px]">
                    <div className="flex items-center justify-center gap-1">
                      P{i + 1}
                      <button onClick={() => removePeriod(i)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {DAYS.map((day) => (
                <TableRow key={day}>
                  <TableCell className="font-semibold text-xs">{day.slice(0, 3)}</TableCell>
                  {Array.from({ length: maxPeriods }, (_, i) => (
                    <TableCell key={i} className="p-1">
                      <Input
                        value={schedule[day]?.[i] ?? ""}
                        onChange={(e) => updateCell(day, i, e.target.value.toUpperCase())}
                        className="h-8 text-xs text-center font-mono"
                        placeholder="—"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
