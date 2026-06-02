import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/MobileLayout';
import { InwardEntryForm } from '@/components/forms/InwardEntryForm';
import { useLanguage } from '@/contexts/LanguageContext';

const MobileInwardEntryFormWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  return (
    <MobileLayout title={language === 'english' ? 'New Inward Entry' : 'புதிய உள்வரும் பதிவு'} showBackButton onBack={() => navigate('/purchases/inward')}>
      <div className="bg-white rounded-lg pb-12">
        <InwardEntryForm 
          onSuccess={() => navigate('/purchases/inward')}
          onCancel={() => navigate('/purchases/inward')}
        />
      </div>
    </MobileLayout>
  );
};

export default MobileInwardEntryFormWrapper;
