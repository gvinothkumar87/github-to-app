import React, { createContext, useContext, useState } from 'react';
import { Language, LanguageContextType } from '@/types';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('english');

  const getDisplayName = (item: { name_english: string; name_tamil?: string }) => {
    return language === 'tamil' && item.name_tamil ? item.name_tamil : item.name_english;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, getDisplayName }}>
      {children}
    </LanguageContext.Provider>
  );
};