import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play } from "lucide-react";
import { motion } from "framer-motion";

export default function LearnTopic() {
  const { subjectId, moduleId, topicId } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("topics").select("*").eq("id", topicId).single(),
      supabase.from("videos").select("*").eq("topic_id", topicId).order("order_index"),
    ]).then(([{ data: t }, { data: v }]) => {
      setTopic(t);
      setVideos(v || []);
      setLoading(false);
    });
  }, [topicId]);

  if (loading) return (
    <main className="container max-w-4xl py-8 px-4">
      <div className="h-8 w-48 mb-4 rounded skeleton-shimmer" />
      <div className="aspect-video w-full rounded-xl skeleton-shimmer" />
    </main>
  );

  return (
    <main className="container max-w-4xl py-8 px-4 min-h-[80vh]">
      <Button variant="ghost" size="sm" onClick={() => navigate(`/learn/${subjectId}/${moduleId}`)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Topics
      </Button>
      <h1 className="text-2xl font-bold font-display">{topic?.title}</h1>
      {topic?.description && <p className="text-muted-foreground mt-1 mb-6">{topic.description}</p>}

      {videos.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No videos added yet.</p>
      ) : (
        <div className="space-y-6 mt-6">
          {videos.map((v, i) => (
            <motion.div key={v.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-primary" />
                  <h3 className="font-medium">{v.title}</h3>
                </div>
                <div className="aspect-video w-full rounded-xl overflow-hidden border bg-muted">
                  <iframe
                    src={`https://www.youtube.com/embed/${v.youtube_id}`}
                    title={v.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </main>
  );
}
