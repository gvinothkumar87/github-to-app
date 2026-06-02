import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/MobileLayout';
import { PurchaseForm } from '@/components/forms/PurchaseForm';
import { useLanguage } from '@/contexts/LanguageContext';

const MobileDirectPurchaseFormWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  return (
    <MobileLayout title={language === 'english' ? 'Direct Purchase' : 'நேரடி கொள்முதல்'} showBackButton onBack={() => navigate('/purchases')}>
      <div className="bg-white rounded-lg pb-12">
        <PurchaseForm 
          onSuccess={() => navigate('/purchases')}
          onCancel={() => navigate('/purchases')}
        />
      </div>
    </MobileLayout>
  );
};

export default MobileDirectPurchaseFormWrapper;
