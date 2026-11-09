import { useEffect, useState } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, GitBranch, BookOpen, Layers, FileText, Video, LogOut, Menu, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Seo } from "@/components/Seo";
import { toast } from "@/hooks/use-toast";

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/branches", label: "Branches", icon: GitBranch },
  { to: "/admin/subjects", label: "Subjects", icon: BookOpen },
  { to: "/admin/modules", label: "Modules", icon: Layers },
  { to: "/admin/topics", label: "Topics", icon: FileText },
  { to: "/admin/videos", label: "Videos", icon: Video },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    let active = true;

    const verifyAdminAccess = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session) {
          navigate("/admin/login", { replace: true });
          return;
        }

        const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin", {
          _user_id: data.session.user.id,
        });
        if (adminError) throw adminError;
        if (!isAdmin) {
          toast({ title: "Admin access required", description: "This account is not an administrator.", variant: "destructive" });
          navigate("/admin/login", { replace: true });
          return;
        }

        if (active) setChecking(false);
      } catch (error) {
        if (!active) return;
        console.error("Failed to verify admin access", error);
        toast({ title: "Could not verify admin access", description: "Please sign in again.", variant: "destructive" });
        navigate("/admin/login", { replace: true });
      }
    };

    void verifyAdminAccess();
    return () => {
      active = false;
    };
  }, [navigate]);

  if (checking) return (
    <>
      <Seo title="Admin | TeamDino" description="TeamDino administration." noIndex />
      <main className="container py-12"><Skeleton className="h-8 w-48" /></main>
    </>
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const sidebar = (
    <aside className={`${isMobile ? 'fixed inset-y-0 left-0 z-50 w-64' : 'w-56 shrink-0'} bg-card border-r flex flex-col`}>
      <div className="p-4 font-bold font-display text-lg border-b flex items-center justify-between">
        Admin Panel
        {isMobile && <button onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button>}
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            onClick={() => isMobile && setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`
            }
          >
            <l.icon className="w-4 h-4" /> {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-2 border-t">
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-[80vh]">
      <Seo title="Admin | TeamDino" description="TeamDino administration." noIndex />
      {isMobile ? (
        <>
          {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)} />}
          {sidebarOpen && sidebar}
        </>
      ) : sidebar}
      <div className="flex-1 flex flex-col">
        {isMobile && (
          <div className="border-b p-2">
            <button onClick={() => setSidebarOpen(true)} className="p-2"><Menu className="w-5 h-5" /></button>
          </div>
        )}
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
