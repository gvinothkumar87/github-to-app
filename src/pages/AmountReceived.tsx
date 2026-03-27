import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/PageLayout';
import { AmountReceivedForm } from '@/components/forms/AmountReceivedForm';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ReceiptsList } from '@/components/ReceiptsList';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AmountReceived = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFormSuccess = () => {
    setShowForm(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  return (
    <PageLayout
      title={language === 'english' ? 'Amount Received' : 'பெற்ற தொகை'}
    >
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">
              {language === 'english' ? 'Amount Received' : 'பெற்ற தொகை'}
            </h1>
          </div>
          <LanguageToggle />
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {showForm ? (
          <div className="mb-6">
            <AmountReceivedForm
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        ) : (
          <div className="mb-6">
            <Button
              onClick={() => setShowForm(true)}
              className="w-full"
              size="lg"
            >
              {language === 'english' ? '+ Create Receipt' : '+ ரசீது உருவாக்கு'}
            </Button>
          </div>
        )}

        <div className="mt-6">
          <ReceiptsList key={refreshKey} />
        </div>
      </div>
    </PageLayout>
  );
};

export default AmountReceived;
