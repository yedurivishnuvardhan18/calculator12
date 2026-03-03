import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";

export default function AdminTopics() {
  const [branches, setBranches] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [filterBranch, setFilterBranch] = useState("");
  const [filterSem, setFilterSem] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterModule, setFilterModule] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { supabase.from("branches").select("*").order("name").then(({ data }) => setBranches(data || [])); }, []);
  useEffect(() => { if (!filterBranch) return; supabase.from("semesters").select("*").eq("branch_id", filterBranch).order("number").then(({ data }) => { setSemesters(data || []); setFilterSem(""); }); }, [filterBranch]);
  useEffect(() => { if (!filterSem) return; supabase.from("subjects").select("*").eq("semester_id", filterSem).order("name").then(({ data }) => { setSubjects(data || []); setFilterSubject(""); }); }, [filterSem]);
  useEffect(() => { if (!filterSubject) return; supabase.from("modules").select("*").eq("subject_id", filterSubject).order("module_number").then(({ data }) => { setModules(data || []); setFilterModule(""); }); }, [filterSubject]);
  useEffect(() => { if (!filterModule) { setTopics([]); return; } loadTopics(); }, [filterModule]);

  const loadTopics = () => supabase.from("topics").select("*").eq("module_id", filterModule).order("order_index").then(({ data }) => setTopics(data || []));

  const handleSave = async () => {
    if (!title.trim() || !filterModule) return;
    setLoading(true);
    if (editId) {
      await supabase.from("topics").update({ title: title.trim(), description: description.trim() }).eq("id", editId);
    } else {
      const maxOrder = topics.length > 0 ? Math.max(...topics.map(t => t.order_index)) + 1 : 0;
      await supabase.from("topics").insert({ title: title.trim(), description: description.trim(), module_id: filterModule, order_index: maxOrder });
    }
    toast({ title: editId ? "Topic updated" : "Topic created" });
    setDialogOpen(false); setEditId(null); setTitle(""); setDescription(""); setLoading(false);
    loadTopics();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this topic?")) return;
    await supabase.from("topics").delete().eq("id", id);
    loadTopics();
  };

  const move = async (id: string, dir: -1 | 1) => {
    const idx = topics.findIndex(t => t.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= topics.length) return;
    await Promise.all([
      supabase.from("topics").update({ order_index: topics[swapIdx].order_index }).eq("id", topics[idx].id),
      supabase.from("topics").update({ order_index: topics[idx].order_index }).eq("id", topics[swapIdx].id),
    ]);
    loadTopics();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-display">Topics</h1>
        <Button onClick={() => { setEditId(null); setTitle(""); setDescription(""); setDialogOpen(true); }} disabled={!filterModule}><Plus className="w-4 h-4 mr-1" /> Add Topic</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <Select value={filterBranch} onValueChange={setFilterBranch}><SelectTrigger><SelectValue placeholder="Branch" /></SelectTrigger><SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select>
        <Select value={filterSem} onValueChange={setFilterSem} disabled={!filterBranch}><SelectTrigger><SelectValue placeholder="Semester" /></SelectTrigger><SelectContent>{semesters.map(s => <SelectItem key={s.id} value={s.id}>Sem {s.number}</SelectItem>)}</SelectContent></Select>
        <Select value={filterSubject} onValueChange={setFilterSubject} disabled={!filterSem}><SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger><SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
        <Select value={filterModule} onValueChange={setFilterModule} disabled={!filterSubject}><SelectTrigger><SelectValue placeholder="Module" /></SelectTrigger><SelectContent>{modules.map(m => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}</SelectContent></Select>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Title</TableHead><TableHead className="w-[160px]">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {topics.map((t, i) => (
              <TableRow key={t.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell className="font-medium">{t.title}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => move(t.id, -1)} disabled={i === 0}><ArrowUp className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => move(t.id, 1)} disabled={i === topics.length - 1}><ArrowDown className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { setEditId(t.id); setTitle(t.title); setDescription(t.description || ""); setDialogOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(t.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {topics.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">{filterModule ? "No topics" : "Select filters"}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>{editId ? "Edit Topic" : "Add Topic"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Topic title" value={title} onChange={e => setTitle(e.target.value)} />
            <Textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} />
            <Button className="w-full" onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
