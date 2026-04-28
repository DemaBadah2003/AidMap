'use client'

import { useEffect, useMemo, useState } from 'react'
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
import { 
  Pencil, Plus, Search, MapPin, AlertCircle, Check, X, Loader2, ChevronRight, ChevronLeft
} from 'lucide-react'

// --- شروط التحقق الصارمة (Zod Schema) ---
const shelterSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'اسم المركز مطلوب')
    .refine((val) => val.split(/\s+/).filter(Boolean).length >= 4, { 
      message: 'يجب أن يكون الاسم رباعياً على الأقل' 
    }),
  area: z.string().min(1, 'المنطقة مطلوبة'),
  phone: z.string()
    .trim()
    .regex(/^(056|059)\d{7}$/, 'يجب أن يبدأ بـ 056 أو 059 ويتبعه 7 أرقام'),
  capacity: z.coerce.number()
    .int()
    .min(1, 'السعة يجب أن تكون أكبر من 0'),
  familiesCount: z.coerce.number()
    .int()
    .nonnegative('عدد العائلات لا يمكن أن يكون سالباً'),
})

const REGIONS_OPTIONS = ['شرق', 'غرب', 'شمال', 'جنوب'] as const;
const statusDisplay = { 'FULL': 'ممتلئ', 'NOT_FULL': 'غير ممتلئ' }
const BASE_URL = '/api/project/camp/shelter'

