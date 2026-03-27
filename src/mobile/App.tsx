import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { MobileServiceProvider } from './providers/MobileServiceProvider';
import MobileProtectedRoute from './components/MobileProtectedRoute';
import MobileAuth from './pages/MobileAuth';
import MobileIndex from './pages/MobileIndex';
import MobileReceiptForm from './forms/MobileReceiptForm';
import MobileCustomerForm from './forms/MobileCustomerForm';
import MobileOutwardEntryForm from './forms/MobileOutwardEntryForm';
import MobileItemForm from './forms/MobileItemForm';
import MobileSalesForm from './forms/MobileSalesForm';
import MobileCustomerList from './pages/MobileCustomerList';
import MobileTransitList from './pages/MobileTransitList';
import MobileItemList from './pages/MobileItemList';
import MobileSalesList from './pages/MobileSalesList';
import MobileSettings from './pages/MobileSettings';
import MobileSalesLedgerOffline from './pages/MobileSalesLedgerOffline';
import MobileCustomerLedgerOffline from './pages/MobileCustomerLedgerOffline';
import MobileBillsList from './pages/MobileBillsList';
import MobileEditSaleForm from './forms/MobileEditSaleForm';
import MobileInvoiceGenerator from './components/MobileInvoiceGenerator';
import MobileCreditNoteForm from './pages/MobileCreditNoteForm';
import MobileDebitNoteForm from './pages/MobileDebitNoteForm';
import MobileReceiptList from './pages/MobileReceiptList';
import MobileReports from './pages/MobileReports';
import MobileDirectSalesForm from './forms/MobileDirectSalesForm';

// Create a query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

const MobileApp: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <MobileServiceProvider>
            <Router>
            <Routes>
              <Route path="/auth" element={<MobileAuth />} />
              <Route path="/" element={
                <MobileProtectedRoute>
                  <MobileIndex />
                </MobileProtectedRoute>
              } />
              <Route path="/receipts/new" element={
                <MobileProtectedRoute>
                  <MobileReceiptForm />
                </MobileProtectedRoute>
              } />
              <Route path="/customers" element={
                <MobileProtectedRoute>
                  <MobileCustomerList />
                </MobileProtectedRoute>
              } />
              <Route path="/customers/new" element={
                <MobileProtectedRoute>
                  <MobileCustomerForm />
                </MobileProtectedRoute>
              } />
              <Route path="/customers/:id/edit" element={
                <MobileProtectedRoute>
                  <MobileCustomerForm />
                </MobileProtectedRoute>
              } />
              <Route path="/transit" element={
                <MobileProtectedRoute>
                  <MobileTransitList />
                </MobileProtectedRoute>
              } />
              <Route path="/transit/new" element={
                <MobileProtectedRoute>
                  <MobileOutwardEntryForm />
                </MobileProtectedRoute>
              } />
              <Route path="/items" element={
                <MobileProtectedRoute>
                  <MobileItemList />
                </MobileProtectedRoute>
              } />
              <Route path="/items/new" element={
                <MobileProtectedRoute>
                  <MobileItemForm />
                </MobileProtectedRoute>
              } />
              <Route path="/items/:id/edit" element={
                <MobileProtectedRoute>
                  <MobileItemForm />
                </MobileProtectedRoute>
              } />
              <Route path="/sales" element={
                <MobileProtectedRoute>
                  <MobileSalesList />
                </MobileProtectedRoute>
              } />
              <Route path="/sales/new" element={
                <MobileProtectedRoute>
                  <MobileSalesForm />
                </MobileProtectedRoute>
              } />
              <Route path="/sales/new/:outwardEntryId" element={
                <MobileProtectedRoute>
                  <MobileSalesForm />
                </MobileProtectedRoute>
              } />
              <Route path="/sales/:id/edit" element={
                <MobileProtectedRoute>
                  <MobileEditSaleForm />
                </MobileProtectedRoute>
              } />
              <Route path="/sales/:id/view" element={
                <MobileProtectedRoute>
                  <MobileInvoiceGenerator />
                </MobileProtectedRoute>
              } />
              <Route path="/sales-ledger" element={
                <MobileProtectedRoute>
                  <MobileSalesLedgerOffline />
                </MobileProtectedRoute>
              } />
              <Route path="/customer-ledger" element={
                <MobileProtectedRoute>
                  <MobileCustomerLedgerOffline />
                </MobileProtectedRoute>
              } />
              <Route path="/bills" element={
                <MobileProtectedRoute>
                  <MobileBillsList />
                </MobileProtectedRoute>
              } />
              <Route path="/bills/:billId/invoice" element={
                <MobileProtectedRoute>
                  <MobileInvoiceGenerator />
                </MobileProtectedRoute>
              } />
              <Route path="/receipts" element={
                <MobileProtectedRoute>
                  <MobileReceiptList />
                </MobileProtectedRoute>
              } />
              <Route path="/credit-note" element={
                <MobileProtectedRoute>
                  <MobileCreditNoteForm />
                </MobileProtectedRoute>
              } />
              <Route path="/debit-note" element={
                <MobileProtectedRoute>
                  <MobileDebitNoteForm />
                </MobileProtectedRoute>
              } />
              <Route path="/reports" element={
                <MobileProtectedRoute>
                  <MobileReports />
                </MobileProtectedRoute>
              } />
              <Route path="/direct-sales" element={
                <MobileProtectedRoute>
                  <MobileDirectSalesForm />
                </MobileProtectedRoute>
              } />
              <Route path="/settings" element={
                <MobileProtectedRoute>
                  <MobileSettings />
                </MobileProtectedRoute>
              } />
            </Routes>
            <Toaster />
          </Router>
          </MobileServiceProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default MobileApp;