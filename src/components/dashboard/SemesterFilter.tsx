import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SemesterFilterProps {
  semesters: string[];
  selected: string;
  onChange: (value: string) => void;
}

export function SemesterFilter({ semesters, selected, onChange }: SemesterFilterProps) {
  return (
    <Select value={selected} onValueChange={onChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select semester" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Semesters</SelectItem>
        {semesters.map((s) => (
          <SelectItem key={s} value={s}>{s}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
