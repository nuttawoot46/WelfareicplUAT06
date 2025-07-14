import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { UserManagement } from './admin/UserManagement';
import React, { Suspense } from 'react';

const AdminReport = React.lazy(() => import('./AdminReport'));

// Main Admin Component
const Admin = () => {
  return (
    <Layout>
      <div className="flex flex-col">
        <main className="flex-1 p-4 sm:px-6 sm:py-6 space-y-4">
          <Routes>
            <Route path="/" element={<Navigate to="/admin/users" replace />} />
            <Route path="users" element={<UserManagement />} />
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

export default Admin;
