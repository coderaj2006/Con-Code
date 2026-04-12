import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface Coords {
  lat: number;
  lon: number;
  city?: string;
  source: 'gps' | 'manual' | 'default';
}

interface LocationContextType {
  coords: Coords;
  isLocating: boolean;
  locationError: string | null;
  requestGPS: () => void;
  setManualCity: (city: string, lat: number, lon: number) => void;
}

const DEFAULT_COORDS: Coords = { lat: 28.6139, lon: 77.2090, city: 'New Delhi', source: 'default' };

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [coords, setCoords] = useState<Coords>(() => {
    try {
      const stored = localStorage.getItem('kisaan_location');
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_COORDS;
  });
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const persist = (c: Coords) => {
    setCoords(c);
    localStorage.setItem('kisaan_location', JSON.stringify(c));
  };

  const requestGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('GPS not supported on this device.');
      return;
    }
    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        persist({ lat: pos.coords.latitude, lon: pos.coords.longitude, source: 'gps' });
        setIsLocating(false);
      },
      (err) => {
        setLocationError(err.code === 1 ? 'Location access denied.' : 'Could not get location.');
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  }, []);

  const setManualCity = useCallback((city: string, lat: number, lon: number) => {
    persist({ lat, lon, city, source: 'manual' });
    setLocationError(null);
  }, []);

  // Auto-request GPS on first load if no stored location
  useEffect(() => {
    const stored = localStorage.getItem('kisaan_location');
    if (!stored) requestGPS();
  }, []);

  return (
    <LocationContext.Provider value={{ coords, isLocating, locationError, requestGPS, setManualCity }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
};
