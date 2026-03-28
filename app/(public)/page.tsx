'use client';

import { useEffect, useState } from 'react';
import MapPreviewContent from '../components/maps/MapPreviewContent';

type MapPlace = {
  id: string;
  name: string;
  type: 'shelter' | 'hospital' | 'water' | 'food';
  lng: number;
  lat: number;
  operator?: string;
  capacity?: number | null;
  occupancy?: number | null;
  availableBeds?: number | null;
  statusText?: string;
};

export default function PublicHomePage() {
  const [places, setPlaces] = useState<MapPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPlaces = async () => {
      try {
        const res = await fetch('/api/project/places', { cache: 'no-store' });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || 'فشل في جلب الأماكن');
        }

        setPlaces(Array.isArray(data?.data) ? data.data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'حدث خطأ');
      } finally {
        setLoading(false);
      }
    };

    loadPlaces();
  }, []);

  return (
    <div className="p-4">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-6 text-center">جاري تحميل الخريطة...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : (
          <MapPreviewContent height={700} adminPlaces={places} />
        )}
      </div>
    </div>
  );
}