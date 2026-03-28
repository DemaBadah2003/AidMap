'use client'

import { useEffect, useState } from 'react'
import MapPreview from '@/app/components/maps/MapPreviewContent'

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

function toSafeNumber(value: any, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback

  const normalized =
    typeof value === 'string' ? value.replace(/,/g, '.').trim() : value

  const n = Number(normalized)
  return Number.isFinite(n) ? n : fallback
}

function normalizePlace(item: any): MapPlace | null {
  const rawType = String(
    item?.type ?? item?.kind ?? item?.category ?? item?.placeType ?? ''
  ).toLowerCase()

  let mappedType: MapPlace['type'] = 'shelter'

  if (['shelter', 'shelters', 'school', 'unrwa_school'].includes(rawType)) {
    mappedType = 'shelter'
  } else if (
    ['hospital', 'medical', 'clinic', 'doctors', 'pharmacy'].includes(rawType)
  ) {
    mappedType = 'hospital'
  } else if (['water', 'drinking_water', 'aid'].includes(rawType)) {
    mappedType = 'water'
  } else if (
    ['food', 'community_centre', 'social_centre', 'marketplace'].includes(rawType)
  ) {
    mappedType = 'food'
  }

  const lat = toSafeNumber(item?.lat ?? item?.latitude, NaN)
  const lng = toSafeNumber(item?.lng ?? item?.longitude ?? item?.long, NaN)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  return {
    id: String(item?.id ?? item?._id ?? crypto.randomUUID()),
    name: String(item?.name ?? item?.title ?? item?.placeName ?? 'بدون اسم'),
    type: mappedType,
    lat,
    lng,
    operator: String(item?.operator ?? item?.managedBy ?? ''),
    capacity: toSafeNumber(item?.capacity, 0),
    occupancy: toSafeNumber(item?.occupancy, 0),
    availableBeds: toSafeNumber(item?.availableBeds, 0),
    statusText: String(item?.statusText ?? item?.status ?? ''),
  }
}

export default function ProjectMapPreviewPage() {
  const [places, setPlaces] = useState<MapPlace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadPlaces = async () => {
      try {
        setLoading(true)
        setError('')

        const res = await fetch('/api/project/places', {
          cache: 'no-store',
        })

        const data = await res.json()

        console.log('API response status:', res.status)
        console.log('API response data:', data)

        if (!res.ok) {
          throw new Error(data?.message || 'فشل في جلب الأماكن')
        }

        const rawPlaces = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.places)
              ? data.places
              : []

        const normalizedPlaces = rawPlaces
          .map(normalizePlace)
          .filter(Boolean) as MapPlace[]

        const badPlaces = rawPlaces.filter((item: any) => {
          const lat = toSafeNumber(item?.lat ?? item?.latitude, NaN)
          const lng = toSafeNumber(item?.lng ?? item?.longitude ?? item?.long, NaN)

          return !Number.isFinite(lat) || !Number.isFinite(lng)
        })

        console.log('bad places:', badPlaces)
        console.log('normalized places:', normalizedPlaces)

        setPlaces(normalizedPlaces)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'حدث خطأ')
        setPlaces([])
      } finally {
        setLoading(false)
      }
    }

    loadPlaces()
  }, [])

  console.log('places', places)

  if (loading) {
    return <div className="p-6">جاري تحميل الخريطة...</div>
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>
  }

  if (!places.length) {
    return <div className="p-6 text-amber-600">لا توجد أماكن لعرضها على الخريطة</div>
  }

  return (
    <div className="p-6">
      <MapPreview
        height={700}
        adminPlaces={places}
        osmEnabled={true}
      />
    </div>
  )
}