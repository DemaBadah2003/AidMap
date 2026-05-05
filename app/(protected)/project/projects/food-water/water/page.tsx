'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Pencil, Plus, Search, Loader2, Droplets, MapPin } from 'lucide-react'

type WaterPoint = {
  id: string
  pointName: string
  waterType: string
  lat: string
  lng: string
  status: string
}

const BASE_URL = '/api/project/projects/water-points'
const selectBaseClass = 'w-full min-w-0 rounded-lg border border-input bg-background px-3 text-start text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'

export default function WaterPointsPage() {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const [items, setItems] = useState<WaterPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [addOpen, setAddOpen] = useState(false)
  const [formData, setFormData] = useState<Omit<WaterPoint, 'id'>>({
    pointName: '', waterType: '', lat: '', lng: '', status: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchPoints = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL)
      const data = await res.json()
      setItems(data)
    } catch (err) { console.error('Fetch error:', err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPoints() }, [])

  const isFormValid = (data: typeof formData) =>
    data.pointName.trim() !== '' && data.waterType !== '' && data.status !== ''

  const onAdd = async () => {
    if (!isFormValid(formData)) return
    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        await fetchPoints()
        setAddOpen(false)
        setFormData({ pointName: '', waterType: '', lat: '', lng: '', status: '' })
        setCurrentPage(1)
      }
    } finally { setSubmitting(false) }
  }

  const filtered = useMemo(() =>
    items.filter(s => !q || s.pointName.toLowerCase().includes(q.toLowerCase())),
    [q, items]
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage, itemsPerPage])

  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const rangeEnd = Math.min(currentPage * itemsPerPage, filtered.length)

  return (
    <div className="w-full px-4 py-6">
      <div className="mb-6 flex items-center gap-2">
        <Droplets className="w-8 h-8 text-blue-600" />
        <h1 className="text-2xl font-bold text-foreground">{t('nav.waterPoints')}</h1>
      </div>

      <Card className="overflow-hidden border shadow-sm rounded-xl">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row items-center gap-3 border-b">
            <div className="relative w-full max-w-xs">
              <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('common.messages.searchPlaceholder')}
                className="h-10 pe-10"
              />
            </div>
            <Button onClick={() => setAddOpen(true)} className="bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 gap-2 sm:ms-auto">
              <Plus className="h-4 w-4" />
              {t('common.buttons.add')}
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-sm">
              <thead className="bg-muted/40 border-b">
                <tr>
                  <th className="p-4 font-semibold text-muted-foreground">{t('common.labels.name')}</th>
                  <th className="p-4 font-semibold text-muted-foreground">{t('common.labels.type')}</th>
                  <th className="p-4 font-semibold text-muted-foreground">{t('pages.addPlaces.lat')}</th>
                  <th className="p-4 font-semibold text-muted-foreground">{t('pages.addPlaces.lng')}</th>
                  <th className="p-4 font-semibold text-muted-foreground">{t('common.labels.status')}</th>
                  <th className="p-4 text-center font-semibold text-muted-foreground">{t('common.labels.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan={6} className="p-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></td></tr>
                ) : paginatedData.length === 0 ? (
                  <tr><td colSpan={6} className="p-16 text-center text-muted-foreground italic">{t('common.messages.noData')}</td></tr>
                ) : paginatedData.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-bold text-foreground">{s.pointName}</td>
                    <td className="p-4 text-muted-foreground">{s.waterType}</td>
                    <td className="p-4 font-mono text-muted-foreground text-xs">{s.lat}</td>
                    <td className="p-4 font-mono text-muted-foreground text-xs">{s.lng}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-md border text-muted-foreground">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 flex items-center justify-between border-t bg-muted/20">
            <span className="text-xs text-muted-foreground">{rangeStart} - {rangeEnd} / {filtered.length}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>{t('common.buttons.prev')}</Button>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>{t('common.buttons.next')}</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md rounded-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-start text-lg font-bold text-blue-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              {t('common.buttons.add')}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4 text-start">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">{t('common.labels.name')}</label>
              <Input className="h-11" value={formData.pointName} onChange={e => setFormData({ ...formData, pointName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">{t('common.labels.type')}</label>
              <select className={`${selectBaseClass} h-11`} value={formData.waterType} onChange={e => setFormData({ ...formData, waterType: e.target.value })}>
                <option value="">{t('common.labels.type')}</option>
                <option value="fresh">Fresh</option>
                <option value="salt">Salt</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">{t('pages.addPlaces.lat')}</label>
                <Input className="h-11 font-mono" value={formData.lat} onChange={e => setFormData({ ...formData, lat: e.target.value })} placeholder="0.0000" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">{t('pages.addPlaces.lng')}</label>
                <Input className="h-11 font-mono" value={formData.lng} onChange={e => setFormData({ ...formData, lng: e.target.value })} placeholder="0.0000" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">{t('common.labels.status')}</label>
              <select className={`${selectBaseClass} h-11`} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                <option value="">{t('common.labels.status')}</option>
                <option value="active">{t('common.labels.active')}</option>
                <option value="inactive">{t('common.labels.inactive')}</option>
              </select>
            </div>
          </div>
          <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-3">
            <Button onClick={onAdd} disabled={submitting || !isFormValid(formData)} className="flex-1 bg-blue-600 hover:bg-blue-700 h-11 rounded-xl text-white">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.buttons.save')}
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1 h-11 rounded-xl">{t('common.buttons.cancel')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
