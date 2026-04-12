// RESKIN ONLY — Logic untouched. UI layer updated per Agri-Tech spec.
import { FC, useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

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

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:8002';

/* INJECT LOGIC HERE — DO NOT REMOVE */
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
      setPrices([
        { crop: 'Tomato', price: 2400, unit: 'Quintal', trend: 'up',     market: 'Azadpur' },
        { crop: 'Wheat',  price: 2100, unit: 'Quintal', trend: 'stable', market: 'Lucknow' },
        { crop: 'Potato', price: 1200, unit: 'Quintal', trend: 'down',   market: 'Indore' },
      ]);
    } finally {
      setLoading(false);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  };

  useEffect(() => { fetchPrices(); }, []);
  /* END LOGIC */

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'up')   return <TrendingUp   className="w-5 h-5 text-agri-green" />;
    if (trend === 'down') return <TrendingDown  className="w-5 h-5 text-agri-terra" />;
    return                       <Minus         className="w-5 h-5 text-agri-soil/50" />;
  };

  const trendValueColor = (trend: string) =>
    trend === 'up' ? 'text-agri-green' : trend === 'down' ? 'text-agri-terra' : 'text-agri-soil-deep';

  return (
    <div className={`card-agri-dark ${isSunlightMode ? 'bg-black border-2 border-white' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-lg font-medium flex items-center gap-2 ${
          isSunlightMode ? 'text-white' : 'text-agri-soil-deep'
        }`}>
          <TrendingUp className={`w-5 h-5 ${isSunlightMode ? 'text-[#39FF14]' : 'text-agri-green'}`} />
          Mandi Prices
        </h2>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className={`text-xs ${isSunlightMode ? 'text-white/50' : 'text-agri-soil/60'}`}>{lastUpdated}</span>
          )}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={fetchPrices}
            disabled={loading}
            aria-label="Refresh mandi prices"
            title="Refresh mandi prices"
            className={`p-2 min-h-[44px] min-w-[44px] rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 ${
              isSunlightMode ? 'bg-white/10 text-white' : 'bg-agri-cream text-agri-soil hover:text-agri-soil-deep'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </div>

      {/* Loading shimmer */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 skeleton rounded-2xl" />
          ))}
        </div>
      ) : (
        /* Card list with divide-y */
        <div className={`rounded-2xl overflow-hidden border divide-y ${
          isSunlightMode ? 'border-white/20 divide-white/10' : 'border-agri-soil/15 divide-agri-soil/10'
        }`}>
          {prices.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className={`flex justify-between items-center px-4 py-4 ${
                isSunlightMode ? 'bg-white/5' : 'bg-agri-offwhite'
              }`}
            >
              {/* Left: crop name + market */}
              <div>
                <p className={`text-base font-medium ${isSunlightMode ? 'text-white' : 'text-agri-soil-deep'}`}>
                  {item.crop}
                </p>
                <p className={`text-xs ${isSunlightMode ? 'text-white/50' : 'text-agri-soil/60'}`}>{item.market}</p>
              </div>

              {/* Right: price + trend */}
              <div className="flex items-center gap-3">
                <p className={`text-xl font-semibold ${trendValueColor(item.trend)}`}>
                  ₹{item.price.toLocaleString()}
                </p>
                <TrendIcon trend={item.trend} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <p className={`text-xs text-center mt-4 ${isSunlightMode ? 'text-white/30' : 'text-agri-soil/60'}`}>
        Prices sourced from Agmarknet • Updated daily
      </p>
    </div>
  );
};

/*
 * Changes Made:
 * - Dark zinc cards → agri-offwhite with divide-y divide-agri-soil/10
 * - Trend up → agri-green, trend down → agri-terra (color + icon, never color alone)
 * - Price text-xl font-semibold in trend color
 * - Crop name text-base font-medium, market text-xs text-agri-soil/60
 * - Refresh button min-h-[44px] with focus ring
 * - Loading uses skeleton shimmer
 */
