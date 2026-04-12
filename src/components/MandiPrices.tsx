import { FC, useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_BASE } from '../config';

interface MandiPrice {
  crop: string;
  price: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  market: string;
}

interface MandiPricesProps {
  isSunlightMode?: boolean;
}



export const MandiPrices: FC<MandiPricesProps> = ({ isSunlightMode }) => {
  const [prices, setPrices] = useState<MandiPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/telemetry?farmer_id=1`);
      const data = await res.json();
      if (data?.mandi?.length) {
        setPrices(data.mandi);
      }
    } catch {
      // fallback static data
      setPrices([
        { crop: 'Tomato', price: 2400, unit: 'Quintal', trend: 'up', market: 'Azadpur' },
        { crop: 'Wheat',  price: 2100, unit: 'Quintal', trend: 'stable', market: 'Lucknow' },
        { crop: 'Potato', price: 1200, unit: 'Quintal', trend: 'down', market: 'Indore' },
      ]);
    } finally {
      setLoading(false);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  };

  useEffect(() => { fetchPrices(); }, []);

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'up')     return <TrendingUp   className="w-4 h-4 text-emerald-400" />;
    if (trend === 'down')   return <TrendingDown  className="w-4 h-4 text-red-400" />;
    return                         <Minus         className="w-4 h-4 text-zinc-400" />;
  };

  const trendColor = (trend: string) =>
    trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-zinc-400';

  return (
    <div className={`card-agri-dark ${isSunlightMode ? 'bg-black border-4 border-white' : ''}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
          <span className={`w-1.5 h-6 rounded-full ${isSunlightMode ? 'bg-neon-agri' : 'bg-blue-500'}`} />
          Mandi Prices
        </h2>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[9px] font-bold uppercase text-zinc-500">{lastUpdated}</span>
          )}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={fetchPrices}
            disabled={loading}
            className={`p-2 rounded-xl transition-all ${isSunlightMode ? 'bg-white/10 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 skeleton rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {prices.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${
                isSunlightMode
                  ? 'bg-white/5 border-white/10'
                  : 'bg-zinc-800/60 border-zinc-700/50'
              }`}
            >
              <div>
                <p className={`text-sm font-black uppercase tracking-tight ${isSunlightMode ? 'text-neon-agri' : 'text-white'}`}>
                  {item.crop}
                </p>
                <p className="text-[10px] font-bold uppercase text-zinc-500">{item.market}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={`text-base font-black ${isSunlightMode ? 'text-white' : 'text-white'}`}>
                    ₹{item.price.toLocaleString()}
                  </p>
                  <p className="text-[9px] font-bold uppercase text-zinc-500">per {item.unit}</p>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-xl ${
                  item.trend === 'up' ? 'bg-emerald-500/10' : item.trend === 'down' ? 'bg-red-500/10' : 'bg-zinc-700/50'
                }`}>
                  <TrendIcon trend={item.trend} />
                  <span className={`text-[10px] font-black uppercase ${trendColor(item.trend)}`}>
                    {item.trend}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <p className="text-[9px] font-bold uppercase text-zinc-600 text-center mt-4">
        Prices sourced from Agmarknet • Updated daily
      </p>
    </div>
  );
};
