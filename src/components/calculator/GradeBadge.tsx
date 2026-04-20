import { cn } from "@/lib/utils";

interface GradeBadgeProps {
  letter: string;
  point: number;
  size?: "sm" | "md" | "lg";
}

const gradeColors: Record<string, string> = {
  'O': 'bg-grade-o',
  'A+': 'bg-grade-a-plus',
  'A': 'bg-grade-a',
  'B+': 'bg-grade-b-plus',
  'B': 'bg-grade-b',
  'C': 'bg-grade-c',
  'P': 'bg-grade-p',
  'I': 'bg-grade-p',
  'F': 'bg-grade-f',
  'Ab/R': 'bg-grade-f',
  'L/AB': 'bg-grade-f',
};

export function GradeBadge({ letter, point, size = "md" }: GradeBadgeProps) {
  const sizeClasses = {
    sm: "w-11 h-11 text-sm",
    md: "w-16 h-16 text-xl",
    lg: "w-24 h-24 text-3xl",
  };

  const isTopGrade = ['O', 'A+', 'A'].includes(letter);

  return (
    <div className="relative inline-block group">
      {isTopGrade && size !== "sm" && (
        <div className="absolute inset-0 animate-pulse">
          <div className="absolute inset-0 bg-pop-yellow/30 rounded-2xl blur-md scale-125" />
        </div>
      )}
      
      <div
        className={cn(
          "relative rounded-2xl flex flex-col items-center justify-center text-white font-extrabold font-display border-3 border-white pop-shadow transition-all duration-300 hover:scale-110 hover:rotate-3 hover:pop-shadow-lg cursor-default",
          gradeColors[letter] || 'bg-muted',
          sizeClasses[size]
        )}
      >
        <span className="drop-shadow-md">{letter}</span>
        {size !== "sm" && (
          <span className="text-[10px] sm:text-xs opacity-90 font-bold">({point})</span>
        )}
      </div>
    </div>
  );
}
