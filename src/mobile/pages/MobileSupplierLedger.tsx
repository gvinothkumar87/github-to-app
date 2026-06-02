import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/MobileLayout';
import { SupplierLedgerView } from '@/components/SupplierLedgerView';
import { useLanguage } from '@/contexts/LanguageContext';

const MobileSupplierLedger: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  return (
    <MobileLayout title={language === 'english' ? 'Supplier Ledger' : 'சப்ளையர் லெட்ஜர்'} showBackButton onBack={() => navigate('/purchases')}>
      <div className="space-y-4 bg-white p-2 rounded-lg">
        <div className="overflow-x-auto pb-4">
          <SupplierLedgerView />
        </div>
      </div>
    </MobileLayout>
  );
};

export default MobileSupplierLedger;
