import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { whatIfSkip, whatIfAttend } from "@/lib/attendance-calculator";
import type { SubjectResult } from "@/types/attendance";

interface WhatIfSimulatorProps {
  subjectResults: SubjectResult[];
  targetPercentage: number;
}

export function WhatIfSimulator({ subjectResults, targetPercentage }: WhatIfSimulatorProps) {
  const [count, setCount] = useState(5);

  return (
    <Card className="border-2 border-border pop-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-display">🧪 What-If Simulator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Number of classes: <span className="text-primary font-bold">{count}</span>
          </label>
          <Slider value={[count]} onValueChange={([v]) => setCount(v)} min={1} max={30} step={1} />
        </div>

        <Tabs defaultValue="skip">
          <TabsList className="w-full">
            <TabsTrigger value="skip" className="flex-1">If I Skip {count}</TabsTrigger>
            <TabsTrigger value="attend" className="flex-1">If I Attend {count}</TabsTrigger>
          </TabsList>

          <TabsContent value="skip" className="mt-3 space-y-2">
            {subjectResults.map((r) => {
              const newPct = whatIfSkip(r.present, r.total, count);
              const isSafe = newPct >= targetPercentage;
              return (
                <div key={r.code} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-xs font-semibold">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{r.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{r.currentPercentage.toFixed(1)}% → </p>
                    <p className={cn("text-sm font-bold font-display", isSafe ? "text-success" : "text-destructive")}>
                      {newPct.toFixed(1)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="attend" className="mt-3 space-y-2">
            {subjectResults.map((r) => {
              const newPct = whatIfAttend(r.present, r.total, count);
              const isSafe = newPct >= targetPercentage;
              return (
                <div key={r.code} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-xs font-semibold">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{r.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{r.currentPercentage.toFixed(1)}% → </p>
                    <p className={cn("text-sm font-bold font-display", isSafe ? "text-success" : "text-destructive")}>
                      {newPct.toFixed(1)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
