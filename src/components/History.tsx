import { FC } from 'react';
import { Info } from 'lucide-react';

const historyItems = [
  { date: '10 Apr', type: 'Pest Scan', result: 'Early Blight', crop: 'Tomato' },
  { date: '08 Apr', type: 'Voice Help', result: 'Fertilizer Advice', crop: 'Wheat' },
  { date: '05 Apr', type: 'Pest Scan', result: 'Healthy', crop: 'Rice' },
];

export const History: FC = () => {
  return (
    <div className="px-4 pb-12">
      <h2 className="text-lg font-black uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-agri-amber rounded-full"></span>
        Recent History
      </h2>
      <div className="bg-white rounded-3xl shadow-agri overflow-hidden border border-gray-100">
        {historyItems.map((item, idx) => (
          <div key={idx} className={`p-4 flex items-center justify-between ${idx !== historyItems.length - 1 ? 'border-b border-gray-50' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="text-center bg-gray-50 px-2 py-1.5 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase leading-none">{item.date.split(' ')[1]}</p>
                <p className="text-sm font-black text-gray-700 leading-none mt-0.5">{item.date.split(' ')[0]}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{item.result}</p>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">{item.type} • {item.crop}</p>
              </div>
            </div>
            <button className="text-agri-green/40 hover:text-agri-green btn-press">
              <Info className="w-5 h-5" />
            </button>
          </div>
        ))}
        <button className="w-full py-3 bg-gray-50 text-agri-green text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-colors">
          View All History
        </button>
      </div>
    </div>
  );
};
