import { FC, useEffect, useState } from 'react';
import { Info, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getFarmerHistory, DiagnosisHistoryItem } from '../services/api';

interface HistoryProps {
  isSunlightMode?: boolean;
}

export const History: FC<HistoryProps> = ({ isSunlightMode }) => {
  const [historyItems, setHistoryItems] = useState<DiagnosisHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getFarmerHistory(1); // Hardcoded for demo/seed farmer
        setHistoryItems(data.slice(0, 3)); // Show top 3
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return { day, month: months[date.getMonth()] };
  };

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
      <div className={`rounded-3xl overflow-hidden min-h-[100px] flex flex-col ${
        isSunlightMode ? 'border-2 border-white' : 'bg-gray-50/50'
      }`}>
        {isLoading ? (
          <div className="flex-grow flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-agri-green/50" />
          </div>
        ) : historyItems.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400 text-sm font-medium">No records found.</p>
          </div>
        ) : (
          historyItems.map((item, idx) => {
            const { day, month } = formatDate(item.timestamp);
            return (
              <div key={item.id} className={`p-4 flex items-center justify-between ${
                idx !== historyItems.length - 1 ? (isSunlightMode ? 'border-b-2 border-white' : 'border-b border-gray-100') : ''
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`text-center px-2 py-1.5 rounded-xl border min-w-[40px] ${
                    isSunlightMode ? 'bg-white text-black border-white' : 'bg-white border-gray-100'
                  }`}>
                    <p className="text-[10px] font-bold uppercase leading-none">{month}</p>
                    <p className="text-sm font-black leading-none mt-0.5">{day}</p>
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${
                      isSunlightMode ? 'text-neon-agri' : 'text-gray-900'
                    }`}>{item.ai_diagnosis?.split('.')[0] || 'Diagnosis'}</p>
                    <p className={`text-[10px] font-medium uppercase tracking-tighter ${
                      isSunlightMode ? 'text-white/60' : 'text-gray-400'
                    }`}>SCAN • {item.weather_at_time || 'Cloudy'}</p>
                  </div>
                </div>
                <button className={`btn-press ${
                  isSunlightMode ? 'text-white' : 'text-agri-green/40'
                }`}>
                  <Info className="w-5 h-5" />
                </button>
              </div>
            );
          })
        )}
        <button className={`w-full py-4 text-xs font-black uppercase tracking-widest transition-colors ${
          isSunlightMode ? 'bg-white text-black hover:bg-neon-agri' : 'bg-gray-50 text-agri-green hover:bg-gray-100'
        }`}>
          View All History
        </button>
      </div>
    </motion.div>
  );
};
