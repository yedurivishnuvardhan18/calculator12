import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function LearnModule() {
  const { subjectId, moduleId } = useParams();
  const navigate = useNavigate();
  const [mod, setMod] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("modules").select("*").eq("id", moduleId).single(),
      supabase.from("topics").select("*").eq("module_id", moduleId).order("order_index"),
    ]).then(([{ data: m }, { data: t }]) => {
      setMod(m);
      setTopics(t || []);
      setLoading(false);
    });
  }, [moduleId]);

  if (loading) return (
    <main className="container max-w-4xl py-8 px-4">
      <div className="h-8 w-48 mb-6 rounded skeleton-shimmer" />
      <div className="grid gap-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl skeleton-shimmer" />)}</div>
    </main>
  );

  return (
    <main className="container max-w-4xl py-8 px-4 min-h-[80vh]">
      <Button variant="ghost" size="sm" onClick={() => navigate(`/learn/${subjectId}`)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Modules
      </Button>
      <h1 className="text-2xl font-bold font-display">{mod?.title || "Module"}</h1>
      {mod?.description && <p className="text-muted-foreground mb-6">{mod.description}</p>}

      {topics.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No topics added yet.</p>
      ) : (
        <div className="grid gap-3 mt-6">
          {topics.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="cursor-pointer hover:border-primary/50 transition-all group" onClick={() => navigate(`/learn/${subjectId}/${moduleId}/${t.id}`)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="font-medium">{t.title}</h3>
                      {t.description && <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </main>
  );
}
