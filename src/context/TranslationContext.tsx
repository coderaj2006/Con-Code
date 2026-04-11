import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, languages, LanguageCode } from '../i18n';
import { useToast } from './ToastContext';

interface TranslationContextType {
  t: (key: string) => string;
  currentLanguage: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  availableLanguages: typeof languages;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(() => {
    return (localStorage.getItem('preferred-language') as LanguageCode) || 'en';
  });
  
  const { showToast } = useToast();

  const t = (key: string): string => {
    return translations[currentLanguage]?.[key] || translations['en']?.[key] || key;
  };

  const setLanguage = (code: LanguageCode) => {
    setCurrentLanguage(code);
    localStorage.setItem('preferred-language', code);
    document.documentElement.lang = code;
    
    // Show localized toast feedback
    const feedback = translations[code]?.['language_updated'] || translations['en']?.['language_updated'];
    showToast(feedback, 'success');
  };

  useEffect(() => {
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  return (
    <TranslationContext.Provider value={{ t, currentLanguage, setLanguage, availableLanguages: languages }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) throw new Error('useTranslation must be used within TranslationProvider');
  return context;
};
