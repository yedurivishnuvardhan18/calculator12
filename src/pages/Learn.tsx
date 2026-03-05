import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, BookOpen, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Learn() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [semesters, setSemesters] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  useEffect(() => {
    supabase.from("branches").select("*").order("name").then(({ data }) => {
      setBranches(data || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedBranch) { setSemesters([]); setSelectedSemester(""); return; }
    supabase.from("semesters").select("*").eq("branch_id", selectedBranch).order("number").then(({ data }) => {
      setSemesters(data || []);
      setSelectedSemester("");
    });
  }, [selectedBranch]);

  useEffect(() => {
    if (!selectedBranch || !selectedSemester) { setSubjects([]); return; }
    setLoadingSubjects(true);
    supabase.from("subjects").select("*").eq("branch_id", selectedBranch).eq("semester_id", selectedSemester).order("name").then(({ data }) => {
      setSubjects(data || []);
      setLoadingSubjects(false);
    });
  }, [selectedBranch, selectedSemester]);

  return (
    <main className="container max-w-4xl py-8 px-4 min-h-[80vh]">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <GraduationCap className="w-4 h-4" /> Learning Hub
        </div>
        <h1 className="text-3xl font-bold font-display">Explore Subjects</h1>
        <p className="text-muted-foreground mt-2">Select your branch and semester to find study materials</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Branch</label>
          {loading ? <div className="h-10 w-full rounded skeleton-shimmer" /> : (
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
              <SelectContent>
                {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Semester</label>
          <Select value={selectedSemester} onValueChange={setSelectedSemester} disabled={!selectedBranch}>
            <SelectTrigger><SelectValue placeholder="Select semester" /></SelectTrigger>
            <SelectContent>
              {semesters.map(s => <SelectItem key={s.id} value={s.id}>Semester {s.number}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loadingSubjects && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1,2,3,4].map(i => <div key={i} className="h-28 w-full rounded-xl skeleton-shimmer" />)}
        </div>
      )}

      {!loadingSubjects && subjects.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {subjects.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg group" onClick={() => navigate(`/learn/${s.id}`)}>
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{s.name}</h3>
                      <p className="text-sm text-muted-foreground">{s.code}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {!loadingSubjects && selectedSemester && subjects.length === 0 && (
        <p className="text-center text-muted-foreground py-12">No subjects found for this selection.</p>
      )}
    </main>
  );
}
