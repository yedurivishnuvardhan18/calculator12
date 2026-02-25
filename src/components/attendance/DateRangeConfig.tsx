import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DayOfWeek, AttendanceConfig } from "@/types/attendance";

const ALL_DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface DateRangeConfigProps {
  config: AttendanceConfig;
  onChange: (config: AttendanceConfig) => void;
}

export function DateRangeConfig({ config, onChange }: DateRangeConfigProps) {
  const [holidayDates, setHolidayDates] = useState<Date[]>(config.holidays);

  const toggleDay = (day: DayOfWeek) => {
    const wd = config.workingDays.includes(day)
      ? config.workingDays.filter((d) => d !== day)
      : [...config.workingDays, day];
    onChange({ ...config, workingDays: wd });
  };

  const handleHolidaySelect = (date: Date | undefined) => {
    if (!date) return;
    const exists = holidayDates.some((h) => h.toDateString() === date.toDateString());
    const updated = exists
      ? holidayDates.filter((h) => h.toDateString() !== date.toDateString())
      : [...holidayDates, date];
    setHolidayDates(updated);
    onChange({ ...config, holidays: updated });
  };

  return (
    <Card className="border-2 border-border pop-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-display">⚙️ Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">From Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(config.fromDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={config.fromDate} onSelect={(d) => d && onChange({ ...config, fromDate: d })} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">To Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(config.toDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={config.toDate} onSelect={(d) => d && onChange({ ...config, toDate: d })} />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Working days */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Working Days</label>
          <div className="flex flex-wrap gap-2">
            {ALL_DAYS.map((day) => (
              <Button
                key={day}
                variant={config.workingDays.includes(day) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleDay(day)}
                className="text-xs"
              >
                {day.slice(0, 3)}
              </Button>
            ))}
          </div>
        </div>

        {/* Target percentage */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Target Attendance: <span className="text-primary font-bold">{config.targetPercentage}%</span>
          </label>
          <Slider
            value={[config.targetPercentage]}
            onValueChange={([v]) => onChange({ ...config, targetPercentage: v })}
            min={50}
            max={100}
            step={1}
          />
        </div>

        {/* Holidays */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Holidays ({holidayDates.length} selected)
          </label>
          <Calendar
            mode="multiple"
            selected={holidayDates}
            onSelect={(dates) => {
              const d = dates ?? [];
              setHolidayDates(d);
              onChange({ ...config, holidays: d });
            }}
            className="rounded-md border"
          />
        </div>
      </CardContent>
    </Card>
  );
}
