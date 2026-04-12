import { FC, useState, useEffect } from 'react';
import { Droplets, Thermometer, TestTube, Wind, FlaskConical, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useTranslation } from '../context/TranslationContext';
import { WeatherAlert } from '../services/api';

interface TelemetryEntry {
  date: string;
  type: string;
  result: string;
  crop: string;
}

interface CropStatusProps {
  isSunlightMode?: boolean;
  telemetryHistory?: TelemetryEntry[];
  isSimulationMode?: boolean;
  smartAlerts?: WeatherAlert[];
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string; badge: string; icon: FC<any> }> = {
  CRITICAL: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/30',
    badge: 'bg-red-500/20 text-red-400 border-red-500/40',
    icon: AlertTriangle,
  },
  WARNING: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    icon: AlertCircle,
  },
  INFO: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    icon: Info,
  },
};

export const CropStatus: FC<CropStatusProps> = ({
  isSunlightMode,
  telemetryHistory = [],
  isSimulationMode = false,
  smartAlerts = [],
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  const vitals = [
    { label: t('humidity'), value: '85%', status: 'High', color: 'bg-red-500/20 text-red-500', icon: Wind },
    { label: t('temperature'), value: '32°C', status: 'Warm', color: 'bg-amber-500/20 text-amber-500', icon: Thermometer },
    { label: t('soil_ph'), value: '6.8', status: 'Good', color: 'bg-emerald-500/20 text-emerald-500', icon: TestTube },
    { label: t('moisture'), value: '42%', status: 'Good', color: 'bg-emerald-500/20 text-emerald-500', icon: Droplets },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className={`card-agri-dark ${isSunlightMode ? 'bg-black border-4 border-white' : ''}`}>
        <h2 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-white/50">
          <span className="w-1.5 h-6 rounded-full bg-zinc-800 animate-pulse"></span>
          {t('live_field_status')}
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 skeleton rounded-2xl" />
              <div className="h-3 w-12 skeleton" />
              <div className="h-5 w-8 skeleton" />
              <div className="h-6 w-full skeleton rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`card-agri-dark ${isSunlightMode ? 'bg-black border-4 border-white' : ''}`}>
      <h2 className={`text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${
        isSunlightMode ? 'text-white' : 'text-white'
      }`}>
        <span className={`w-1.5 h-6 rounded-full ${isSunlightMode ? 'bg-neon-agri' : 'bg-blue-500'}`}></span>
        {t('live_field_status')}
        {isSimulationMode && (
          <span className="ml-auto text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            Demo Data
          </span>
        )}
      </h2>

      {/* Vitals Grid */}
      <div className="grid grid-cols-4 gap-2">
        {vitals.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 border ${
              isSunlightMode ? 'bg-white text-black border-white' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}>
              <item.icon className="w-6 h-6" />
            </div>
            <p className={`text-[10px] font-bold uppercase tracking-tighter mb-1 text-center truncate w-full ${
              isSunlightMode ? 'text-white' : 'text-zinc-500'
            }`}>
              {item.label}
            </p>
            <p className={`text-base font-black mb-2 ${isSunlightMode ? 'text-neon-agri' : 'text-white'}`}>
              {item.value}
            </p>
            <div className={`status-pill w-full justify-center ${
              isSunlightMode ? 'bg-white text-black' : item.color
            }`}>
              {item.status}
            </div>
          </div>
        ))}
      </div>

      {/* Smart Alerts Section */}
      {smartAlerts.length > 0 && (
        <div className="mt-6 pt-4 border-t border-zinc-800 space-y-2">
          <p className={`text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${
            isSunlightMode ? 'text-white/60' : 'text-zinc-500'
          }`}>
            <AlertTriangle className="w-3 h-3" />
            Actionable Insights
          </p>
          {smartAlerts.map((alert, idx) => {
            const style = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES['INFO'];
            const Icon = style.icon;
            return (
              <div
                key={idx}
                className={`rounded-2xl px-3 py-3 border ${style.bg} ${style.border}`}
              >
                <div className="flex items-start gap-2">
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${style.text}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${style.badge}`}>
                        {alert.severity}
                      </span>
                      <span className={`text-xs font-black truncate ${style.text}`}>{alert.title}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug mb-1">{alert.message}</p>
                    <p className={`text-[11px] font-bold ${style.text}`}>→ {alert.action}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Live Scan History */}
      {telemetryHistory.length > 0 && (
        <div className="mt-6 pt-4 border-t border-zinc-800">
          <p className={`text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${
            isSunlightMode ? 'text-white/60' : 'text-zinc-500'
          }`}>
            <FlaskConical className="w-3 h-3" />
            Recent Scans
          </p>
          <div className="space-y-2">
            {telemetryHistory.map((entry, idx) => (
              <div key={idx} className={`flex items-center justify-between px-3 py-2 rounded-xl ${
                isSunlightMode ? 'bg-white/5 border border-white/10' : 'bg-zinc-800/60'
              }`}>
                <div>
                  <p className={`text-xs font-black ${isSunlightMode ? 'text-neon-agri' : 'text-white'}`}>{entry.result}</p>
                  <p className={`text-[10px] font-bold uppercase ${isSunlightMode ? 'text-white/40' : 'text-zinc-500'}`}>
                    {entry.crop} • {entry.date}
                  </p>
                </div>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                  isSunlightMode ? 'bg-white text-black' : 'bg-emerald-500/20 text-emerald-400'
                }`}>{entry.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
