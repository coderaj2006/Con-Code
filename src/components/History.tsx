import { FC } from 'react';
import { Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface HistoryProps {
  isSunlightMode?: boolean;
}

const historyItems = [
  { date: '10 Apr', type: 'Pest Scan', result: 'Early Blight', crop: 'Tomato' },
  { date: '08 Apr', type: 'Voice Help', result: 'Fertilizer Advice', crop: 'Wheat' },
  { date: '05 Apr', type: 'Pest Scan', result: 'Healthy', crop: 'Rice' },
];

export const History: FC<HistoryProps> = ({ isSunlightMode }) => {
  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      className={`p-6 rounded-[2.5rem] shadow-2xl transition-all duration-500 mb-20 ${
        isSunlightMode ? 'bg-black border-4 border-white' : 'glass-card shadow-agri-glow'
      }`}
    >
      <h2 className={`text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${
        isSunlightMode ? 'text-white' : 'text-gray-400'
      }`}>
        <span className={`w-1.5 h-6 rounded-full ${isSunlightMode ? 'bg-neon-agri' : 'bg-agri-amber'}`}></span>
        Recent History
      </h2>
      <div className={`rounded-3xl overflow-hidden ${
        isSunlightMode ? 'border-2 border-white' : 'bg-gray-50/50'
      }`}>
        {historyItems.map((item, idx) => (
          <div key={idx} className={`p-4 flex items-center justify-between ${
            idx !== historyItems.length - 1 ? (isSunlightMode ? 'border-b-2 border-white' : 'border-b border-gray-100') : ''
          }`}>
            <div className="flex items-center gap-3">
              <div className={`text-center px-2 py-1.5 rounded-xl border ${
                isSunlightMode ? 'bg-white text-black border-white' : 'bg-white border-gray-100'
              }`}>
                <p className="text-[10px] font-bold uppercase leading-none">{item.date.split(' ')[1]}</p>
                <p className="text-sm font-black leading-none mt-0.5">{item.date.split(' ')[0]}</p>
              </div>
              <div>
                <p className={`text-sm font-bold ${
                  isSunlightMode ? 'text-neon-agri' : 'text-gray-900'
                }`}>{item.result}</p>
                <p className={`text-[10px] font-medium uppercase tracking-tighter ${
                  isSunlightMode ? 'text-white/60' : 'text-gray-400'
                }`}>{item.type} • {item.crop}</p>
              </div>
            </div>
            <button className={`btn-press ${
              isSunlightMode ? 'text-white' : 'text-agri-green/40'
            }`}>
              <Info className="w-5 h-5" />
            </button>
          </div>
        ))}
        <button className={`w-full py-4 text-xs font-black uppercase tracking-widest transition-colors ${
          isSunlightMode ? 'bg-white text-black hover:bg-neon-agri' : 'bg-gray-50 text-agri-green hover:bg-gray-100'
        }`}>
          View All History
        </button>
      </div>
    </motion.div>
  );
};
