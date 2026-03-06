import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const fromLng = searchParams.get('fromLng')
  const fromLat = searchParams.get('fromLat')
  const toLng = searchParams.get('toLng')
  const toLat = searchParams.get('toLat')
  const profile = (searchParams.get('profile') ?? 'driving') as 'driving' | 'walking' | 'cycling'

  if (!fromLng || !fromLat || !toLng || !toLat) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 })
  }

  // ✅ لو عندك OSRM على سيرفر/دكر:
  const OSRM_BASE = process.env.OSRM_BASE_URL ?? 'http://localhost:5000'

  const url =
    `${OSRM_BASE}/route/v1/${profile}/` +
    `${fromLng},${fromLat};${toLng},${toLat}` +
    `?overview=full&geometries=geojson&alternatives=false&steps=false`

  const res = await fetch(url)
  if (!res.ok) return NextResponse.json({ error: 'OSRM request failed' }, { status: 502 })

  const data = await res.json()
  const route = data?.routes?.[0]
  if (!route) return NextResponse.json({ error: 'No route found' }, { status: 404 })

  return NextResponse.json({
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
    geometry: route.geometry,
  })
}