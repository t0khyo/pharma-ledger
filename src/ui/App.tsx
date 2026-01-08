import { Toaster } from "@/components/ui/sonner";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Debts from "@/pages/Debts";
import FinancialReports from "@/pages/FinancialReports";
import Customers from "@/pages/Customers";
import CustomerDetails from "@/pages/CustomerDetails";
import Companies from "@/pages/Companies";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="debts" element={<Debts />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetails />} />
            <Route path="companies" element={<Companies />} />
            
            {/* Admin-only route */}
            <Route
              path="reports"
              element={
                <ProtectedRoute requiredRole="admin">
                  <FinancialReports />
                </ProtectedRoute>
              }
            />

            <Route
              path="settings"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Settings />
                </ProtectedRoute>
              }
            />


            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
