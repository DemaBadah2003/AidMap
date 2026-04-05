'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '../../../../../components/ui/card'
import { Button } from '../../../../../components/ui/button'
import { Input } from '../../../../../components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../../../components/ui/dialog'

import { Pencil, Save, X, Plus, Search, Trash2, Loader2 } from 'lucide-react'

// بيانات المناطق والمحافظات الثابتة
const AREAS_DATA: Record<string, string[]> = {
  'شمال': ['جباليا', 'بيت لاهيا', 'بيت حانون'],
  'جنوب': ['رفح', 'خانيونس'],
  'شرق': ['حي الشجاعية', 'الزيتون'],
  'غرب': ['إيواء الفرقان', 'مخيم الشاطئ', 'تل الهوى']
}

type Camp = {
  id: string
  nameAr: string
  areaAr: string
  subAreaAr: string
  capacity: number
  currentFamilies: number
}

const BASE_URL = '/api/project/projects/camps'

// --- التنسيقات الموحدة ---
const topControlHeight = 'h-10 sm:h-11'
const fixedButtonClass = 'h-10 sm:h-11 min-w-[130px] px-5 rounded-lg text-sm font-medium shrink-0 shadow-sm'
const fixedIconButtonClass = 'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors'
const selectBaseClass = 'w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-right text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-200'
const inputBaseClass = 'w-full min-w-0 rounded-lg border-slate-200 bg-white text-right text-xs sm:text-sm outline-none focus:!ring-2 focus:!ring-slate-200'

