import { FC, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Check, Globe } from 'lucide-react';
import { useTranslation } from '../context/TranslationContext';

interface LanguageBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanguageBottomSheet: FC<LanguageBottomSheetProps> = ({ isOpen, onClose }) => {
  const { availableLanguages, currentLanguage, setLanguage } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLanguages = availableLanguages.filter(lang => 
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    lang.native.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          
          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[101] bg-zinc-950 border-t border-zinc-800 rounded-t-[3rem] max-h-[85vh] overflow-hidden flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
          >
            {/* Handle */}
            <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mt-4 mb-2" />
            
            <div className="p-6 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-white font-black text-xl uppercase tracking-tight">Select Language</h2>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Choose your preferred tongue</p>
                </div>
                <button 
                  onClick={onClose}
                  className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input 
                  type="text"
                  placeholder="Search language or script..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all text-sm font-bold"
                />
              </div>

              {/* Language List */}
              <div className="flex-grow overflow-y-auto pr-2 pb-12">
                <div className="grid grid-cols-1 gap-3">
                  {filteredLanguages.map((lang) => (
                    <motion.button
                      key={lang.code}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setLanguage(lang.code as any);
                        onClose();
                      }}
                      className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all group ${
                        currentLanguage === lang.code 
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' 
                          : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors ${
                          currentLanguage === lang.code 
                            ? 'bg-emerald-500/20 border-emerald-500/20' 
                            : 'bg-zinc-800 border-zinc-700 group-hover:bg-zinc-700'
                        }`}>
                          <Globe className={`w-6 h-6 ${currentLanguage === lang.code ? 'text-emerald-500' : 'text-zinc-400'}`} />
                        </div>
                        <div className="text-left">
                          <p className={`text-lg font-black tracking-tight ${currentLanguage === lang.code ? 'text-white' : 'text-zinc-200'}`}>
                            {lang.native}
                          </p>
                          <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">{lang.name}</p>
                        </div>
                      </div>
                      {currentLanguage === lang.code && (
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Check className="w-5 h-5 text-zinc-950 stroke-[3px]" />
                        </div>
                      )}
                    </motion.button>
                  ))}

                  {filteredLanguages.length === 0 && (
                    <div className="py-12 text-center">
                      <p className="text-zinc-600 font-black uppercase text-sm tracking-widest">No languages found</p>
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
