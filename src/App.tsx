import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import TimeTracking from "./pages/TimeTracking";
import Schedule from "./pages/Schedule";
import Leaves from "./pages/Leaves";
import Performance from "./pages/Performance";
import QRScan from "./pages/QRScan";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/time-tracking" element={<TimeTracking />} />
          <Route path="/dashboard/schedule" element={<Schedule />} />
          <Route path="/dashboard/leaves" element={<Leaves />} />
          <Route path="/dashboard/performance" element={<Performance />} />
          <Route path="/dashboard/qr-scan" element={<QRScan />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
