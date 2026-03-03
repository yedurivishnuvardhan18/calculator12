import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function AdminSubjects() {
  const [branches, setBranches] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [filterBranch, setFilterBranch] = useState("");
  const [filterSem, setFilterSem] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [branchId, setBranchId] = useState("");
  const [semId, setSemId] = useState("");
  const [formSemesters, setFormSemesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { supabase.from("branches").select("*").order("name").then(({ data }) => setBranches(data || [])); }, []);

  useEffect(() => {
    if (!filterBranch) { setSemesters([]); setFilterSem(""); return; }
    supabase.from("semesters").select("*").eq("branch_id", filterBranch).order("number").then(({ data }) => { setSemesters(data || []); setFilterSem(""); });
  }, [filterBranch]);

  useEffect(() => {
    if (!branchId) { setFormSemesters([]); return; }
    supabase.from("semesters").select("*").eq("branch_id", branchId).order("number").then(({ data }) => setFormSemesters(data || []));
  }, [branchId]);

  useEffect(() => {
    if (!filterBranch || !filterSem) { setSubjects([]); return; }
    supabase.from("subjects").select("*").eq("branch_id", filterBranch).eq("semester_id", filterSem).order("name").then(({ data }) => setSubjects(data || []));
  }, [filterBranch, filterSem]);

  const handleSave = async () => {
    if (!name.trim() || !code.trim() || !branchId || !semId) return;
    setLoading(true);
    if (editId) {
      await supabase.from("subjects").update({ name: name.trim(), code: code.trim(), branch_id: branchId, semester_id: semId }).eq("id", editId);
      toast({ title: "Subject updated" });
    } else {
      await supabase.from("subjects").insert({ name: name.trim(), code: code.trim(), branch_id: branchId, semester_id: semId });
      toast({ title: "Subject created", description: "5 modules auto-created." });
    }
    setDialogOpen(false); resetForm(); setLoading(false);
    if (filterBranch && filterSem) {
      supabase.from("subjects").select("*").eq("branch_id", filterBranch).eq("semester_id", filterSem).order("name").then(({ data }) => setSubjects(data || []));
    }
  };

  const resetForm = () => { setEditId(null); setName(""); setCode(""); setBranchId(""); setSemId(""); };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this subject and all its data?")) return;
    await supabase.from("subjects").delete().eq("id", id);
    toast({ title: "Subject deleted" });
    setSubjects(subjects.filter(s => s.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-display">Subjects</h1>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-1" /> Add Subject</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 mb-4">
        <Select value={filterBranch} onValueChange={setFilterBranch}>
          <SelectTrigger><SelectValue placeholder="Filter by branch" /></SelectTrigger>
          <SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterSem} onValueChange={setFilterSem} disabled={!filterBranch}>
          <SelectTrigger><SelectValue placeholder="Filter by semester" /></SelectTrigger>
          <SelectContent>{semesters.map(s => <SelectItem key={s.id} value={s.id}>Semester {s.number}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead className="w-[120px]">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {subjects.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.code}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setEditId(s.id); setName(s.name); setCode(s.code); setBranchId(s.branch_id); setSemId(s.semester_id); setDialogOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {subjects.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">{filterSem ? "No subjects" : "Select branch & semester"}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Subject" : "Add Subject"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Subject name" value={name} onChange={e => setName(e.target.value)} />
            <Input placeholder="Subject code" value={code} onChange={e => setCode(e.target.value)} />
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
              <SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={semId} onValueChange={setSemId} disabled={!branchId}>
              <SelectTrigger><SelectValue placeholder="Select semester" /></SelectTrigger>
              <SelectContent>{formSemesters.map(s => <SelectItem key={s.id} value={s.id}>Semester {s.number}</SelectItem>)}</SelectContent>
            </Select>
            <Button className="w-full" onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
