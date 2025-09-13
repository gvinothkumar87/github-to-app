import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/contexts/LanguageContext';
import MobileIndex from './pages/MobileIndex';
import MobileReceiptForm from './forms/MobileReceiptForm';

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
            {/* Add more mobile routes as needed */}
          </Routes>
          <Toaster />
        </Router>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default MobileApp;