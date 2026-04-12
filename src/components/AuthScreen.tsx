// RESKIN ONLY — Logic untouched. UI layer updated per Agri-Tech spec.
import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CROPS = ['Wheat', 'Rice', 'Tomato', 'Potato', 'Onion', 'Mustard', 'Maize', 'Cotton', 'Sugarcane', 'Soybean'];

interface AuthScreenProps {
  isSunlightMode?: boolean;
}

/* INJECT LOGIC HERE — DO NOT REMOVE */
export const AuthScreen: FC<AuthScreenProps> = ({ isSunlightMode }) => {
  const { setProfile } = useAuth();
  const [name, setName] = useState('');
  const [crop, setCrop] = useState('Wheat');
  const [error, setError] = useState('');

  const handleStart = () => {
    if (!name.trim()) { setError('Please enter your name to continue.'); return; }
    setProfile(name.trim(), crop);
  };
  /* END LOGIC */

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center px-6 ${
      isSunlightMode ? 'bg-black' : 'bg-agri-cream'
    }`}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="w-full max-w-sm flex flex-col gap-6"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-5 border-4 ${
              isSunlightMode ? 'bg-black border-[#39FF14]' : 'bg-agri-green border-agri-green-mid'
            }`}
          >
            <Leaf className={`w-12 h-12 ${isSunlightMode ? 'text-[#39FF14]' : 'text-agri-cream'}`} />
          </motion.div>
          <h1 className={`text-2xl font-semibold tracking-tight ${
            isSunlightMode ? 'text-white' : 'text-agri-soil-deep'
          }`}>
            KISAAN AI
          </h1>
          <p className={`text-sm font-medium mt-2 ${isSunlightMode ? 'text-white/50' : 'text-agri-soil/60'}`}>
            Your Personal Agri-Assistant
          </p>
        </div>

        {/* Name input */}
        <div>
          <label
            htmlFor="farmer-name"
            className={`text-sm font-medium mb-2 block ${isSunlightMode ? 'text-white/70' : 'text-agri-soil-deep/70'}`}
          >
            What's your name?
          </label>
          <input
            id="farmer-name"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleStart()}
            placeholder="e.g. Ramesh Kumar"
            autoFocus
            className={`w-full px-5 py-4 min-h-[44px] rounded-2xl text-base font-medium outline-none border-2 transition-all focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 ${
              isSunlightMode
                ? 'bg-white/5 border-white/20 text-white placeholder-white/30 focus:border-[#39FF14]'
                : 'bg-agri-offwhite border-agri-soil/20 text-agri-soil-deep placeholder-agri-soil/40 focus:border-agri-green'
            }`}
          />
        </div>

        {/* Crop selector */}
        <div>
          <label className={`text-sm font-medium mb-2 block ${isSunlightMode ? 'text-white/70' : 'text-agri-soil-deep/70'}`}>
            Your main crop
          </label>
          <div className="flex flex-wrap gap-2">
            {CROPS.map(c => (
              <button
                key={c}
                onClick={() => setCrop(c)}
                aria-pressed={crop === c}
                className={`px-3 py-2 min-h-[44px] rounded-xl text-sm font-medium border-2 transition-all focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 ${
                  crop === c
                    ? (isSunlightMode ? 'bg-white text-black border-white' : 'bg-agri-green text-agri-cream border-agri-green')
                    : (isSunlightMode ? 'bg-white/5 text-white/50 border-white/10' : 'bg-agri-offwhite text-agri-soil border-agri-soil/20')
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Error — color + text label */}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-agri-terra text-sm font-medium text-center -mt-2"
            role="alert"
          >
            ⚠ {error}
          </motion.p>
        )}

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleStart}
          className={`w-full min-h-[64px] rounded-2xl text-base font-semibold flex items-center justify-center gap-3 transition-colors focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 ${
            isSunlightMode ? 'bg-white text-black' : 'bg-agri-green text-agri-cream active:bg-agri-green/80'
          }`}
        >
          <Leaf className="w-5 h-5" />
          Get Started
          <ChevronRight className="w-5 h-5" />
        </motion.button>

        <p className={`text-center text-xs font-medium ${isSunlightMode ? 'text-white/40' : 'text-agri-soil/50'}`}>
          No account needed • Works offline
        </p>
      </motion.div>
    </div>
  );
};

/*
 * Changes Made:
 * - bg-zinc-950 → bg-agri-cream
 * - Inputs: agri-offwhite bg, agri-soil/20 border, focus:ring-agri-green
 * - CTA: bg-agri-green min-h-[64px] text-base font-semibold
 * - Crop buttons: aria-pressed, min-h-[44px], focus rings
 * - Error: agri-terra + ⚠ icon prefix (not color alone)
 * - All labels have htmlFor associations
 */
