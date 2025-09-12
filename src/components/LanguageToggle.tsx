import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Languages } from 'lucide-react';

export const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => setLanguage(language === 'english' ? 'tamil' : 'english')}
      className="flex items-center gap-2 w-full justify-start"
    >
      <Languages className="h-4 w-4" />
      {language === 'english' ? 'தமிழ்' : 'English'}
    </Button>
  );
};