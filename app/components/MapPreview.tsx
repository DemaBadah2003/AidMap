'use client'

import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

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
  osmAmenities?: Array<'hospital' | 'clinic' | 'school' | 'pharmacy' | 'doctors' | 'drinking_water'>

  osmCategories?: {
    shelters?: boolean // مدارس / مراكز ايواء (مدارس)
    medical?: boolean // مستشفيات/عيادات/صيدليات/أطباء
    aid?: boolean // ماء
    food?: boolean // غذاء/جمعيات/مراكز دعم
  }
}

type HandlerItem = {
  type: 'click' | 'mouseenter' | 'mouseleave'
  layerId: string
  handler: (e?: any) => void
}

type GeoItem = { label: string; lng: number; lat: number }

type StepItem = {
  instruction: string
  distanceText?: string
}

type RouterEngine = 'graphhopper' | 'osrm' | 'valhalla'

/** ✅ Navbar (OSM-like) */
function OSMNavbar() {
  return (
    <header className="w-full bg-white border-b border-slate-200">
      <div className="h-14 flex items-center justify-between px-3 sm:px-4">
        {/* LEFT */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Title (أول شيء) */}
          <div className="font-extrabold text-slate-900 tracking-tight whitespace-nowrap">
            Gaza Safe Aid Platform (GSAP)
          </div>

          {/* Links */}
          <nav className="hidden lg:flex items-center gap-4 ml-2 text-[13px] text-slate-600">
            <a
              href="#"
              className="inline-flex items-center gap-1 px-3 h-8 rounded border border-emerald-500 text-emerald-700 font-semibold hover:bg-emerald-50"
            >
              Edit <span className="text-emerald-700">▾</span>
            </a>
            <a href="#" className="hover:text-slate-900">
              History
            </a>
            <a href="#" className="hover:text-slate-900">
              Export
            </a>
            <a href="#" className="hover:text-slate-900">
              Help
            </a>
            <a href="#" className="hover:text-slate-900">
              About
            </a>
          </nav>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-9 w-10 rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-center"
            title="Language"
          >
            🌐
          </button>

          <a
            href="#"
            className="h-9 px-3 rounded border border-slate-200 hover:bg-slate-50 text-[13px] font-semibold text-slate-700 inline-flex items-center"
          >
            Log In
          </a>

          <a
            href="#"
            className="h-9 px-3 rounded border border-slate-200 hover:bg-slate-50 text-[13px] font-semibold text-slate-700 inline-flex items-center"
          >
            Sign Up
          </a>
        </div>
      </div>

      {/* Mobile links */}
      <div className="lg:hidden border-t border-slate-200 px-3 py-2 flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-slate-600">
        <a href="#" className="hover:text-slate-900 font-semibold text-emerald-700">
          Edit ▾
        </a>
        <a href="#" className="hover:text-slate-900">
          History
        </a>
        <a href="#" className="hover:text-slate-900">
          Export
        </a>
        <a href="#" className="hover:text-slate-900">
          Help
        </a>
        <a href="#" className="hover:text-slate-900">
          About
        </a>
      </div>
    </header>
  )
}

/** ✅ Custom simple button control (MapLibre) */
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
    if (this._container?.parentNode) this._container.parentNode.removeChild(this._container)
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

