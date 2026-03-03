import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { extractYoutubeId, getYoutubeThumbnail } from "@/lib/youtube";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";

export default function AdminVideos() {
  const [branches, setBranches] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [filterBranch, setFilterBranch] = useState("");
  const [filterSem, setFilterSem] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterModule, setFilterModule] = useState("");
  const [filterTopic, setFilterTopic] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { supabase.from("branches").select("*").order("name").then(({ data }) => setBranches(data || [])); }, []);
  useEffect(() => { if (!filterBranch) return; supabase.from("semesters").select("*").eq("branch_id", filterBranch).order("number").then(({ data }) => { setSemesters(data || []); setFilterSem(""); }); }, [filterBranch]);
  useEffect(() => { if (!filterSem) return; supabase.from("subjects").select("*").eq("semester_id", filterSem).order("name").then(({ data }) => { setSubjects(data || []); setFilterSubject(""); }); }, [filterSem]);
  useEffect(() => { if (!filterSubject) return; supabase.from("modules").select("*").eq("subject_id", filterSubject).order("module_number").then(({ data }) => { setModules(data || []); setFilterModule(""); }); }, [filterSubject]);
  useEffect(() => { if (!filterModule) return; supabase.from("topics").select("*").eq("module_id", filterModule).order("order_index").then(({ data }) => { setTopics(data || []); setFilterTopic(""); }); }, [filterModule]);
  useEffect(() => { if (!filterTopic) { setVideos([]); return; } loadVideos(); }, [filterTopic]);

  const loadVideos = () => supabase.from("videos").select("*").eq("topic_id", filterTopic).order("order_index").then(({ data }) => setVideos(data || []));

  const previewId = extractYoutubeId(youtubeUrl);

  const handleSave = async () => {
    if (!title.trim() || !youtubeUrl.trim() || !filterTopic) return;
    const ytId = extractYoutubeId(youtubeUrl);
    if (!ytId) { toast({ title: "Invalid YouTube URL", variant: "destructive" }); return; }
    setLoading(true);
    if (editId) {
      await supabase.from("videos").update({ title: title.trim(), youtube_url: youtubeUrl.trim(), youtube_id: ytId }).eq("id", editId);
    } else {
      const maxOrder = videos.length > 0 ? Math.max(...videos.map(v => v.order_index)) + 1 : 0;
      await supabase.from("videos").insert({ title: title.trim(), youtube_url: youtubeUrl.trim(), youtube_id: ytId, topic_id: filterTopic, order_index: maxOrder });
    }
    toast({ title: editId ? "Video updated" : "Video added" });
    setDialogOpen(false); setEditId(null); setTitle(""); setYoutubeUrl(""); setLoading(false);
    loadVideos();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this video?")) return;
    await supabase.from("videos").delete().eq("id", id);
    loadVideos();
  };

  const move = async (id: string, dir: -1 | 1) => {
    const idx = videos.findIndex(v => v.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= videos.length) return;
    await Promise.all([
      supabase.from("videos").update({ order_index: videos[swapIdx].order_index }).eq("id", videos[idx].id),
      supabase.from("videos").update({ order_index: videos[idx].order_index }).eq("id", videos[swapIdx].id),
    ]);
    loadVideos();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-display">Videos</h1>
        <Button onClick={() => { setEditId(null); setTitle(""); setYoutubeUrl(""); setDialogOpen(true); }} disabled={!filterTopic}><Plus className="w-4 h-4 mr-1" /> Add Video</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mb-4">
        <Select value={filterBranch} onValueChange={setFilterBranch}><SelectTrigger><SelectValue placeholder="Branch" /></SelectTrigger><SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select>
        <Select value={filterSem} onValueChange={setFilterSem} disabled={!filterBranch}><SelectTrigger><SelectValue placeholder="Semester" /></SelectTrigger><SelectContent>{semesters.map(s => <SelectItem key={s.id} value={s.id}>Sem {s.number}</SelectItem>)}</SelectContent></Select>
        <Select value={filterSubject} onValueChange={setFilterSubject} disabled={!filterSem}><SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger><SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
        <Select value={filterModule} onValueChange={setFilterModule} disabled={!filterSubject}><SelectTrigger><SelectValue placeholder="Module" /></SelectTrigger><SelectContent>{modules.map(m => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}</SelectContent></Select>
        <Select value={filterTopic} onValueChange={setFilterTopic} disabled={!filterModule}><SelectTrigger><SelectValue placeholder="Topic" /></SelectTrigger><SelectContent>{topics.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}</SelectContent></Select>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Thumbnail</TableHead><TableHead>Title</TableHead><TableHead className="w-[160px]">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {videos.map((v, i) => (
              <TableRow key={v.id}>
                <TableCell><img src={getYoutubeThumbnail(v.youtube_id)} alt="" className="w-24 h-14 object-cover rounded" /></TableCell>
                <TableCell className="font-medium">{v.title}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => move(v.id, -1)} disabled={i === 0}><ArrowUp className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => move(v.id, 1)} disabled={i === videos.length - 1}><ArrowDown className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { setEditId(v.id); setTitle(v.title); setYoutubeUrl(v.youtube_url); setDialogOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(v.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {videos.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">{filterTopic ? "No videos" : "Select filters"}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>{editId ? "Edit Video" : "Add Video"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Video title" value={title} onChange={e => setTitle(e.target.value)} />
            <Input placeholder="YouTube URL" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} />
            {previewId && (
              <div className="rounded-lg overflow-hidden border">
                <img src={getYoutubeThumbnail(previewId)} alt="Preview" className="w-full" />
              </div>
            )}
            <Button className="w-full" onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
