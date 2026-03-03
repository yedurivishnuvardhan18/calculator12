import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { GitBranch, BookOpen, FileText, Video } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ branches: 0, subjects: 0, topics: 0, videos: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from("branches").select("id", { count: "exact", head: true }),
      supabase.from("subjects").select("id", { count: "exact", head: true }),
      supabase.from("topics").select("id", { count: "exact", head: true }),
      supabase.from("videos").select("id", { count: "exact", head: true }),
    ]).then(([b, s, t, v]) => {
      setStats({
        branches: b.count || 0,
        subjects: s.count || 0,
        topics: t.count || 0,
        videos: v.count || 0,
      });
    });
  }, []);

  const items = [
    { label: "Branches", value: stats.branches, icon: GitBranch, color: "text-blue-500 bg-blue-500/10" },
    { label: "Subjects", value: stats.subjects, icon: BookOpen, color: "text-emerald-500 bg-emerald-500/10" },
    { label: "Topics", value: stats.topics, icon: FileText, color: "text-purple-500 bg-purple-500/10" },
    { label: "Videos", value: stats.videos, icon: Video, color: "text-orange-500 bg-orange-500/10" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold font-display mb-6">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(i => (
          <Card key={i.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${i.color}`}>
                <i.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{i.value}</p>
                <p className="text-sm text-muted-foreground">{i.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
