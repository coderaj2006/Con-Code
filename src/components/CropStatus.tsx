import { FC } from 'react';
import { Droplets, Thermometer, Bug, ChevronRight } from 'lucide-react';

const statuses = [
  {
    label: 'Soil Moisture',
    value: 'Good',
    detail: '72%',
    icon: <Droplets className="w-6 h-6" />,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  {
    label: 'Temperature',
    value: '32°C',
    detail: 'Optimal',
    icon: <Thermometer className="w-6 h-6" />,
    color: 'text-orange-600',
    bg: 'bg-orange-100',
  },
  {
    label: 'Pest Risk',
    value: 'Low',
    detail: 'No threats',
    icon: <Bug className="w-6 h-6" />,
    color: 'text-green-600',
    bg: 'bg-green-100',
  },
];

export const CropStatus: FC = () => {
  return (
    <div className="px-4 pb-6">
      <h2 className="text-lg font-black uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-agri-green rounded-full"></span>
        Crop Status
      </h2>
      <div className="grid grid-cols-1 gap-3">
        {statuses.map((item, idx) => (
          <div key={idx} className="card-agri flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className={`${item.bg} ${item.color} p-3 rounded-2xl`}>
                {item.icon}
              </div>
              <div>
                <p className="text-gray-500 text-sm font-bold uppercase tracking-tight">{item.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-gray-900">{item.value}</span>
                  <span className="text-xs font-bold text-gray-400">{item.detail}</span>
                </div>
              </div>
            </div>
            <div className="text-gray-300 group-hover:text-agri-green transition-colors">
              <ChevronRight className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
