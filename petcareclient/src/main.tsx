import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Route, Routes, BrowserRouter } from "react-router";

import "./index.css";
import { Toaster } from "sonner";

import App from "./App";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthPage from "./features/auth-page/auth-page";
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
        <Route path="/auth/login" element={<AuthPage />} />
        <Route path="/auth/register" element={<AuthPage />} />
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
