import { useState, FC } from 'react';
import { Globe, User, ChevronDown, Check } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिंदी (Hindi)' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'hr', name: 'हरयाणवी (Haryanvi)' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
  { code: 'mr', name: 'मराठी (Marathi)' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', name: 'മലയാളം (Malayalam)' },
  { code: 'ta', name: 'தமிழ் (Tamil)' },
  { code: 'te', name: 'తెలుగు (Telugu)' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
  { code: 'as', name: 'অসমীয়া (Assamese)' },
];

interface HeaderProps {
  selectedLanguage: { code: string; name: string };
  setSelectedLanguage: (lang: { code: string; name: string }) => void;
}

export const Header: FC<HeaderProps> = ({ selectedLanguage, setSelectedLanguage }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-agri-green text-white shadow-lg px-4 py-3 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <Globe className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-wide">KISAAN AI</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full btn-press border border-white/20"
          >
            <span className="text-sm font-medium">{selectedLanguage.name.split(' ')[0]}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-xl shadow-2xl py-2 border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="max-h-64 overflow-y-auto">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setSelectedLanguage(lang);
                      setIsOpen(false);
                      document.documentElement.lang = lang.code;
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-agri-green/5 flex items-center justify-between ${selectedLanguage.code === lang.code ? 'text-agri-green font-bold' : ''}`}
                  >
                    {lang.name}
                    {selectedLanguage.code === lang.code && <Check className="w-5 h-5 text-agri-green" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button className="p-1 rounded-full btn-press">
          <div className="w-10 h-10 bg-agri-amber border-2 border-white rounded-full flex items-center justify-center shadow-md">
            <User className="w-6 h-6 text-agri-green-dark" />
          </div>
        </button>
      </div>
    </header>
  );
};
