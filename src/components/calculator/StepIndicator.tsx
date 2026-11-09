import { cn } from "@/lib/utils";
import { Check, BookOpen, Award, Calculator, TrendingUp } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  completedSteps: number[];
}

const steps = [
  { id: 1, name: "Course & WGP", shortName: "WGP", icon: BookOpen, color: "bg-pop-pink", foreground: "text-pop-pink-foreground" },
  { id: 2, name: "Letter Grade", shortName: "Grade", icon: Award, color: "bg-pop-purple", foreground: "text-pop-purple-foreground" },
  { id: 3, name: "SGPA", shortName: "SGPA", icon: Calculator, color: "bg-pop-cyan", foreground: "text-pop-cyan-foreground" },
  { id: 4, name: "CGPA", shortName: "CGPA", icon: TrendingUp, color: "bg-pop-orange", foreground: "text-pop-orange-foreground" },
];

export function StepIndicator({ currentStep, completedSteps }: StepIndicatorProps) {
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
                      ? "bg-accent text-accent-foreground border-accent pop-shadow rotate-0"
                      : isCurrent
                      ? cn(step.color, step.foreground, "border-foreground/20 pop-shadow animate-bounce-in -rotate-3")
                      : "bg-muted text-muted-foreground border-foreground/10 group-hover:scale-105",
                    "group-hover:pop-shadow transition-all"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 sm:w-7 sm:h-7 stroke-[3]" />
                  ) : (
                    <Icon className="w-4 h-4 sm:w-6 sm:h-6" />
                  )}
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
                    completedSteps.includes(step.id) 
                      ? "bg-accent" 
                      : "bg-foreground/10"
                  )}
                  style={{
                    backgroundImage: !completedSteps.includes(step.id) 
                      ? 'repeating-linear-gradient(90deg, transparent, transparent 4px, hsl(var(--foreground) / 0.1) 4px, hsl(var(--foreground) / 0.1) 8px)'
                      : undefined
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
