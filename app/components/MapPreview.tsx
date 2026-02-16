'use client'

import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useMemo, useRef } from 'react'
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
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const osmHandlersRef = useRef<HandlerItem[]>([])

  // RTL plugin مرة واحدة فقط
  const rtlReadyRef = useRef(false)

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

  // إصلاح mojibake
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

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    if (mapRef.current) return

    // RTL plugin قبل إنشاء الخريطة (مرة واحدة)
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
    })
    map.addControl(geolocate, 'top-right')

    map.on('load', () => map.resize())

    const t1 = window.setTimeout(() => map.resize(), 100)
    const t2 = window.setTimeout(() => map.resize(), 300)

    const handleResize = () => map.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.clearTimeout(t1)
      window.clearTimeout(t2)

      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []

      cleanupOsm()

      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // تحريك عند تغير الإحداثيات
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.easeTo({ center: [lng, lat], zoom })
  }, [lng, lat, zoom])

  // Markers الخاصة فينا
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
      map.flyTo({ center: [places[0].lng, places[0].lat], zoom: Math.max(zoom, 12) })
    } else {
      map.fitBounds(bounds, { padding: 50, maxZoom: 14 })
    }

    window.setTimeout(() => map.resize(), 60)
  }, [places, zoom])

  // OSM overlay
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

        const extra = operator ? `<div style="opacity:.8;margin-top:4px">الجهة: ${operator}</div>` : ''

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

    // تصنيف مدارس وكالة عبر الاسم/المشغل
    const isUnrwa = (name: string, operator: string) => {
      const t = `${name} ${operator}`.toLowerCase()
      return t.includes('unrwa') || t.includes('وكالة') || t.includes('الاونروا') || t.includes('الأونروا')
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

    // ✅ أعد الجلب عند تغيير مكان/زوم (مهم لزر تحديد الموقع)
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

  // إخفاء/إظهار طبقات حسب الفلاتر
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const setVis = (id: string, on: boolean) => {
      if (!map.getLayer(id)) return
      map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none')
    }

    setVis('osm-clusters', true)
    setVis('osm-cluster-count', true)

    const showSchools = !!osmCategories?.shelters
    setVis('osm-schools-layer', showSchools)
    setVis('osm-schools-labels', showSchools)
    setVis('osm-unrwa-schools-layer', showSchools)
    setVis('osm-unrwa-schools-labels', showSchools)

    setVis('osm-medical-layer', !!osmCategories?.medical)
    setVis('osm-medical-labels', !!osmCategories?.medical)

    setVis('osm-water-layer', !!osmCategories?.aid)
    setVis('osm-water-labels', !!osmCategories?.aid)

    setVis('osm-food-layer', !!osmCategories?.food)
    setVis('osm-food-labels', !!osmCategories?.food)
  }, [osmCategories])

  return (
    <div className="w-full rounded-lg overflow-hidden border border-slate-200 bg-white relative">
      <div ref={containerRef} className="w-full" style={{ height }} />
    </div>
  )
}