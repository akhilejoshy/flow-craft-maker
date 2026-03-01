import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
// import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Screenshots from "./pages/Screenshots";
import NotFound from "./pages/NotFound";
import Auth from "./components/Auth";


const queryClient = new QueryClient();

// const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const { isAuthenticated } = useAuth();
//   if (!isAuthenticated) return <Navigate to="/login" replace />;
//   return <AppLayout>{children}</AppLayout>;
// };

// const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const { isAuthenticated } = useAuth();
//   if (isAuthenticated) return <Navigate to="/dashboard" replace />;
//   return <>{children}</>;
// };

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      < Sonner />
      <HashRouter>
        <Routes>
          {/* 1. Redirect root to dashboard or login */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 2. Login Route */}
          <Route path="/login" element={
            <Auth auth={false}>
                <Login />
            </Auth>
          } />

          {/* 3. Dashboard Route */}
          <Route path="/dashboard" element={
            <Auth auth={true}>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </Auth>
          } />

          {/* 4. Screenshots Route */}
          <Route path="/screenshots" element={
            <Auth auth={true}>
              <AppLayout>
                <Screenshots />
              </AppLayout>
            </Auth>
          } />

          {/* 5. Catch-all 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
