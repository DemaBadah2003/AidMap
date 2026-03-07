'use client'

import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin } from 'lucide-react'

export type Place = {
  id: string
  name: string
  type?: string
  lng: number
  lat: number
}

type Props = {
  lng?: number
  lat?: number
  zoom?: number
  height?: number
  places?: Place[]

  osmEnabled?: boolean
  osmAmenities?: Array<
    'hospital' | 'clinic' | 'school' | 'pharmacy' | 'doctors' | 'drinking_water'
  >

  osmCategories?: {
    shelters?: boolean
    medical?: boolean
    aid?: boolean
    food?: boolean
  }
}

type HandlerItem = {
  type: 'click' | 'mouseenter' | 'mouseleave'
  layerId: string
  handler: (e?: any) => void
}

type GeoItem = { label: string; lng: number; lat: number }
type StepItem = { instruction: string; distanceText?: string }
type RouterEngine = 'graphhopper' | 'osrm' | 'valhalla'

type TopItem = {
  key: 'shelter' | 'aid' | 'school'
  title: string
  name: string
  meta: string
}

class IconButtonControl implements maplibregl.IControl {
  private _map?: maplibregl.Map
  private _container?: HTMLDivElement
  private _btn?: HTMLButtonElement

  constructor(
    private opts: {
      title: string
      icon: string
      onClick: () => void
      active?: () => boolean
    }
  ) {}

  onAdd(map: maplibregl.Map) {
    this._map = map

    const container = document.createElement('div')
    container.className = 'maplibregl-ctrl maplibregl-ctrl-group'
    container.style.display = 'flex'
    container.style.flexDirection = 'column'
    container.style.alignItems = 'stretch'

    const btn = document.createElement('button')
    btn.type = 'button'
    btn.title = this.opts.title
    btn.setAttribute('aria-label', this.opts.title)
    btn.style.width = '32px'
    btn.style.height = '32px'
    btn.style.display = 'flex'
    btn.style.alignItems = 'center'
    btn.style.justifyContent = 'center'
    btn.innerHTML = this.opts.icon

    btn.onclick = (e) => {
      e.preventDefault()
      this.opts.onClick()
      this.syncActive()
    }

    container.appendChild(btn)
    this._container = container
    this._btn = btn

    this.syncActive()
    return container
  }

  onRemove() {
    if (this._container?.parentNode) {
      this._container.parentNode.removeChild(this._container)
    }
    this._map = undefined
  }

  private syncActive() {
    if (!this._btn) return
    const isActive = this.opts.active?.() ?? false
    this._btn.style.background = isActive ? '#e5e7eb' : ''
  }
}

const LAYERS_ICON = `
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M12 3 3 8l9 5 9-5-9-5Z" stroke="#111827" stroke-width="2" stroke-linejoin="round"/>
  <path d="M3 12l9 5 9-5" stroke="#111827" stroke-width="2" stroke-linejoin="round"/>
  <path d="M3 16l9 5 9-5" stroke="#111827" stroke-width="2" stroke-linejoin="round"/>
</svg>
`

const QUERY_ICON = `
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <circle cx="12" cy="12" r="9" stroke="#111827" stroke-width="2"/>
  <path d="M9.6 9.6A2.6 2.6 0 0 1 12 8.3c1.4 0 2.6 1 2.6 2.3 0 1.2-.8 1.8-1.6 2.2-.9.5-1.6 1-1.6 2.2v.3"
        stroke="#111827" stroke-width="2" stroke-linecap="round"/>
  <circle cx="12" cy="17.7" r="1" fill="#111827"/>
</svg>
`

