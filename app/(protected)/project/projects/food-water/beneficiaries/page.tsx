'use client'

import { useEffect, useMemo, useState } from 'react'
import { z, ZodError } from 'zod'
import { Card, CardContent } from '../../../../../../components/ui/card'
import { Button } from '../../../../../../components/ui/button'
import { Input } from '../../../../../../components/ui/input'
import { Pencil, Plus, Search, Check, X, Loader2, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../../../../components/ui/dialog"

// --- التعريفات الثابتة ---
const AREAS = ["شمال", "جنوب", "شرق", "غرب"]
const PRIORITIES = ["عادي", "مستعجل", "حرج"]

type Priority = 'مستعجل' | 'عادي' | 'حرج'

type Beneficiary = {
  id: string
  nameAr: string
  phone: string
  familyCount: number
  area: string
  campId: string
  campName: string
  priority: Priority
}

type CampOption = {
  id: string
  name: string
  area: string
}

const BASE_URL = '/api/project/projects/beneficiaries'
const CAMPS_OPTIONS_URL = '/api/project/projects/camps?forBeneficiary=true'

const phoneRegex = /^(056|059)\d{7}$/

const beneficiarySchema = z.object({
  nameAr: z.string().min(1, 'اسم المستفيد مطلوب').trim(),
  phone: z.string().trim().min(1, 'رقم الهاتف مطلوب').regex(phoneRegex, 'يجب أن يبدأ بـ 056 أو 059'),
  familyCount: z.coerce.number()
    .int('يجب أن يكون رقماً صحيحاً')
    .min(1, 'يجب أن يكون فرد واحد على الأقل')
    .max(50, 'الحد الأقصى المسموح به 50 فرداً'),
  area: z.string().min(1, 'يرجى اختيار المنطقة'),
  campId: z.string().min(1, 'يرجى اختيار المخيم'),
  priority: z.enum(['مستعجل', 'عادي', 'حرج']),
})

async function requestJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    cache: 'no-store',
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) throw new Error(data?.message ?? `خطأ: ${res.status}`)
  return data as T
}

