'use client'

import { useEffect, useState } from 'react'
import { MapLibrePreview } from '@/app/components/maps/MapPreviewContent'
import { Button } from '@/components/ui/button'

type MapPlace = {
  id: string
  name: string
  type: 'shelter' | 'hospital' | 'water' | 'food'
  lng: number
  lat: number
  operator: string
  capacity: number
  occupancy: number
  availableBeds: number
  statusText: string
}

type FilterType = 'all' | 'shelter' | 'hospital' | 'water' | 'food'

function toSafeNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function normalizePlace(item: any): MapPlace | null {
  const lat = toSafeNumber(item?.lat, NaN)
  const lng = toSafeNumber(item?.lng, NaN)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) return null
  return {
    id: String(item?.id ?? crypto.randomUUID()),
    name: String(item?.name ?? 'بدون اسم'),
    type: item?.type === 'hospital' ? 'hospital' : item?.type === 'water' ? 'water' : item?.type === 'food' ? 'food' : 'shelter',
    lat, lng,
    operator: String(item?.operator ?? ''),
    capacity: toSafeNumber(item?.capacity, 0),
    occupancy: toSafeNumber(item?.occupancy, 0),
    availableBeds: toSafeNumber(item?.availableBeds, 0),
    statusText: String(item?.statusText ?? ''),
  }
}

const filterLabels: Record<FilterType, string> = {
  all: 'الكل',
  shelter: 'مراكز الإيواء',
  hospital: 'المستشفيات',
  water: 'نقاط الماء',
  food: 'الغذاء والدعم',
}

const filterColors: Record<FilterType, string> = {
  all: 'bg-slate-800 text-white',
  shelter: 'bg-emerald-600 text-white',
  hospital: 'bg-red-600 text-white',
  water: 'bg-blue-600 text-white',
  food: 'bg-orange-500 text-white',
}

export default function ProjectMapPreviewPage() {
  const [allPlaces, setAllPlaces] = useState<MapPlace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  useEffect(() => {
    fetch('/api/project/places', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (!data?.success) throw new Error(data?.message || 'فشل في جلب الأماكن')
        const raw = Array.isArray(data?.data) ? data.data : []
        const normalized = raw.map(normalizePlace).filter(Boolean) as MapPlace[]
        setAllPlaces(normalized)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'حدث خطأ'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = activeFilter === 'all' ? allPlaces : allPlaces.filter(p => p.type === activeFilter)

  const counts = {
    all: allPlaces.length,
    shelter: allPlaces.filter(p => p.type === 'shelter').length,
    hospital: allPlaces.filter(p => p.type === 'hospital').length,
    water: allPlaces.filter(p => p.type === 'water').length,
    food: allPlaces.filter(p => p.type === 'food').length,
  }

  return (
    <div className="flex flex-col gap-4 p-4 h-full" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-800">خريطة الأماكن</h1>
          <p className="text-sm text-slate-500">مراكز الإيواء والمستشفيات والمساعدات</p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(filterLabels) as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                activeFilter === f
                  ? filterColors[f]
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {filterLabels[f]}
              {counts[f] > 0 && <span className="mr-1 opacity-80">({counts[f]})</span>}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          خطأ في تحميل البيانات: {error}
        </div>
      )}

      {loading && (
        <div className="bg-blue-50 border border-blue-100 text-blue-600 px-4 py-2 rounded-xl text-sm">
          جاري تحميل بيانات الخريطة...
        </div>
      )}

      {!loading && !error && allPlaces.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-sm">
          لا توجد أماكن بإحداثيات محددة. أضف إحداثيات للمستشفيات والمخيمات لتظهر على الخريطة.
        </div>
      )}

      <div className="flex-1 min-h-0" style={{ minHeight: 500 }}>
        <MapLibrePreview
          height={680}
          adminPlaces={filtered}
          osmEnabled={true}
          osmAmenities={['hospital', 'clinic', 'school', 'pharmacy', 'doctors', 'drinking_water']}
          osmCategories={{ shelters: true, medical: true, aid: true, food: true }}
        />
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-slate-400 text-center">
          يعرض {filtered.length} موقع على الخريطة
          {activeFilter !== 'all' && ` • فلتر: ${filterLabels[activeFilter]}`}
        </p>
      )}
    </div>
  )
}
