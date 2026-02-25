import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import type { SubjectAttendance } from "@/types/attendance";

interface AttendanceEditorProps {
  subjects: SubjectAttendance[];
  onChange: (subjects: SubjectAttendance[]) => void;
}

export function AttendanceEditor({ subjects, onChange }: AttendanceEditorProps) {
  const updateField = (index: number, field: keyof SubjectAttendance, value: string) => {
    const updated = [...subjects];
    if (field === "present" || field === "total" || field === "percentage") {
      (updated[index] as any)[field] = Number(value) || 0;
      // auto-calculate percentage
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

  return (
    <Card className="border-2 border-border pop-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-display flex items-center justify-between">
          <span>📊 Attendance Data</span>
          <Button variant="outline" size="sm" onClick={addSubject}>
            <Plus className="w-4 h-4 mr-1" /> Subject
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
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
          <p className="text-center text-muted-foreground text-sm py-6">No subjects yet. Upload an image or add manually.</p>
        )}
      </CardContent>
    </Card>
  );
}
