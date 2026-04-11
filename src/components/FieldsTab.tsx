import { FC, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Plus, Droplets, Sun, Wind, ChevronRight, X } from 'lucide-react';

interface Field {
  id: string;
  name: string;
  crop: string;
  area: string;
  health: 'Good' | 'Fair' | 'Poor';
  growth: number;
  lastScan: string;
  emoji: string;
}

const MOCK_FIELDS: Field[] = [
  { id: '1', name: 'North Field', crop: 'Wheat',  area: '2.5 acres', health: 'Good', growth: 72, lastScan: '2 days ago', emoji: '🌾' },
  { id: '2', name: 'South Plot',  crop: 'Tomato', area: '1.2 acres', health: 'Fair', growth: 45, lastScan: '5 days ago', emoji: '🍅' },
  { id: '3', name: 'East Garden', crop: 'Potato', area: '0.8 acres', health: 'Good', growth: 88, lastScan: 'Today',      emoji: '🥔' },
];

const healthColor = (h: string) =>
  h === 'Good' ? 'text-emerald-400 bg-emerald-500/10' :
  h === 'Fair' ? 'text-amber-400 bg-amber-500/10' :
                 'text-red-400 bg-red-500/10';

interface FieldsTabProps {
  isSunlightMode?: boolean;
}

export const FieldsTab: FC<FieldsTabProps> = ({ isSunlightMode }) => {
  const [fields, setFields] = useState<Field[]>(MOCK_FIELDS);
  const [selected, setSelected] = useState<Field | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCrop, setNewCrop] = useState('');

  const addField = () => {
    if (!newName.trim() || !newCrop.trim()) return;
    const f: Field = {
      id: Date.now().toString(),
      name: newName,
      crop: newCrop,
      area: '1.0 acres',
      health: 'Good',
      growth: 0,
      lastScan: 'Never',
      emoji: '🌱',
    };
    setFields(prev => [...prev, f]);
    setNewName('');
    setNewCrop('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 ${isSunlightMode ? 'text-white' : 'text-white'}`}>
          <span className={`w-1.5 h-6 rounded-full ${isSunlightMode ? 'bg-neon-agri' : 'bg-agri-green'}`} />
          My Fields
        </h2>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAdd(true)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest ${
            isSunlightMode ? 'bg-white text-black' : 'bg-agri-green text-white'
          }`}
        >
          <Plus className="w-3.5 h-3.5" /> Add Field
        </motion.button>
      </div>

      {/* Field Cards */}
      <div className="space-y-3">
        {fields.map((field, idx) => (
          <motion.div
            key={field.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07 }}
            onClick={() => setSelected(field)}
            className={`p-4 rounded-[2rem] border-2 cursor-pointer transition-all active:scale-[0.98] ${
              isSunlightMode ? 'bg-black border-white/20 hover:border-white' : 'bg-zinc-900 border-zinc-800 hover:border-agri-green/40'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{field.emoji}</span>
                <div>
                  <p className={`font-black text-sm uppercase tracking-tight ${isSunlightMode ? 'text-neon-agri' : 'text-white'}`}>
                    {field.name}
                  </p>
                  <p className="text-[10px] font-bold uppercase text-zinc-500">{field.crop} • {field.area}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${healthColor(field.health)}`}>
                  {field.health}
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-600" />
              </div>
            </div>
            {/* Growth bar */}
            <div className={`h-2 w-full rounded-full overflow-hidden ${isSunlightMode ? 'bg-white/10' : 'bg-zinc-800'}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${field.growth}%` }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: idx * 0.1 }}
                className={`h-full rounded-full ${isSunlightMode ? 'bg-neon-agri' : 'bg-agri-green'}`}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[9px] font-bold uppercase text-zinc-600">Growth</span>
              <span className={`text-[9px] font-black uppercase ${isSunlightMode ? 'text-neon-agri' : 'text-emerald-400'}`}>{field.growth}%</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Field Detail Sheet */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50"
              onClick={() => setSelected(null)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto rounded-t-[3rem] z-50 p-6 pb-10 ${
                isSunlightMode ? 'bg-black border-t-4 border-x-4 border-white' : 'bg-zinc-900'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selected.emoji}</span>
                  <div>
                    <p className={`font-black text-lg uppercase ${isSunlightMode ? 'text-neon-agri' : 'text-white'}`}>{selected.name}</p>
                    <p className="text-xs font-bold uppercase text-zinc-500">{selected.crop} • {selected.area}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="p-2 rounded-full bg-zinc-800 text-zinc-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { icon: Leaf,     label: 'Health',    value: selected.health },
                  { icon: Sun,      label: 'Growth',    value: `${selected.growth}%` },
                  { icon: Droplets, label: 'Last Scan', value: selected.lastScan },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className={`p-3 rounded-2xl text-center border ${isSunlightMode ? 'bg-white/5 border-white/10' : 'bg-zinc-800 border-zinc-700'}`}>
                    <Icon className={`w-5 h-5 mx-auto mb-1 ${isSunlightMode ? 'text-neon-agri' : 'text-emerald-400'}`} />
                    <p className="text-[9px] font-bold uppercase text-zinc-500">{label}</p>
                    <p className={`text-xs font-black uppercase mt-0.5 ${isSunlightMode ? 'text-white' : 'text-white'}`}>{value}</p>
                  </div>
                ))}
              </div>
              <button className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm ${
                isSunlightMode ? 'bg-white text-black' : 'bg-agri-green text-white'
              }`}>
                Scan This Field
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Field Sheet */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50"
              onClick={() => setShowAdd(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto rounded-t-[3rem] z-50 p-6 pb-10 ${
                isSunlightMode ? 'bg-black border-t-4 border-x-4 border-white' : 'bg-zinc-900'
              }`}
            >
              <h3 className={`text-base font-black uppercase tracking-widest mb-6 ${isSunlightMode ? 'text-neon-agri' : 'text-white'}`}>
                Add New Field
              </h3>
              <div className="space-y-3 mb-6">
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Field name (e.g. North Plot)"
                  className={`w-full px-4 py-3 rounded-2xl text-sm font-bold outline-none border-2 ${
                    isSunlightMode
                      ? 'bg-white/5 border-white/20 text-white placeholder-white/30'
                      : 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
                  }`}
                />
                <input
                  value={newCrop}
                  onChange={e => setNewCrop(e.target.value)}
                  placeholder="Crop (e.g. Wheat)"
                  className={`w-full px-4 py-3 rounded-2xl text-sm font-bold outline-none border-2 ${
                    isSunlightMode
                      ? 'bg-white/5 border-white/20 text-white placeholder-white/30'
                      : 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
                  }`}
                />
              </div>
              <button
                onClick={addField}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm ${
                  isSunlightMode ? 'bg-white text-black' : 'bg-agri-green text-white'
                }`}
              >
                Add Field
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
