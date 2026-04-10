'use client'

import {useEffect, useMemo, useState, type ChangeEvent} from 'react'
import {Card, CardContent} from '../../../../../components/ui/card'
import {Button} from '../../../../../components/ui/button'
import {Input} from '../../../../../components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../../../components/ui/dialog'
import {Pencil, Save, X, Plus, Search} from 'lucide-react'

type ClinicStatus = 'مفتوحة' | 'مغلقة'

type Clinic = {
  id: string
  nameAr: string
  specialtyAr: string
  capacityPerDay: number
  status: ClinicStatus
}

type FieldErrors = Partial<Record<'nameAr' | 'specialtyAr' | 'capacityPerDay' | 'status', string>>

// خيارات التخصصات المقترحة لمشاريع الإغاثة
const SPECIALTIES = [
  'طب عام',
  'أطفال',
  'نساء وتوليد',
  'طوارئ',
  'صحة نفسية',
  'تغذية علاجية',
  'طب أسنان',
  'باطنية',
  'أمراض جلدية',
  'علاج طبيعي',
  'مختبر',
  'صيدلية'
]

const clinicsSeed: Clinic[] = []

const toIntOnly = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

const normalizeText = (value: string) => value.trim().toLocaleLowerCase()

export default function ClinicsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Clinic[]>(clinicsSeed)
  const [statusFilter, setStatusFilter] = useState<'الكل' | 'مفتوحة' | 'مغلقة'>('الكل')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [addOpen, setAddOpen] = useState(false)
  const [nameAr, setNameAr] = useState('')
  const [specialtyAr, setSpecialtyAr] = useState('طب عام')
  const [capacityPerDay, setCapacityPerDay] = useState<number>(0)
  const [status, setStatus] = useState<ClinicStatus>('مفتوحة')
  const [addFieldErrors, setAddFieldErrors] = useState<FieldErrors>({})

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    nameAr: string
    specialtyAr: string
    capacityPerDay: number
    status: ClinicStatus
  }>({
    nameAr: '',
    specialtyAr: 'طب عام',
    capacityPerDay: 1,
    status: 'مفتوحة',
  })

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const topControlHeight = 'h-10 sm:h-11'
  const fixedIconButtonClass = 'inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg border'
  const tableBtnClass = 'h-9 sm:h-10 rounded-lg px-3 sm:px-4 text-xs sm:text-sm font-semibold'
  const inputBaseClass = 'w-full rounded-lg border-slate-200 bg-white text-right text-xs sm:text-sm outline-none focus:ring-2'

  const fetchClinics = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/project/projects/clinic', { method: 'GET', cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'فشل في جلب البيانات')
      setItems(Array.isArray(data) ? data : [])
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchClinics() }, [])

  const filtered = useMemo(() => {
    const s = q.trim()
    return items.filter((c) => {
      const matchSearch = !s || c.nameAr.includes(s) || c.specialtyAr.includes(s)
      const matchStatus = statusFilter === 'الكل' || c.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [q, items, statusFilter])

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const onAdd = async () => {
    if (!nameAr.trim()) {
      setAddFieldErrors({ nameAr: 'اسم العيادة مطلوب' })
      return
    }
    try {
      setSubmitting(true)
      const res = await fetch('/api/project/projects/clinic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameAr: nameAr.trim(), specialtyAr, capacityPerDay, status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'فشلت الإضافة')
      setItems((prev) => [data, ...prev])
      setAddOpen(false)
      setNameAr('')
      setSpecialtyAr('طب عام')
      setCapacityPerDay(0)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'خطأ أثناء الإضافة')
    } finally {
      setSubmitting(false)
    }
  }

  const saveEditRow = async (id: string) => {
    try {
      setSubmitting(true)
      const res = await fetch(`/api/project/projects/clinic?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDraft),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'فشل التعديل')
      setItems((prev) => prev.map((c) => (c.id === id ? data : c)))
      setEditingId(null)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'خطأ أثناء التعديل')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full px-2 py-3 sm:px-4 sm:py-5 lg:px-6" dir="rtl">
      <div className="mb-6 text-right">
        <div className="text-xl font-semibold text-foreground lg:text-2xl">العيادات</div>
        <div className="text-sm text-muted-foreground">الرئيسية {'>'} <span className="text-foreground">إدارة العيادات</span></div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative min-w-[220px]">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن عيادة..." className="pr-9 h-10" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="h-10 border rounded-md px-2 text-sm bg-white">
                <option value="الكل">كل الحالات</option>
                <option value="مفتوحة">مفتوحة</option>
                <option value="مغلقة">مغلقة</option>
              </select>
            </div>
            <Button className="!bg-blue-600 hover:!bg-blue-700 text-white h-10" onClick={() => setAddOpen(true)}>
              <Plus className="ms-1 h-4 w-4" /> إضافة عيادة
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-[700px]">
              <thead className="bg-[#F9FAFB] border-b">
                <tr>
                  <th className="px-4 py-4 font-medium">اسم العيادة</th>
                  <th className="px-4 py-4 font-medium">التخصص</th>
                  <th className="px-4 py-4 font-medium">السعة اليومية</th>
                  <th className="px-4 py-4 font-medium text-center">الحالة</th>
                  <th className="px-4 py-4 font-medium text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((c) => {
                  const isEditing = editingId === c.id
                  return (
                    <tr key={c.id} className="hover:bg-muted/30 border-b last:border-0">
                      <td className="px-4 py-4">
                        {isEditing ? <Input value={editDraft.nameAr} onChange={(e) => setEditDraft({...editDraft, nameAr: e.target.value})} /> : c.nameAr}
                      </td>
                      <td className="px-4 py-4">
                        {isEditing ? (
                          <select 
                            value={editDraft.specialtyAr} 
                            onChange={(e) => setEditDraft({...editDraft, specialtyAr: e.target.value})}
                            className="w-full h-10 rounded-md border border-input bg-background px-3"
                          >
                            {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        ) : c.specialtyAr}
                      </td>
                      <td className="px-4 py-4">
                        {isEditing ? <Input type="text" value={String(editDraft.capacityPerDay)} onChange={(e) => setEditDraft({...editDraft, capacityPerDay: toIntOnly(e.target.value)})} /> : c.capacityPerDay}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${c.status === 'مفتوحة' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {!isEditing ? (
                            <button onClick={() => { setEditingId(c.id); setEditDraft(c); }} className={fixedIconButtonClass}><Pencil className="size-4" /></button>
                          ) : (
                            <>
                              <Button onClick={() => saveEditRow(c.id)} size="sm" className="h-9"><Save className="size-4 ms-1" /> حفظ</Button>
                              <Button variant="outline" onClick={() => setEditingId(null)} size="sm" className="h-9"><X className="size-4 ms-1" /> إلغاء</Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="text-right">
          <DialogHeader><DialogTitle>إضافة عيادة جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">اسم العيادة</label>
              <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="اسم العيادة" />
              {addFieldErrors.nameAr && <p className="text-xs text-red-500">{addFieldErrors.nameAr}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">التخصص</label>
              <select
                value={specialtyAr}
                onChange={(e) => setSpecialtyAr(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">السعة اليومية</label>
              <Input type="text" value={String(capacityPerDay)} onChange={(e) => setCapacityPerDay(toIntOnly(e.target.value))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">الحالة</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as ClinicStatus)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="مفتوحة">مفتوحة</option>
                <option value="مغلقة">مغلقة</option>
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button onClick={onAdd} disabled={submitting}>إضافة</Button>
            <Button variant="outline" onClick={() => setAddOpen(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}