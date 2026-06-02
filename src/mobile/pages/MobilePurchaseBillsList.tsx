import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/MobileLayout';
import { UnifiedPurchaseBillsList } from '@/components/UnifiedPurchaseBillsList';
import { useLanguage } from '@/contexts/LanguageContext';

const MobilePurchaseBillsList: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  return (
    <MobileLayout title={language === 'english' ? 'Purchase Bills' : 'கொள்முதல் பில்கள்'} showBackButton onBack={() => navigate('/purchases')}>
      <div className="space-y-4 bg-white p-2 rounded-lg">
        {/* We can re-use the UnifiedPurchaseBillsList component but it's built for desktop.
            Let's wrap it in a scrollable container for now. In a full rewrite, we'd make it mobile-native cards. */}
        <div className="overflow-x-auto pb-4">
          <UnifiedPurchaseBillsList />
        </div>
      </div>
    </MobileLayout>
  );
};

export default MobilePurchaseBillsList;
