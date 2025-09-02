import { LanguageProvider } from '@/contexts/LanguageContext';
import { TransitLogbook } from '@/components/TransitLogbook';

const Index = () => {
  return (
    <LanguageProvider>
      <TransitLogbook />
    </LanguageProvider>
  );
};

export default Index;
