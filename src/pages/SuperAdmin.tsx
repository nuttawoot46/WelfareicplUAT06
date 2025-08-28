import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { UserManagement } from './admin/UserManagement';
import { SuperAdminDashboard } from './superadmin/SuperAdminDashboard';
import { SystemSettings } from './superadmin/SystemSettings';
import { DatabaseManagement } from './superadmin/DatabaseManagement';
import { SecuritySettings } from './superadmin/SecuritySettings';
import { AuditLogs } from './superadmin/AuditLogs';
import React, { Suspense } from 'react';

const AdminReport = React.lazy(() => import('./AdminReport'));

// Main SuperAdmin Component
const SuperAdmin = () => {
  return (
    <Layout>
      <div className="flex flex-col">
        <main className="flex-1 p-4 sm:px-6 sm:py-6 space-y-4">
          <Routes>
            <Route path="/" element={<Navigate to="/superadmin/dashboard" replace />} />
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="system" element={<SystemSettings />} />
            <Route path="database" element={<DatabaseManagement />} />
            <Route path="security" element={<SecuritySettings />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route
              path="report"
              element={
                <Suspense fallback={<div>Loading Report...</div>}>
                  <AdminReport />
                </Suspense>
              }
            />
          </Routes>
        </main>
      </div>
    </Layout>
  );
};

export default SuperAdmin;