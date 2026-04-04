import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Route, Routes, useParams, BrowserRouter } from "react-router-dom";

import "./index.css";
import { Toaster } from "sonner";

import App from "./App";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthPage from "./features/auth-page/auth-page";
import ForgotPasswordPage from "./features/auth-page/forgot-password-page";
import ResetPasswordPage from "./features/auth-page/reset-password-page";
import CustomersPage from "./features/customer/customer-page";
import { DashboardPage } from "./features/dashboard";
import ExpiringSoonPage from "./features/inventory/expiring-soon-page";
import InventoryPage from "./features/inventory/inventory-page";
import LowStockPage from "./features/inventory/low-stock-page";
import AcceptInvitationPage from "./features/invitation/accept-invitation-page";
import InvitationPage from "./features/invitation/invitation-page";
import PetListPage from "./features/pets/pet-list-page";
import CustomerProfilePage from "./features/profile/customer";
import PetProfile from "./features/profile/pets";
import ProfilePage from "./features/profile/profile";
import ServicesPage from "./features/service/components/service-page";
import CreateStorePage from "./features/store/create-store-page";

function PetProfileWrapper() {
  const { id } = useParams();

  return <PetProfile petId={Number(id)} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
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
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/pets" element={<PetListPage />} />
        <Route path="/pets/:id" element={<PetProfileWrapper />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/customer-profile" element={<CustomerProfilePage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/inventory/low-stock" element={<LowStockPage />} />
        <Route path="/inventory/expiring-soon" element={<ExpiringSoonPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invitations"
          element={
            <ProtectedRoute>
              <InvitationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-store"
          element={
            <ProtectedRoute>
              <CreateStorePage />
            </ProtectedRoute>
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
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
