import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/MobileLayout';
import { PurchaseFromTransitForm } from '@/components/forms/PurchaseFromTransitForm';
import { useLanguage } from '@/contexts/LanguageContext';

const MobilePurchaseFromTransitFormWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  return (
    <MobileLayout title={language === 'english' ? 'Purchase from Transit' : 'போக்குவரத்து கொள்முதல்'} showBackButton onBack={() => navigate('/purchases')}>
      <div className="bg-white rounded-lg pb-12">
        <PurchaseFromTransitForm 
          onSuccess={() => navigate('/purchases')}
          onCancel={() => navigate('/purchases')}
        />
      </div>
    </MobileLayout>
  );
};

export default MobilePurchaseFromTransitFormWrapper;
