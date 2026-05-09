'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Pencil, Plus, Search, Loader2, AlertCircle, ChevronLeft } from 'lucide-react'

type HospitalRecord = {
  id: string
  hospitalType: string
  hospitalName: string
  region: string
  phone: string
  latitude: number | null
  longitude: number | null
  doctorNames: string
}

const BASE_URL = '/api/project/Medical-Services/hospitals'

const REGIONS = [
  { value: 'شمال', label: 'شمال' },
  { value: 'جنوب', label: 'جنوب' },
  { value: 'شرق', label: 'شرق' },
  { value: 'غرب', label: 'غرب' },
]

const TYPES = [
  { value: 'حكومية', label: 'حكومية' },
  { value: 'خاص', label: 'خاص' },
  { value: 'وكالة', label: 'وكالة' },
]

const selectClass = 'w-full min-w-0 rounded-lg border border-input bg-background px-3 text-start text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'

function HospitalForm({
  hospitalName, setHospitalName,
  hospitalType, setHospitalType,
  region, setRegion,
  phone, setPhone,
  latitude, setLatitude,
  longitude, setLongitude,
}: {
  hospitalName: string; setHospitalName: (v: string) => void
  hospitalType: string; setHospitalType: (v: string) => void
  region: string; setRegion: (v: string) => void
  phone: string; setPhone: (v: string) => void
  latitude: string; setLatitude: (v: string) => void
  longitude: string; setLongitude: (v: string) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4 py-2 text-start">
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground">{t('pages.hospitals.name')}</label>
        <Input className="h-11" placeholder={t('pages.hospitals.name')} value={hospitalName} onChange={e => setHospitalName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground">{t('pages.hospitals.type')}</label>
        <select className={`${selectClass} h-11`} value={hospitalType} onChange={e => setHospitalType(e.target.value)}>
          <option value="">اختر النوع</option>
          {TYPES.map(tp => <option key={tp.value} value={tp.value}>{tp.label}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground">المنطقة</label>
        <select className={`${selectClass} h-11`} value={region} onChange={e => setRegion(e.target.value)}>
          <option value="">اختر المنطقة</option>
          {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground">{t('common.labels.phone')}</label>
        <Input className="h-11" placeholder="05XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">خط العرض</label>
          <Input className="h-11" placeholder="31.5000" type="number" step="any" value={latitude} onChange={e => setLatitude(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">خط الطول</label>
          <Input className="h-11" placeholder="34.4667" type="number" step="any" value={longitude} onChange={e => setLongitude(e.target.value)} />
        </div>
      </div>
    </div>
  )
}

export default function HospitalsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [q, setQ] = useState('')
  const [items, setItems] = useState<HospitalRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Add dialog state
  const [addOpen, setAddOpen] = useState(false)
  const [addName, setAddName] = useState('')
  const [addType, setAddType] = useState('')
  const [addRegion, setAddRegion] = useState('')
  const [addPhone, setAddPhone] = useState('')
  const [addLat, setAddLat] = useState('')
  const [addLng, setAddLng] = useState('')
  const [addSubmitting, setAddSubmitting] = useState(false)

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState('')
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState('')
  const [editRegion, setEditRegion] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editLat, setEditLat] = useState('')
  const [editLng, setEditLng] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL)
      const data = await res.json()
      setItems(Array.isArray(data.hospitals) ? data.hospitals : [])
    } catch (err) { console.error('Fetch error:', err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const isAddValid = useMemo(() =>
    addName.trim() !== '' && addType !== '' && addRegion !== '' && addPhone.trim() !== '',
    [addName, addType, addRegion, addPhone]
  )

  const isEditValid = useMemo(() =>
    editName.trim() !== '' && editType !== '' && editRegion !== '' && editPhone.trim() !== '',
    [editName, editType, editRegion, editPhone]
  )

  const resetAdd = () => { setAddName(''); setAddType(''); setAddRegion(''); setAddPhone(''); setAddLat(''); setAddLng('') }

  const onAdd = async () => {
    if (!isAddValid) return
    setAddSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospitalName: addName, hospitalType: addType, region: addRegion, phone: addPhone, latitude: addLat || null, longitude: addLng || null })
      })
      if (res.ok) { await fetchData(); setAddOpen(false); resetAdd() }
    } finally { setAddSubmitting(false) }
  }

  const openEdit = (item: HospitalRecord) => {
    setEditId(item.id)
    setEditName(item.hospitalName)
    setEditType(item.hospitalType)
    setEditRegion(item.region)
    setEditPhone(item.phone)
    setEditLat(item.latitude != null ? String(item.latitude) : '')
    setEditLng(item.longitude != null ? String(item.longitude) : '')
    setEditOpen(true)
  }

  const onEdit = async () => {
    if (!isEditValid) return
    setEditSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, hospitalName: editName, hospitalType: editType, region: editRegion, phone: editPhone, latitude: editLat || null, longitude: editLng || null })
      })
      if (res.ok) { await fetchData(); setEditOpen(false) }
    } finally { setEditSubmitting(false) }
  }

  const filteredItems = useMemo(() =>
    items.filter(item =>
      item.hospitalName?.toLowerCase().includes(q.toLowerCase()) ||
      item.region?.toLowerCase().includes(q.toLowerCase())
    ),
    [items, q]
  )

  return (
    <div className="w-full px-4 py-6">
      <div className="mb-6 text-start">
        <h1 className="text-2xl font-bold text-foreground">{t('pages.hospitals.title')}</h1>
      </div>

      <Card className="overflow-hidden rounded-xl border shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row items-center gap-3 border-b">
            <div className="relative w-full max-w-xs">
              <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder={t('common.messages.searchPlaceholder')} className="h-10 pe-10" />
            </div>
            <Button onClick={() => setAddOpen(true)} className="bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 gap-2 sm:ms-auto">
              <Plus className="h-4 w-4" /> {t('pages.hospitals.addButton')}
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-sm">
              <thead className="bg-muted/40 border-b">
                <tr>
                  <th className="p-4 font-semibold text-muted-foreground">{t('pages.hospitals.type')}</th>
                  <th className="p-4 font-semibold text-muted-foreground">{t('pages.hospitals.name')}</th>
                  <th className="p-4 font-semibold text-muted-foreground">المنطقة</th>
                  <th className="p-4 font-semibold text-muted-foreground">{t('common.labels.phone')}</th>
                  <th className="p-4 text-center font-semibold text-muted-foreground">{t('common.labels.actions')}</th>
                  <th className="p-4 text-center font-semibold text-muted-foreground">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan={6} className="p-16 text-center text-muted-foreground">
                    <Loader2 className="animate-spin mx-auto mb-2 size-5" />{t('common.messages.loading')}
                  </td></tr>
                ) : filteredItems.length === 0 ? (
                  <tr><td colSpan={6} className="p-16 text-center text-muted-foreground italic">{t('common.messages.noData')}</td></tr>
                ) : filteredItems.map(item => (
                  <tr key={item.id} className="transition-colors hover:bg-muted/30">
                    <td className="p-4 font-medium text-blue-600">{item.hospitalType}</td>
                    <td className="p-4 font-semibold text-foreground">{item.hospitalName}</td>
                    <td className="p-4 text-muted-foreground">{item.region}</td>
                    <td className="p-4 text-muted-foreground">{item.phone}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => openEdit(item)}
                        className="rounded-md border p-2 text-muted-foreground transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => router.push(`/project/projects/Medical-Services/hospitals/${item.id}`)}
                        className="rounded-md border p-2 text-muted-foreground transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={open => { setAddOpen(open); if (!open) resetAdd() }}>
        <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-start text-lg font-bold">{t('pages.hospitals.addTitle')}</DialogTitle></DialogHeader>
          <HospitalForm
            hospitalName={addName} setHospitalName={setAddName}
            hospitalType={addType} setHospitalType={setAddType}
            region={addRegion} setRegion={setAddRegion}
            phone={addPhone} setPhone={setAddPhone}
            latitude={addLat} setLatitude={setAddLat}
            longitude={addLng} setLongitude={setAddLng}
          />
          {!isAddValid && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {t('common.messages.required')}
            </div>
          )}
          <DialogFooter className="flex flex-row gap-3 mt-2">
            <Button onClick={onAdd} disabled={!isAddValid || addSubmitting} className="flex-1 h-11 gap-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl">
              {addSubmitting && <Loader2 className="animate-spin size-4" />}
              {t('common.buttons.save')}
            </Button>
            <Button variant="outline" onClick={() => { setAddOpen(false); resetAdd() }} className="flex-1 h-11 rounded-xl">{t('common.buttons.cancel')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-start text-lg font-bold">تعديل المستشفى</DialogTitle></DialogHeader>
          <HospitalForm
            hospitalName={editName} setHospitalName={setEditName}
            hospitalType={editType} setHospitalType={setEditType}
            region={editRegion} setRegion={setEditRegion}
            phone={editPhone} setPhone={setEditPhone}
            latitude={editLat} setLatitude={setEditLat}
            longitude={editLng} setLongitude={setEditLng}
          />
          {!isEditValid && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {t('common.messages.required')}
            </div>
          )}
          <DialogFooter className="flex flex-row gap-3 mt-2">
            <Button onClick={onEdit} disabled={!isEditValid || editSubmitting} className="flex-1 h-11 gap-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl">
              {editSubmitting && <Loader2 className="animate-spin size-4" />}
              {t('common.buttons.save')}
            </Button>
            <Button variant="outline" onClick={() => setEditOpen(false)} className="flex-1 h-11 rounded-xl">{t('common.buttons.cancel')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
