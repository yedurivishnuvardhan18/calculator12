import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import type { TimetableSchedule, DayOfWeek } from "@/types/attendance";

const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface TimetableEditorProps {
  schedule: TimetableSchedule;
  onChange: (schedule: TimetableSchedule) => void;
}

export function TimetableEditor({ schedule, onChange }: TimetableEditorProps) {
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

  return (
    <Card className="border-2 border-border pop-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-display flex items-center justify-between">
          <span>📅 Weekly Timetable</span>
          <Button variant="outline" size="sm" onClick={addPeriod}>
            <Plus className="w-4 h-4 mr-1" /> Period
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
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
      </CardContent>
    </Card>
  );
}