export default function BeneficiariesPage() {
  const [q, setQ] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [items, setItems] = useState<Beneficiary[]>([])
  const [campOptions, setCampOptions] = useState<CampOption[]>([])
  const [loading, setLoading] = useState(false)

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [addFormData, setAddFormData] = useState<Partial<Beneficiary>>({ priority: 'عادي', area: '', familyCount: 0 })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<Beneficiary>>({})
  
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [bens, camps] = await Promise.all([
          requestJSON<Beneficiary[]>(BASE_URL),
          requestJSON<CampOption[]>(CAMPS_OPTIONS_URL)
        ])
        setItems(bens)
        setCampOptions(camps)
      } catch (err: any) {
        console.error("Error loading data:", err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredCampsForAdd = useMemo(() => campOptions.filter(c => c.area === addFormData.area), [addFormData.area, campOptions])
  const filteredCampsForEdit = useMemo(() => campOptions.filter(c => c.area === editFormData.area), [editFormData.area, campOptions])

  const filteredItems = useMemo(() => {
    return items.filter(b => {
      const matchesSearch = !q || b.nameAr.includes(q) || b.phone.includes(q) || (b.campName && b.campName.includes(q));
      const matchesPriority = priorityFilter === 'all' || b.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    })
  }, [q, priorityFilter, items])

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage))
  
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredItems.slice(start, start + itemsPerPage)
  }, [filteredItems, currentPage, itemsPerPage])

  useEffect(() => { setCurrentPage(1) }, [q, priorityFilter, itemsPerPage])

  const rangeStart = filteredItems.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const rangeEnd = Math.min(currentPage * itemsPerPage, filteredItems.length)

  const handleAddSubmit = async () => {
    setErrors({})
    try {
      const validatedData = beneficiarySchema.parse(addFormData)
      setSubmitting(true)
      const newItem = await requestJSON<Beneficiary>(BASE_URL, {
        method: 'POST',
        body: JSON.stringify(validatedData)
      })
      setItems([newItem, ...items])
      setIsAddDialogOpen(false)
      setAddFormData({ priority: 'عادي', area: '', familyCount: 0 })
      setCurrentPage(1) 
    } catch (err) {
      if (err instanceof ZodError) {
        const errs: Record<string, string> = {}
        err.issues.forEach(i => errs[i.path[0] as string] = i.message)
        setErrors(errs)
      } else if (err instanceof Error) alert(err.message)
    } finally { setSubmitting(false) }
  }

  const handleSaveEdit = async (id: string) => {
    setErrors({})
    try {
      const validatedData = beneficiarySchema.parse(editFormData)
      setSubmitting(true)
      const savedItem = await requestJSON<Beneficiary>(`${BASE_URL}?id=${id}`, {
        method: 'PATCH',
        body: JSON.stringify(validatedData)
      })
      setItems(items.map(item => item.id === id ? savedItem : item))
      setEditingId(null)
    } catch (err) {
      if (err instanceof ZodError) {
        const errs: Record<string, string> = {}
        err.issues.forEach(i => errs[i.path[0] as string] = i.message)
        setErrors(errs)
      } else if (err instanceof Error) alert(err.message)
    } finally { setSubmitting(false) }
  }

  const inputBaseClass = "w-full min-w-0 rounded-lg border-slate-200 bg-white text-right text-xs sm:text-sm outline-none focus:!ring-2 focus:!ring-slate-100 font-normal"
  const selectBaseClass = "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-right text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-100 font-normal"

  return (
    <div className="w-full px-4 py-6" dir="rtl">
      <div className="mb-6 text-right">
        <h1 className="text-2xl font-bold text-slate-900">إدارة المستفيدين</h1>
        <p className="text-sm text-slate-500 mt-1 font-normal">الرئيسية &gt; إدارة المستفيدين</p>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl bg-white">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row items-center gap-3 border-b">
            <div className="relative w-full max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث..."
                className={`${inputBaseClass} h-10 pr-10 bg-slate-50 border-none`}
              />
            </div>
            
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className={`${selectBaseClass} h-10 sm:w-[130px] bg-slate-50 border-slate-200`}
            >
              <option value="all">كل الأولويات</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <Button
              onClick={() => { setErrors({}); setIsAddDialogOpen(true); }}
              className={`bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 rounded-lg mr-auto shadow-sm font-bold`}
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة مستفيد
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="p-4 text-slate-500 font-bold">اسم المستفيد</th>
                  <th className="p-4 text-slate-500 font-bold">رقم الهاتف</th>
                  <th className="p-4 text-slate-500 font-bold">المنطقة</th>
                  <th className="p-4 text-slate-500 font-bold">المخيم</th>
                  <th className="p-4 text-center text-slate-500 font-bold">الأفراد</th>
                  <th className="p-4 text-center text-slate-500 font-bold">الأولوية</th>
                  <th className="p-4 text-center text-slate-500 font-bold">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr><td colSpan={7} className="p-20 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />جاري التحميل...</td></tr>
                ) : paginatedItems.length === 0 ? (
                  <tr><td colSpan={7} className="p-20 text-center text-slate-400 italic">لا توجد نتائج مطابقة.</td></tr>
                ) : paginatedItems.map((b) => {
                  const isEditing = editingId === b.id;
                  return (
                    <tr key={b.id} className={`hover:bg-slate-50/50 transition-colors ${isEditing ? 'bg-blue-50/40' : ''}`}>
                      <td className="p-4">
                        {isEditing ? <Input className="h-9 border-blue-400" value={editFormData.nameAr} onChange={e => setEditFormData({...editFormData, nameAr: e.target.value})} /> : b.nameAr}
                      </td>
                      <td className="p-4">
                        {isEditing ? <Input className="h-9 border-blue-400" value={editFormData.phone} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} /> : b.phone}
                      </td>
                      <td className="p-4">
                        {isEditing ? (
                          <select className={`${selectBaseClass} h-9 border-blue-400`} value={editFormData.area} onChange={e => setEditFormData({...editFormData, area: e.target.value, campId: ''})}>
                            <option value="">اختر..</option>
                            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                        ) : b.area}
                      </td>
                      <td className="p-4">
                        {isEditing ? (
                          <select className={`${selectBaseClass} h-9 border-blue-400`} value={editFormData.campId} disabled={!editFormData.area} onChange={e => setEditFormData({...editFormData, campId: e.target.value})}>
                            <option value="">اختر..</option>
                            {filteredCampsForEdit.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        ) : b.campName}
                      </td>
                      <td className="p-4 text-center">
                        {isEditing ? <Input type="number" className="h-9 w-20 mx-auto border-blue-400 text-center" value={editFormData.familyCount || ''} onChange={e => setEditFormData({...editFormData, familyCount: Number(e.target.value)})} /> : b.familyCount}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${b.priority === 'حرج' ? 'bg-red-100 text-red-700' : b.priority === 'مستعجل' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                          {b.priority}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {isEditing ? (
                          <div className="flex gap-1 justify-center">
                            <Button size="sm" onClick={() => handleSaveEdit(b.id)} disabled={submitting} className="bg-green-600 text-white">حفظ</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>إلغاء</Button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingId(b.id); setEditFormData(b); }} className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-md border border-slate-100 text-slate-400 transition-all">
                            <Pencil className="w-4 h-4"/>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

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
              <span className="text-slate-500 font-medium">
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

      {/* Add Modal - تم تحديثه ليطابق الصفحة السابقة تماماً */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent dir="rtl" className="max-w-md shadow-2xl border-none rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-right text-lg font-bold">إضافة مستفيد جديد</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4 text-right">
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">اسم المستفيد</label>
               <Input className="h-11 bg-slate-50 border-slate-200" value={addFormData.nameAr || ''} onChange={e => setAddFormData({...addFormData, nameAr: e.target.value})} placeholder="الاسم الرباعي" />
               {errors.nameAr && <p className="text-[10px] text-red-500 font-normal mt-1">{errors.nameAr}</p>}
            </div>
            
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">رقم الهاتف</label>
               <Input className="h-11 bg-slate-50 border-slate-200" value={addFormData.phone || ''} onChange={e => setAddFormData({...addFormData, phone: e.target.value})} placeholder="05xxxxxxxx" />
               {errors.phone && <p className="text-[10px] text-red-500 font-normal mt-1">{errors.phone}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">المنطقة</label>
                <select className={`${selectBaseClass} h-11 bg-slate-50 border-slate-200`} value={addFormData.area || ''} onChange={e => setAddFormData({...addFormData, area: e.target.value, campId: ''})}>
                    <option value="">اختر المنطقة</option>
                    {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                {errors.area && <p className="text-[10px] text-red-500 font-normal mt-1">{errors.area}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">الأولوية</label>
                <select className={`${selectBaseClass} h-11 bg-slate-50 border-slate-200`} value={addFormData.priority || 'عادي'} onChange={e => setAddFormData({...addFormData, priority: e.target.value as Priority})}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">المخيم</label>
               <select className={`${selectBaseClass} h-11 bg-slate-50 border-slate-200`} value={addFormData.campId || ''} onChange={e => setAddFormData({...addFormData, campId: e.target.value})} disabled={!addFormData.area}>
                  <option value="">اختر المخيم</option>
                  {filteredCampsForAdd.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
               {errors.campId && <p className="text-[10px] text-red-500 font-normal mt-1">{errors.campId}</p>}
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">عدد الأفراد</label>
               <Input className="h-11 bg-slate-50 border-slate-200" type="number" placeholder="0" value={addFormData.familyCount || ''} onChange={e => setAddFormData({...addFormData, familyCount: Number(e.target.value)})} />
               {errors.familyCount && <p className="text-[10px] text-red-500 font-normal mt-1">{errors.familyCount}</p>}
            </div>

            {Object.keys(errors).length > 0 && (
              <div className="text-[10px] text-amber-600 flex items-center gap-2 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                <AlertCircle className="w-3.5 h-3.5 shrink-0"/> يرجى تصحيح الأخطاء أعلاه لتتمكن من حفظ البيانات.
              </div>
            )}
          </div>
          
          <DialogFooter className="mt-2 flex flex-row items-center gap-3 w-full">
            <Button 
              onClick={handleAddSubmit} 
              disabled={submitting} 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null} حفظ البيانات
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsAddDialogOpen(false)} 
              className="flex-1 h-11 font-normal text-slate-600 bg-white hover:bg-slate-50 border-slate-200 rounded-xl"
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}