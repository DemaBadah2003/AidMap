'use client'

import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
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
  Pencil, Save, X, Plus, Search, 
  ChevronRight, ChevronLeft, Loader2
} from 'lucide-react'

// --- 1. الثوابت ---
const REGIONS_OPTIONS = ['شرق', 'غرب', 'شمال', 'جنوب'] as const;
const STATUS_OPTIONS = ['ممتلئ', 'غير ممتلئ'] as const;

// --- 2. مخطط التحقق Zod ---
const shelterSchema = z.object({
  nameAr: z.string().trim().min(1, 'اسم المركز مطلوب'),
  areaAr: z.enum([...REGIONS_OPTIONS], { 
    errorMap: () => ({ message: 'المنطقة مطلوبة' }) 
  }),
  supervisorAr: z.string().trim().min(1, 'اسم المشرف مطلوب'),
  phone: z
    .string()
    .trim()
    .min(1, 'رقم الهاتف مطلوب')
    .regex(/^(056|059)\d{7}$/, 'يجب أن يبدأ بـ 056 أو 059 ويتكون من 10 أرقام'),
  capacity: z.coerce.number().gt(0, 'السعة يجب أن تكون أكبر من صفر'),
  fillStatus: z.enum([...STATUS_OPTIONS], { 
    errorMap: () => ({ message: 'الحالة مطلوبة' }) 
  }),
})

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