export default function MapPreview({
  lng = 34.4667,
  lat = 31.5,
  zoom = 10,
  height = 260,
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

  // RTL plugin مرة واحدة فقط
  const rtlReadyRef = useRef(false)

  // ✅ UI: Layers + Query
  const [layersOpen, setLayersOpen] = useState(false)
  const [queryMode, setQueryMode] = useState(false)

  // ✅ اجعل فلاتر الطبقات قابلة للتغيير من لوحة Layers
  const [layerCats, setLayerCats] = useState(osmCategories)
  useEffect(() => {
    setLayerCats(osmCategories)
  }, [osmCategories])

  // ====== Routing UI State (الكود الثاني) ======
  const [profile, setProfile] = useState<'driving' | 'walking' | 'cycling'>('walking')
  const [routerEngine, setRouterEngine] = useState<RouterEngine>('osrm')

  const [fromText, setFromText] = useState('')
  const [toText, setToText] = useState('')
  const [fromPick, setFromPick] = useState<GeoItem | null>(null)
  const [toPick, setToPick] = useState<GeoItem | null>(null)

  const [fromSug, setFromSug] = useState<GeoItem[]>([])
  const [toSug, setToSug] = useState<GeoItem[]>([])

  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(
    null
  )
  const [steps, setSteps] = useState<StepItem[]>([])

  // ====== Top Search UI ======
  const [topSearch, setTopSearch] = useState('')
  const [dirOpen, setDirOpen] = useState(false)

  // ====== Units Settings (OSM-like) ======
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

  // ====== Text cleanup (mojibake fix) ======
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

  // ====== Route drawing helpers ======
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
        paint: { 'line-width': 5, 'line-color': '#2563eb', 'line-opacity': 0.85 },
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

  // ====== Geocoding search ======
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

  // ====== Suggestions ======
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

  // ====== Route call ======
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

  // ====== Map init + GPS (من الكود الأول) ======
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

    // ✅ GPS / GeolocateControl (Find my location)
    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserLocation: true,
    })
    map.addControl(geolocate, 'top-right')

    // ✅ زر Layers تحت Find my location
    map.addControl(
      new IconButtonControl({
        title: 'Layers',
        icon: LAYERS_ICON,
        onClick: () => {
          setLayersOpen((v) => !v)
        },
        active: () => layersOpen,
      }),
      'top-right'
    )

    // ✅ زر Query Feature (?) تحت Layers
    map.addControl(
      new IconButtonControl({
        title: 'Query feature',
        icon: QUERY_ICON,
        onClick: () => {
          setQueryMode((v) => !v)
        },
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

  // ✅ Query Feature behavior
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

  // ResizeObserver (من الكود الثاني)
  useEffect(() => {
    const wrap = wrapperRef.current
    if (!wrap) return
    const ro = new ResizeObserver(() => mapRef.current?.resize())
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    setTimeout(() => mapRef.current?.resize(), 50)
  }, [height])

  // تحريك عند تغير الإحداثيات (من الكود الأول)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.easeTo({ center: [lng, lat], zoom })
  }, [lng, lat, zoom])

  // ====== Markers الخاصة فينا (من الكود الأول) ======
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

      const marker = new maplibregl.Marker().setLngLat([p.lng, p.lat]).setPopup(popup).addTo(map)
      markersRef.current.push(marker)
    })

    if (places.length === 1) {
      map.flyTo({ center: [places[0].lng, places[0].lat], zoom: Math.max(map.getZoom(), 12) })
    } else {
      map.fitBounds(bounds, { padding: 50, maxZoom: 14 })
    }

    window.setTimeout(() => map.resize(), 60)
  }, [places])

  // ====== OSM overlay (من الكود الأول) ======
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
        return { south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() }
      } catch {
        return { south: 31.2, west: 34.2, north: 31.65, east: 34.6 }
      }
    }

    const attachLayerHandler = (type: HandlerItem['type'], layerId: string, handler: any) => {
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
  ${osmAmenities.map((a) => `nwr["amenity"="${a}"](${south},${west},${north},${east});`).join('\n')}
  ${foodExtra}
);
out center;
`
        const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(overpassQuery)

        const res = await fetch(url)
        const osm = await res.json()
        if (cancelled) return

        const features =
          (osm.elements || [])
            .filter((el: any) => {
              if (el.type === 'node') return typeof el.lat === 'number' && typeof el.lon === 'number'
              return el.center && typeof el.center.lat === 'number' && typeof el.center.lon === 'number'
            })
            .map((el: any) => {
              const lon = el.type === 'node' ? el.lon : el.center.lon
              const lat = el.type === 'node' ? el.lat : el.center.lat

              const tags = el.tags || {}
              const rawName = tags['name:ar'] || tags.name || tags['name:en'] || tags.operator || ''
              const operator = tags.operator || tags['operator:ar'] || ''
              const amenity = tags.amenity || ''
              const shop = tags.shop || ''
              const office = tags.office || ''
              const socialFacility = tags.social_facility || ''

              const display = cleanText(rawName)
              const op = cleanText(operator)

              let kind = 'other'
              if (amenity === 'school') kind = isUnrwa(display, op) ? 'unrwa_school' : 'school'
              else if (['hospital', 'clinic', 'pharmacy', 'doctors'].includes(amenity)) kind = 'medical'
              else if (amenity === 'drinking_water') kind = 'water'
              else if (
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
          layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 12 },
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
            map.easeTo({ center: (cluster.geometry as any).coordinates, zoom: expansionZoom })
          })
        }

        attachLayerHandler('click', 'osm-clusters', onClusterClick)
        attachLayerHandler('mouseenter', 'osm-clusters', () => (map.getCanvas().style.cursor = 'pointer'))
        attachLayerHandler('mouseleave', 'osm-clusters', () => (map.getCanvas().style.cursor = ''))

        // Schools (غير وكالة)
        map.addLayer({
          id: 'osm-schools-layer',
          type: 'circle',
          source: 'osm-places',
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'kind'], 'school']],
          paint: { 'circle-radius': 6, 'circle-color': '#2a9d8f', 'circle-stroke-width': 1, 'circle-stroke-color': '#fff' },
        })
        map.addLayer({
          id: 'osm-schools-labels',
          type: 'symbol',
          source: 'osm-places',
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'kind'], 'school']],
          minzoom: 11,
          layout: {
            'text-field': ['case', ['>', ['length', ['get', 'display_name']], 0], ['get', 'display_name'], 'مدرسة'],
            'text-size': 12,
            'text-offset': [0, 1.2],
            'text-anchor': 'top',
            'text-optional': true,
            'text-allow-overlap': false,
          },
          paint: { 'text-color': '#111', 'text-halo-color': '#fff', 'text-halo-width': 1.4 },
        })

        // UNRWA
        map.addLayer({
          id: 'osm-unrwa-schools-layer',
          type: 'circle',
          source: 'osm-places',
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'kind'], 'unrwa_school']],
          paint: { 'circle-radius': 6, 'circle-color': '#1b7fbd', 'circle-stroke-width': 1, 'circle-stroke-color': '#fff' },
        })
        map.addLayer({
          id: 'osm-unrwa-schools-labels',
          type: 'symbol',
          source: 'osm-places',
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'kind'], 'unrwa_school']],
          minzoom: 11,
          layout: {
            'text-field': ['case', ['>', ['length', ['get', 'display_name']], 0], ['get', 'display_name'], 'مدرسة وكالة (UNRWA)'],
            'text-size': 12,
            'text-offset': [0, 1.2],
            'text-anchor': 'top',
            'text-optional': true,
            'text-allow-overlap': false,
          },
          paint: { 'text-color': '#111', 'text-halo-color': '#fff', 'text-halo-width': 1.4 },
        })

        // Medical
        map.addLayer({
          id: 'osm-medical-layer',
          type: 'circle',
          source: 'osm-places',
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'kind'], 'medical']],
          paint: { 'circle-radius': 6, 'circle-color': '#e63946', 'circle-stroke-width': 1, 'circle-stroke-color': '#fff' },
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
              ['match', ['get', 'amenity'], 'hospital', 'مستشفى', 'clinic', 'عيادة', 'pharmacy', 'صيدلية', 'doctors', 'أطباء', 'مركز طبي'],
            ],
            'text-size': 12,
            'text-offset': [0, 1.2],
            'text-anchor': 'top',
            'text-optional': true,
            'text-allow-overlap': false,
          },
          paint: { 'text-color': '#111', 'text-halo-color': '#fff', 'text-halo-width': 1.4 },
        })

        // Water
        map.addLayer({
          id: 'osm-water-layer',
          type: 'circle',
          source: 'osm-places',
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'kind'], 'water']],
          paint: { 'circle-radius': 6, 'circle-color': '#457b9d', 'circle-stroke-width': 1, 'circle-stroke-color': '#fff' },
        })
        map.addLayer({
          id: 'osm-water-labels',
          type: 'symbol',
          source: 'osm-places',
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'kind'], 'water']],
          minzoom: 11,
          layout: {
            'text-field': ['case', ['>', ['length', ['get', 'display_name']], 0], ['get', 'display_name'], 'نقطة ماء'],
            'text-size': 12,
            'text-offset': [0, 1.2],
            'text-anchor': 'top',
            'text-optional': true,
            'text-allow-overlap': false,
          },
          paint: { 'text-color': '#111', 'text-halo-color': '#fff', 'text-halo-width': 1.4 },
        })

        // Food
        map.addLayer({
          id: 'osm-food-layer',
          type: 'circle',
          source: 'osm-places',
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'kind'], 'food']],
          paint: { 'circle-radius': 6, 'circle-color': '#f4a261', 'circle-stroke-width': 1, 'circle-stroke-color': '#fff' },
        })
        map.addLayer({
          id: 'osm-food-labels',
          type: 'symbol',
          source: 'osm-places',
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'kind'], 'food']],
          minzoom: 11,
          layout: {
            'text-field': ['case', ['>', ['length', ['get', 'display_name']], 0], ['get', 'display_name'], 'مركز دعم / توزيع'],
            'text-size': 12,
            'text-offset': [0, 1.2],
            'text-anchor': 'top',
            'text-optional': true,
            'text-allow-overlap': false,
          },
          paint: { 'text-color': '#111', 'text-halo-color': '#fff', 'text-halo-width': 1.4 },
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

  // ====== إخفاء/إظهار طبقات حسب الفلاتر (مربوط بلوحة Layers) ======
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
  <div className="w-full">
    {/* ✅ Navbar فوق كل شيء */}
    <OSMNavbar />

    {/* ✅ نفس wrapperRef (مهم للـ ResizeObserver) */}
    <div ref={wrapperRef} className="w-full">
      <div className="flex w-full" style={{ height }}>

 
          {/* SIDEBAR */}
          <div
            className="bg-white border-r"
            style={{
              width: 320,
              minWidth: 300,
              maxWidth: 360,
              overflow: 'hidden',
              padding: 10,
              position: 'relative',
            }}
          >
            {/* TOP BAR */}
            <div className="mb-3">
              <div className="flex items-center w-full h-10 border border-slate-200 bg-white">
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
                  className="h-full flex-1 px-3 text-sm outline-none"
                  style={{ border: 'none', minWidth: 0 }}
                />

                <button
                  type="button"
                  onClick={() => mapRef.current?.flyTo({ center: [lng, lat], zoom })}
                  className="h-full px-2 text-xs text-blue-600 whitespace-nowrap"
                  style={{ textDecoration: 'underline', flex: '0 0 auto' }}
                >
                  Where is this?
                </button>

                <div className="h-full flex items-center bg-blue-600" style={{ flex: '0 0 auto' }}>
                  <button
                    type="button"
                    onClick={runTopSearch}
                    className="h-full w-10 flex items-center justify-center"
                    title="Search"
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

                  <div style={{ width: 1, height: '70%', background: 'rgba(255,255,255,.35)' }} />

                  <button
                    type="button"
                    onClick={() => {
                      setDirOpen((v) => !v)
                      setUnitsOpen(false)
                    }}
                    className="h-full w-10 flex items-center justify-center"
                    title="Directions between two points"
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

            {/* Directions Panel */}
            {dirOpen && (
              <div
                className="border rounded-md bg-white"
                style={{
                  position: 'absolute',
                  top: 54,
                  left: 10,
                  right: 10,
                  padding: 10,
                  boxShadow: '0 6px 18px rgba(0,0,0,.12)',
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex overflow-hidden rounded-md border">
                    <button
                      type="button"
                      onClick={() => setProfile('driving')}
                      className="w-9 h-8 flex items-center justify-center"
                      style={{
                        background: profile === 'driving' ? '#e5e7eb' : '#fff',
                        borderRight: '1px solid #e5e7eb',
                      }}
                      title="Car"
                    >
                      🚗
                    </button>

                    <button
                      type="button"
                      onClick={() => setProfile('cycling')}
                      className="w-9 h-8 flex items-center justify-center"
                      style={{
                        background: profile === 'cycling' ? '#e5e7eb' : '#fff',
                        borderRight: '1px solid #e5e7eb',
                      }}
                      title="Bike"
                    >
                      🚲
                    </button>

                    <button
                      type="button"
                      onClick={() => setProfile('walking')}
                      className="w-9 h-8 flex items-center justify-center"
                      style={{
                        background: profile === 'walking' ? '#e5e7eb' : '#fff',
                      }}
                      title="Walk"
                    >
                      🚶
                    </button>
                  </div>

                  <select
                    value={routerEngine}
                    onChange={(e) => setRouterEngine(e.target.value as RouterEngine)}
                    className="flex-1 h-8 rounded-md border px-2 text-sm"
                  >
                    <optgroup label="Directions services">
                      <option value="graphhopper">GraphHopper</option>
                      <option value="osrm">OSRM</option>
                      <option value="valhalla">Valhalla</option>
                    </optgroup>
                  </select>

                  <button
                    type="button"
                    className="w-8 h-8 rounded-md border flex items-center justify-center"
                    onClick={() => {
                      setDirOpen(false)
                      setUnitsOpen(false)
                    }}
                    title="Close"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-2 flex gap-2 items-start">
                  <div className="flex-1">
                    <div className="relative mb-2">
                      <div className="absolute left-2 top-1/2 -translate-y-1/2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M12 22s7-4.4 7-12a7 7 0 1 0-14 0c0 7.6 7 12 7 12Z"
                            fill="#22c55e"
                          />
                          <circle cx="12" cy="10" r="2.5" fill="white" />
                        </svg>
                      </div>

                      <div
                        className="absolute top-1/2 -translate-y-1/2"
                        style={{ left: 32, width: 1, height: 18, background: '#e5e7eb' }}
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
                        className="w-full h-9 rounded-md border pr-3 text-sm"
                        style={{ paddingLeft: 44 }}
                      />

                      {!!fromSug.length && !fromPick && (
                        <div className="absolute left-0 right-0 mt-1 bg-white border rounded-md overflow-hidden max-h-56 overflow-y-auto z-50">
                          {fromSug.map((it, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50"
                              onClick={() => {
                                setFromPick(it)
                                setFromText(it.label)
                                setFromSug([])
                              }}
                            >
                              {it.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <div className="absolute left-2 top-1/2 -translate-y-1/2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M12 22s7-4.4 7-12a7 7 0 1 0-14 0c0 7.6 7 12 7 12Z"
                            fill="#ef4444"
                          />
                          <circle cx="12" cy="10" r="2.5" fill="white" />
                        </svg>
                      </div>

                      <div
                        className="absolute top-1/2 -translate-y-1/2"
                        style={{ left: 32, width: 1, height: 18, background: '#e5e7eb' }}
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
                        className="w-full h-9 rounded-md border pr-3 text-sm"
                        style={{ paddingLeft: 44 }}
                      />

                      {!!toSug.length && !toPick && (
                        <div className="absolute left-0 right-0 mt-1 bg-white border rounded-md overflow-hidden max-h-56 overflow-y-auto z-50">
                          {toSug.map((it, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50"
                              onClick={() => {
                                setToPick(it)
                                setToText(it.label)
                                setToSug([])
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
                    className="w-10 h-[76px] border rounded-md flex items-center justify-center bg-white hover:bg-slate-50"
                    onClick={reverseDir}
                  >
                    <span style={{ fontSize: 18, lineHeight: 1 }}>⇅</span>
                  </button>
                </div>

                <div className="mt-4 flex items-start justify-between">
                  <div
                    style={{
                      fontSize: 34,
                      fontWeight: 800,
                      color: '#111827',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Directions
                  </div>

                  <button
                    type="button"
                    className="w-9 h-9 rounded-md border flex items-center justify-center"
                    title="Close"
                    onClick={() => {
                      setDirOpen(false)
                      setUnitsOpen(false)
                    }}
                    style={{ color: '#6b7280' }}
                  >
                    ✕
                  </button>
                </div>

                {unitsOpen && (
                  <div className="mt-2 border rounded-md overflow-hidden">
                    <div className="grid grid-cols-3">
                      <button
                        type="button"
                        onClick={() => {
                          setUnitsMode('km')
                          setUnitsOpen(false)
                        }}
                        className="h-8 text-xs border-r"
                        style={{
                          background: unitsMode === 'km' ? '#6b7280' : '#fff',
                          color: unitsMode === 'km' ? '#fff' : '#6b7280',
                          fontWeight: 600,
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
                        className="h-8 text-xs border-r"
                        style={{
                          background: unitsMode === 'miles_feet' ? '#6b7280' : '#fff',
                          color: unitsMode === 'miles_feet' ? '#fff' : '#6b7280',
                          fontWeight: 600,
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
                        className="h-8 text-xs"
                        style={{
                          background: unitsMode === 'miles_yards' ? '#6b7280' : '#fff',
                          color: unitsMode === 'miles_yards' ? '#fff' : '#6b7280',
                          fontWeight: 600,
                        }}
                      >
                        miles, yards
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between text-sm" style={{ color: '#111827' }}>
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
                    className="w-9 h-9 rounded-md border flex items-center justify-center"
                    title="Settings"
                    onClick={() => setUnitsOpen((v) => !v)}
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

                <div className="mt-3 border-t pt-2" style={{ maxHeight: 240, overflowY: 'auto' }}>
                  {steps.length ? (
                    <ol className="pl-5" style={{ listStyleType: 'decimal', margin: 0 }}>
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

                    {/* MAP + Filters under map */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* MAP */}
            <div className="relative flex-1 min-h-0">
              <div ref={containerRef} className="w-full h-full" />

              {/* ✅ Layers Panel (يظهر عند الضغط على زر Layers) */}
              {layersOpen && (
                <div
                  className="bg-white border rounded-md"
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: 12,
                    width: 220,
                    padding: 10,
                    boxShadow: '0 10px 24px rgba(0,0,0,.14)',
                    zIndex: 10,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div style={{ fontWeight: 800, color: '#111827' }}>Layers</div>
                    <button
                      type="button"
                      className="w-8 h-8 rounded border flex items-center justify-center"
                      onClick={() => setLayersOpen(false)}
                      title="Close"
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
                    Toggle OSM categories
                  </div>

                  <div className="mt-2 space-y-2" style={{ fontSize: 13, color: '#111827' }}>
                    {[
                      { k: 'shelters', label: 'Shelters (Schools)' },
                      { k: 'medical', label: 'Medical' },
                      { k: 'aid', label: 'Water' },
                      { k: 'food', label: 'Food/Support' },
                    ].map((it) => (
                      <label key={it.k} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!(layerCats as any)?.[it.k]}
                          onChange={(e) =>
                            setLayerCats((prev) => ({ ...(prev || {}), [it.k]: e.target.checked }))
                          }
                        />
                        <span>{it.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* ✅ Query hint (اختياري) */}
              {queryMode && (
                <div
                  className="bg-white border rounded-md"
                  style={{
                    position: 'absolute',
                    right: 12,
                    bottom: 12,
                    padding: '8px 10px',
                    boxShadow: '0 10px 24px rgba(0,0,0,.12)',
                    zIndex: 10,
                    fontSize: 12,
                    color: '#111827',
                  }}
                >
                  Query mode: اضغط على أي عنصر في الخريطة لعرض بياناته
                </div>
              )}
            </div>

            {/* ✅ 3 Filters under the map */}
            <div dir="rtl" className="mt-4 grid gap-2 text-sm">
              <label className="flex items-center gap-2">
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

              <label className="flex items-center gap-2">
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

              <label className="flex items-center gap-2">
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
      </div>
    </div>
  )
}