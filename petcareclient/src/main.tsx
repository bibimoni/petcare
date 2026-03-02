import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Route, Routes, BrowserRouter } from "react-router";

import "./index.css";
import { Toaster } from "sonner";

import App from "./App";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthPage from "./features/auth-page/auth-page";
import ForgotPasswordPage from "./features/auth-page/forgot-password-page";
import ResetPasswordPage from "./features/auth-page/reset-password-page";
import { DashboardPage } from "./features/dashboard";
import ProfilePage from "./features/profile/profile";

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
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
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
