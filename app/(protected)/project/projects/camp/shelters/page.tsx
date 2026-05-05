'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
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
import { Pencil, Save, X, Plus, Search, Loader2 } from 'lucide-react'

const REGIONS_OPTIONS = ['شرق', 'غرب', 'شمال', 'جنوب'] as const
const STATUS_OPTIONS = ['ممتلئ', 'غير ممتلئ'] as const

type Region = (typeof REGIONS_OPTIONS)[number]
type FillStatus = (typeof STATUS_OPTIONS)[number]

type Shelter = {
  id: string
  nameAr: string
  areaAr: Region
  supervisorAr: string
  phone: string
  familiesCount: number
  capacity: number
  fillStatus: FillStatus
}

const BASE_URL = '/api/project/projects/shelter'

const selectClass = 'w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'

export default function SheltersPage() {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Shelter[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | FillStatus>('all')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [addOpen, setAddOpen] = useState(false)
  const [formData, setFormData] = useState({
    nameAr: '',
    areaAr: 'شمال' as Region,
    supervisorAr: '',
    phone: '',
    capacity: 0,
    fillStatus: 'غير ممتلئ' as FillStatus,
  })
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Omit<Shelter, 'id' | 'familiesCount'>>({
    nameAr: '', areaAr: 'شمال', supervisorAr: '', phone: '', capacity: 0, fillStatus: 'غير ممتلئ',
  })

  const shelterSchema = z.object({
    nameAr: z.string().trim().min(1, t('common.messages.required')),
    areaAr: z.enum([...REGIONS_OPTIONS], { errorMap: () => ({ message: t('common.messages.required') }) }),
    supervisorAr: z.string().trim().min(1, t('common.messages.required')),
    phone: z.string().trim().min(1, t('common.messages.required')).regex(/^(056|059)\d{7}$/, t('common.messages.required')),
    capacity: z.coerce.number().gt(0, t('common.messages.required')),
    fillStatus: z.enum([...STATUS_OPTIONS], { errorMap: () => ({ message: t('common.messages.required') }) }),
  })

  const fetchShelters = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL)
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchShelters() }, [])

  const filteredItems = useMemo(() =>
    items.filter(sh => {
      const matchSearch = (sh.nameAr || '').includes(q) || (sh.areaAr || '').includes(q) || (sh.phone || '').includes(q)
      const matchStatus = statusFilter === 'all' || sh.fillStatus === statusFilter
      return matchSearch && matchStatus
    }),
    [q, items, statusFilter]
  )

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage))
  const currentTableData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredItems.slice(start, start + itemsPerPage)
  }, [currentPage, filteredItems, itemsPerPage])

  useEffect(() => { setCurrentPage(1) }, [q, statusFilter, itemsPerPage])

  const rangeStart = filteredItems.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const rangeEnd = Math.min(currentPage * itemsPerPage, filteredItems.length)

  const validate = (data: any) => {
    const result = shelterSchema.safeParse(data)
    if (!result.success) {
      const errors: Record<string, string> = {}
      result.error.issues.forEach(issue => { errors[issue.path[0].toString()] = issue.message })
      setFormErrors(errors)
      return false
    }
    setFormErrors({})
    return true
  }

  const onAdd = async () => {
    if (!validate(formData)) return
    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) throw new Error(t('common.messages.saveError'))
      const created = await res.json()
      setItems(prev => [created, ...prev])
      setAddOpen(false)
      setFormData({ nameAr: '', areaAr: 'شمال', supervisorAr: '', phone: '', capacity: 0, fillStatus: 'غير ممتلئ' })
      setCurrentPage(1)
    } catch (err: any) { alert(err.message) }
    finally { setSubmitting(false) }
  }

  const saveEditRow = async (id: string) => {
    if (!validate(editDraft)) return
    try {
      const res = await fetch(`${BASE_URL}?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDraft)
      })
      if (!res.ok) throw new Error(t('common.messages.saveError'))
      const updated = await res.json()
      setItems(prev => prev.map(sh => sh.id === id ? { ...sh, ...updated } : sh))
      setEditingId(null)
    } catch { alert(t('common.messages.error')) }
  }

  return (
    <div className="w-full px-4 py-6">
      <div className="mb-6 text-start">
        <h1 className="text-2xl font-bold text-foreground">{t('pages.shelters.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('nav.dashboard')} &gt; {t('nav.shelters')}</p>
      </div>

      <Card className="overflow-hidden rounded-xl border shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col lg:flex-row gap-4 justify-between border-b">
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('common.messages.searchPlaceholder')} className="pe-9 h-10" />
              </div>
              <select
                className={`${selectClass} h-10 min-w-[130px]`}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="all">{t('pages.shelters.allStatuses')}</option>
                <option value="ممتلئ">{t('pages.shelters.full')}</option>
                <option value="غير ممتلئ">{t('pages.shelters.notFull')}</option>
              </select>
            </div>
            <Button onClick={() => { setFormErrors({}); setAddOpen(true) }} className="bg-blue-600 hover:bg-blue-700 h-10 px-5 gap-2">
              <Plus className="h-4 w-4" /> {t('pages.shelters.addButton')}
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm border-collapse">
              <thead className="bg-muted/40 border-b">
                <tr>
                  <th className="p-4 font-semibold text-muted-foreground">{t('pages.shelters.name')}</th>
                  <th className="p-4 font-semibold text-muted-foreground">{t('pages.shelters.region')}</th>
                  <th className="p-4 font-semibold text-muted-foreground">{t('pages.shelters.supervisor')}</th>
                  <th className="p-4 font-semibold text-muted-foreground">{t('pages.shelters.phone')}</th>
                  <th className="p-4 font-semibold text-muted-foreground">{t('pages.shelters.capacity')}</th>
                  <th className="p-4 text-center font-semibold text-muted-foreground">{t('pages.shelters.status')}</th>
                  <th className="p-4 text-center font-semibold text-muted-foreground">{t('common.labels.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan={7} className="p-16 text-center text-muted-foreground">
                    <Loader2 className="animate-spin inline-block mb-2 size-5" /> {t('common.messages.loading')}
                  </td></tr>
                ) : currentTableData.length === 0 ? (
                  <tr><td colSpan={7} className="p-16 text-center text-muted-foreground italic">{t('common.messages.noData')}</td></tr>
                ) : currentTableData.map((sh) => (
                  <tr key={sh.id} className="transition-colors hover:bg-muted/30">
                    {editingId === sh.id ? (
                      <>
                        <td className="p-2 align-top">
                          <Input value={editDraft.nameAr} onChange={e => setEditDraft({ ...editDraft, nameAr: e.target.value })} className={formErrors.nameAr ? 'border-red-400' : ''} />
                          {formErrors.nameAr && <p className="text-[10px] text-red-500 mt-1">{formErrors.nameAr}</p>}
                        </td>
                        <td className="p-2 align-top">
                          <select className={`${selectClass} h-10`} value={editDraft.areaAr} onChange={e => setEditDraft({ ...editDraft, areaAr: e.target.value as Region })}>
                            {REGIONS_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </td>
                        <td className="p-2 align-top">
                          <Input value={editDraft.supervisorAr} onChange={e => setEditDraft({ ...editDraft, supervisorAr: e.target.value })} className={formErrors.supervisorAr ? 'border-red-400' : ''} />
                          {formErrors.supervisorAr && <p className="text-[10px] text-red-500 mt-1">{formErrors.supervisorAr}</p>}
                        </td>
                        <td className="p-2 align-top">
                          <Input value={editDraft.phone} onChange={e => setEditDraft({ ...editDraft, phone: e.target.value })} className={formErrors.phone ? 'border-red-400' : ''} />
                          {formErrors.phone && <p className="text-[10px] text-red-500 mt-1">{formErrors.phone}</p>}
                        </td>
                        <td className="p-2 align-top">
                          <Input type="number" value={editDraft.capacity} onChange={e => setEditDraft({ ...editDraft, capacity: +e.target.value })} className={formErrors.capacity ? 'border-red-400' : ''} />
                          {formErrors.capacity && <p className="text-[10px] text-red-500 mt-1">{formErrors.capacity}</p>}
                        </td>
                        <td className="p-2 text-center align-top">
                          <select className={`${selectClass} h-9`} value={editDraft.fillStatus} onChange={e => setEditDraft({ ...editDraft, fillStatus: e.target.value as FillStatus })}>
                            <option value="ممتلئ">{t('pages.shelters.full')}</option>
                            <option value="غير ممتلئ">{t('pages.shelters.notFull')}</option>
                          </select>
                        </td>
                        <td className="p-2 align-top pt-3">
                          <div className="flex justify-center gap-1">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 h-9" onClick={() => saveEditRow(sh.id)}><Save className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" className="h-9" onClick={() => { setEditingId(null); setFormErrors({}) }}><X className="h-4 w-4 text-red-500" /></Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 font-medium text-foreground">{sh.nameAr}</td>
                        <td className="p-4 text-muted-foreground">{sh.areaAr}</td>
                        <td className="p-4 text-muted-foreground">{sh.supervisorAr}</td>
                        <td className="p-4 text-muted-foreground" dir="ltr">{sh.phone}</td>
                        <td className="p-4 text-muted-foreground">{sh.capacity}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${sh.fillStatus === 'ممتلئ' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                            {sh.fillStatus === 'ممتلئ' ? t('pages.shelters.full') : t('pages.shelters.notFull')}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => { setEditingId(sh.id); setEditDraft(sh); setFormErrors({}) }}
                            className="rounded-md border p-2 text-muted-foreground transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="h-8 rounded-md border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
              </select>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">{rangeStart} – {rangeEnd} / {filteredItems.length}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>{t('common.buttons.prev')}</Button>
                <Button variant="outline" size="sm" className="h-8" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>{t('common.buttons.next')}</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="text-xl font-bold text-start">{t('pages.shelters.addTitle')}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <label className="text-sm font-semibold text-foreground">{t('pages.shelters.name')}</label>
              <Input value={formData.nameAr} onChange={e => setFormData({ ...formData, nameAr: e.target.value })} className={formErrors.nameAr ? 'border-red-400' : ''} />
              {formErrors.nameAr && <span className="text-xs text-red-500">{formErrors.nameAr}</span>}
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-semibold text-foreground">{t('pages.shelters.region')}</label>
              <select className={`${selectClass} h-11`} value={formData.areaAr} onChange={e => setFormData({ ...formData, areaAr: e.target.value as Region })}>
                {REGIONS_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-semibold text-foreground">{t('pages.shelters.supervisor')}</label>
              <Input value={formData.supervisorAr} onChange={e => setFormData({ ...formData, supervisorAr: e.target.value })} className={formErrors.supervisorAr ? 'border-red-400' : ''} />
              {formErrors.supervisorAr && <span className="text-xs text-red-500">{formErrors.supervisorAr}</span>}
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-semibold text-foreground">{t('pages.shelters.phone')}</label>
              <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="059XXXXXXX" className={formErrors.phone ? 'border-red-400' : ''} />
              {formErrors.phone && <span className="text-xs text-red-500">{formErrors.phone}</span>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <label className="text-sm font-semibold text-foreground">{t('pages.shelters.capacity')}</label>
                <Input type="number" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: +e.target.value })} className={formErrors.capacity ? 'border-red-400' : ''} />
                {formErrors.capacity && <span className="text-xs text-red-500">{formErrors.capacity}</span>}
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-semibold text-foreground">{t('pages.shelters.status')}</label>
                <select className={`${selectClass} h-11`} value={formData.fillStatus} onChange={e => setFormData({ ...formData, fillStatus: e.target.value as FillStatus })}>
                  <option value="ممتلئ">{t('pages.shelters.full')}</option>
                  <option value="غير ممتلئ">{t('pages.shelters.notFull')}</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-row gap-2 w-full mt-2">
            <Button onClick={onAdd} disabled={submitting} className="flex-1 h-11 gap-2 bg-blue-600 hover:bg-blue-700 rounded-xl">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('common.buttons.save')}
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1 h-11 rounded-xl">{t('common.buttons.cancel')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
