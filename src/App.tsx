
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import ClaimForm from "./pages/ClaimForm";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminRegister from "./pages/AdminRegister";
import PaymentRedirect from "./pages/PaymentRedirect";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CourrierDetail from "./pages/CourrierDetail";
import PasswordReset from "./pages/PasswordReset";
import ResetPassword from "./pages/ResetPassword";
import DossierDetail from "./pages/DossierDetail";
import { Messages } from "./pages/Messages";
import { UserDocuments } from "./pages/UserDocuments";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            
            {/* Auth routes - redirect if already authenticated */}
            <Route path="/login" element={
              <ProtectedRoute requireAuth={false}>
                <Login />
              </ProtectedRoute>
            } />
            <Route path="/register" element={
              <ProtectedRoute requireAuth={false}>
                <Register />
              </ProtectedRoute>
            } />
            <Route path="/admin/register" element={
              <ProtectedRoute requireAuth={false}>
                <AdminRegister />
              </ProtectedRoute>
            } />
            <Route path="/password-reset" element={
              <ProtectedRoute requireAuth={false}>
                <PasswordReset />
              </ProtectedRoute>
            } />
            <Route path="/reset-password" element={
              <ProtectedRoute requireAuth={false}>
                <ResetPassword />
              </ProtectedRoute>
            } />
            
            {/* Protected routes - require authentication */}
            <Route path="/claim-form" element={
              <ProtectedRoute>
                <ClaimForm />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/courrier/:id" element={
              <ProtectedRoute>
                <CourrierDetail />
              </ProtectedRoute>
            } />
            <Route path="/payment-redirect" element={
              <ProtectedRoute>
                <PaymentRedirect />
              </ProtectedRoute>
            } />
            <Route path="/case/:id" element={
              <ProtectedRoute>
                <DossierDetail />
              </ProtectedRoute>
            } />
            <Route path="/case/:id/messages" element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            } />
            <Route path="/documents" element={
              <ProtectedRoute>
                <UserDocuments />
              </ProtectedRoute>
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
