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

// --- شروط التحقق الصارمة ---
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
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

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

  const onAdd = async () => {
    setAddErrors({})
    setResponseError('')

    const result = shelterSchema.safeParse(addFormData)
    
    if (!result.success) {
      const errors: Record<string, string> = {}
      result.error.issues.forEach(i => { errors[i.path[0].toString()] = i.message })
      setAddErrors(errors)
      return
    }

    setAdding(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'فشل الإضافة')
      
      await fetchShelters()
      setAddOpen(false)
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
    <div className="w-full px-2 md:px-4 py-4 md:py-8 font-sans" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">إدارة مراكز الإيواء</h1>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Header Section */}
        <div className="p-3 md:p-4 bg-slate-50/50 border-b flex flex-col lg:flex-row items-center justify-between gap-4">
           <div className="flex flex-col sm:flex-row flex-1 items-center gap-3 w-full">
              <div className="relative w-full max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input placeholder="بحث باسم المركز..." className="pr-10 bg-white" value={q} onChange={(e) => {setQ(e.target.value); setCurrentPage(1);}} />
              </div>
           </div>
           <Button onClick={() => { setAddOpen(true); setAddErrors({}); }} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-10 w-full lg:w-auto">
             <Plus size={18} /> إضافة مركز جديد
           </Button>
        </div>

        {/* Table Container with Horizontal and Vertical Scroll */}
        <CardContent className="p-0 flex-1 overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-slate-200">
            <table className="w-full text-right border-collapse min-w-[600px]">
              <thead className="bg-slate-100 text-slate-600 text-xs md:text-sm border-b sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-3 md:p-4 font-bold bg-slate-100">اسم المركز</th>
                  <th className="p-3 md:p-4 font-bold bg-slate-100">المنطقة</th>
                  <th className="p-3 md:p-4 font-bold text-center bg-slate-100">السعة</th>
                  <th className="p-3 md:p-4 font-bold text-center bg-slate-100">الحالة</th>
                  <th className="p-3 md:p-4 font-bold text-center bg-slate-100">تعديل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-xs md:text-sm">
                {loading ? (
                  <tr><td colSpan={5} className="p-10 text-center text-slate-400">جاري التحميل...</td></tr>
                ) : paginatedItems.map((item: any) => (
                    <tr key={item.id} className="hover:bg-blue-50/10">
                      <td className="p-3 font-bold text-slate-800">{item.name}</td>
                      <td className="p-3">{item.area}</td>
                      <td className="p-3 text-center">{item.capacity}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${item.fillStatus === 'FULL' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {statusDisplay[item.fillStatus as keyof typeof statusDisplay]}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Pencil className="h-4 w-4 text-blue-600" /></Button>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Section */}
          <div className="p-4 bg-slate-50 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 order-2 sm:order-1">
              <span className="text-xs text-slate-500 font-bold">عرض:</span>
              <select className="border rounded h-8 text-xs bg-white px-2 outline-none" value={pageSize} onChange={(e) => {setPageSize(Number(e.target.value)); setCurrentPage(1);}}>
                {[5, 10, 15, 20].map(size => <option key={size} value={size}>{size}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3 order-1 sm:order-2">
              <span className="text-xs text-slate-500">صفحة {currentPage} من {totalPages || 1}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronRight size={16} /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}><ChevronLeft size={16} /></Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pop-up Add Form */}
      <Dialog open={addOpen} onOpenChange={(val) => { setAddOpen(val); if(!val) setAddErrors({}); }}>
        <DialogContent className="w-[95vw] max-w-md rounded-2xl text-right p-6" dir="rtl">
          <DialogHeader><DialogTitle className="text-xl font-bold text-slate-800 border-b pb-2">إضافة مركز إيواء جديد</DialogTitle></DialogHeader>
          
          <div className="flex flex-col gap-4 py-4 overflow-y-auto max-h-[75vh]">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">اسم المركز (رباعي) <span className="text-red-500">*</span></label>
              <Input 
                value={addFormData.name} 
                onChange={(e) => setAddFormData({...addFormData, name: e.target.value})} 
                placeholder="أدخل الاسم رباعياً..." 
                className={addErrors.name ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} 
              />
              {addErrors.name && <p className="text-[11px] text-red-600 font-bold">{addErrors.name}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">المنطقة</label>
              <select className="w-full border border-slate-200 h-10 rounded-md px-3 bg-white text-sm outline-none" value={addFormData.area} onChange={(e) => setAddFormData({...addFormData, area: e.target.value})}>
                {REGIONS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">رقم الهاتف <span className="text-red-500">*</span></label>
              <Input 
                value={addFormData.phone} 
                onChange={(e) => setAddFormData({...addFormData, phone: e.target.value})} 
                placeholder="059xxxxxxx" 
                className={addErrors.phone ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} 
              />
              {addErrors.phone && <p className="text-[11px] text-red-600 font-bold">{addErrors.phone}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">السعة القصوى</label>
              <Input 
                  type="number" 
                  value={addFormData.capacity} 
                  onChange={(e) => setAddFormData({...addFormData, capacity: e.target.value as any})} 
                  className={addErrors.capacity ? 'border-red-500' : 'border-slate-200'}
              />
              {addErrors.capacity && <p className="text-[11px] text-red-600 font-bold">{addErrors.capacity}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">العائلات الحالية</label>
              <Input 
                  type="number" 
                  value={addFormData.familiesCount} 
                  onChange={(e) => setAddFormData({...addFormData, familiesCount: e.target.value as any})} 
                  className="border-slate-200"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-3 mt-2">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full h-11 rounded-xl font-bold shadow-md" onClick={onAdd} disabled={adding}>
              {adding ? <Loader2 className="animate-spin ml-2" size={18} /> : 'حفظ البيانات'}
            </Button>
            <Button variant="ghost" className="w-full h-11 text-slate-500" onClick={() => setAddOpen(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}