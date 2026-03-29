import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { FocusProvider } from "@/contexts/FocusContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import FocusPage from "./pages/FocusPage";
import BlockPageRoute from "./pages/BlockPageRoute";
import HistoryPageRoute from "./pages/HistoryPageRoute";
import WalletPageRoute from "./pages/WalletPageRoute";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <FocusProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/focus" element={<FocusPage />} />
              <Route path="/block" element={<BlockPageRoute />} />
              <Route path="/history" element={<HistoryPageRoute />} />
              <Route path="/wallet" element={<WalletPageRoute />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </FocusProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
