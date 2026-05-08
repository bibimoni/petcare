import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Route, Routes, useParams, BrowserRouter } from "react-router-dom";

import "./index.css";
import { Toaster } from "sonner";

import App from "./App";
import NotFound from "./components/not-found";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoutes";
import AboutUsPage from "./features/about-us/page";
import AuditLogsPage from "./features/audit-logs/page";
import AuthPage from "./features/auth-page/auth-page";
import ForgotPasswordPage from "./features/auth-page/forgot-password-page";
import ResetPasswordPage from "./features/auth-page/reset-password-page";
import CustomersPage from "./features/customer/customer-page";
import { DashboardPage } from "./features/dashboard";
import EmployeesPage from "./features/employees/page";
import FaqPage from "./features/faq/page";
import FinancePage from "./features/finance/page";
import ExpiringSoonPage from "./features/inventory/expiring-soon-page";
import InventoryPage from "./features/inventory/inventory-page";
import LowStockPage from "./features/inventory/low-stock-page";
import AcceptInvitationPage from "./features/invitation/accept-invitation-page";
import InvitationPage from "./features/invitation/invitation-page";
import NotAuthenticatedPage from "./features/not-authenticated/page";
import PetListPage from "./features/pets/pet-list-page";
import AllProductsPage from "./features/pos/components/all-products";
import PaymentSuccessPage from "./features/pos/components/payment-success";
import PosHistoryPage from "./features/pos/history-page";
import PosPage from "./features/pos/pos-page";
import PrivacyPolicyPage from "./features/privacy-policy/page";
import CustomerProfilePage from "./features/profile/customer";
import PetProfile from "./features/profile/pets";
import ProfilePage from "./features/profile/profile";
import ServicesPage from "./features/service/components/service-page";
import SettingsPage from "./features/settings/page";
import CreateStorePage from "./features/store/create-store-page";
import TermAndServicePage from "./features/term-and-service/page";
import NotificationsPage from "./features/notifications/notifications-page";
import { queryClient } from "./lib/query-client";

function PetProfileWrapper() {
  const { id } = useParams();

  return <PetProfile petId={Number(id)} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster
          richColors
          position="top-center"
          expand={true}
          toastOptions={{
            style: {
              minWidth: "360px",
              fontSize: "16px",
              padding: "16px",
            },
          }}
        />
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/term-and-service" element={<TermAndServicePage />} />
          <Route path="/about-us" element={<AboutUsPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/not-authenticated" element={<NotAuthenticatedPage />} />
          <Route
            path="/employees"
            element={
              <RoleRoute allowedRoles={["ADMIN"]}>
                <EmployeesPage />
              </RoleRoute>
            }
          />
          <Route
            path="/pets"
            element={
              <RoleRoute allowedRoles={["ADMIN", "STAFF"]}>
                <PetListPage />
              </RoleRoute>
            }
          />
          <Route
            path="/pets/:id"
            element={
              <RoleRoute allowedRoles={["ADMIN", "STAFF"]}>
                <PetProfileWrapper />
              </RoleRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <RoleRoute allowedRoles={["ADMIN", "STAFF"]}>
                <CustomersPage />
              </RoleRoute>
            }
          />
          <Route
            path="/customers/:id"
            element={
              <RoleRoute allowedRoles={["ADMIN", "STAFF"]}>
                <CustomerProfilePage />
              </RoleRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <RoleRoute allowedRoles={["ADMIN", "STAFF"]}>
                <InventoryPage />
              </RoleRoute>
            }
          />
          <Route
            path="/inventory/low-stock"
            element={
              <RoleRoute allowedRoles={["ADMIN", "STAFF"]}>
                <LowStockPage />
              </RoleRoute>
            }
          />
          <Route
            path="/inventory/expiring-soon"
            element={
              <RoleRoute allowedRoles={["ADMIN", "STAFF"]}>
                <ExpiringSoonPage />
              </RoleRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <RoleRoute allowedRoles={["ADMIN", "STAFF"]}>
                <NotificationsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/services"
            element={
              <RoleRoute allowedRoles={["ADMIN"]}>
                <ServicesPage />
              </RoleRoute>
            }
          />
          <Route
            path="/pos"
            element={
              <RoleRoute allowedRoles={["ADMIN", "STAFF"]}>
                <PosPage />
              </RoleRoute>
            }
          />
          <Route
            path="/pos/all-products"
            element={
              <RoleRoute allowedRoles={["ADMIN", "STAFF"]}>
                <AllProductsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/pos/history"
            element={
              <RoleRoute allowedRoles={["ADMIN", "STAFF"]}>
                <PosHistoryPage />
              </RoleRoute>
            }
          />
          <Route
            path="/orders/:orderId/success"
            element={
              <RoleRoute allowedRoles={["ADMIN", "STAFF"]}>
                <PaymentSuccessPage />
              </RoleRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RoleRoute allowedRoles={["ADMIN", "STAFF"]}>
                <DashboardPage />
              </RoleRoute>
            }
          />
          <Route
            path="/invitations"
            element={
              <RoleRoute allowedRoles={["NULL"]}>
                <InvitationPage />
              </RoleRoute>
            }
          />
          <Route
            path="/create-store"
            element={
              <RoleRoute allowedRoles={["NULL"]}>
                <CreateStorePage />
              </RoleRoute>
            }
          />
          <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <RoleRoute allowedRoles={["ADMIN", "STAFF", "NULL"]}>
                <SettingsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <RoleRoute allowedRoles={["ADMIN"]}>
                <AuditLogsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/finance"
            element={
              <RoleRoute allowedRoles={["ADMIN"]}>
                <FinancePage />
              </RoleRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