export default function SheltersPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [responseError, setResponseError] = useState('')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  // In-line Edit States
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState({ name: '', area: '', phone: '', capacity: 0, familiesCount: 0 })
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  // Add States
  const [addOpen, setAddOpen] = useState(false)
  const [addFormData, setAddFormData] = useState({ name: '', area: 'شمال', phone: '', capacity: 1, familiesCount: 0 })
  const [addErrors, setAddErrors] = useState<Record<string, string>>({})
  const [adding, setAdding] = useState(false)

  const fetchShelters = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL)
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) { setResponseError('فشل تحميل البيانات') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchShelters() }, [])

  // --- دالة حفظ التعديل المباشر ---
  const onInLineSave = async (id: string) => {
    const result = shelterSchema.safeParse(editFormData)
    if (!result.success) {
      const errors: Record<string, string> = {}
      result.error.issues.forEach(i => { errors[i.path[0].toString()] = i.message })
      setEditErrors(errors); return
    }
    
    setSavingId(id); setResponseError(''); setEditErrors({})
    try {
      const res = await fetch(`${BASE_URL}?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'فشل التحديث')
      await fetchShelters(); setEditingId(null)
    } catch (err: any) { setResponseError(err.message) }
    finally { setSavingId(null) }
  }

  // --- دالة إضافة مركز جديد ---
  const onAdd = async () => {
    const result = shelterSchema.safeParse(addFormData)
    if (!result.success) {
      const errors: Record<string, string> = {}
      result.error.issues.forEach(i => { errors[i.path[0].toString()] = i.message })
      setAddErrors(errors); return
    }

    setAdding(true); setResponseError(''); setAddErrors({})
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'فشل الإضافة (ربما البيانات مكررة)')
      await fetchShelters(); setAddOpen(false)
      setAddFormData({ name: '', area: 'شمال', phone: '', capacity: 1, familiesCount: 0 })
    } catch (err: any) { setResponseError(err.message) }
    finally { setAdding(false) }
  }

  const filteredItems = useMemo(() => {
    return items.filter((item: any) => {
      const matchesSearch = item.name.toLowerCase().includes(q.toLowerCase()) || item.phone.includes(q);
      const matchesStatus = statusFilter === 'ALL' || item.fillStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, q, statusFilter]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredItems.length / pageSize);

  return (
    <div className="w-full px-4 py-8 font-sans" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">إدارة مراكز الإيواء</h1>
        <p className="text-slate-500 mt-1 text-sm">تتبع سعة مراكز النزوح والمناطق مع التدقيق في البيانات</p>
      </div>

      {responseError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3 text-sm mb-6">
          <AlertCircle size={20} /> <p className="font-bold">{responseError}</p>
        </div>
      )}

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="flex flex-1 items-center gap-3 w-full">
              <div className="relative w-full max-w-sm">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input placeholder="بحث باسم المركز أو الهاتف..." className="pr-10 bg-white" value={q} onChange={(e) => {setQ(e.target.value); setCurrentPage(1);}} />
              </div>
              <select className="border rounded-md px-3 h-10 text-sm bg-white" value={statusFilter} onChange={(e) => {setStatusFilter(e.target.value); setCurrentPage(1);}}>
                <option value="ALL">كل الحالات</option>
                <option value="NOT_FULL">غير ممتلئ</option>
                <option value="FULL">ممتلئ</option>
              </select>
           </div>
           <Button onClick={() => setAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-10">
             <Plus size={18} /> إضافة مركز جديد
           </Button>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto overflow-y-auto max-h-[450px]">
            <table className="w-full text-right border-collapse sticky top-0">
              <thead className="bg-slate-100/80 text-slate-600 text-sm border-b sticky top-0 z-10">
                <tr>
                  <th className="p-4 font-bold text-right min-w-[220px]">اسم المركز</th>
                  <th className="p-4 font-bold text-right min-w-[120px]">المنطقة</th>
                  <th className="p-4 font-bold text-center">السعة</th>
                  <th className="p-4 font-bold text-center">العائلات</th>
                  <th className="p-4 font-bold text-right">الحالة</th>
                  <th className="p-4 font-bold text-center">تعديل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr><td colSpan={6} className="p-10 text-center text-slate-400">جاري التحميل...</td></tr>
                ) : paginatedItems.map((item: any) => {
                  const isEditing = editingId === item.id;
                  const isSaving = savingId === item.id;
                  return (
                    <tr key={item.id} className={`${isEditing ? 'bg-blue-50/50' : 'hover:bg-blue-50/10'}`}>
                      <td className="p-3">
                        {isEditing ? (
                          <div className="space-y-1">
                            <Input value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} className={`h-9 ${editErrors.name ? 'border-red-500' : ''}`} />
                            {editErrors.name && <p className="text-[10px] text-red-600 font-bold">{editErrors.name}</p>}
                          </div>
                        ) : <span className="font-bold text-slate-800">{item.name}</span>}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <select className="w-full border h-9 rounded-md text-sm bg-white" value={editFormData.area} onChange={(e) => setEditFormData({...editFormData, area: e.target.value})}>
                            {REGIONS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : <span className="text-slate-600 flex items-center gap-1.5"><MapPin size={14} className="text-blue-500" /> {item.area}</span>}
                      </td>
                      <td className="p-3 text-center">{isEditing ? <Input type="number" value={editFormData.capacity} onChange={(e) => setEditFormData({...editFormData, capacity: e.target.value as any})} className="h-9 w-20 text-center mx-auto" /> : item.capacity}</td>
                      <td className="p-3 text-center">{isEditing ? <Input type="number" value={editFormData.familiesCount} onChange={(e) => setEditFormData({...editFormData, familiesCount: e.target.value as any})} className="h-9 w-20 text-center mx-auto" /> : item.familiesCount}</td>
                      <td className="p-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.fillStatus === 'FULL' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {statusDisplay[item.fillStatus as keyof typeof statusDisplay]}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {isEditing ? (
                          <div className="flex justify-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => onInLineSave(item.id)} disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-emerald-600" />}</Button>
                            <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}><X className="h-4 w-4 text-red-600" /></Button>
                          </div>
                        ) : <Button variant="ghost" size="sm" onClick={() => {setEditingId(item.id); setEditFormData({name:item.name, area:item.area, phone:item.phone, capacity:item.capacity, familiesCount:item.familiesCount}); setEditErrors({})}} disabled={editingId !== null}><Pencil className="h-4 w-4 text-blue-600" /></Button>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-bold">عرض:</span>
              <select className="border rounded h-8 text-xs bg-white" value={pageSize} onChange={(e) => {setPageSize(Number(e.target.value)); setCurrentPage(1);}}>
                {[5, 10, 15, 20].map(size => <option key={size} value={size}>{size}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">صفحة {currentPage} من {totalPages || 1}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronRight size={16} /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}><ChevronLeft size={16} /></Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* نافذة الإضافة المحدثة (كل حقل في سطر) */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md text-right" dir="rtl">
          <DialogHeader><DialogTitle className="text-xl font-bold">إضافة مركز إيواء جديد</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-5 py-4">
            
            {/* الاسم */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">اسم المركز (يجب أن يكون رباعياً) <span className="text-red-500">*</span></label>
              <Input value={addFormData.name} onChange={(e) => setAddFormData({...addFormData, name: e.target.value})} className={addErrors.name ? 'border-red-500 shadow-sm' : ''} placeholder="أدخل الاسم رباعياً..." />
              {addErrors.name && <p className="text-[11px] text-red-600 font-bold">{addErrors.name}</p>}
            </div>

            {/* المنطقة */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">المنطقة</label>
              <select className="w-full border h-10 rounded-md px-2 bg-white" value={addFormData.area} onChange={(e) => setAddFormData({...addFormData, area: e.target.value})}>
                {REGIONS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {/* الهاتف */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">رقم الهاتف (يبدأ بـ 056 أو 059) <span className="text-red-500">*</span></label>
              <Input value={addFormData.phone} onChange={(e) => setAddFormData({...addFormData, phone: e.target.value})} className={addErrors.phone ? 'border-red-500' : ''} placeholder="059xxxxxxx" />
              {addErrors.phone && <p className="text-[11px] text-red-600 font-bold">{addErrors.phone}</p>}
            </div>

            {/* السعة */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">السعة القصوى (أكبر من 0) <span className="text-red-500">*</span></label>
              <Input type="number" value={addFormData.capacity} onChange={(e) => setAddFormData({...addFormData, capacity: e.target.value as any})} className={addErrors.capacity ? 'border-red-500' : ''} />
              {addErrors.capacity && <p className="text-[11px] text-red-600 font-bold">{addErrors.capacity}</p>}
            </div>

            {/* العائلات */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">عدد العائلات الحالية</label>
              <Input type="number" value={addFormData.familiesCount} onChange={(e) => setAddFormData({...addFormData, familiesCount: e.target.value as any})} />
            </div>

          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button className="bg-blue-600 text-white flex-1 h-11" onClick={onAdd} disabled={adding}>{adding ? <Loader2 className="animate-spin ml-2" size={18} /> : 'حفظ البيانات'}</Button>
            <Button variant="outline" className="flex-1 h-11" onClick={() => setAddOpen(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}