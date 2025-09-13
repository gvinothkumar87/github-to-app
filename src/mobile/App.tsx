import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/contexts/LanguageContext';
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
      <LanguageProvider>
        <Router>
          <Routes>
            <Route path="/" element={<MobileIndex />} />
            <Route path="/receipts/new" element={<MobileReceiptForm />} />
            <Route path="/customers" element={<MobileCustomerList />} />
            <Route path="/customers/new" element={<MobileCustomerForm />} />
            <Route path="/customers/:id/edit" element={<MobileCustomerForm />} />
            <Route path="/transit" element={<MobileTransitList />} />
            <Route path="/transit/new" element={<MobileOutwardEntryForm />} />
            <Route path="/items" element={<MobileItemList />} />
            <Route path="/items/new" element={<MobileItemForm />} />
            <Route path="/items/:id/edit" element={<MobileItemForm />} />
            <Route path="/sales" element={<MobileSalesList />} />
            <Route path="/sales/new" element={<MobileSalesForm />} />
            <Route path="/sales/new/:outwardEntryId" element={<MobileSalesForm />} />
            <Route path="/settings" element={<MobileSettings />} />
          </Routes>
          <Toaster />
        </Router>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default MobileApp;