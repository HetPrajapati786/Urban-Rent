import { Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { Toaster } from 'react-hot-toast';

// Pages
import LandingPage from './pages/LandingPage';
import SelectRole from './pages/auth/SelectRole';
import TenantDashboard from './pages/tenant/TenantDashboard';
import TenantHome from './pages/tenant/TenantHome';
import TenantProperties from './pages/tenant/TenantProperties';
import TenantFavourites from './pages/tenant/TenantFavourites';
import TenantApplications from './pages/tenant/TenantApplications';
import TenantSearch from './pages/tenant/TenantSearch';
import TenantPropertyDetails from './pages/tenant/TenantPropertyDetails';
import TenantPayments from './pages/tenant/TenantPayments';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import AddProperty from './pages/manager/AddProperty';
import AllProperties from './pages/manager/AllProperties';
import PropertyDetails from './pages/manager/PropertyDetails';
import ManagerApplications from './pages/manager/ManagerApplications';
import ManagerEarnings from './pages/manager/ManagerEarnings';
import ManagerCredits from './pages/manager/ManagerCredits';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProperties from './pages/admin/AdminProperties';
import AdminPropertyDetail from './pages/admin/AdminPropertyDetail';
import AdminUsers from './pages/admin/AdminUsers';
import AdminApplications from './pages/admin/AdminApplications';
import AdminPayments from './pages/admin/AdminPayments';
import AdminIncome from './pages/admin/AdminIncome';
import AdminLogin from './pages/admin/AdminLogin';
import AdminBlogs from './pages/admin/AdminBlogs';
import DemoRoleSelect from './pages/DemoRoleSelect';

// Blogs & News
import TenantBlogs from './pages/tenant/TenantBlogs';
import TenantBlogDetails from './pages/tenant/TenantBlogDetails';
import ManagerBlogs from './pages/manager/ManagerBlogs';
import AdminBlogEditor from './pages/admin/AdminBlogEditor';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import AdminGuard from './components/AdminGuard';
import UserSync from './components/UserSync';
import SmartToaster from './components/SmartToaster';

/**
 * PostLoginRedirect — After Clerk sign-in, redirect user based on role.
 * If no role → go to /select-role. Otherwise → go to their dashboard.
 */
function PostLoginRedirect() {
  const { user } = useUser();
  const role = user?.unsafeMetadata?.role || user?.publicMetadata?.role;

  if (!role) return <Navigate to="/select-role" replace />;
  if (role === 'tenant') return <Navigate to="/tenant/home" replace />;
  if (role === 'manager') return <Navigate to="/manager/dashboard" replace />;
  return <Navigate to="/" replace />;
}

function App() {
  const { user } = useUser();
  const userRole = user?.unsafeMetadata?.role || user?.publicMetadata?.role;

  return (
    <>
      <Toaster position="top-right" />
      <SmartToaster userRole={userRole} />
      <UserSync />
      <Routes>
        {/* Public — Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Post-login redirect helper */}
        <Route
          path="/sso-callback"
          element={
            <SignedIn>
              <PostLoginRedirect />
            </SignedIn>
          }
        />

        {/* Role Selection — requires auth but no role yet */}
        <Route path="/select-role" element={<SelectRole />} />

        {/* Public Knowledge Base accessible from Landing Page Nav */}
        <Route path="/blogs" element={<TenantBlogs />} />
        <Route path="/blogs/:slug" element={<TenantBlogDetails />} />

        {/* Tenant Routes */}
        <Route
          path="/tenant/home"
          element={
            <ProtectedRoute role="tenant">
              <TenantHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenant/dashboard"
          element={
            <ProtectedRoute role="tenant">
              <TenantDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenant/properties"
          element={
            <ProtectedRoute role="tenant">
              <TenantProperties />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenant/search"
          element={
            <ProtectedRoute role="tenant">
              <TenantSearch />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenant/favourites"
          element={
            <ProtectedRoute role="tenant">
              <TenantFavourites />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenant/applications"
          element={
            <ProtectedRoute role="tenant">
              <TenantApplications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenant/properties/:id"
          element={
            <ProtectedRoute role="tenant">
              <TenantPropertyDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenant/payments"
          element={
            <ProtectedRoute role="tenant">
              <TenantPayments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenant/blogs"
          element={
            <ProtectedRoute role="tenant">
              <TenantBlogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenant/blogs/:slug"
          element={
            <ProtectedRoute role="tenant">
              <TenantBlogDetails />
            </ProtectedRoute>
          }
        />

        {/* Manager Routes */}
        <Route
          path="/manager/dashboard"
          element={
            <ProtectedRoute role="manager">
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/add-property"
          element={
            <ProtectedRoute role="manager">
              <AddProperty />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/edit-property/:id"
          element={
            <ProtectedRoute role="manager">
              <AddProperty />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/blogs"
          element={
            <ProtectedRoute role="manager">
              <ManagerBlogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/properties"
          element={
            <ProtectedRoute role="manager">
              <AllProperties />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/properties/:id"
          element={
            <ProtectedRoute role="manager">
              <PropertyDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/applications"
          element={
            <ProtectedRoute role="manager">
              <ManagerApplications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/earnings"
          element={
            <ProtectedRoute role="manager">
              <ManagerEarnings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/credits"
          element={
            <ProtectedRoute role="manager">
              <ManagerCredits />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminGuard>
              <AdminDashboard />
            </AdminGuard>
          }
        />
        <Route
          path="/admin/properties"
          element={
            <AdminGuard>
              <AdminProperties />
            </AdminGuard>
          }
        />
        <Route
          path="/admin/properties/:id"
          element={
            <AdminGuard>
              <AdminPropertyDetail />
            </AdminGuard>
          }
        />
        <Route
          path="/admin/applications"
          element={
            <AdminGuard>
              <AdminApplications />
            </AdminGuard>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <AdminGuard>
              <AdminPayments />
            </AdminGuard>
          }
        />
        <Route
          path="/admin/income"
          element={
            <AdminGuard>
              <AdminIncome />
            </AdminGuard>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminGuard>
              <AdminUsers />
            </AdminGuard>
          }
        />
        <Route
          path="/admin/blogs"
          element={
            <AdminGuard>
              <AdminBlogs />
            </AdminGuard>
          }
        />
        <Route
          path="/admin/blogs/create"
          element={
            <AdminGuard>
              <AdminBlogEditor />
            </AdminGuard>
          }
        />
        <Route
          path="/admin/blogs/edit/:id"
          element={
            <AdminGuard>
              <AdminBlogEditor />
            </AdminGuard>
          }
        />

        {/* ===== Demo Routes (no auth required) ===== */}
        <Route path="/demo" element={<DemoRoleSelect />} />
        <Route path="/demo/tenant" element={<TenantHome />} />
        <Route path="/demo/tenant/home" element={<TenantHome />} />
        <Route path="/demo/tenant/dashboard" element={<TenantDashboard />} />
        <Route path="/demo/tenant/properties" element={<TenantProperties />} />
        <Route path="/demo/tenant/search" element={<TenantSearch />} />
        <Route path="/demo/tenant/favourites" element={<TenantFavourites />} />
        <Route path="/demo/tenant/applications" element={<TenantApplications />} />
        <Route path="/demo/tenant/properties/:id" element={<TenantPropertyDetails />} />
        <Route path="/demo/tenant/payments" element={<TenantPayments />} />
        <Route path="/demo/manager" element={<ManagerDashboard />} />
        <Route path="/demo/manager/add-property" element={<AddProperty />} />
        <Route path="/demo/manager/edit-property/:id" element={<AddProperty />} />
        <Route path="/demo/manager/properties" element={<AllProperties />} />
        <Route path="/demo/manager/properties/:id" element={<PropertyDetails />} />
        <Route path="/demo/manager/applications" element={<ManagerApplications />} />
        <Route path="/demo/manager/earnings" element={<ManagerEarnings />} />
        <Route path="/demo/manager/credits" element={<ManagerCredits />} />

        {/* Admin Demo Routes */}
        <Route path="/demo/admin" element={<AdminDashboard />} />
        <Route path="/demo/admin/properties" element={<AdminProperties />} />
        <Route path="/demo/admin/properties/:id" element={<AdminPropertyDetail />} />
        <Route path="/demo/admin/applications" element={<AdminApplications />} />
        <Route path="/demo/admin/payments" element={<AdminPayments />} />
        <Route path="/demo/admin/income" element={<AdminIncome />} />
        <Route path="/demo/admin/users" element={<AdminUsers />} />

        {/* Catch all → home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
