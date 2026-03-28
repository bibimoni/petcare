import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Route, Routes, BrowserRouter } from "react-router-dom";

import "./index.css";
import { Toaster } from "sonner";

import App from "./App";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthPage from "./features/auth-page/auth-page";
import ForgotPasswordPage from "./features/auth-page/forgot-password-page";
import ResetPasswordPage from "./features/auth-page/reset-password-page";
import ProfilePage from "./features/profile/profile";
import PetListPage from "./features/pets/pages/pet-list-page";
import CustomersPage from "./features/customer/customer-page";
import Cusprofile from "./features/profile/cus-profile";
import PetDetailPage from "./features/profile/pet-profile";
import { useParams } from "react-router-dom";
import PetProfile from "./features/profile/pet-profile";

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
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/customer-profile" element={<Cusprofile />} />
        {/* <Route path="/pet-profile/:petId" element={<PetProfile/>} /> */}
        <Route path="/pets/:id" element={<PetProfileWrapper />} />
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
