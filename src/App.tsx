import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { WelfareProvider } from "@/context/WelfareContext";
import { InternalTrainingProvider } from "@/context/InternalTrainingContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { LeaveProvider } from "@/context/LeaveContext";
import { RoleProtectedRoute } from "@/components/auth/RoleProtectedRoute";
import { Toaster as HotToast } from 'react-hot-toast';
import MainLayout from "@/components/layout/MainLayout";

// Import Pages
import IndexPage from "./pages/Index"; // หน้า Login ของคุณ
import DashboardPage from "./pages/Dashboard";
import WelfareDashboard from "./pages/WelfareDashboard";
import AccountingDashboard from "./pages/AccountingDashboard";
import NotFoundPage from "./pages/NotFound";
import Forms from "./pages/Forms";
import { WelfareFormsPage } from "./pages/WelfareFormsPage";
import { AccountingFormsPage } from "./pages/AccountingFormsPage";
import Admin from "./pages/Admin";  
import SuperAdmin from "./pages/SuperAdmin";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import { ApprovalPage } from "./pages/ApprovalPage";
import { AccountingApprovalPage } from "./pages/AccountingApprovalPage";
import { HRApprovalPage } from "./pages/HRApprovalPage";
import { AccountingReviewPage } from "./pages/AccountingReviewPage";
import { WelfareAccountingReviewPage } from "./pages/WelfareAccountingReviewPage";
import { GeneralAccountingReviewPage } from "./pages/GeneralAccountingReviewPage";

import { SupportPage } from "./pages/SupportPage";
import SpecialApprovalPage from "./pages/SpecialApprovalPage";
import LeaveCalendarPage from "./pages/LeaveCalendarPage";
import LeaveApprovalPage from "./pages/LeaveApprovalPage";
import LeaveReportPage from "./pages/LeaveReportPage";


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
                <LeaveProvider>
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
                      <MainLayout>
                        <DashboardPage />
                      </MainLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/welfare-dashboard" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <WelfareDashboard />
                      </MainLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/accounting-dashboard" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <AccountingDashboard />
                      </MainLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/forms" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Forms />
                      </MainLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/welfare-forms" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <WelfareFormsPage />
                      </MainLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/accounting-forms" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <AccountingFormsPage />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/notifications" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Notifications />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Settings />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/approve" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <ApprovalPage />
                      </MainLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/accounting-approve" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <AccountingApprovalPage />
                      </MainLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/hr-approve" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <HRApprovalPage />
                      </MainLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/special-approve" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <SpecialApprovalPage />
                      </MainLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/*" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Admin />
                      </MainLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/superadmin/*" element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['superadmin']}>
                        <MainLayout>
                          <SuperAdmin />
                        </MainLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  } />

                  <Route path="/accounting-review" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <AccountingReviewPage />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/welfare-accounting-review" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <WelfareAccountingReviewPage />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/general-accounting-review" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <GeneralAccountingReviewPage />
                      </MainLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/support" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <SupportPage />
                      </MainLayout>
                    </ProtectedRoute>
                  } />

                  {/* Leave Calendar Routes */}
                  <Route path="/leave-calendar" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <LeaveCalendarPage />
                      </MainLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/leave-approve" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <LeaveApprovalPage />
                      </MainLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/leave-report" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <LeaveReportPage />
                      </MainLayout>
                    </ProtectedRoute>
                  } />

                  {/* Catch-all Route สำหรับหน้า 404 */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
                </NotificationProvider>
                </LeaveProvider>
              </InternalTrainingProvider>
            </WelfareProvider>
          </AuthProvider>
        </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;