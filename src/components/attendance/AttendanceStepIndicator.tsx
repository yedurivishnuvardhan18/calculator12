import { cn } from "@/lib/utils";
import { Check, Upload, FileEdit, Settings, BarChart3 } from "lucide-react";

interface AttendanceStepIndicatorProps {
  currentStep: number;
  completedSteps: number[];
}

const steps = [
  { id: 1, name: "Timetable", shortName: "Time", icon: Upload, color: "bg-pop-cyan" },
  { id: 2, name: "Attendance", shortName: "Attend", icon: FileEdit, color: "bg-pop-pink" },
  { id: 3, name: "Configure", shortName: "Config", icon: Settings, color: "bg-pop-orange" },
  { id: 4, name: "Results", shortName: "Results", icon: BarChart3, color: "bg-pop-purple" },
];

export function AttendanceStepIndicator({ currentStep, completedSteps }: AttendanceStepIndicatorProps) {
  return (
    <div className="w-full py-4 sm:py-8">
      <div className="flex items-center justify-between max-w-2xl mx-auto px-2 sm:px-6">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center group">
                <div
                  className={cn(
                    "w-10 h-10 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-300 border-3",
                    isCompleted
                      ? "bg-accent text-white border-accent pop-shadow"
                      : isCurrent
                      ? cn(step.color, "text-white border-foreground/20 pop-shadow animate-bounce-in -rotate-3")
                      : "bg-muted text-muted-foreground border-foreground/10 group-hover:scale-105",
                    "group-hover:pop-shadow transition-all"
                  )}
                >
                  {isCompleted ? <Check className="w-5 h-5 sm:w-7 sm:h-7 stroke-[3]" /> : <Icon className="w-4 h-4 sm:w-6 sm:h-6" />}
                </div>
                <span
                  className={cn(
                    "mt-2 sm:mt-3 text-[10px] sm:text-xs font-bold text-center max-w-[55px] sm:max-w-none font-display leading-tight",
                    isCurrent ? "text-primary" : isCompleted ? "text-accent" : "text-muted-foreground"
                  )}
                >
                  <span className="hidden sm:inline">{step.name}</span>
                  <span className="sm:hidden">{step.shortName}</span>
                </span>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-5 sm:w-16 md:w-24 h-1 sm:h-1.5 mx-1 sm:mx-3 rounded-full transition-all duration-300",
                    completedSteps.includes(step.id) ? "bg-accent" : "bg-foreground/10"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
