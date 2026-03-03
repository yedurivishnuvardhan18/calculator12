import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Pencil } from "lucide-react";

export default function AdminModules() {
  const [branches, setBranches] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [filterBranch, setFilterBranch] = useState("");
  const [filterSem, setFilterSem] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMod, setEditMod] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => { supabase.from("branches").select("*").order("name").then(({ data }) => setBranches(data || [])); }, []);
  useEffect(() => {
    if (!filterBranch) { setSemesters([]); return; }
    supabase.from("semesters").select("*").eq("branch_id", filterBranch).order("number").then(({ data }) => { setSemesters(data || []); setFilterSem(""); });
  }, [filterBranch]);
  useEffect(() => {
    if (!filterSem) { setSubjects([]); return; }
    supabase.from("subjects").select("*").eq("semester_id", filterSem).order("name").then(({ data }) => { setSubjects(data || []); setFilterSubject(""); });
  }, [filterSem]);
  useEffect(() => {
    if (!filterSubject) { setModules([]); return; }
    supabase.from("modules").select("*").eq("subject_id", filterSubject).order("module_number").then(({ data }) => setModules(data || []));
  }, [filterSubject]);

  const handleSave = async () => {
    if (!editMod) return;
    await supabase.from("modules").update({ title: title.trim(), description: description.trim() }).eq("id", editMod.id);
    toast({ title: "Module updated" });
    setDialogOpen(false);
    supabase.from("modules").select("*").eq("subject_id", filterSubject).order("module_number").then(({ data }) => setModules(data || []));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold font-display mb-6">Modules</h1>
      <div className="grid gap-3 sm:grid-cols-3 mb-4">
        <Select value={filterBranch} onValueChange={setFilterBranch}>
          <SelectTrigger><SelectValue placeholder="Branch" /></SelectTrigger>
          <SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterSem} onValueChange={setFilterSem} disabled={!filterBranch}>
          <SelectTrigger><SelectValue placeholder="Semester" /></SelectTrigger>
          <SelectContent>{semesters.map(s => <SelectItem key={s.id} value={s.id}>Semester {s.number}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterSubject} onValueChange={setFilterSubject} disabled={!filterSem}>
          <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
          <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Title</TableHead><TableHead>Description</TableHead><TableHead className="w-[80px]">Edit</TableHead></TableRow></TableHeader>
          <TableBody>
            {modules.map(m => (
              <TableRow key={m.id}>
                <TableCell>{m.module_number}</TableCell>
                <TableCell className="font-medium">{m.title}</TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{m.description || "—"}</TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => { setEditMod(m); setTitle(m.title); setDescription(m.description || ""); setDialogOpen(true); }}><Pencil className="w-4 h-4" /></Button></TableCell>
              </TableRow>
            ))}
            {modules.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Select a subject</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>Edit Module {editMod?.module_number}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
            <Textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
            <Button className="w-full" onClick={handleSave}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
