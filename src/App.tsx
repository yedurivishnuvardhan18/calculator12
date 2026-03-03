import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { ThemeProvider } from "./components/ThemeProvider";
import GradeCalculator from "./pages/GradeCalculator";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { ExternalPage } from "./components/ExternalPage";
import { FloatingCoffee } from "./components/FloatingCoffee";
import { CoffeePopup } from "./components/CoffeePopup";
import Learn from "./pages/Learn";
import LearnSubject from "./pages/LearnSubject";
import LearnModule from "./pages/LearnModule";
import LearnTopic from "./pages/LearnTopic";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBranches from "./pages/admin/AdminBranches";
import AdminSubjects from "./pages/admin/AdminSubjects";
import AdminModules from "./pages/admin/AdminModules";
import AdminTopics from "./pages/admin/AdminTopics";
import AdminVideos from "./pages/admin/AdminVideos";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<GradeCalculator />} />
            <Route path="/habits" element={<Index />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/learn/:subjectId" element={<LearnSubject />} />
            <Route path="/learn/:subjectId/:moduleId" element={<LearnModule />} />
            <Route path="/learn/:subjectId/:moduleId/:topicId" element={<LearnTopic />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="branches" element={<AdminBranches />} />
              <Route path="subjects" element={<AdminSubjects />} />
              <Route path="modules" element={<AdminModules />} />
              <Route path="topics" element={<AdminTopics />} />
              <Route path="videos" element={<AdminVideos />} />
            </Route>
            <Route path="/external/feedback" element={<ExternalPage url="https://docs.google.com/forms/d/e/1FAIpQLSffSEUgxpJZ4i14s1E0cFQmheKTlS6uKGajijuL3YMBUY4txg/viewform?usp=publish-editor" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
          <FloatingCoffee />
          <CoffeePopup />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
