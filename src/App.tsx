import { useState, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { FocusProvider } from "@/contexts/FocusContext";
import { NativePermissionGate } from "@/components/NativePermissionGate";
import { SplashScreen } from "@/components/SplashScreen";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import FocusPage from "./pages/FocusPage";
import BlockPageRoute from "./pages/BlockPageRoute";
import HistoryPageRoute from "./pages/HistoryPageRoute";
import WalletPageRoute from "./pages/WalletPageRoute";
import ProfilePage from "./pages/ProfilePage";
import PermissionsPage from "./pages/PermissionsPage";
import DiagnosticsPage from "./pages/DiagnosticsPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SchedulePage from "./pages/SchedulePage";
import StorePage from "./pages/StorePage";
import NotFound from "./pages/NotFound";
import { ActiveFocusOverlay } from "@/components/focus/ActiveFocusOverlay";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const hideSplash = useCallback(() => setShowSplash(false), []);

  return (
    <>
      {showSplash && <SplashScreen onComplete={hideSplash} />}
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <FocusProvider>
                <NativePermissionGate>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/focus" element={<FocusPage />} />
                    <Route path="/block" element={<BlockPageRoute />} />
                    <Route path="/history" element={<HistoryPageRoute />} />
                    <Route path="/wallet" element={<WalletPageRoute />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/permissions" element={<PermissionsPage />} />
                    <Route path="/diagnostics" element={<DiagnosticsPage />} />
                    <Route path="/leaderboard" element={<LeaderboardPage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/schedule" element={<SchedulePage />} />
                    <Route path="/store" element={<StorePage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <ActiveFocusOverlay />
                </NativePermissionGate>
              </FocusProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </>
  );
};

export default App;
