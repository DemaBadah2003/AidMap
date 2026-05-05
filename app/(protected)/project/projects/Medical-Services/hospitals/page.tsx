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
import { Pencil, Plus, Search, Loader2, AlertCircle } from 'lucide-react'

type HospitalRecord = {
  id: string
  hospitalType: string
  hospitalName: string
  phone: string
  status: string
  description: string
}

const BASE_URL = '/api/project/projects/doctors'

const selectClass = 'w-full min-w-0 rounded-lg border border-input bg-background px-3 text-start text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'

export default function HospitalsPage() {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const [items, setItems] = useState<HospitalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [hospitalType, setHospitalType] = useState('')
  const [hospitalName, setHospitalName] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL)
      const data = await res.json()
      setItems(data)
    } catch (err) { console.error('Fetch error:', err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const isAddValid = useMemo(() =>
    hospitalName.trim() !== '' && hospitalType !== '' && phone.trim() !== '' && status !== '',
    [hospitalName, hospitalType, phone, status]
  )

  const onAdd = async () => {
    if (!isAddValid) return
    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospitalType, hospitalName, phone, status, description })
      })
      if (res.ok) {
        await fetchData()
        setAddOpen(false)
        resetAddForm()
      }
    } finally { setSubmitting(false) }
  }

  const resetAddForm = () => {
    setHospitalType(''); setHospitalName(''); setPhone(''); setStatus(''); setDescription('')
  }

  const filteredItems = useMemo(() =>
    items.filter(item =>
      item.hospitalName?.toLowerCase().includes(q.toLowerCase()) ||
      item.hospitalType?.toLowerCase().includes(q.toLowerCase())
    ),
    [items, q]
  )

  return (
    <div className="w-full px-4 py-6">
      <div className="mb-6 text-start">
        <h1 className="text-2xl font-bold text-foreground">{t('pages.hospitals.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('pages.hospitals.title')}</p>
      </div>

      <Card className="overflow-hidden rounded-xl border shadow-sm">
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
              <Plus className="h-4 w-4" /> {t('pages.hospitals.addButton')}
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-sm">
              <thead className="bg-muted/40 border-b">
                <tr>
                  <th className="p-4 font-semibold text-muted-foreground">{t('pages.hospitals.type')}</th>
                  <th className="p-4 font-semibold text-muted-foreground">{t('pages.hospitals.name')}</th>
                  <th className="p-4 font-semibold text-muted-foreground">{t('common.labels.phone')}</th>
                  <th className="p-4 font-semibold text-muted-foreground">{t('pages.hospitals.status')}</th>
                  <th className="p-4 font-semibold text-muted-foreground">{t('common.labels.notes')}</th>
                  <th className="p-4 text-center font-semibold text-muted-foreground">{t('common.labels.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan={6} className="p-16 text-center text-muted-foreground">
                    <Loader2 className="animate-spin mx-auto mb-2 size-5" />{t('common.messages.loading')}
                  </td></tr>
                ) : filteredItems.length === 0 ? (
                  <tr><td colSpan={6} className="p-16 text-center text-muted-foreground italic">{t('common.messages.noData')}</td></tr>
                ) : filteredItems.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-muted/30">
                    <td className="p-4 font-medium text-blue-600">{item.hospitalType}</td>
                    <td className="p-4 font-semibold text-foreground">{item.hospitalName}</td>
                    <td className="p-4 text-muted-foreground">{item.phone}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 max-w-[150px] truncate text-muted-foreground">{item.description || '—'}</td>
                    <td className="p-4 text-center">
                      <button className="rounded-md border p-2 text-muted-foreground transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-start text-lg font-bold">{t('pages.hospitals.addTitle')}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-2 text-start">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">{t('pages.hospitals.type')}</label>
              <select className={`${selectClass} h-11`} value={hospitalType} onChange={e => setHospitalType(e.target.value)}>
                <option value="">{t('pages.hospitals.allTypes')}</option>
                <option value="government">{t('pages.hospitals.types.government')}</option>
                <option value="private">{t('pages.hospitals.types.private')}</option>
                <option value="field">{t('pages.hospitals.types.field')}</option>
                <option value="clinic">{t('pages.hospitals.types.clinic')}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">{t('pages.hospitals.name')}</label>
              <Input className="h-11" placeholder={t('pages.hospitals.name')} value={hospitalName} onChange={e => setHospitalName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">{t('common.labels.phone')}</label>
              <Input className="h-11" placeholder="05XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">{t('pages.hospitals.status')}</label>
              <select className={`${selectClass} h-11`} value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">{t('pages.hospitals.allStatuses')}</option>
                <option value="active">{t('pages.hospitals.statuses.active')}</option>
                <option value="inactive">{t('pages.hospitals.statuses.inactive')}</option>
                <option value="partial">{t('pages.hospitals.statuses.partial')}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">{t('common.labels.notes')}</label>
              <textarea
                className="w-full rounded-lg border border-input bg-background p-2 text-sm outline-none min-h-[60px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            {!isAddValid && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {t('common.messages.required')}
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-row gap-3 mt-2">
            <Button onClick={onAdd} disabled={!isAddValid || submitting} className="flex-1 h-11 gap-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl">
              {submitting && <Loader2 className="animate-spin size-4" />}
              {t('common.buttons.save')}
            </Button>
            <Button variant="outline" onClick={() => { setAddOpen(false); resetAddForm() }} className="flex-1 h-11 rounded-xl">{t('common.buttons.cancel')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
