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
// import GitamResults from "./pages/GitamResults";
import { ExternalPage } from "./components/ExternalPage";
import { FloatingCoffee } from "./components/FloatingCoffee";

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
            {/* <Route path="/gitam-results" element={<GitamResults />} /> */}
            <Route path="/external/feedback" element={<ExternalPage url="https://docs.google.com/forms/d/e/1FAIpQLSffSEUgxpJZ4i14s1E0cFQmheKTlS6uKGajijuL3YMBUY4txg/viewform?usp=publish-editor" />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
          <FloatingCoffee />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
