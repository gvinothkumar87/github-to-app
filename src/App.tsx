import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Bills from "./pages/Bills";
import DebitNote from "./pages/DebitNote";
import CreditNote from "./pages/CreditNote";
import Suppliers from "./pages/Suppliers";
import Purchases from "./pages/Purchases";
import SupplierLedger from "./pages/SupplierLedger";
import StockLedger from "./pages/StockLedger";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import GoogleDriveCallback from "./pages/GoogleDriveCallback";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/google-callback" element={<GoogleDriveCallback />} />
              <Route path="/bills" element={
                <ProtectedRoute>
                  <Bills />
                </ProtectedRoute>
              } />
              <Route path="/debit-note" element={
                <ProtectedRoute>
                  <DebitNote />
                </ProtectedRoute>
              } />
              <Route path="/credit-note" element={
                <ProtectedRoute>
                  <CreditNote />
                </ProtectedRoute>
              } />
              <Route path="/suppliers" element={
                <ProtectedRoute>
                  <Suppliers />
                </ProtectedRoute>
              } />
              <Route path="/purchases" element={
                <ProtectedRoute>
                  <Purchases />
                </ProtectedRoute>
              } />
              <Route path="/supplier-ledger" element={
                <ProtectedRoute>
                  <SupplierLedger />
                </ProtectedRoute>
              } />
              <Route path="/stock-ledger" element={
                <ProtectedRoute>
                  <StockLedger />
                </ProtectedRoute>
              } />
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
