'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '../../../../../../components/ui/card'
import { Button } from '../../../../../../components/ui/button'
import { Input } from '../../../../../../components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../../../../components/ui/dialog'
import { 
  Pencil, 
  Plus, 
  Search, 
  Loader2, 
  AlertCircle, 
} from 'lucide-react'

const AREAS_DATA: Record<string, string[]> = {
  'شمال': ['جباليا', 'بيت لاهيا', 'بيت حانون'],
  'جنوب': ['رفح', 'خانيونس'],
  'شرق': ['حي الشجاعية', 'الزيتون'],
  'غرب': ['إيواء الفرقان', 'مخيم الشاطئ', 'تل الهوى']
}

type Camp = {
  id: string
  name: string
  area: string
  subArea: string
  capacity: number
  currentFamiliesCount: number
  status: 'FULL' | 'NOT_FULL'
}

const BASE_URL = '/api/project/camp/camps'
const topControlHeight = 'h-10'
const inputBaseClass = 'w-full min-w-0 rounded-lg border-slate-200 bg-white text-right text-xs sm:text-sm outline-none focus:!ring-2 focus:!ring-slate-100 font-normal'
const selectBaseClass = 'w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-right text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-100 font-normal'

export default function CampsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Camp[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'FULL' | 'NOT_FULL'>('all')

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5) 

  const [addOpen, setAddOpen] = useState(false)
  const [name, setName] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [selectedSubArea, setSelectedSubArea] = useState('')
  const [capacity, setCapacity] = useState<number>(0)
  const [currentFamiliesCount, setCurrentFamiliesCount] = useState<number>(0)
  const [submitting, setSubmitting] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Omit<Camp, 'id' | 'status'>>({
    name: '', area: '', subArea: '', capacity: 0, currentFamiliesCount: 0
  })

  const fetchCamps = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL)
      const data = await res.json()
      setItems(data)
    } catch (err) { console.error('Fetch error:', err) } 
    finally { setLoading(false) }
  }

  useEffect(() => { fetchCamps() }, [])

  const isEditValid = useMemo(() => {
    return editDraft.name.trim() !== '' && editDraft.area !== '' && editDraft.subArea !== '' && editDraft.capacity > 0
  }, [editDraft])

  const isAddValid = useMemo(() => {
    return name.trim() !== '' && selectedArea !== '' && selectedSubArea !== '' && capacity > 0
  }, [name, selectedArea, selectedSubArea, capacity])

  const onAdd = async () => {
    if (!isAddValid) return
    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, area: selectedArea, subArea: selectedSubArea,
          capacity: Number(capacity), currentFamiliesCount: Number(currentFamiliesCount)
        })
      })
      if (res.ok) {
        await fetchCamps()
        setAddOpen(false)
        resetAddForm()
        setCurrentPage(1)
      }
    } finally { setSubmitting(false) }
  }

  const saveEditRow = async (id: string) => {
    if (!isEditValid) return
    try {
      const res = await fetch(`${BASE_URL}?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editDraft.name, area: editDraft.area, subArea: editDraft.subArea,
          capacity: Number(editDraft.capacity), currentFamiliesCount: Number(editDraft.currentFamiliesCount)
        })
      })
      if (res.ok) {
        await fetchCamps()
        setEditingId(null)
      }
    } catch (err) { console.error(err) }
  }

  const resetAddForm = () => {
    setName(''); setSelectedArea(''); setSelectedSubArea(''); setCapacity(0); setCurrentFamiliesCount(0);
  }

  const filtered = useMemo(() => {
    return items.filter((c) => {
      const matchSearch = !q || c.name.includes(q) || (c.area || '').includes(q)
      const isFull = c.currentFamiliesCount >= c.capacity
      const matchStatus = statusFilter === 'all' ? true : statusFilter === 'FULL' ? isFull : !isFull
      return matchSearch && matchStatus
    })
  }, [q, items, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage, itemsPerPage])

  useEffect(() => { setCurrentPage(1) }, [q, statusFilter, itemsPerPage])

  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const rangeEnd = Math.min(currentPage * itemsPerPage, filtered.length)

  return (
    <div className="w-full px-2 sm:px-4 py-6" dir="rtl">
      <div className="mb-6 text-right">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">إدارة المخيمات</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">الرئيسية &gt; إدارة المخيمات</p>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl bg-white">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col lg:flex-row items-center gap-3 border-b">
            <div className="relative w-full lg:max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث..."
                className={`${inputBaseClass} ${topControlHeight} pr-10 bg-slate-50 border-none`}
              />
            </div>
            
            <div className="flex w-full lg:w-auto gap-2 items-center lg:ml-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className={`${selectBaseClass} ${topControlHeight} flex-1 lg:w-[130px] bg-slate-50 border-slate-200`}
              >
                <option value="all">كل الحالات</option>
                <option value="FULL">ممتلئ</option>
                <option value="NOT_FULL">غير ممتلئ</option>
              </select>
            </div>

            <Button
              onClick={() => setAddOpen(true)}
              className={`bg-blue-600 text-white hover:bg-blue-700 ${topControlHeight} px-4 rounded-lg mr-auto shadow-sm w-full lg:w-auto`}
            >
              <Plus className="h-4 w-4 ml-2" />
              <span className="text-xs sm:text-sm">إضافة مخيم</span>
            </Button>
          </div>

          <div className="overflow-x-auto overflow-y-auto max-h-[420px] scrollbar-thin scrollbar-thumb-slate-200">
            <table className="w-full text-right border-collapse text-xs sm:text-sm relative min-w-[700px]">
              <thead className="bg-slate-50/90 border-b border-slate-100 sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="p-3 sm:p-4 text-slate-500 font-bold">اسم المخيم</th>
                  <th className="p-3 sm:p-4 text-slate-500 font-bold hidden md:table-cell">المنطقة</th>
                  <th className="p-3 sm:p-4 text-slate-500 font-bold">الموقع</th>
                  <th className="p-3 sm:p-4 text-center text-slate-500 font-bold">السعة</th>
                  <th className="p-3 sm:p-4 text-center text-slate-500 font-bold">الحالي</th>
                  <th className="p-3 sm:p-4 text-center text-slate-500 font-bold">الحالة</th>
                  <th className="p-3 sm:p-4 text-center text-slate-500 font-bold">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-arabic">
                {loading ? (
                  <tr><td colSpan={7} className="p-20 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />جاري التحميل...</td></tr>
                ) : paginatedData.length === 0 ? (
                  <tr><td colSpan={7} className="p-20 text-center text-slate-400 italic">لا توجد نتائج مطابقة لبحثك.</td></tr>
                ) : paginatedData.map((c) => {
                  const isEditing = editingId === c.id;
                  return (
                    <tr key={c.id} className={`hover:bg-slate-50/50 transition-colors ${isEditing ? 'bg-blue-50/40' : ''}`}>
                      <td className="p-3 sm:p-4">{isEditing ? <Input className="h-9 border-blue-400 text-xs sm:text-sm" value={editDraft.name} onChange={e => setEditDraft({...editDraft, name: e.target.value})} /> : c.name}</td>
                      <td className="p-3 sm:p-4 hidden md:table-cell">{isEditing ? (
                        <select className={`${selectBaseClass} h-9 border-blue-400`} value={editDraft.area} onChange={e => setEditDraft({...editDraft, area: e.target.value, subArea: ''})}>
                          <option value="">اختر..</option>
                          {Object.keys(AREAS_DATA).map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      ) : c.area}</td>
                      <td className="p-3 sm:p-4">{isEditing ? (
                        <select className={`${selectBaseClass} h-9 border-blue-400`} value={editDraft.subArea} onChange={e => setEditDraft({...editDraft, subArea: e.target.value})} disabled={!editDraft.area}>
                          <option value="">اختر..</option>
                          {editDraft.area && AREAS_DATA[editDraft.area].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : c.subArea}</td>
                      <td className="p-3 sm:p-4 text-center">{isEditing ? <Input type="number" className="h-9 w-16 sm:w-20 mx-auto border-blue-400 text-center" value={editDraft.capacity || ''} onChange={e => setEditDraft({...editDraft, capacity: Number(e.target.value)})} /> : c.capacity}</td>
                      <td className="p-3 sm:p-4 text-center">{isEditing ? <Input type="number" className="h-9 w-16 sm:w-20 mx-auto border-blue-400 text-center" value={editDraft.currentFamiliesCount || ''} onChange={e => setEditDraft({...editDraft, currentFamiliesCount: Number(e.target.value)})} /> : c.currentFamiliesCount}</td>
                      <td className="p-3 sm:p-4 text-center">
                        <span className={`px-2 py-1 rounded-md text-[9px] sm:text-[10px] font-bold ${c.currentFamiliesCount >= c.capacity ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {c.currentFamiliesCount >= c.capacity ? 'ممتلئ' : 'متاح'}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 text-center">
                        {isEditing ? (
                          <div className="flex gap-1 justify-center">
                            <Button size="sm" onClick={() => saveEditRow(c.id)} disabled={!isEditValid} className={!isEditValid ? 'opacity-40 grayscale' : 'bg-green-600 text-white h-8 text-[10px] sm:text-xs'}>حفظ</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8 text-[10px] sm:text-xs">إلغاء</Button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingId(c.id); setEditDraft(c); }} className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-md border border-slate-100 text-slate-400 transition-all">
                            <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4"/>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t bg-slate-50/30 font-arabic">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 order-2 sm:order-1">
              <span>عرض صفوف:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => setItemsPerPage(Number(e.target.value))} 
                className="border rounded-md h-8 px-1 bg-white outline-none cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
              </select>
            </div>

            <div className="flex items-center gap-4 text-xs sm:text-sm order-1 sm:order-2">
              <span className="text-slate-500 font-medium">
                {rangeStart} - {rangeEnd} <span className="mx-1 text-slate-300">|</span> من {filtered.length}
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-2 sm:px-3 border-slate-200 hover:bg-white font-normal" 
                  disabled={currentPage <= 1} 
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  السابق
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-2 sm:px-3 border-slate-200 hover:bg-white font-normal" 
                  disabled={currentPage >= totalPages} 
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  التالي
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="w-[95%] sm:max-w-md shadow-2xl border-none rounded-2xl font-arabic p-4 sm:p-6 overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-right text-lg font-bold">إضافة مخيم جديد</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4 text-right">
            {/* الحقول الآن تأتي في سطر واحد لكل منها باستخدام flex-col الافتراضي */}
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">اسم المخيم</label>
               <Input className="h-10 sm:h-11 bg-slate-50 border-slate-200" value={name} onChange={e => setName(e.target.value)} placeholder="أدخل اسم المخيم" />
            </div>
            
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">المنطقة</label>
               <select className={`${selectBaseClass} h-10 sm:h-11 bg-slate-50 border-slate-200`} value={selectedArea} onChange={e => {setSelectedArea(e.target.value); setSelectedSubArea('')}}>
                  <option value="">اختر المنطقة</option>
                  {Object.keys(AREAS_DATA).map(a => <option key={a} value={a}>{a}</option>)}
               </select>
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">الموقع</label>
               <select className={`${selectBaseClass} h-10 sm:h-11 bg-slate-50 border-slate-200`} value={selectedSubArea} onChange={e => setSelectedSubArea(e.target.value)} disabled={!selectedArea}>
                  <option value="">اختر الموقع</option>
                  {selectedArea && AREAS_DATA[selectedArea].map(s => <option key={s} value={s}>{s}</option>)}
               </select>
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">السعة القصوى</label>
               <Input className="h-10 sm:h-11 bg-slate-50 border-slate-200" type="number" placeholder="0" value={capacity || ''} onChange={e => setCapacity(Number(e.target.value))} />
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">العائلات حالياً</label>
               <Input className="h-10 sm:h-11 bg-slate-50 border-slate-200" type="number" placeholder="0" value={currentFamiliesCount || ''} onChange={e => setCurrentFamiliesCount(Number(e.target.value))} />
            </div>

            {!isAddValid && (
              <div className="text-[10px] text-amber-600 flex items-center gap-2 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                <AlertCircle className="w-3.5 h-3.5 shrink-0"/> يرجى إكمال الحقول الإلزامية لحفظ البيانات.
              </div>
            )}
          </div>
          
          <DialogFooter className="mt-2 flex flex-col sm:flex-row items-center gap-3 w-full">
            <Button 
              onClick={onAdd} 
              disabled={submitting || !isAddValid} 
              className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 sm:h-11 rounded-xl"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null} حفظ البيانات
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setAddOpen(false)} 
              className="w-full sm:flex-1 h-10 sm:h-11 font-normal text-slate-600 bg-white hover:bg-slate-50 border-slate-200 rounded-xl"
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}