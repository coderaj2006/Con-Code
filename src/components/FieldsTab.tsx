// RESKIN ONLY — Logic untouched. UI layer updated per Agri-Tech spec.
import { FC, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Plus, Droplets, Sun, ChevronRight, X } from 'lucide-react';

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

/* INJECT LOGIC HERE — DO NOT REMOVE */
const MOCK_FIELDS: Field[] = [
  { id: '1', name: 'North Field', crop: 'Wheat',  area: '2.5 acres', health: 'Good', growth: 72, lastScan: '2 days ago', emoji: '🌾' },
  { id: '2', name: 'South Plot',  crop: 'Tomato', area: '1.2 acres', health: 'Fair', growth: 45, lastScan: '5 days ago', emoji: '🍅' },
  { id: '3', name: 'East Garden', crop: 'Potato', area: '0.8 acres', health: 'Good', growth: 88, lastScan: 'Today',      emoji: '🥔' },
];

const healthStyle = (h: string) =>
  h === 'Good' ? 'text-agri-green bg-agri-green/10 border-agri-green/20' :
  h === 'Fair' ? 'text-agri-amber bg-agri-amber/10 border-agri-amber/20' :
                 'text-agri-terra bg-agri-terra/10 border-agri-terra/20';

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
  /* END LOGIC */

  const sheetBase = `fixed bottom-0 left-0 right-0 max-w-md mx-auto rounded-t-3xl z-50 p-6 pb-10 ${
    isSunlightMode ? 'bg-black border-t-4 border-x-4 border-white' : 'bg-agri-offwhite border-t border-agri-soil/20'
  }`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-lg font-medium flex items-center gap-2 ${isSunlightMode ? 'text-white' : 'text-agri-soil-deep'}`}>
          <Leaf className={`w-5 h-5 ${isSunlightMode ? 'text-[#39FF14]' : 'text-agri-green'}`} />
          My Fields
        </h2>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAdd(true)}
          aria-label="Add new field"
          className={`flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 ${
            isSunlightMode ? 'bg-white text-black' : 'bg-agri-green text-agri-cream'
          }`}
        >
          <Plus className="w-4 h-4" /> Add Field
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
            role="button"
            tabIndex={0}
            aria-label={`View ${field.name} details`}
            onKeyDown={e => e.key === 'Enter' && setSelected(field)}
            className={`p-4 rounded-3xl border-2 cursor-pointer transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 ${
              isSunlightMode
                ? 'bg-black border-white/20 hover:border-white'
                : 'bg-agri-offwhite border-agri-soil/15 hover:border-agri-green/40'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{field.emoji}</span>
                <div>
                  <p className={`text-base font-medium ${isSunlightMode ? 'text-white' : 'text-agri-soil-deep'}`}>
                    {field.name}
                  </p>
                  <p className={`text-xs ${isSunlightMode ? 'text-white/50' : 'text-agri-soil/60'}`}>
                    {field.crop} • {field.area}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-1 rounded-full border ${healthStyle(field.health)}`}>
                  {field.health}
                </span>
                <ChevronRight className={`w-5 h-5 ${isSunlightMode ? 'text-white/30' : 'text-agri-soil/40'}`} />
              </div>
            </div>
            {/* Growth bar */}
            <div className={`h-2 w-full rounded-full overflow-hidden ${isSunlightMode ? 'bg-white/10' : 'bg-agri-soil/10'}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${field.growth}%` }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: idx * 0.1 }}
                className={`h-full rounded-full ${isSunlightMode ? 'bg-[#39FF14]' : 'bg-agri-green'}`}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className={`text-xs ${isSunlightMode ? 'text-white/40' : 'text-agri-soil/50'}`}>Growth</span>
              <span className={`text-xs font-medium ${isSunlightMode ? 'text-[#39FF14]' : 'text-agri-green'}`}>{field.growth}%</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Field Detail Sheet */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-agri-soil-deep/40 p-4"
              onClick={() => setSelected(null)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 flex flex-col max-h-[90vh] rounded-t-3xl overflow-hidden ${
                isSunlightMode ? 'bg-black border-t-4 border-x-4 border-white' : 'bg-agri-offwhite'
              }`}
            >
              {/* Zone 1 — Green banner header (flex-none, flush to top edge) */}
              <div className={`flex-none flex items-center justify-between px-5 pt-5 pb-4 ${
                isSunlightMode ? 'bg-black border-b border-white/20' : 'bg-agri-green'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selected.emoji}</span>
                  <div>
                    <p className={`text-xl font-semibold ${isSunlightMode ? 'text-white' : 'text-agri-cream'}`}>
                      {selected.name}
                    </p>
                    <p className={`text-xs ${isSunlightMode ? 'text-white/50' : 'text-agri-cream/70'}`}>
                      {selected.crop} • {selected.area}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Close field details"
                  className={`min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isSunlightMode
                      ? 'bg-white/10 text-white focus:ring-white'
                      : 'bg-agri-cream/20 text-agri-cream focus:ring-agri-cream'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Zone 2 — Scrollable content (flex-1 min-h-0) */}
              <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Leaf,     label: 'Health',    value: selected.health },
                    { icon: Sun,      label: 'Growth',    value: `${selected.growth}%` },
                    { icon: Droplets, label: 'Last Scan', value: selected.lastScan },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className={`p-3 rounded-2xl text-center border ${
                      isSunlightMode ? 'bg-white/5 border-white/10' : 'bg-agri-cream border-agri-soil/10'
                    }`}>
                      <Icon className={`w-5 h-5 mx-auto mb-1 ${isSunlightMode ? 'text-[#39FF14]' : 'text-agri-green'}`} />
                      <p className={`text-xs ${isSunlightMode ? 'text-white/50' : 'text-agri-soil/60'}`}>{label}</p>
                      <p className={`text-sm font-medium mt-0.5 ${isSunlightMode ? 'text-white' : 'text-agri-soil-deep'}`}>{value}</p>
                    </div>
                  ))}
                </div>
                <button className={`w-full min-h-[44px] py-3 rounded-2xl text-base font-semibold focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 ${
                  isSunlightMode ? 'bg-white text-black' : 'bg-agri-green text-agri-cream'
                }`}>
                  Scan This Field
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Field Sheet */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowAdd(false)} />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={sheetBase}
            >
              <h3 className={`text-xl font-semibold mb-6 ${isSunlightMode ? 'text-white' : 'text-agri-soil-deep'}`}>
                Add New Field
              </h3>
              <div className="space-y-3 mb-6">
                <div>
                  <label htmlFor="field-name" className={`text-sm font-medium mb-1 block ${isSunlightMode ? 'text-white/70' : 'text-agri-soil-deep/70'}`}>
                    Field name
                  </label>
                  <input
                    id="field-name"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. North Plot"
                    className={`w-full px-4 py-3 min-h-[44px] rounded-2xl text-base font-medium outline-none border-2 focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 ${
                      isSunlightMode
                        ? 'bg-white/5 border-white/20 text-white placeholder-white/30'
                        : 'bg-agri-cream border-agri-soil/20 text-agri-soil-deep placeholder-agri-soil/40'
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor="field-crop" className={`text-sm font-medium mb-1 block ${isSunlightMode ? 'text-white/70' : 'text-agri-soil-deep/70'}`}>
                    Crop
                  </label>
                  <input
                    id="field-crop"
                    value={newCrop}
                    onChange={e => setNewCrop(e.target.value)}
                    placeholder="e.g. Wheat"
                    className={`w-full px-4 py-3 min-h-[44px] rounded-2xl text-base font-medium outline-none border-2 focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 ${
                      isSunlightMode
                        ? 'bg-white/5 border-white/20 text-white placeholder-white/30'
                        : 'bg-agri-cream border-agri-soil/20 text-agri-soil-deep placeholder-agri-soil/40'
                    }`}
                  />
                </div>
              </div>
              <button
                onClick={addField}
                className={`w-full min-h-[44px] py-3 rounded-2xl text-base font-semibold focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 ${
                  isSunlightMode ? 'bg-white text-black' : 'bg-agri-green text-agri-cream'
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

/*
 * Changes Made:
 * - Dark zinc → agri-offwhite / agri-cream surfaces
 * - Health badges: agri-green/agri-amber/agri-terra with border (color + text)
 * - Growth bar bg-agri-green
 * - All inputs: label htmlFor, min-h-[44px], focus rings
 * - Buttons min-h-[44px] with focus rings
 * - Sheet backdrop bg-black/50
 */