export default function CampsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Camp[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'full' | 'notfull'>('all')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // حقول الإضافة
  const [addOpen, setAddOpen] = useState(false)
  const [nameAr, setNameAr] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [selectedSubArea, setSelectedSubArea] = useState('')
  const [capacity, setCapacity] = useState<number>(0)
  const [currentFamilies, setCurrentFamilies] = useState<number>(0)
  const [submitting, setSubmitting] = useState(false)

  // حقول التعديل
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Omit<Camp, 'id'>>({
    nameAr: '',
    areaAr: '',
    subAreaAr: '',
    capacity: 0,
    currentFamilies: 0
  })

  // 1. جلب البيانات من السكيما (GET)
  const fetchCamps = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setItems(data.map((x: any) => ({
        id: x.id,
        nameAr: x.name,
        areaAr: x.area || '',
        subAreaAr: x.subArea || '',
        capacity: x.capacity || 0,
        currentFamilies: x.currentFamiliesCount || 0,
      })))
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCamps() }, [])

  // 2. إضافة مخيم جديد (POST)
  const onAdd = async () => {
    if (!nameAr || !selectedArea || !selectedSubArea || capacity <= 0) {
      alert('يرجى إكمال جميع البيانات بشكل صحيح')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameAr,
          area: selectedArea,
          subArea: selectedSubArea,
          capacity: capacity,
          currentFamiliesCount: currentFamilies
        })
      })

      if (res.ok) {
        await fetchCamps() // إعادة جلب البيانات لتحديث القائمة
        setAddOpen(false)
        resetAddForm()
      }
    } catch (err) {
      console.error('Add error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // 3. تحديث بيانات مخيم (PATCH)
  const saveEditRow = async (id: string) => {
    const { nameAr, areaAr, subAreaAr, capacity, currentFamilies } = editDraft
    if (!nameAr.trim() || !areaAr.trim() || !subAreaAr.trim() || capacity <= 0) {
      alert('يرجى ملء كافة الحقول بشكل صحيح')
      return
    }

    try {
      const res = await fetch(`${BASE_URL}?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameAr,
          area: areaAr,
          subArea: subAreaAr,
          capacity: capacity,
          currentFamiliesCount: currentFamilies
        })
      })

      if (res.ok) {
        setItems(prev => prev.map(c => c.id === id ? { ...c, ...editDraft } : c))
        setEditingId(null)
      }
    } catch (err) {
      console.error('Save error:', err)
    }
  }

  // 4. حذف مخيم (DELETE)
  const onDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المخيم نهائياً؟')) return

    try {
      const res = await fetch(`${BASE_URL}?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setItems(prev => prev.filter(c => c.id !== id))
      }
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const startEditRow = (c: Camp) => {
    setEditingId(c.id)
    setEditDraft({
      nameAr: c.nameAr,
      areaAr: c.areaAr,
      subAreaAr: c.subAreaAr,
      capacity: c.capacity,
      currentFamilies: c.currentFamilies
    })
  }

  const resetAddForm = () => {
    setNameAr(''); setSelectedArea(''); setSelectedSubArea(''); setCapacity(0); setCurrentFamilies(0);
  }

  const filtered = useMemo(() => {
    return items.filter((c) => {
      const matchSearch = !q || c.nameAr.includes(q) || c.areaAr.includes(q) || c.subAreaAr.includes(q)
      const isFull = c.currentFamilies >= c.capacity
      const matchStatus = statusFilter === 'all' ? true : statusFilter === 'full' ? isFull : !isFull
      return matchSearch && matchStatus
    })
  }, [q, items, statusFilter])

  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, filtered.length)

  return (
    <div className="w-full px-4 py-6" dir="rtl">
      <div className="mb-6 flex justify-between items-end">
        <div className="text-right">
          <h1 className="text-2xl font-bold text-black">إدارة المخيمات</h1>
          <p className="text-sm text-slate-500 mt-1">النظام التلقائي لحساب استيعاب المخيمات (مرتبط بقاعدة البيانات)</p>
        </div>
        <Button
          className={`!bg-blue-600 !text-white hover:!bg-blue-700 ${fixedButtonClass}`}
          onClick={() => setAddOpen(true)}
        >
          <Plus className="ml-2 h-5 w-5" /> إضافة مخيم
        </Button>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row gap-4 border-b bg-white">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث عن مخيم أو منطقة..."
                className={`${inputBaseClass} ${topControlHeight} pr-10`}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={`${selectBaseClass} ${topControlHeight} sm:w-[160px]`}
            >
              <option value="all">كل الحالات</option>
              <option value="full">ممتلئ</option>
              <option value="notfull">غير ممتلئ</option>
            </select>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p>جاري تحميل البيانات...</p>
              </div>
            ) : (
              <table className="w-full text-right border-collapse">
                <thead className="bg-slate-50 text-slate-600 text-xs font-bold border-b">
                  <tr>
                    <th className="p-4">اسم المخيم</th>
                    <th className="p-4">المنطقة</th>
                    <th className="p-4">الموقع</th>
                    <th className="p-4 text-center">السعة القصوى</th>
                    <th className="p-4 text-center">العائلات الحالية</th>
                    <th className="p-4 text-center">الحالة</th>
                    <th className="p-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="text-sm bg-white divide-y divide-slate-100">
                  {filtered.slice((page - 1) * pageSize, page * pageSize).map((c) => {
                    const isEditing = editingId === c.id;
                    const currentCap = isEditing ? editDraft.capacity : c.capacity;
                    const currentFam = isEditing ? editDraft.currentFamilies : c.currentFamilies;
                    const isFull = currentFam >= currentCap && currentCap > 0;

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          {isEditing ? (
                            <Input className="h-9" value={editDraft.nameAr} onChange={e => setEditDraft({...editDraft, nameAr: e.target.value})} />
                          ) : (
                            <span className="font-semibold text-slate-900">{c.nameAr}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {isEditing ? (
                            <select className={`${selectBaseClass} h-9`} value={editDraft.areaAr} onChange={e => setEditDraft({...editDraft, areaAr: e.target.value, subAreaAr: ''})}>
                              <option value="">اختر المنطقة</option>
                              {Object.keys(AREAS_DATA).map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                          ) : c.areaAr}
                        </td>
                        <td className="p-4">
                          {isEditing ? (
                            <select className={`${selectBaseClass} h-9`} value={editDraft.subAreaAr} onChange={e => setEditDraft({...editDraft, subAreaAr: e.target.value})}>
                              <option value="">اختر الموقع</option>
                              {AREAS_DATA[editDraft.areaAr]?.map(sa => <option key={sa} value={sa}>{sa}</option>)}
                            </select>
                          ) : c.subAreaAr}
                        </td>
                        <td className="p-4 text-center font-mono">
                          {isEditing ? (
                            <Input type="number" className="h-9 w-24 mx-auto text-center" value={editDraft.capacity} onChange={e => setEditDraft({...editDraft, capacity: Number(e.target.value)})} />
                          ) : c.capacity}
                        </td>
                        <td className="p-4 text-center font-mono">
                          {isEditing ? (
                            <Input type="number" className="h-9 w-24 mx-auto text-center" value={editDraft.currentFamilies} onChange={e => setEditDraft({...editDraft, currentFamilies: Number(e.target.value)})} />
                          ) : c.currentFamilies}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${isFull ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                            {isFull ? 'ممتلئ' : 'متاح'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-2">
                            {!isEditing ? (
                              <>
                                <button onClick={() => startEditRow(c)} className={fixedIconButtonClass} title="تعديل">
                                  <Pencil className="w-4 h-4 text-slate-500" />
                                </button>
                                <button onClick={() => onDelete(c.id)} className={`${fixedIconButtonClass} hover:bg-red-50 hover:border-red-200`} title="حذف">
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              </>
                            ) : (
                              <>
                                <Button size="sm" onClick={() => saveEditRow(c.id)} className="bg-black text-white hover:bg-zinc-800 h-9 px-4">
                                  <Save className="w-4 h-4 ml-1" /> حفظ
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="h-9 px-4 border-slate-200">
                                  <X className="w-4 h-4 ml-1" /> إلغاء
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="p-4 border-t bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">عرض {rangeStart} - {rangeEnd} من {filtered.length}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs border-slate-200 bg-white" onClick={() => setPage(p => p - 1)} disabled={page === 1}>السابق</Button>
              <Button variant="outline" size="sm" className="h-8 text-xs border-slate-200 bg-white" onClick={() => setPage(p => p + 1)} disabled={rangeEnd >= filtered.length}>التالي</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* نافذة الإضافة */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl" dir="rtl">
          <DialogHeader className="p-6 bg-blue-600">
            <DialogTitle className="text-lg font-bold text-white text-right">إضافة مخيم جديد للسكيما</DialogTitle>
          </DialogHeader>
          <div className="p-6 grid gap-5 bg-white">
            <div className="grid gap-1.5 text-right">
              <label className="text-xs font-bold text-black uppercase">اسم المخيم</label>
              <Input value={nameAr} onChange={e => setNameAr(e.target.value)} placeholder="مثال: مخيم الأمل" className="h-11" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5 text-right">
                <label className="text-xs font-bold text-black">المنطقة</label>
                <select className={`${selectBaseClass} h-11`} value={selectedArea} onChange={e => { setSelectedArea(e.target.value); setSelectedSubArea(''); }}>
                  <option value="">اختر...</option>
                  {Object.keys(AREAS_DATA).map(area => <option key={area} value={area}>{area}</option>)}
                </select>
              </div>
              <div className="grid gap-1.5 text-right">
                <label className="text-xs font-bold text-black">الموقع</label>
                <select className={`${selectBaseClass} h-11`} value={selectedSubArea} disabled={!selectedArea} onChange={e => setSelectedSubArea(e.target.value)}>
                  <option value="">اختر...</option>
                  {selectedArea && AREAS_DATA[selectedArea].map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="grid gap-1.5 text-right">
                <label className="text-xs font-bold text-black">السعة الإجمالية</label>
                <Input type="number" value={capacity || ''} onChange={e => setCapacity(Number(e.target.value))} className="h-11 text-center" />
              </div>
              <div className="grid gap-1.5 text-right">
                <label className="text-xs font-bold text-black">الموجود حالياً</label>
                <Input type="number" value={currentFamilies || ''} onChange={e => setCurrentFamilies(Number(e.target.value))} className="h-11 text-center" />
              </div>
            </div>
          </div>
          <DialogFooter className="p-4 bg-slate-50 flex justify-end gap-3 border-t">
            <Button variant="ghost" onClick={() => setAddOpen(false)} className="h-11 px-6">إلغاء</Button>
            <Button className="h-11 px-10 bg-blue-600 text-white hover:bg-blue-700" onClick={onAdd} disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'حفظ في قاعدة البيانات'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}