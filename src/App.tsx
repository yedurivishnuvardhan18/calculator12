import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { ThemeProvider } from "./components/ThemeProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { CommandPalette } from "./components/CommandPalette";
import { BugReportButton } from "./components/BugReportButton";
import { Seo } from "./components/Seo";
import { ExternalPage } from "./components/ExternalPage";

const GradeCalculator = lazy(() => import("./pages/GradeCalculator"));
const About = lazy(() => import("./pages/About"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Learn = lazy(() => import("./pages/Learn"));
const LearnSubject = lazy(() => import("./pages/LearnSubject"));
const LearnModule = lazy(() => import("./pages/LearnModule"));
const LearnTopic = lazy(() => import("./pages/LearnTopic"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminBranches = lazy(() => import("./pages/admin/AdminBranches"));
const AdminSubjects = lazy(() => import("./pages/admin/AdminSubjects"));
const AdminModules = lazy(() => import("./pages/admin/AdminModules"));
const AdminTopics = lazy(() => import("./pages/admin/AdminTopics"));
const AdminVideos = lazy(() => import("./pages/admin/AdminVideos"));
const GitamResults = lazy(() => import("./pages/GitamResults"));
const WhatIfCalculator = lazy(() => import("./pages/WhatIfCalculator"));
const AttendanceCalculator = lazy(() => import("./pages/AttendanceCalculator"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <CommandPalette />
          <Navbar />
          <Suspense fallback={<main className="container min-h-[60vh] py-12" aria-busy="true">Loading calculator...</main>}>
            <Routes>
              <Route path="/" element={<ErrorBoundary><GradeCalculator /></ErrorBoundary>} />
              <Route path="/about" element={<ErrorBoundary><About /></ErrorBoundary>} />
              <Route path="/what-if" element={<ErrorBoundary><WhatIfCalculator /></ErrorBoundary>} />
              <Route path="/attendance" element={<ErrorBoundary><AttendanceCalculator /></ErrorBoundary>} />
              <Route path="/learn" element={<ErrorBoundary><Learn /></ErrorBoundary>} />
              <Route path="/learn/:subjectId" element={<ErrorBoundary><LearnSubject /></ErrorBoundary>} />
              <Route path="/learn/:subjectId/:moduleId" element={<ErrorBoundary><LearnModule /></ErrorBoundary>} />
              <Route path="/learn/:subjectId/:moduleId/:topicId" element={<ErrorBoundary><LearnTopic /></ErrorBoundary>} />
              <Route path="/gitam-results" element={<ErrorBoundary><GitamResults /></ErrorBoundary>} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="branches" element={<AdminBranches />} />
                <Route path="subjects" element={<AdminSubjects />} />
                <Route path="modules" element={<AdminModules />} />
                <Route path="topics" element={<AdminTopics />} />
                <Route path="videos" element={<AdminVideos />} />
              </Route>
              <Route
                path="/external/feedback"
                element={
                  <>
                    <Seo title="External Feedback Form | TeamDino" description="Open the TeamDino feedback form." noIndex />
                    <ExternalPage url="https://docs.google.com/forms/d/e/1FAIpQLSffSEUgxpJZ4i14s1E0cFQmheKTlS6uKGajijuL3YMBUY4txg/viewform?usp=publish-editor" />
                  </>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <BugReportButton />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
