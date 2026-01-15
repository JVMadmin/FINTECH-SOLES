import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";

// Pages
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ClientsPage from "@/pages/ClientsPage";
import ClientDetailPage from "@/pages/ClientDetailPage";
import CreditsPage from "@/pages/CreditsPage";
import CreditDetailPage from "@/pages/CreditDetailPage";
import CobranzaPage from "@/pages/CobranzaPage";
import CarteraPage from "@/pages/CarteraPage";
import UsersPage from "@/pages/UsersPage";
import CashboxPage from "@/pages/CashboxPage";
import LogsPage from "@/pages/LogsPage";

// Context
import { AuthProvider, useAuth } from "@/context/AuthContext";

// Layout
import MainLayout from "@/components/layout/MainLayout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Axios interceptor for auth
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
};

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <ProtectedRoute>
            <ClientsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients/:id"
        element={
          <ProtectedRoute>
            <ClientDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/credits"
        element={
          <ProtectedRoute>
            <CreditsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/credits/:id"
        element={
          <ProtectedRoute>
            <CreditDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cobranza"
        element={
          <ProtectedRoute>
            <CobranzaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cartera"
        element={
          <ProtectedRoute
            allowedRoles={["desarrollador", "administrador", "supervisor"]}
          >
            <CarteraPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute
            allowedRoles={[
              "desarrollador",
              "administrador",
              "gerente_regional",
              "supervisor",
            ]}
          >
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cashbox"
        element={
          <ProtectedRoute>
            <CashboxPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/logs"
        element={
          <ProtectedRoute allowedRoles={["desarrollador", "administrador"]}>
            <LogsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  // Seed initial data on first load
  useEffect(() => {
    const seedData = async () => {
      try {
        await axios.post(`${API}/seed`);
      } catch (e) {
        // Ignore if already seeded
      }
    };
    seedData();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
