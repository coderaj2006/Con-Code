// RESKIN ONLY — Logic untouched. UI layer updated per Agri-Tech spec.
import { FC, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Check, Globe } from 'lucide-react';
import { useTranslation } from '../context/TranslationContext';

interface LanguageBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

/* INJECT LOGIC HERE — DO NOT REMOVE */
export const LanguageBottomSheet: FC<LanguageBottomSheetProps> = ({ isOpen, onClose }) => {
  const { availableLanguages, currentLanguage, setLanguage } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLanguages = availableLanguages.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.native.toLowerCase().includes(searchQuery.toLowerCase())
  );
  /* END LOGIC */

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[101] bg-agri-offwhite border-t border-agri-soil/20 rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col"
          >
            {/* Handle */}
            <div className="w-12 h-1.5 bg-agri-soil/20 rounded-full mx-auto mt-4 mb-2" />

            <div className="p-6 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-agri-soil-deep">Select Language</h2>
                  <p className="text-xs font-medium text-agri-soil/60 mt-1">Choose your preferred tongue</p>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close language selector"
                  className="min-h-[44px] min-w-[44px] bg-agri-cream border border-agri-soil/20 rounded-2xl flex items-center justify-center text-agri-soil hover:text-agri-soil-deep transition-colors focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-5">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-agri-soil/50" />
                <label htmlFor="lang-search" className="sr-only">Search language</label>
                <input
                  id="lang-search"
                  type="text"
                  placeholder="Search language or script..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-agri-cream border border-agri-soil/20 rounded-2xl py-3 pl-12 pr-4 text-agri-soil-deep placeholder:text-agri-soil/40 focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 transition-all text-base font-medium min-h-[44px]"
                />
              </div>

              {/* Language List */}
              <div className="flex-grow overflow-y-auto pr-1 pb-12">
                <div className="grid grid-cols-1 gap-2">
                  {filteredLanguages.map((lang) => (
                    <motion.button
                      key={lang.code}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setLanguage(lang.code as any); onClose(); }}
                      aria-pressed={currentLanguage === lang.code}
                      className={`flex items-center justify-between p-4 min-h-[44px] rounded-2xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 ${
                        currentLanguage === lang.code
                          ? 'bg-agri-green/10 border-agri-green text-agri-green'
                          : 'bg-agri-offwhite border-agri-soil/15 hover:border-agri-soil/30 text-agri-soil-deep'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                          currentLanguage === lang.code
                            ? 'bg-agri-green/10 border-agri-green/20'
                            : 'bg-agri-cream border-agri-soil/15'
                        }`}>
                          <Globe className={`w-5 h-5 ${currentLanguage === lang.code ? 'text-agri-green' : 'text-agri-soil/60'}`} />
                        </div>
                        <div className="text-left">
                          <p className={`text-base font-medium ${currentLanguage === lang.code ? 'text-agri-soil-deep' : 'text-agri-soil-deep'}`}>
                            {lang.native}
                          </p>
                          <p className="text-xs text-agri-soil/60">{lang.name}</p>
                        </div>
                      </div>
                      {currentLanguage === lang.code && (
                        <div className="w-7 h-7 bg-agri-green rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white stroke-[2.5px]" />
                        </div>
                      )}
                    </motion.button>
                  ))}

                  {filteredLanguages.length === 0 && (
                    <div className="py-12 text-center">
                      <p className="text-agri-soil/50 text-sm font-medium">No languages found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/*
 * Changes Made:
 * - Dark zinc → agri-offwhite / agri-cream surfaces
 * - Active language: bg-agri-green/10 border-agri-green
 * - Check badge: bg-agri-green
 * - Search input: agri-cream bg, focus:ring-agri-green, min-h-[44px]
 * - All buttons min-h-[44px] with focus rings and aria-pressed
 * - Label htmlFor on search input
 */
