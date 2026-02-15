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
    shelters?: boolean
    medical?: boolean
    aid?: boolean
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
  osmCategories = { shelters: true, medical: true, aid: true },
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const osmHandlersRef = useRef<HandlerItem[]>([])

  const OSM_LAYERS = [
    'osm-clusters',
    'osm-cluster-count',
    'osm-shelters-layer',
    'osm-shelters-labels',
    'osm-medical-layer',
    'osm-medical-labels',
    'osm-aid-layer',
    'osm-aid-labels',
  ] as const

  const amenityToArabic = (a: string) => {
    switch (a) {
      case 'school':
        return 'مدرسة / مركز إيواء'
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
      default:
        return a
    }
  }

  // إصلاح “mojibake” لو صار بأسماء OSM
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

    const map = new maplibregl.Map({
      container: el,

      /**
       * ✅ الحل النهائي للطلاسم:
       * هذا Style أنظف وأقل labels بكثير من liberty
       */
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

  // OSM
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (!osmEnabled) {
      cleanupOsm()
      return
    }

    let cancelled = false

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

        const displayName = cleanText(p.display_name || p.name || '')
        const amenity = cleanText(p.amenity || 'unknown')
        const title = displayName.length ? displayName : amenityToArabic(amenity)

        new maplibregl.Popup({ offset: 18 })
          .setLngLat([lng, lat])
          .setHTML(`<b>${title}</b><br/>${amenityToArabic(amenity)}`)
          .addTo(map)
      }

      attachLayerHandler('click', layerId, onClick)
      attachLayerHandler('mouseenter', layerId, () => (map.getCanvas().style.cursor = 'pointer'))
      attachLayerHandler('mouseleave', layerId, () => (map.getCanvas().style.cursor = ''))
    }

    async function run() {
      try {
        const { south, west, north, east } = getBbox()

        const overpassQuery = `
          [out:json][timeout:25];
          (
            ${osmAmenities
              .map((a) => `node["amenity"="${a}"](${south},${west},${north},${east});`)
              .join('\n')}
          );
          out body;
        `
        const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(overpassQuery)

        const res = await fetch(url)
        const osm = await res.json()
        if (cancelled) return

        const geojson = {
          type: 'FeatureCollection',
          features: (osm.elements || [])
            .filter(
              (el: any) => el.type === 'node' && typeof el.lat === 'number' && typeof el.lon === 'number'
            )
            .map((el: any) => {
              const rawName =
                el.tags?.['name:ar'] || el.tags?.name || el.tags?.['name:en'] || el.tags?.operator || ''
              const amenity = el.tags?.amenity || 'unknown'
              const fixedName = cleanText(rawName)

              return {
                type: 'Feature',
                properties: {
                  name: rawName,
                  display_name: fixedName,
                  amenity,
                },
                geometry: { type: 'Point', coordinates: [el.lon, el.lat] },
              }
            }),
        } as any

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
          const features = map.queryRenderedFeatures(e.point, { layers: ['osm-clusters'] })
          const cluster = features[0]
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

        map.addLayer({
          id: 'osm-shelters-layer',
          type: 'circle',
          source: 'osm-places',
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'amenity'], 'school']],
          paint: { 'circle-radius': 6, 'circle-color': '#2a9d8f', 'circle-stroke-width': 1, 'circle-stroke-color': '#fff' },
        })

        map.addLayer({
          id: 'osm-shelters-labels',
          type: 'symbol',
          source: 'osm-places',
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'amenity'], 'school']],
          minzoom: 13,
          layout: {
            'text-field': ['case', ['>', ['length', ['get', 'display_name']], 0], ['get', 'display_name'], 'مدرسة / مركز إيواء'],
            'text-size': 12,
            'text-offset': [0, 1.2],
            'text-anchor': 'top',
            'text-optional': true,
            'text-allow-overlap': false,
          },
          paint: { 'text-color': '#111', 'text-halo-color': '#fff', 'text-halo-width': 1.4 },
        })

        map.addLayer({
          id: 'osm-medical-layer',
          type: 'circle',
          source: 'osm-places',
          filter: ['all', ['!', ['has', 'point_count']], ['in', ['get', 'amenity'], ['literal', ['hospital', 'clinic', 'pharmacy', 'doctors']]]],
          paint: { 'circle-radius': 6, 'circle-color': '#e63946', 'circle-stroke-width': 1, 'circle-stroke-color': '#fff' },
        })

        map.addLayer({
          id: 'osm-medical-labels',
          type: 'symbol',
          source: 'osm-places',
          filter: ['all', ['!', ['has', 'point_count']], ['in', ['get', 'amenity'], ['literal', ['hospital', 'clinic', 'pharmacy', 'doctors']]]],
          minzoom: 13,
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

        map.addLayer({
          id: 'osm-aid-layer',
          type: 'circle',
          source: 'osm-places',
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'amenity'], 'drinking_water']],
          paint: { 'circle-radius': 6, 'circle-color': '#457b9d', 'circle-stroke-width': 1, 'circle-stroke-color': '#fff' },
        })

        map.addLayer({
          id: 'osm-aid-labels',
          type: 'symbol',
          source: 'osm-places',
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'amenity'], 'drinking_water']],
          minzoom: 13,
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

        attachPopup('osm-shelters-layer')
        attachPopup('osm-medical-layer')
        attachPopup('osm-aid-layer')

        window.setTimeout(() => map.resize(), 60)
      } catch (err) {
        console.error('OSM fetch failed:', err)
      }
    }

    cleanupOsm()
    if (map.loaded()) run()
    else map.once('load', run)

    return () => {
      cancelled = true
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

    setVis('osm-shelters-layer', !!osmCategories?.shelters)
    setVis('osm-shelters-labels', !!osmCategories?.shelters)

    setVis('osm-medical-layer', !!osmCategories?.medical)
    setVis('osm-medical-labels', !!osmCategories?.medical)

    setVis('osm-aid-layer', !!osmCategories?.aid)
    setVis('osm-aid-labels', !!osmCategories?.aid)
  }, [osmCategories])

  return (
    <div className="w-full rounded-lg overflow-hidden border border-slate-200 bg-white relative">
      <div ref={containerRef} className="w-full" style={{ height }} />
    </div>
  )
}