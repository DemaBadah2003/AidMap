'use client'

import { useEffect, useState } from 'react'
import MapPreview from '@/app/components/MapPreview'

type MapPlace = {
  id: string
  name: string
  type: 'shelter' | 'hospital' | 'water' | 'food'
  lng: number
  lat: number
  operator?: string
  capacity?: number | null
  occupancy?: number | null
  availableBeds?: number | null
  statusText?: string
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

        if (!res.ok) {
          throw new Error(data?.message || 'فشل في جلب الأماكن')
        }

        if (Array.isArray(data)) {
          setPlaces(data)
        } else if (Array.isArray(data?.data)) {
          setPlaces(data.data)
        } else if (Array.isArray(data?.places)) {
          setPlaces(data.places)
        } else {
          console.error('Invalid /api/places response:', data)
          setPlaces([])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'حدث خطأ')
        setPlaces([])
      } finally {
        setLoading(false)
      }
    }

    loadPlaces()
  }, [])

  if (loading) {
    return <div className="p-6">جاري تحميل الخريطة...</div>
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>
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