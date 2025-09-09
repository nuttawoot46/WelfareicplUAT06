import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { WelfareProvider } from "@/context/WelfareContext";
import { InternalTrainingProvider } from "@/context/InternalTrainingContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { RoleProtectedRoute } from "@/components/auth/RoleProtectedRoute";
import { Toaster as HotToast } from 'react-hot-toast';

// Import Pages
import IndexPage from "./pages/Index"; // หน้า Login ของคุณ
import DashboardPage from "./pages/Dashboard";
import NotFoundPage from "./pages/NotFound";
import Forms from "./pages/Forms";
import Admin from "./pages/Admin";  
import SuperAdmin from "./pages/SuperAdmin";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import { ApprovalPage } from "./pages/ApprovalPage";
import { HRApprovalPage } from "./pages/HRApprovalPage";
import { AccountingReviewPage } from "./pages/AccountingReviewPage";
import ManagerPDFApprovalPage from "./pages/ManagerPDFApprovalPage";
import HRPDFApprovalPage from "./pages/HRPDFApprovalPage";
import WorkflowTimelinePage from "./pages/WorkflowTimelinePage";
import { SupportPage } from "./pages/SupportPage";


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
    <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <WelfareProvider>
              <InternalTrainingProvider>
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

                  <Route path="/hr-approve" element={
                    <ProtectedRoute>
                      <HRApprovalPage />
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/*" element={
                    <ProtectedRoute>
                      <Admin />
                    </ProtectedRoute>
                  } />

                  <Route path="/superadmin/*" element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['superadmin']}>
                        <SuperAdmin />
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  } />

                  <Route path="/accounting-review" element={
                    <ProtectedRoute>
                      <AccountingReviewPage />
                    </ProtectedRoute>
                  } />

                  <Route path="/support" element={
                    <ProtectedRoute>
                      <SupportPage />
                    </ProtectedRoute>
                  } />
                  
                  {/* Catch-all Route สำหรับหน้า 404 */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
                </NotificationProvider>
              </InternalTrainingProvider>
            </WelfareProvider>
          </AuthProvider>
        </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;