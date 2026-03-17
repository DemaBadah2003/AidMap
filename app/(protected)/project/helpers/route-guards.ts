'use client'

import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

function getRoleFromCookies() {
  if (typeof document === 'undefined') return null

  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('userRole='))

  return match ? decodeURIComponent(match.split('=')[1]) : null
}

export function requireAdmin(router: AppRouterInstance) {
  const role = getRoleFromCookies()

  if (role !== 'ADMIN') {
    router.push('/login')
  }
}

export function requireCitizen(router: AppRouterInstance) {
  const role = getRoleFromCookies()

  if (role !== 'CITIZEN' && role !== 'ADMIN') {
    router.push('/login')
  }
}