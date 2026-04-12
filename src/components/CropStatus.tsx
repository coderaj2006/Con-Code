// RESKIN ONLY — Logic untouched. UI layer updated per Agri-Tech spec.
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

/* INJECT LOGIC HERE — DO NOT REMOVE */
const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string; badge: string; icon: FC<any> }> = {
  CRITICAL: {
    bg: 'bg-agri-terra/10',
    text: 'text-agri-terra',
    border: 'border-agri-terra/30',
    badge: 'bg-agri-terra/10 text-agri-terra border-agri-terra/30',
    icon: AlertTriangle,
  },
  WARNING: {
    bg: 'bg-agri-amber/10',
    text: 'text-agri-amber',
    border: 'border-agri-amber/30',
    badge: 'bg-agri-amber/10 text-agri-amber border-agri-amber/30',
    icon: AlertCircle,
  },
  INFO: {
    bg: 'bg-agri-green/10',
    text: 'text-agri-green',
    border: 'border-agri-green/30',
    badge: 'bg-agri-green/10 text-agri-green border-agri-green/30',
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
    { label: t('humidity'),    value: '85%',  status: 'High', color: 'text-agri-terra',    icon: Wind },
    { label: t('temperature'), value: '32°C', status: 'Warm', color: 'text-agri-amber',    icon: Thermometer },
    { label: t('soil_ph'),     value: '6.8',  status: 'Good', color: 'text-agri-green',    icon: TestTube },
    { label: t('moisture'),    value: '42%',  status: 'Good', color: 'text-agri-green',    icon: Droplets },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className={`card-agri-dark ${isSunlightMode ? 'bg-black border-2 border-white' : ''}`}>
        <div className="shimmer-bar mb-6"><div className="shimmer-bar-inner" /></div>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 skeleton rounded-2xl" />
              <div className="h-3 w-12 skeleton" />
              <div className="h-5 w-8 skeleton" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`card-agri-dark ${isSunlightMode ? 'bg-black border-2 border-white' : ''}`}>
      <div className="flex items-center justify-between mb-5">
        <h2 className={`text-lg font-medium ${isSunlightMode ? 'text-white' : 'text-agri-soil-deep'}`}>
          {t('live_field_status')}
        </h2>
        {isSimulationMode && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
            isSunlightMode ? 'bg-white/10 text-white border-white/20' : 'bg-agri-amber/10 text-agri-amber border-agri-amber/30'
          }`}>
            Demo Data
          </span>
        )}
      </div>

      {/* Vitals Grid */}
      <div className={`rounded-2xl overflow-hidden border divide-y ${
        isSunlightMode ? 'border-white/20 divide-white/10' : 'border-agri-soil/10 divide-agri-soil/10'
      }`}>
        {vitals.map((item, idx) => (
          <div key={idx} className={`flex items-center justify-between px-4 py-3 ${
            isSunlightMode ? 'bg-white/5' : 'bg-agri-offwhite'
          }`}>
            <div className="flex items-center gap-2">
              <item.icon className={`w-5 h-5 ${isSunlightMode ? 'text-white/60' : 'text-agri-soil/60'}`} />
              <span className={`text-sm font-medium ${isSunlightMode ? 'text-white/70' : 'text-agri-soil-deep/70'}`}>
                {item.label}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-semibold ${isSunlightMode ? 'text-white' : 'text-agri-soil-deep'}`}>
                {item.value}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                isSunlightMode ? 'bg-white/10 text-white' : item.color + ' bg-current/10'
              }`}>
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Smart Alerts */}
      {smartAlerts.length > 0 && (
        <div className="mt-5 space-y-2">
          <p className={`text-xs font-medium uppercase tracking-wide flex items-center gap-2 mb-3 ${
            isSunlightMode ? 'text-white/50' : 'text-agri-soil/60'
          }`}>
            <AlertTriangle className="w-4 h-4" />
            Actionable Insights
          </p>
          {smartAlerts.map((alert, idx) => {
            const style = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES['INFO'];
            const Icon = style.icon;
            return (
              <div key={idx} className={`rounded-2xl px-4 py-3 border ${style.bg} ${style.border}`}>
                <div className="flex items-start gap-2">
                  <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${style.text}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${style.badge}`}>
                        {alert.severity}
                      </span>
                      <span className={`text-sm font-medium truncate ${style.text}`}>{alert.title}</span>
                    </div>
                    <p className={`text-sm leading-snug mb-1 ${isSunlightMode ? 'text-white/70' : 'text-agri-soil-deep/70'}`}>
                      {alert.message}
                    </p>
                    <p className={`text-sm font-medium ${style.text}`}>→ {alert.action}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scan History */}
      {telemetryHistory.length > 0 && (
        <div className="mt-5 pt-4 border-t border-agri-soil/10">
          <p className={`text-xs font-medium uppercase tracking-wide flex items-center gap-2 mb-3 ${
            isSunlightMode ? 'text-white/50' : 'text-agri-soil/60'
          }`}>
            <FlaskConical className="w-4 h-4" />
            Recent Scans
          </p>
          <div className="space-y-2">
            {telemetryHistory.map((entry, idx) => (
              <div key={idx} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                isSunlightMode ? 'bg-white/5 border-white/10' : 'bg-agri-cream border-agri-soil/10'
              }`}>
                <div>
                  <p className={`text-sm font-medium ${isSunlightMode ? 'text-white' : 'text-agri-soil-deep'}`}>
                    {entry.result}
                  </p>
                  <p className={`text-xs ${isSunlightMode ? 'text-white/40' : 'text-agri-soil/60'}`}>
                    {entry.crop} • {entry.date}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  isSunlightMode ? 'bg-white/10 text-white' : 'bg-agri-green/10 text-agri-green'
                }`}>{entry.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/*
 * Changes Made:
 * - Dark zinc palette → agri-offwhite / agri-cream surfaces
 * - Vitals in row layout with divide-y (icon+label left, value+status right)
 * - SEVERITY_STYLES updated to agri-terra/agri-amber/agri-green
 * - Loading uses shimmer-bar instead of skeleton blocks
 * - Status badges use color + text label (never color alone)
 */
