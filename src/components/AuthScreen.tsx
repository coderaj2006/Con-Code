import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CROPS = ['Wheat', 'Rice', 'Tomato', 'Potato', 'Onion', 'Mustard', 'Maize', 'Cotton', 'Sugarcane', 'Soybean'];

interface AuthScreenProps {
  isSunlightMode?: boolean;
}

export const AuthScreen: FC<AuthScreenProps> = ({ isSunlightMode }) => {
  const { setProfile } = useAuth();
  const [name, setName] = useState('');
  const [crop, setCrop] = useState('Wheat');
  const [error, setError] = useState('');

  const handleStart = () => {
    if (!name.trim()) { setError('Please enter your name to continue.'); return; }
    setProfile(name.trim(), crop);
  };

  const bg = isSunlightMode ? 'bg-black' : 'bg-zinc-950';
  const inputClass = `w-full px-5 py-4 rounded-2xl text-base font-bold outline-none border-2 transition-all ${
    isSunlightMode
      ? 'bg-white/5 border-white/20 text-white placeholder-white/30 focus:border-neon-agri'
      : 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-emerald-500'
  }`;

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center px-6 ${bg}`}>
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
              isSunlightMode ? 'bg-black border-neon-agri' : 'bg-emerald-800 border-emerald-500'
            }`}
          >
            <Leaf className={`w-12 h-12 ${isSunlightMode ? 'text-neon-agri' : 'text-white'}`} />
          </motion.div>
          <h1 className={`text-4xl font-black uppercase tracking-widest ${isSunlightMode ? 'text-neon-agri' : 'text-white'}`}>
            KISAAN AI
          </h1>
          <p className="text-xs font-bold uppercase text-zinc-500 tracking-widest mt-2">
            Your Personal Agri-Assistant
          </p>
        </div>

        {/* Name input */}
        <div>
          <label className={`text-[11px] font-black uppercase tracking-widest mb-2 block ${isSunlightMode ? 'text-white/50' : 'text-zinc-500'}`}>
            What's your name?
          </label>
          <input
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleStart()}
            placeholder="e.g. Ramesh Kumar"
            autoFocus
            className={inputClass}
          />
        </div>

        {/* Crop selector */}
        <div>
          <label className={`text-[11px] font-black uppercase tracking-widest mb-2 block ${isSunlightMode ? 'text-white/50' : 'text-zinc-500'}`}>
            Your main crop
          </label>
          <div className="flex flex-wrap gap-2">
            {CROPS.map(c => (
              <button
                key={c}
                onClick={() => setCrop(c)}
                className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wide border-2 transition-all ${
                  crop === c
                    ? (isSunlightMode ? 'bg-white text-black border-white' : 'bg-emerald-600 text-white border-emerald-500')
                    : (isSunlightMode ? 'bg-white/5 text-white/50 border-white/10' : 'bg-zinc-800 text-zinc-400 border-zinc-700')
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-red-400 text-xs font-bold uppercase text-center -mt-2">
            {error}
          </motion.p>
        )}

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
          onClick={handleStart}
          className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 ${
            isSunlightMode ? 'bg-white text-black' : 'bg-emerald-600 text-white'
          }`}
        >
          Get Started <ChevronRight className="w-4 h-4" />
        </motion.button>

        <p className="text-center text-[10px] font-bold uppercase text-zinc-600">
          No account needed • Works offline
        </p>
      </motion.div>
    </div>
  );
};
