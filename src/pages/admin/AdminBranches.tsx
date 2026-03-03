import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function AdminBranches() {
  const [branches, setBranches] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => supabase.from("branches").select("*").order("name").then(({ data }) => setBranches(data || []));
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    if (editId) {
      await supabase.from("branches").update({ name: name.trim() }).eq("id", editId);
      toast({ title: "Branch updated" });
    } else {
      await supabase.from("branches").insert({ name: name.trim() });
      toast({ title: "Branch created", description: "8 semesters auto-created." });
    }
    setDialogOpen(false); setName(""); setEditId(null); setLoading(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this branch and all its data?")) return;
    await supabase.from("branches").delete().eq("id", id);
    toast({ title: "Branch deleted" });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-display">Branches</h1>
        <Button onClick={() => { setEditId(null); setName(""); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-1" /> Add Branch</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Name</TableHead><TableHead className="w-[120px]">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {branches.map(b => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setEditId(b.id); setName(b.name); setDialogOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(b.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {branches.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">No branches yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editId ? "Edit Branch" : "Add Branch"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Branch name" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSave()} />
            <Button className="w-full" onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
