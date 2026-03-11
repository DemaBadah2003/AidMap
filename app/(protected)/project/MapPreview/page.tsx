'use client'

import MapPreview from '@/app/components/MapPreview'

export default function Page() {
  return (
    <div className="p-6">
      <MapPreview height={700} osmEnabled={true} />
    </div>
  )
}