export default function SheltersPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Shelter[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'الكل' | FillStatus>('الكل')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  
  // --- حالات الـ Pagination المحدثة ---
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
    nameAr: '',
    areaAr: 'شمال',
    supervisorAr: '',
    phone: '',
    capacity: 0,
    fillStatus: 'غير ممتلئ',
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

  useEffect(() => {
    fetchShelters()
  }, [])

  const filteredItems = useMemo(() => {
    return items.filter(sh => {
      const name = sh.nameAr || ''
      const area = sh.areaAr || ''
      const phone = sh.phone || ''
      const matchSearch = name.includes(q) || area.includes(q) || phone.includes(q)
      const matchStatus = statusFilter === 'الكل' || sh.fillStatus === statusFilter
      return matchSearch && matchStatus
    })
  }, [q, items, statusFilter])

  // --- منطق الـ Pagination الجديد ---
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage))
  
  const currentTableData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredItems.slice(start, start + itemsPerPage)
  }, [currentPage, filteredItems, itemsPerPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [q, statusFilter, itemsPerPage])

  const rangeStart = filteredItems.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const rangeEnd = Math.min(currentPage * itemsPerPage, filteredItems.length)

  const validate = (data: any) => {
    const result = shelterSchema.safeParse(data)
    if (!result.success) {
      const errors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0].toString()
        errors[fieldName] = issue.message
      })
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
      if (!res.ok) throw new Error('فشل الحفظ')
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
      if (!res.ok) throw new Error('فشل التعديل')
      const updated = await res.json()
      setItems(prev => prev.map(sh => sh.id === id ? { ...sh, ...updated } : sh))
      setEditingId(null)
    } catch (err) { alert('حدث خطأ أثناء التعديل') }
  }

  return (
    <div className="w-full px-4 py-5" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 text-right font-sans">إدارة مراكز الإيواء</h1>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col lg:flex-row gap-4 justify-between bg-white border-b">
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث..." className="pr-9 h-10 border-slate-200" />
              </div>
              <select 
                className="border border-slate-200 rounded-lg px-3 text-sm bg-white h-10 outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="الكل">كل الحالات</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            <Button onClick={() => { setFormErrors({}); setAddOpen(true); }} className="bg-blue-600 hover:bg-blue-700 h-10 px-5 font-bold">
                إضافة مركز إيواء <Plus className="mr-2 h-4 w-4" />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="p-4 font-bold text-slate-600">اسم المركز</th>
                  <th className="p-4 font-bold text-slate-600">المنطقة</th>
                  <th className="p-4 font-bold text-slate-600">المشرف</th>
                  <th className="p-4 font-bold text-slate-600">الهاتف</th>
                  <th className="p-4 font-bold text-slate-600">السعة</th>
                  <th className="p-4 text-center font-bold text-slate-600">الحالة</th>
                  <th className="p-4 text-center font-bold text-slate-600">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="p-10 text-center text-slate-500"><Loader2 className="animate-spin inline-block mr-2" /> جاري التحميل...</td></tr>
                ) : currentTableData.length === 0 ? (
                  <tr><td colSpan={7} className="p-10 text-center text-slate-500 italic">لا توجد بيانات تطابق البحث</td></tr>
                ) : currentTableData.map((sh) => (
                  <tr key={sh.id} className="hover:bg-slate-50/50 transition-colors">
                    {editingId === sh.id ? (
                      <>
                        <td className="p-2 align-top">
                            <Input value={editDraft.nameAr} onChange={(e)=>setEditDraft({...editDraft, nameAr: e.target.value})} className={formErrors.nameAr ? 'border-red-500' : ''} />
                            {formErrors.nameAr && <p className="text-[10px] text-red-500 mt-1">{formErrors.nameAr}</p>}
                        </td>
                        <td className="p-2 align-top">
                          <select className="border rounded p-2 w-full h-10 bg-white outline-none" value={editDraft.areaAr} onChange={(e)=>setEditDraft({...editDraft, areaAr: e.target.value as Region})}>
                            {REGIONS_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </td>
                        <td className="p-2 align-top">
                            <Input value={editDraft.supervisorAr} onChange={(e)=>setEditDraft({...editDraft, supervisorAr: e.target.value})} className={formErrors.supervisorAr ? 'border-red-500' : ''} />
                            {formErrors.supervisorAr && <p className="text-[10px] text-red-500 mt-1">{formErrors.supervisorAr}</p>}
                        </td>
                        <td className="p-2 align-top">
                            <Input value={editDraft.phone} onChange={(e)=>setEditDraft({...editDraft, phone: e.target.value})} className={formErrors.phone ? 'border-red-500' : ''} />
                            {formErrors.phone && <p className="text-[10px] text-red-500 mt-1" dir="rtl">{formErrors.phone}</p>}
                        </td>
                        <td className="p-2 align-top">
                            <Input type="number" value={editDraft.capacity} onChange={(e)=>setEditDraft({...editDraft, capacity: +e.target.value})} className={formErrors.capacity ? 'border-red-500' : ''} />
                            {formErrors.capacity && <p className="text-[10px] text-red-500 mt-1">{formErrors.capacity}</p>}
                        </td>
                        <td className="p-2 text-center align-top">
                          <select className="border rounded p-1 h-9 bg-white outline-none" value={editDraft.fillStatus} onChange={(e)=>setEditDraft({...editDraft, fillStatus: e.target.value as FillStatus})}>
                             {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="p-2 flex justify-center gap-1 align-top pt-3">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 h-9" onClick={() => saveEditRow(sh.id)}><Save className="h-4 w-4"/></Button>
                          <Button size="sm" variant="ghost" className="h-9" onClick={() => {setEditingId(null); setFormErrors({});}}><X className="h-4 w-4 text-red-500"/></Button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 font-medium text-slate-700">{sh.nameAr}</td>
                        <td className="p-4 text-slate-600">{sh.areaAr}</td>
                        <td className="p-4 text-slate-600">{sh.supervisorAr}</td>
                        <td className="p-4 text-slate-600" dir="ltr">{sh.phone}</td>
                        <td className="p-4 text-slate-600">{sh.capacity}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${sh.fillStatus === 'ممتلئ' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {sh.fillStatus}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button onClick={() => {setEditingId(sh.id); setEditDraft(sh); setFormErrors({});}} className="p-2 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-slate-200">
                            <Pencil className="h-4 w-4 text-slate-500" />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- الـ Pagination بنفس التنسيق الموحد المطلوب --- */}
          <div className="p-4 flex items-center justify-between border-t bg-slate-50/30">
            <div className="flex items-center gap-2 text-sm text-slate-500">
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

            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-500 font-medium font-sans">
                {rangeStart} - {rangeEnd} <span className="mx-1 text-slate-300">|</span> من {filteredItems.length}
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-3 border-slate-200 hover:bg-white font-normal" 
                  disabled={currentPage <= 1} 
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  السابق
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-3 border-slate-200 hover:bg-white font-normal" 
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

      {/* --- Dialog الإضافة --- */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="max-w-md rounded-2xl border-none shadow-2xl">
          <DialogHeader><DialogTitle className="text-xl font-bold text-right text-slate-800">إضافة مركز إيواء جديد</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4 text-right">
            <div className="grid gap-1.5">
              <label className="text-sm font-bold text-slate-700">اسم المركز</label>
              <Input 
                value={formData.nameAr} 
                onChange={(e)=>setFormData({...formData, nameAr: e.target.value})} 
                className={formErrors.nameAr ? 'border-red-500 bg-slate-50' : 'border-slate-200 bg-slate-50'}
                placeholder="أدخل اسم المركز..."
              />
              {formErrors.nameAr && <span className="text-xs text-red-500">{formErrors.nameAr}</span>}
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-bold text-slate-700">المنطقة</label>
              <select 
                className="w-full border border-slate-200 rounded-md p-2 text-sm h-11 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-100"
                value={formData.areaAr} 
                onChange={(e)=>setFormData({...formData, areaAr: e.target.value as Region})}
              >
                {REGIONS_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-bold text-slate-700">اسم المشرف</label>
              <Input 
                value={formData.supervisorAr} 
                onChange={(e)=>setFormData({...formData, supervisorAr: e.target.value})} 
                className={formErrors.supervisorAr ? 'border-red-500 bg-slate-50' : 'border-slate-200 bg-slate-50'}
                placeholder="أدخل اسم المشرف..."
              />
              {formErrors.supervisorAr && <span className="text-xs text-red-500">{formErrors.supervisorAr}</span>}
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-bold text-slate-700">رقم الهاتف</label>
              <Input 
                value={formData.phone} 
                onChange={(e)=>setFormData({...formData, phone: e.target.value})} 
                placeholder="059XXXXXXX" 
                className={formErrors.phone ? 'border-red-500 bg-slate-50' : 'border-slate-200 bg-slate-50'}
              />
              {formErrors.phone && <span className="text-xs text-red-500">{formErrors.phone}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">السعة</label>
                <Input 
                  type="number" 
                  value={formData.capacity} 
                  onChange={(e)=>setFormData({...formData, capacity: +e.target.value})} 
                  className={formErrors.capacity ? 'border-red-500 bg-slate-50' : 'border-slate-200 bg-slate-50'}
                />
                {formErrors.capacity && <span className="text-xs text-red-500">{formErrors.capacity}</span>}
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-slate-700">الحالة</label>
                <select 
                  className="w-full border border-slate-200 rounded-md p-2 text-sm h-11 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-100"
                  value={formData.fillStatus} 
                  onChange={(e)=>setFormData({...formData, fillStatus: e.target.value as FillStatus})}
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-row-reverse gap-2 w-full mt-2">
            <Button onClick={onAdd} disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 h-11 font-bold rounded-xl">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : 'حفظ البيانات'}
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1 h-11 border-slate-200 rounded-xl">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}