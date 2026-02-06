import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { UserSelector, UserBar } from "@/components/UserSelector";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AuthenticatedApp = () => {
  const { profile, loading } = useAuth();

  // Mostrar pantalla de selección de usuario si no hay usuario
  if (loading || !profile) {
    return <UserSelector />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <div className="max-w-[1920px] mx-auto p-4">
          <UserBar />
        </div>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthenticatedApp />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
