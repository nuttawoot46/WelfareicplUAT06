import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { WelfareProvider } from "@/context/WelfareContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { Toaster as HotToast } from 'react-hot-toast';
import { ThemeProvider } from 'next-themes';

// Import Pages
import IndexPage from "./pages/Index"; // หน้า Login ของคุณ
import DashboardPage from "./pages/Dashboard";
import NotFoundPage from "./pages/NotFound";
import Forms from "./pages/Forms";
import Admin from "./pages/Admin";  
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import { ApprovalPage } from "./pages/ApprovalPage";


// Import หน้าอื่นๆ ของคุณตามต้องการ
// import Forms from "./pages/Forms";
// import Admin from "./pages/Admin";
// ...

const queryClient = new QueryClient();

// สร้าง "ยาม" สำหรับหน้าที่ต้องล็อกอินก่อน
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading Authentication...</div>;
  }

  if (!user) {
    // ถ้ายังไม่ล็อกอิน ให้ไปที่หน้าแรก (Login)
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// สร้าง "ยาม" สำหรับหน้าสาธารณะ (เช่น หน้า Login)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
  
    if (loading) {
      return <div>Loading Authentication...</div>;
    }
  
    if (user) {
      // ถ้าล็อกอินแล้ว แต่พยายามจะเข้าหน้า Login ให้พาไป Dashboard แทน
      return <Navigate to="/dashboard" replace />;
    }
  
    return <>{children}</>;
  };


const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <WelfareProvider>
              <NotificationProvider>
                <Toaster />
                <Sonner />
                <HotToast position="top-right" />
                <Routes>
                  {/* --- Public Routes --- */}
                  <Route path="/" element={
                    <PublicRoute>
                      <IndexPage />
                    </PublicRoute>
                  } />
                  
                  {/* --- ลบ Route /auth/callback ทิ้งไปเลย --- */}
                  {/* <Route path="/auth/callback" element={<AuthCallback />} /> */}

                  {/* --- Protected Routes --- */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  } />

                  <Route path="/forms" element={
                    <ProtectedRoute>
                      <Forms />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/notifications" element={
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/approve" element={
                    <ProtectedRoute>
                      <ApprovalPage />
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/*" element={
                    <ProtectedRoute>
                      <Admin />
                    </ProtectedRoute>
                  } />
                  
                  {/* Catch-all Route สำหรับหน้า 404 */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </NotificationProvider>
            </WelfareProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;