const TopCards = () => {
  const items: TopItem[] = [
    { key: 'shelter', title: 'أقرب مأوى', name: 'Al-Azhar Shelter', meta: 'يبعد 1.2 كم' },
    { key: 'aid', title: 'توزيع غذاء وماء', name: 'Al-Rahfah Aid Center', meta: 'مفتوح - 09:00' },
    {
      key: 'school',
      title: 'المدارس المتاحة',
      name: 'Great Gaza Primary School',
      meta: 'سعة 120',
    },
  ]

  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<TopItem | null>(null)

  const onOpenDetails = (item: TopItem) => {
    setSelected(item)
    setOpen(true)
  }

  return (
    <>
      <div dir="rtl" className="grid gap-4 md:grid-cols-3 mb-4">
        {items.map((it) => (
          <Card key={it.key}>
            <CardContent className="p-4 flex flex-col gap-2 text-right">
              <div className="text-sm text-secondary-foreground">{it.title}</div>

              <div dir="ltr" className="text-base font-semibold text-mono text-left">
                {it.name}
              </div>

              <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                <MapPin className="size-3.5" />
                {it.meta}
              </div>

              <Button className="mt-2" size="sm" onClick={() => onOpenDetails(it)}>
                عرض التفاصيل
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}

export default function MapPreview({
  lng = 34.4667,
  lat = 31.5,
  zoom = 10,
  height = 600,
  places = [],
  osmEnabled = false,
  osmAmenities = ['hospital', 'clinic', 'school', 'pharmacy', 'doctors', 'drinking_water'],
  osmCategories = { shelters: true, medical: true, aid: true, food: true },
}: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const osmHandlersRef = useRef<HandlerItem[]>([])

  const rtlReadyRef = useRef(false)

  const [layersOpen, setLayersOpen] = useState(false)
  const [queryMode, setQueryMode] = useState(false)

  const [layerCats, setLayerCats] = useState(osmCategories)
  useEffect(() => {
    setLayerCats(osmCategories)
  }, [osmCategories])

  const [profile, setProfile] = useState<'driving' | 'walking' | 'cycling'>('walking')
  const [routerEngine, setRouterEngine] = useState<RouterEngine>('osrm')

  const [fromText, setFromText] = useState('')
  const [toText, setToText] = useState('')
  const [fromPick, setFromPick] = useState<GeoItem | null>(null)
  const [toPick, setToPick] = useState<GeoItem | null>(null)

  const [fromSug, setFromSug] = useState<GeoItem[]>([])
  const [toSug, setToSug] = useState<GeoItem[]>([])

  const [routeInfo, setRouteInfo] = useState<{
    distanceKm: number
    durationMin: number
  } | null>(null)
  const [steps, setSteps] = useState<StepItem[]>([])

  const [topSearch, setTopSearch] = useState('')
  const [dirOpen, setDirOpen] = useState(false)

  const [unitsOpen, setUnitsOpen] = useState(false)
  const [unitsMode, setUnitsMode] = useState<'km' | 'miles_feet' | 'miles_yards'>('km')

  const OSM_LAYERS = [
    'osm-clusters',
    'osm-cluster-count',
    'osm-schools-layer',
    'osm-schools-labels',
    'osm-unrwa-schools-layer',
    'osm-unrwa-schools-labels',
    'osm-medical-layer',
    'osm-medical-labels',
    'osm-water-layer',
    'osm-water-labels',
    'osm-food-layer',
    'osm-food-labels',
  ] as const

  const amenityToArabic = (a: string) => {
    switch (a) {
      case 'school':
        return 'مدرسة'
      case 'hospital':
        return 'مستشفى'
      case 'clinic':
        return 'عيادة'
      case 'pharmacy':
        return 'صيدلية'
      case 'doctors':
        return 'أطباء'
      case 'drinking_water':
        return 'نقطة ماء'
      case 'community_centre':
        return 'مركز مجتمعي'
      case 'social_centre':
        return 'مركز دعم'
      case 'marketplace':
        return 'سوق'
      default:
        return a
    }
  }

  const looksMojibake = (s: string) => /Ã.|Â|Ø.|Ù./.test(s)
  const fixUtf8FromLatin1 = (s: string) => {
    try {
      const bytes = Uint8Array.from(s, (c) => c.charCodeAt(0))
      return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
    } catch {
      return s
    }
  }

  const cleanText = (v: any) => {
    const t = (v ?? '').toString().trim()
    if (!t) return ''
    let out = t
    if (looksMojibake(out)) out = fixUtf8FromLatin1(out)
    if (looksMojibake(out)) out = fixUtf8FromLatin1(out)
    return out.replace(/\uFFFD/g, '').trim()
  }

  const osmAmenitiesKey = useMemo(() => osmAmenities.join(','), [osmAmenities])

  const cleanupOsm = () => {
    const map = mapRef.current
    if (!map) return

    osmHandlersRef.current.forEach(({ type, layerId, handler }) => {
      map.off(type, layerId, handler)
    })
    osmHandlersRef.current = []

    OSM_LAYERS.forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id)
    })

    if (map.getSource('osm-places')) map.removeSource('osm-places')
  }

  const clearRoute = () => {
    const map = mapRef.current
    if (!map) return
    if (map.getLayer('route-layer')) map.removeLayer('route-layer')
    if (map.getSource('route-source')) map.removeSource('route-source')
  }

  const drawRoute = (geometry: any) => {
    const map = mapRef.current
    if (!map) return

    const sourceId = 'route-source'
    const layerId = 'route-layer'

    const geojson = {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry, properties: {} }],
    } as any

    if (map.getSource(sourceId)) {
      ;(map.getSource(sourceId) as any).setData(geojson)
    } else {
      map.addSource(sourceId, { type: 'geojson', data: geojson })
      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-width': 5,
          'line-color': '#2563eb',
          'line-opacity': 0.85,
        },
      })
    }
  }

  const fitToGeometry = (geometry: any) => {
    const map = mapRef.current
    if (!map) return

    const coords = geometry?.coordinates
    if (!Array.isArray(coords) || coords.length < 2) return

    const bounds = new maplibregl.LngLatBounds()
    for (const c of coords) bounds.extend(c)
    map.fitBounds(bounds, { padding: 70, maxZoom: 15 })
  }

  const searchGeo = async (q: string): Promise<GeoItem[]> => {
    const url =
      `https://nominatim.openstreetmap.org/search?format=json&limit=6&addressdetails=1` +
      `&accept-language=ar,en&q=${encodeURIComponent(q)}`

    try {
      const res = await fetch(url)
      if (!res.ok) return []
      const data = (await res.json()) as any[]
      return (data ?? []).map((x) => ({
        label: x.display_name,
        lat: Number(x.lat),
        lng: Number(x.lon),
      }))
    } catch {
      return []
    }
  }

  const runTopSearch = async () => {
    const q = topSearch.trim()
    if (q.length < 2) return
    const items = await searchGeo(q)
    const first = items[0]
    if (!first) return

    mapRef.current?.flyTo({
      center: [first.lng, first.lat],
      zoom: Math.max(mapRef.current?.getZoom() ?? 10, 13),
    })
  }

  const pickFirstFrom = async () => {
    const q = fromText.trim()
    if (q.length < 2) return
    const items = await searchGeo(q)
    setFromSug(items)
    const first = items[0]
    if (first) {
      setFromPick(first)
      setFromText(first.label)
      setFromSug([])
    }
  }

  const pickFirstTo = async () => {
    const q = toText.trim()
    if (q.length < 2) return
    const items = await searchGeo(q)
    setToSug(items)
    const first = items[0]
    if (first) {
      setToPick(first)
      setToText(first.label)
      setToSug([])
    }
  }

  const reverseDir = () => {
    const ft = fromText
    const fp = fromPick
    const fs = fromSug

    setFromText(toText)
    setFromPick(toPick)
    setFromSug(toSug)

    setToText(ft)
    setToPick(fp)
    setToSug(fs)

    setRouteInfo(null)
    setSteps([])
    clearRoute()
  }

  const formatOsmTime = (minutes: number) => {
    const totalSeconds = Math.max(0, Math.round(minutes * 60))
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const formatDistance = (km: number) => {
    if (unitsMode === 'km') {
      return km >= 1 ? `${km.toFixed(1)}km` : `${Math.round(km * 1000)}m`
    }

    const miles = km * 0.621371
    if (unitsMode === 'miles_feet') {
      if (miles >= 0.1) return `${miles.toFixed(1)}mi`
      const feet = km * 3280.84
      return `${Math.round(feet)}ft`
    }

    if (miles >= 0.1) return `${miles.toFixed(1)}mi`
    const yards = km * 1093.613
    return `${Math.round(yards)}yd`
  }

  useEffect(() => {
    let t: any = null
    const q = fromText.trim()
    if (q.length < 2) {
      setFromSug([])
      return
    }
    t = setTimeout(async () => setFromSug(await searchGeo(q)), 250)
    return () => clearTimeout(t)
  }, [fromText])

  useEffect(() => {
    let t: any = null
    const q = toText.trim()
    if (q.length < 2) {
      setToSug([])
      return
    }
    t = setTimeout(async () => setToSug(await searchGeo(q)), 250)
    return () => clearTimeout(t)
  }, [toText])

  useEffect(() => {
    const run = async () => {
      if (!fromPick || !toPick) return

      const url =
        `/api/route?profile=${profile}` +
        `&service=${routerEngine}` +
        `&fromLng=${fromPick.lng}&fromLat=${fromPick.lat}` +
        `&toLng=${toPick.lng}&toLat=${toPick.lat}`

      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) return

      setRouteInfo({ distanceKm: data.distanceKm, durationMin: data.durationMin })
      drawRoute(data.geometry)
      fitToGeometry(data.geometry)

      const apiSteps: StepItem[] =
        (data.steps as any[])?.map((s) => ({
          instruction: cleanText(
            s.instruction || s.text || s.maneuver?.instruction || s.name || ''
          ),
          distanceText: cleanText(s.distanceText || s.distance || s.length || ''),
        })) ?? []

      setSteps(apiSteps.filter((x) => x.instruction))
      setTimeout(() => mapRef.current?.resize(), 50)
    }

    run()
  }, [fromPick, toPick, profile, routerEngine])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    if (mapRef.current) return

    if (typeof window !== 'undefined' && !rtlReadyRef.current) {
      rtlReadyRef.current = true
      const anyMap: any = maplibregl as any
      if (typeof anyMap.setRTLTextPlugin === 'function') {
        anyMap.setRTLTextPlugin(
          'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
          () => {},
          true
        )
      }
    }

    const map = new maplibregl.Map({
      container: el,
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: [lng, lat],
      zoom,
    })

    mapRef.current = map

    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserLocation: true,
    })
    map.addControl(geolocate, 'top-right')

    map.addControl(
      new IconButtonControl({
        title: 'Layers',
        icon: LAYERS_ICON,
        onClick: () => setLayersOpen((v) => !v),
        active: () => layersOpen,
      }),
      'top-right'
    )

    map.addControl(
      new IconButtonControl({
        title: 'Query feature',
        icon: QUERY_ICON,
        onClick: () => setQueryMode((v) => !v),
        active: () => queryMode,
      }),
      'top-right'
    )

    map.on('load', () => map.resize())

    const t1 = window.setTimeout(() => map.resize(), 80)
    const t2 = window.setTimeout(() => map.resize(), 250)

    const handleResize = () => map.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.clearTimeout(t1)
      window.clearTimeout(t2)

      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []

      cleanupOsm()
      clearRoute()

      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const onClick = (e: maplibregl.MapMouseEvent & maplibregl.ExpiryData) => {
      const feats = map.queryRenderedFeatures(e.point)

      if (!feats?.length) {
        new maplibregl.Popup({ offset: 12 })
          .setLngLat(e.lngLat)
          .setHTML(`<div style="font-size:12px;color:#6b7280">لا يوجد عنصر هنا</div>`)
          .addTo(map)
        return
      }

      const f: any = feats[0]
      const layerId = f?.layer?.id ? String(f.layer.id) : 'unknown'
      const props = f?.properties ?? {}

      const rows = Object.entries(props)
        .slice(0, 18)
        .map(([k, v]) => {
          const vv = cleanText(v)
          return `<div style="display:flex;gap:8px"><div style="min-width:90px;color:#6b7280">${k}</div><div style="color:#111827;word-break:break-word">${vv || '-'}</div></div>`
        })
        .join('')

      new maplibregl.Popup({ offset: 12 })
        .setLngLat(e.lngLat)
        .setHTML(
          `<div style="font-size:12px;line-height:1.4">
            <div style="font-weight:800;color:#111827;margin-bottom:6px">Query</div>
            <div style="color:#6b7280;margin-bottom:6px">Layer: <span style="color:#111827;font-weight:700">${layerId}</span></div>
            ${rows || `<div style="color:#6b7280">No properties</div>`}
          </div>`
        )
        .addTo(map)
    }

    if (queryMode) {
      map.getCanvas().style.cursor = 'crosshair'
      map.on('click', onClick)
    } else {
      map.getCanvas().style.cursor = ''
      map.off('click', onClick)
    }

    return () => {
      map.off('click', onClick)
      if (map.getCanvas()) map.getCanvas().style.cursor = ''
    }
  }, [queryMode])

  useEffect(() => {
    const wrap = wrapperRef.current
    if (!wrap) return
    const ro = new ResizeObserver(() => mapRef.current?.resize())
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    setTimeout(() => mapRef.current?.resize(), 50)
  }, [height, dirOpen, layersOpen])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.easeTo({ center: [lng, lat], zoom })
  }, [lng, lat, zoom])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    if (!places.length) {
      window.setTimeout(() => map.resize(), 50)
      return
    }

    const bounds = new maplibregl.LngLatBounds()

    places.forEach((p) => {
      bounds.extend([p.lng, p.lat])

      const popup = new maplibregl.Popup({ offset: 18 }).setHTML(`
        <div style="font-size:13px; line-height:1.4">
          <div style="font-weight:700">${cleanText(p.name) || 'موقع'}</div>
          ${p.type ? `<div style="opacity:.75">${cleanText(p.type)}</div>` : ''}
        </div>
      `)

      const marker = new maplibregl.Marker()
        .setLngLat([p.lng, p.lat])
        .setPopup(popup)
        .addTo(map)

      markersRef.current.push(marker)
    })

    if (places.length === 1) {
      map.flyTo({
        center: [places[0].lng, places[0].lat],
        zoom: Math.max(map.getZoom(), 12),
      })
    } else {
      map.fitBounds(bounds, { padding: 50, maxZoom: 14 })
    }

    window.setTimeout(() => map.resize(), 60)
  }, [places])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (!osmEnabled) {
      cleanupOsm()
      return
    }

    let cancelled = false
    let timer: any = null

    const getBbox = () => {
      try {
        const b = map.getBounds()
        return {
          south: b.getSouth(),
          west: b.getWest(),
          north: b.getNorth(),
          east: b.getEast(),
        }
      } catch {
        return { south: 31.2, west: 34.2, north: 31.65, east: 34.6 }
      }
    }

    const attachLayerHandler = (
      type: HandlerItem['type'],
      layerId: string,
      handler: any
    ) => {
      if (!map.getLayer(layerId)) return
      map.on(type, layerId, handler)
      osmHandlersRef.current.push({ type, layerId, handler })
    }

    const attachPopup = (layerId: string) => {
      if (!map.getLayer(layerId)) return

      const onClick = (e: any) => {
        const f = e.features?.[0] as any
        if (!f) return

        const [lng, lat] = f.geometry.coordinates
        const p = f.properties || {}

        const name = cleanText(p.display_name || p.name || '')
        const operator = cleanText(p.operator || '')
        const amenity = cleanText(p.amenity || '')
        const kind = cleanText(p.kind || '')
        const title = name || amenityToArabic(amenity) || 'موقع'

        const extra = operator
          ? `<div style="opacity:.8;margin-top:4px">الجهة: ${operator}</div>`
          : ''

        new maplibregl.Popup({ offset: 18 })
          .setLngLat([lng, lat])
          .setHTML(
            `<div style="font-size:13px;line-height:1.35">
              <div style="font-weight:800">${title}</div>
              <div style="opacity:.8">${kind ? kind : ''}${amenity ? (kind ? ' • ' : '') + amenityToArabic(amenity) : ''}</div>
              ${extra}
            </div>`
          )
          .addTo(map)
      }

      attachLayerHandler('click', layerId, onClick)
      attachLayerHandler('mouseenter', layerId, () => (map.getCanvas().style.cursor = 'pointer'))
      attachLayerHandler('mouseleave', layerId, () => (map.getCanvas().style.cursor = ''))
    }

    const isUnrwa = (name: string, operator: string) => {
      const t = `${name} ${operator}`.toLowerCase()
      return (
        t.includes('unrwa') ||
        t.includes('وكالة') ||
        t.includes('الاونروا') ||
        t.includes('الأونروا')
      )
    }

    async function run() {
      try {
        const { south, west, north, east } = getBbox()

        const foodExtra = `
          nwr["amenity"="community_centre"](${south},${west},${north},${east});
          nwr["amenity"="social_centre"](${south},${west},${north},${east});
          nwr["amenity"="marketplace"](${south},${west},${north},${east});
          nwr["office"="ngo"](${south},${west},${north},${east});
          nwr["social_facility"](${south},${west},${north},${east});
          nwr["shop"="supermarket"](${south},${west},${north},${east});
        `

        const overpassQuery = `
[out:json][timeout:25];
(
  ${osmAmenities
    .map((a) => `nwr["amenity"="${a}"](${south},${west},${north},${east});`)
    .join('\n')}
  ${foodExtra}
);
out center;
`

        const url =
          'https://overpass-api.de/api/interpreter?data=' +
          encodeURIComponent(overpassQuery)

        const res = await fetch(url)
        const osm = await res.json()
        if (cancelled) return

        const features = (osm.elements || [])
          .filter((el: any) => {
            if (el.type === 'node') {
              return typeof el.lat === 'number' && typeof el.lon === 'number'
            }
            return (
              el.center &&
              typeof el.center.lat === 'number' &&
              typeof el.center.lon === 'number'
            )
          })
          .map((el: any) => {
            const lon = el.type === 'node' ? el.lon : el.center.lon
            const lat = el.type === 'node' ? el.lat : el.center.lat

            const tags = el.tags || {}
            const rawName =
              tags['name:ar'] || tags.name || tags['name:en'] || tags.operator || ''
            const operator = tags.operator || tags['operator:ar'] || ''
            const amenity = tags.amenity || ''
            const shop = tags.shop || ''
            const office = tags.office || ''
            const socialFacility = tags.social_facility || ''

            const display = cleanText(rawName)
            const op = cleanText(operator)

            let kind = 'other'
            if (amenity === 'school') {
              kind = isUnrwa(display, op) ? 'unrwa_school' : 'school'
            } else if (['hospital', 'clinic', 'pharmacy', 'doctors'].includes(amenity)) {
              kind = 'medical'
            } else if (amenity === 'drinking_water') {
              kind = 'water'
            } else if (
              ['community_centre', 'social_centre', 'marketplace'].includes(amenity) ||
              office === 'ngo' ||
              socialFacility ||
              shop === 'supermarket'
            ) {
              kind = 'food'
            }

            return {
              type: 'Feature',
              properties: {
                name: rawName,
                display_name: display,
                operator: op,
                amenity: amenity || '',
                kind,
              },
              geometry: { type: 'Point', coordinates: [lon, lat] },
            }
          })

        const geojson = { type: 'FeatureCollection', features } as any

        if (map.getSource('osm-places')) {
          ;(map.getSource('osm-places') as any).setData(geojson)
          window.setTimeout(() => map.resize(), 60)
          return
        }

        cleanupOsm()

        map.addSource('osm-places', {
          type: 'geojson',
          data: geojson,
          cluster: true,
          clusterMaxZoom: 13,
          clusterRadius: 50,
        })

        map.addLayer({
          id: 'osm-clusters',
          type: 'circle',
          source: 'osm-places',
          filter: ['has', 'point_count'],
          paint: {
            'circle-radius': ['step', ['get', 'point_count'], 16, 10, 22, 30, 28],
            'circle-color': '#333',
            'circle-opacity': 0.55,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
          },
        })

        map.addLayer({
          id: 'osm-cluster-count',
          type: 'symbol',
          source: 'osm-places',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-size': 12,
          },
          paint: { 'text-color': '#fff' },
        })

        const onClusterClick = (e: any) => {
          const feats = map.queryRenderedFeatures(e.point, { layers: ['osm-clusters'] })
          const cluster = feats[0]
          if (!cluster) return

          const source = map.getSource('osm-places') as any
          const clusterId = cluster.properties.cluster_id
          source.getClusterExpansionZoom(clusterId, (err: any, expansionZoom: number) => {
            if (err) return
            map.easeTo({
              center: (cluster.geometry as any).coordinates,
              zoom: expansionZoom,
            })
          })
        }

        attachLayerHandler('click', 'osm-clusters', onClusterClick)
        attachLayerHandler('mouseenter', 'osm-clusters', () => (map.getCanvas().style.cursor = 'pointer'))
        attachLayerHandler('mouseleave', 'osm-clusters', () => (map.getCanvas().style.cursor = ''))

        map.addLayer({
          id: 'osm-schools-layer',
          type: 'circle',
          source: 'osm-places',
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'kind'], 'school']],
          paint: {
            'circle-radius': 6,
            'circle-color': '#2a9d8f',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff',
          },
        })

        map.addLayer({
          id: 'osm-schools-labels',
          type: 'symbol',
          source: 'osm-places',
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'kind'], 'school']],
          minzoom: 11,
          layout: {
            'text-field': [
              'case',
              ['>', ['length', ['get', 'display_name']], 0],
              ['get', 'display_name'],
              'مدرسة',
            ],
            'text-size': 12,
            'text-offset': [0, 1.2],
            'text-anchor': 'top',
            'text-optional': true,
            'text-allow-overlap': false,
          },
          paint: {
            'text-color': '#111',
            'text-halo-color': '#fff',
            'text-halo-width': 1.4,
          },
        })

        map.addLayer({
          id: 'osm-unrwa-schools-layer',
          type: 'circle',
          source: 'osm-places',
          filter: [
            'all',
            ['!', ['has', 'point_count']],
            ['==', ['get', 'kind'], 'unrwa_school'],
          ],
          paint: {
            'circle-radius': 6,
            'circle-color': '#1b7fbd',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff',
          },
        })

        map.addLayer({
          id: 'osm-unrwa-schools-labels',
          type: 'symbol',
          source: 'osm-places',
          filter: [
            'all',
            ['!', ['has', 'point_count']],
            ['==', ['get', 'kind'], 'unrwa_school'],
          ],
          minzoom: 11,
          layout: {
            'text-field': [
              'case',
              ['>', ['length', ['get', 'display_name']], 0],
              ['get', 'display_name'],
              'مدرسة وكالة (UNRWA)',
            ],
            'text-size': 12,
            'text-offset': [0, 1.2],
            'text-anchor': 'top',
            'text-optional': true,
            'text-allow-overlap': false,
          },
          paint: {
            'text-color': '#111',
            'text-halo-color': '#fff',
            'text-halo-width': 1.4,
          },
        })

        map.addLayer({
          id: 'osm-medical-layer',
          type: 'circle',
          source: 'osm-places',
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'kind'], 'medical']],
          paint: {
            'circle-radius': 6,
            'circle-color': '#e63946',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff',
          },
        })

        map.addLayer({
          id: 'osm-medical-labels',
          type: 'symbol',
          source: 'osm-places',
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'kind'], 'medical']],
          minzoom: 11,
          layout: {
            'text-field': [
              'case',
              ['>', ['length', ['get', 'display_name']], 0],
              ['get', 'display_name'],
              [
                'match',
                ['get', 'amenity'],
                'hospital',
                'مستشفى',
                'clinic',
                'عيادة',
                'pharmacy',
                'صيدلية',
                'doctors',
                'أطباء',
                'مركز طبي',
              ],
            ],
            'text-size': 12,
            'text-offset': [0, 1.2],
            'text-anchor': 'top',
            'text-optional': true,
            'text-allow-overlap': false,
          },
          paint: {
            'text-color': '#111',
            'text-halo-color': '#fff',
            'text-halo-width': 1.4,
          },
        })

        map.addLayer({
          id: 'osm-water-layer',
          type: 'circle',
          source: 'osm-places',
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'kind'], 'water']],
          paint: {
            'circle-radius': 6,
            'circle-color': '#457b9d',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff',
          },
        })

        map.addLayer({
          id: 'osm-water-labels',
          type: 'symbol',
          source: 'osm-places',
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'kind'], 'water']],
          minzoom: 11,
          layout: {
            'text-field': [
              'case',
              ['>', ['length', ['get', 'display_name']], 0],
              ['get', 'display_name'],
              'نقطة ماء',
            ],
            'text-size': 12,
            'text-offset': [0, 1.2],
            'text-anchor': 'top',
            'text-optional': true,
            'text-allow-overlap': false,
          },
          paint: {
            'text-color': '#111',
            'text-halo-color': '#fff',
            'text-halo-width': 1.4,
          },
        })

        map.addLayer({
          id: 'osm-food-layer',
          type: 'circle',
          source: 'osm-places',
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'kind'], 'food']],
          paint: {
            'circle-radius': 6,
            'circle-color': '#f4a261',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff',
          },
        })

        map.addLayer({
          id: 'osm-food-labels',
          type: 'symbol',
          source: 'osm-places',
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'kind'], 'food']],
          minzoom: 11,
          layout: {
            'text-field': [
              'case',
              ['>', ['length', ['get', 'display_name']], 0],
              ['get', 'display_name'],
              'مركز دعم / توزيع',
            ],
            'text-size': 12,
            'text-offset': [0, 1.2],
            'text-anchor': 'top',
            'text-optional': true,
            'text-allow-overlap': false,
          },
          paint: {
            'text-color': '#111',
            'text-halo-color': '#fff',
            'text-halo-width': 1.4,
          },
        })

        attachPopup('osm-schools-layer')
        attachPopup('osm-unrwa-schools-layer')
        attachPopup('osm-medical-layer')
        attachPopup('osm-water-layer')
        attachPopup('osm-food-layer')

        window.setTimeout(() => map.resize(), 60)
      } catch (err) {
        console.error('OSM fetch failed:', err)
      }
    }

    const scheduleRun = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        if (!cancelled) run()
      }, 350)
    }

    cleanupOsm()
    if (map.loaded()) run()
    else map.once('load', run)

    map.on('moveend', scheduleRun)
    map.on('zoomend', scheduleRun)

    return () => {
      cancelled = true
      clearTimeout(timer)
      map.off('moveend', scheduleRun)
      map.off('zoomend', scheduleRun)
      cleanupOsm()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [osmEnabled, osmAmenitiesKey])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const setVis = (id: string, on: boolean) => {
      if (!map.getLayer(id)) return
      map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none')
    }

    setVis('osm-clusters', true)
    setVis('osm-cluster-count', true)

    const showSchools = !!layerCats?.shelters
    setVis('osm-schools-layer', showSchools)
    setVis('osm-schools-labels', showSchools)
    setVis('osm-unrwa-schools-layer', showSchools)
    setVis('osm-unrwa-schools-labels', showSchools)

    setVis('osm-medical-layer', !!layerCats?.medical)
    setVis('osm-medical-labels', !!layerCats?.medical)

    setVis('osm-water-layer', !!layerCats?.aid)
    setVis('osm-water-labels', !!layerCats?.aid)

    setVis('osm-food-layer', !!layerCats?.food)
    setVis('osm-food-labels', !!layerCats?.food)
  }, [layerCats])

  return (
    <div
      ref={wrapperRef}
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: `${height}px`,
          overflow: 'hidden',
          borderRadius: 12,
        }}
      >
        {/* MAP */}
        <div
          ref={containerRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
          }}
        />

        {/* SIDEBAR INSIDE MAP - LEFT */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            width: 320,
            maxWidth: 'calc(100% - 24px)',
            maxHeight: 'calc(100% - 120px)',
            overflowY: 'auto',
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(6px)',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 10,
            zIndex: 20,
            boxShadow: '0 10px 24px rgba(0,0,0,.16)',
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                height: 40,
                border: '1px solid #e2e8f0',
                background: '#fff',
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              <input
                value={topSearch}
                onChange={(e) => setTopSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    runTopSearch()
                  }
                }}
                placeholder="Search"
                style={{
                  height: '100%',
                  flex: 1,
                  padding: '0 12px',
                  fontSize: 14,
                  outline: 'none',
                  border: 'none',
                  minWidth: 0,
                  background: 'transparent',
                }}
              />

              <button
                type="button"
                onClick={() => mapRef.current?.flyTo({ center: [lng, lat], zoom })}
                style={{
                  height: '100%',
                  padding: '0 8px',
                  fontSize: 12,
                  color: '#2563eb',
                  whiteSpace: 'nowrap',
                  textDecoration: 'underline',
                  background: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Where is this?
              </button>

              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  background: '#2563eb',
                }}
              >
                <button
                  type="button"
                  onClick={runTopSearch}
                  title="Search"
                  style={{
                    height: '100%',
                    width: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                      stroke="white"
                      strokeWidth="2"
                    />
                    <path
                      d="M16.3 16.3 21 21"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>

                <div
                  style={{
                    width: 1,
                    height: '70%',
                    background: 'rgba(255,255,255,.35)',
                  }}
                />

                <button
                  type="button"
                  onClick={() => {
                    setDirOpen((v) => !v)
                    setUnitsOpen(false)
                  }}
                  title="Directions between two points"
                  style={{
                    height: '100%',
                    width: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M8 7h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <path d="M8 17h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <path
                      d="M8 7l2-2"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 7l2 2"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M18 17l-2-2"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M18 17l-2 2"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {dirOpen && (
            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                background: '#fff',
                padding: 10,
                boxShadow: '0 6px 18px rgba(0,0,0,.12)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    display: 'flex',
                    overflow: 'hidden',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setProfile('driving')}
                    style={{
                      width: 36,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: profile === 'driving' ? '#e5e7eb' : '#fff',
                      border: 'none',
                      borderRight: '1px solid #e5e7eb',
                      cursor: 'pointer',
                    }}
                    title="Car"
                  >
                    🚗
                  </button>

                  <button
                    type="button"
                    onClick={() => setProfile('cycling')}
                    style={{
                      width: 36,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: profile === 'cycling' ? '#e5e7eb' : '#fff',
                      border: 'none',
                      borderRight: '1px solid #e5e7eb',
                      cursor: 'pointer',
                    }}
                    title="Bike"
                  >
                    🚲
                  </button>

                  <button
                    type="button"
                    onClick={() => setProfile('walking')}
                    style={{
                      width: 36,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: profile === 'walking' ? '#e5e7eb' : '#fff',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    title="Walk"
                  >
                    🚶
                  </button>
                </div>

                <select
                  value={routerEngine}
                  onChange={(e) => setRouterEngine(e.target.value as RouterEngine)}
                  style={{
                    flex: 1,
                    height: 32,
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    padding: '0 8px',
                    fontSize: 13,
                  }}
                >
                  <optgroup label="Directions services">
                    <option value="graphhopper">GraphHopper</option>
                    <option value="osrm">OSRM</option>
                    <option value="valhalla">Valhalla</option>
                  </optgroup>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setDirOpen(false)
                    setUnitsOpen(false)
                  }}
                  title="Close"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    background: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ position: 'relative', marginBottom: 8 }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M12 22s7-4.4 7-12a7 7 0 1 0-14 0c0 7.6 7 12 7 12Z"
                          fill="#22c55e"
                        />
                        <circle cx="12" cy="10" r="2.5" fill="white" />
                      </svg>
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        left: 32,
                        width: 1,
                        height: 18,
                        background: '#e5e7eb',
                      }}
                    />

                    <input
                      value={fromText}
                      onChange={(e) => {
                        setFromText(e.target.value)
                        setFromPick(null)
                        setRouteInfo(null)
                        setSteps([])
                        clearRoute()
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          pickFirstFrom()
                        }
                      }}
                      placeholder="From"
                      style={{
                        width: '100%',
                        height: 36,
                        borderRadius: 8,
                        border: '1px solid #d1d5db',
                        paddingRight: 12,
                        paddingLeft: 44,
                        fontSize: 13,
                      }}
                    />

                    {!!fromSug.length && !fromPick && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          marginTop: 4,
                          background: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: 8,
                          overflow: 'hidden',
                          maxHeight: 220,
                          overflowY: 'auto',
                          zIndex: 50,
                        }}
                      >
                        {fromSug.map((it, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setFromPick(it)
                              setFromText(it.label)
                              setFromSug([])
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '8px 12px',
                              fontSize: 12,
                              background: '#fff',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            {it.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M12 22s7-4.4 7-12a7 7 0 1 0-14 0c0 7.6 7 12 7 12Z"
                          fill="#ef4444"
                        />
                        <circle cx="12" cy="10" r="2.5" fill="white" />
                      </svg>
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        left: 32,
                        width: 1,
                        height: 18,
                        background: '#e5e7eb',
                      }}
                    />

                    <input
                      value={toText}
                      onChange={(e) => {
                        setToText(e.target.value)
                        setToPick(null)
                        setRouteInfo(null)
                        setSteps([])
                        clearRoute()
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          pickFirstTo()
                        }
                      }}
                      placeholder="To"
                      style={{
                        width: '100%',
                        height: 36,
                        borderRadius: 8,
                        border: '1px solid #d1d5db',
                        paddingRight: 12,
                        paddingLeft: 44,
                        fontSize: 13,
                      }}
                    />

                    {!!toSug.length && !toPick && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          marginTop: 4,
                          background: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: 8,
                          overflow: 'hidden',
                          maxHeight: 220,
                          overflowY: 'auto',
                          zIndex: 50,
                        }}
                      >
                        {toSug.map((it, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setToPick(it)
                              setToText(it.label)
                              setToSug([])
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '8px 12px',
                              fontSize: 12,
                              background: '#fff',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            {it.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  title="Reverse directions"
                  onClick={reverseDir}
                  style={{
                    width: 40,
                    height: 76,
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1 }}>⇅</span>
                </button>
              </div>

              <div
                style={{
                  marginTop: 16,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                }}
              >
                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 800,
                    color: '#111827',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Directions
                </div>

                <button
                  type="button"
                  title="Close"
                  onClick={() => {
                    setDirOpen(false)
                    setUnitsOpen(false)
                  }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    background: '#fff',
                    color: '#6b7280',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>

              {unitsOpen && (
                <div
                  style={{
                    marginTop: 8,
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setUnitsMode('km')
                        setUnitsOpen(false)
                      }}
                      style={{
                        height: 32,
                        fontSize: 12,
                        border: 'none',
                        borderRight: '1px solid #e5e7eb',
                        background: unitsMode === 'km' ? '#6b7280' : '#fff',
                        color: unitsMode === 'km' ? '#fff' : '#6b7280',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      kilometers
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUnitsMode('miles_feet')
                        setUnitsOpen(false)
                      }}
                      style={{
                        height: 32,
                        fontSize: 12,
                        border: 'none',
                        borderRight: '1px solid #e5e7eb',
                        background: unitsMode === 'miles_feet' ? '#6b7280' : '#fff',
                        color: unitsMode === 'miles_feet' ? '#fff' : '#6b7280',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      miles, feet
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUnitsMode('miles_yards')
                        setUnitsOpen(false)
                      }}
                      style={{
                        height: 32,
                        fontSize: 12,
                        border: 'none',
                        background: unitsMode === 'miles_yards' ? '#6b7280' : '#fff',
                        color: unitsMode === 'miles_yards' ? '#fff' : '#6b7280',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      miles, yards
                    </button>
                  </div>
                </div>
              )}

              <div
                style={{
                  marginTop: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 14,
                  color: '#111827',
                }}
              >
                <div>
                  {routeInfo ? (
                    <>
                      Distance: {formatDistance(routeInfo.distanceKm)}. Time:{' '}
                      {formatOsmTime(routeInfo.durationMin)}.
                    </>
                  ) : (
                    <>Distance: —. Time: —:—.</>
                  )}
                </div>

                <button
                  type="button"
                  title="Settings"
                  onClick={() => setUnitsOpen((v) => !v)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    background: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                      stroke="#6b7280"
                      strokeWidth="2"
                    />
                    <path
                      d="M19.4 13a7.9 7.9 0 0 0 .1-2l2-1.2-2-3.4-2.3.7a8.3 8.3 0 0 0-1.7-1l-.3-2.4H9.8l-.3 2.4a8.3 8.3 0 0 0-1.7 1l-2.3-.7-2 3.4 2 1.2a7.9 7.9 0 0 0 .1 2l-2 1.2 2 3.4 2.3-.7c.5.4 1.1.7 1.7 1l.3 2.4h4.4l.3-2.4c.6-.3 1.2-.6 1.7-1l2.3.7 2-3.4-2-1.2Z"
                      stroke="#6b7280"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>

              <div
                style={{
                  marginTop: 12,
                  borderTop: '1px solid #e5e7eb',
                  paddingTop: 8,
                  maxHeight: 240,
                  overflowY: 'auto',
                }}
              >
                {steps.length ? (
                  <ol style={{ listStyleType: 'decimal', margin: 0, paddingLeft: 20 }}>
                    {steps.map((s, idx) => (
                      <li
                        key={idx}
                        style={{
                          marginBottom: 8,
                          fontSize: 13,
                          color: '#111827',
                          lineHeight: 1.35,
                        }}
                      >
                        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                          <span style={{ flex: 1 }}>{s.instruction}</span>
                          {s.distanceText ? (
                            <span
                              style={{
                                color: '#6b7280',
                                fontSize: 12,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {s.distanceText}
                            </span>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div style={{ fontSize: 13, color: '#6b7280' }}>
                    No turn-by-turn steps yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* LAYERS PANEL */}
        {layersOpen && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 344,
              width: 220,
              maxWidth: 'calc(100% - 24px)',
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              padding: 10,
              boxShadow: '0 10px 24px rgba(0,0,0,.14)',
              zIndex: 30,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 800, color: '#111827' }}>Layers</div>
              <button
                type="button"
                onClick={() => setLayersOpen(false)}
                title="Close"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  background: '#fff',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
              Toggle OSM categories
            </div>

            <div style={{ marginTop: 8, display: 'grid', gap: 8, fontSize: 13, color: '#111827' }}>
              {[
                { k: 'shelters', label: 'Shelters (Schools)' },
                { k: 'medical', label: 'Medical' },
                { k: 'aid', label: 'Water' },
                { k: 'food', label: 'Food/Support' },
              ].map((it) => (
                <label key={it.k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={!!(layerCats as any)?.[it.k]}
                    onChange={(e) =>
                      setLayerCats((prev) => ({
                        ...(prev || {}),
                        [it.k]: e.target.checked,
                      }))
                    }
                  />
                  <span>{it.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* QUERY HINT */}
        {queryMode && (
          <div
            style={{
              position: 'absolute',
              right: 12,
              bottom: 92,
              padding: '8px 10px',
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              boxShadow: '0 10px 24px rgba(0,0,0,.12)',
              zIndex: 15,
              fontSize: 12,
              color: '#111827',
            }}
          >
            Query mode: اضغط على أي عنصر في الخريطة لعرض بياناته
          </div>
        )}

        {/* BOTTOM FILTERS */}
        <div
          dir="rtl"
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            bottom: 12,
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(6px)',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 12,
            display: 'grid',
            gap: 8,
            fontSize: 14,
            zIndex: 20,
            boxShadow: '0 10px 24px rgba(0,0,0,.14)',
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={!!layerCats?.shelters}
              onChange={(e) =>
                setLayerCats((prev) => ({
                  ...(prev || {}),
                  shelters: e.target.checked,
                }))
              }
            />
            <span>مراكز الإيواء (المدارس الحكومية والوكالة)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={!!layerCats?.medical}
              onChange={(e) =>
                setLayerCats((prev) => ({
                  ...(prev || {}),
                  medical: e.target.checked,
                }))
              }
            />
            <span>العيادات الطبية والصيدليات</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={!!layerCats?.aid}
              onChange={(e) =>
                setLayerCats((prev) => ({
                  ...(prev || {}),
                  aid: e.target.checked,
                }))
              }
            />
            <span>مراكز توزيع الغذاء والماء</span>
          </label>
        </div>
      </div>
    </div>
  )
}