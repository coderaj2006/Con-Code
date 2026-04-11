import { FC, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Lock, Leaf, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthScreenProps {
  isSunlightMode?: boolean;
}

export const AuthScreen: FC<AuthScreenProps> = ({ isSunlightMode }) => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [crop, setCrop] = useState('Wheat');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inputClass = `w-full px-4 py-3.5 rounded-2xl text-sm font-bold outline-none border-2 transition-all ${
    isSunlightMode
      ? 'bg-white/5 border-white/20 text-white placeholder-white/30 focus:border-neon-agri'
      : 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-emerald-500'
  }`;

  const handleSubmit = async () => {
    setError('');
    if (!phone.trim() || !password.trim()) { setError('Phone and password are required.'); return; }
    if (mode === 'signup' && !name.trim()) { setError('Name is required.'); return; }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(phone, password);
      } else {
        await signup(name, phone, password, crop);
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-6 ${isSunlightMode ? 'bg-black' : 'bg-zinc-950'}`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-4 border-4 ${
            isSunlightMode ? 'bg-black border-neon-agri' : 'bg-emerald-800 border-emerald-600'
          }`}>
            <Leaf className={`w-10 h-10 ${isSunlightMode ? 'text-neon-agri' : 'text-white'}`} />
          </div>
          <h1 className={`text-3xl font-black uppercase tracking-widest ${isSunlightMode ? 'text-neon-agri' : 'text-white'}`}>
            KISAAN AI
          </h1>
          <p className="text-xs font-bold uppercase text-zinc-500 tracking-widest mt-1">
            Precision Agri-Tech
          </p>
        </div>

        {/* Tab switcher */}
        <div className={`flex rounded-2xl p-1 mb-6 ${isSunlightMode ? 'bg-white/10' : 'bg-zinc-800'}`}>
          {(['login', 'signup'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                mode === m
                  ? (isSunlightMode ? 'bg-white text-black' : 'bg-emerald-600 text-white')
                  : (isSunlightMode ? 'text-white/50' : 'text-zinc-500')
              }`}
            >
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="space-y-3">
          <AnimatePresence>
            {mode === 'signup' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input value={name} onChange={e => setName(e.target.value)}
                    placeholder="Full Name" className={`${inputClass} pl-11`} />
                </div>
                <div className="relative">
                  <Leaf className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input value={crop} onChange={e => setCrop(e.target.value)}
                    placeholder="Primary Crop (e.g. Wheat)" className={`${inputClass} pl-11`} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="Phone Number" type="tel" className={`${inputClass} pl-11`} />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Password" type={showPass ? 'text' : 'password'}
              className={`${inputClass} pl-11 pr-11`}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <button onClick={() => setShowPass(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-red-400 text-xs font-bold uppercase mt-3 text-center">
            {error}
          </motion.p>
        )}

        {/* Submit */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full mt-6 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all ${
            loading ? 'opacity-60 cursor-not-allowed' : ''
          } ${isSunlightMode ? 'bg-white text-black' : 'bg-emerald-600 text-white'}`}
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </motion.button>

        <p className="text-center text-[10px] font-bold uppercase text-zinc-600 mt-6">
          Your data is stored securely on-device
        </p>
      </motion.div>
    </div>
  );
};
