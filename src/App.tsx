import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "./components/ProtectedRoute.tsx";

const Index = lazy(() => import("./pages/Index.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const Onboard = lazy(() => import("./pages/Onboard.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const MockCheckout = lazy(() => import("./pages/MockCheckout.tsx"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess.tsx"));
const PaymentCancel = lazy(() => import("./pages/PaymentCancel.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboard" element={<ProtectedRoute><Onboard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/mock-checkout" element={<ProtectedRoute><MockCheckout /></ProtectedRoute>} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-cancel" element={<PaymentCancel />} />
          <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
