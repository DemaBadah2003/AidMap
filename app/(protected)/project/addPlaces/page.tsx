'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { requireAdmin } from '@/app/(protected)/project/helpers/route-guards'
import AddPlaces from '@/app/components/addPlaces'

export default function AddPlacesPage() {
  const router = useRouter()

  useEffect(() => {
    requireAdmin(router)
  }, [router])

  return <AddPlaces />
}