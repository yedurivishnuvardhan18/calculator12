import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Layers, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const moduleColors = [
  "bg-blue-500/10 text-blue-500",
  "bg-emerald-500/10 text-emerald-500",
  "bg-purple-500/10 text-purple-500",
  "bg-orange-500/10 text-orange-500",
  "bg-pink-500/10 text-pink-500",
];

export default function LearnSubject() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("subjects").select("*").eq("id", subjectId).single(),
      supabase.from("modules").select("*").eq("subject_id", subjectId).order("module_number"),
    ]).then(([{ data: sub }, { data: mods }]) => {
      setSubject(sub);
      setModules(mods || []);
      setLoading(false);
    });
  }, [subjectId]);

  if (loading) return (
    <main className="container max-w-4xl py-8 px-4">
      <div className="h-8 w-48 mb-2 rounded skeleton-shimmer" />
      <div className="h-5 w-32 mb-8 rounded skeleton-shimmer" />
      <div className="grid gap-4">{[1,2,3,4,5].map(i => <div key={i} className="h-24 rounded-xl skeleton-shimmer" />)}</div>
    </main>
  );

  if (!subject) return <main className="container py-12 text-center"><p>Subject not found.</p></main>;

  return (
    <main className="container max-w-4xl py-8 px-4 min-h-[80vh]">
      <Button variant="ghost" size="sm" onClick={() => navigate("/learn")} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>
      <h1 className="text-2xl font-bold font-display">{subject.name}</h1>
      <p className="text-muted-foreground mb-6">{subject.code}</p>

      <div className="grid gap-4">
        {modules.map((m, i) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg group" onClick={() => navigate(`/learn/${subjectId}/${m.id}`)}>
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold text-lg ${moduleColors[i % 5]}`}>
                    {m.module_number}
                  </div>
                  <div>
                    <h3 className="font-semibold">{m.title || `Module ${m.module_number}`}</h3>
                    {m.description && <p className="text-sm text-muted-foreground line-clamp-1">{m.description}</p>}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </main>
  );
}
