'use client'

import { useEffect, useMemo, useState } from 'react'
import { z, ZodError } from 'zod'
import { Card, CardContent } from '../../../../../components/ui/card'
import { Button } from '../../../../../components/ui/button'
import { Input } from '../../../../../components/ui/input'
import { Pencil, Plus, Search, Check, X, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../../../components/ui/dialog"

// --- التعريفات الأساسية ---
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

// --- السكيما المعدلة (تم حذف شرط invalid_type_error) ---
const beneficiarySchema = z.object({
  nameAr: z.string().min(1, 'اسم المستفيد مطلوب').trim(),
  phone: z.string().trim().min(1, 'رقم الهاتف مطلوب').regex(phoneRegex, 'يجب أن يبدأ بـ 056 أو 059'),
  
  // نكتفي بـ coerce لتحويل النص لرقم، ثم التحقق من الشروط الأخرى
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

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [addFormData, setAddFormData] = useState<Partial<Beneficiary>>({ priority: 'عادي' })

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

  const availableAreas = useMemo(() => Array.from(new Set(campOptions.map(c => c.area))), [campOptions])
  const filteredCampsForAdd = useMemo(() => campOptions.filter(c => c.area === addFormData.area), [addFormData.area, campOptions])
  const filteredCampsForEdit = useMemo(() => campOptions.filter(c => c.area === editFormData.area), [editFormData.area, campOptions])

  const filteredItems = useMemo(() => {
    return items.filter(b => {
      const matchesSearch = !q || b.nameAr.includes(q) || b.phone.includes(q) || (b.campName && b.campName.includes(q));
      const matchesPriority = priorityFilter === 'all' || b.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    })
  }, [q, priorityFilter, items])

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
      setAddFormData({ priority: 'عادي' })
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
      const urlWithId = `${BASE_URL}?id=${id}` 
      const savedItem = await requestJSON<Beneficiary>(urlWithId, {
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

  const inputClass = "h-10 text-sm px-3 bg-white border-slate-200 focus:ring-2 focus:ring-blue-500 w-full"
  const selectClass = "h-10 text-sm px-3 rounded-md border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 w-full bg-white"

  return (
    <div className="w-full px-4 py-6" dir="rtl">
      <div className="mb-6 flex flex-col gap-1 items-start">
        <h1 className="text-2xl font-bold text-slate-800">المستفيدون</h1>
        <p className="text-sm text-slate-500">إدارة بيانات النازحين وتعديلها مباشرة في الجدول</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b bg-slate-50/50 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-3 items-center">
              <div className="relative w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="بحث سريع..." className="pr-9 h-10" value={q} onChange={e => setQ(e.target.value)} />
              </div>
              <select 
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-right text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
              >
                <option value="all">جميع الحالات</option>
                <option value="حرج">حالة حرجة</option>
                <option value="مستعجل">مستعجل</option>
                <option value="عادي">عادي</option>
              </select>
            </div>
            
            <Button onClick={() => { setErrors({}); setIsAddDialogOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm">
              <Plus className="h-4 w-4" /> إضافة مستفيد
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right text-slate-600">
              <thead className="bg-slate-50 border-b text-slate-700 font-bold">
                <tr>
                  <th className="px-4 py-3">اسم المستفيد</th>
                  <th className="px-4 py-3">رقم الهاتف</th>
                  <th className="px-4 py-3">المنطقة</th>
                  <th className="px-4 py-3">المخيم</th>
                  <th className="px-4 py-3 text-center">الأفراد</th>
                  <th className="px-4 py-3 text-center">الأولوية</th>
                  <th className="px-4 py-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(b => {
                  const isEditing = editingId === b.id;
                  return (
                    <tr key={b.id} className={`border-b transition-colors ${isEditing ? 'bg-blue-50/50' : 'hover:bg-slate-50/50'}`}>
                      <td className="px-4 py-2">
                        {isEditing ? <Input className={inputClass} value={editFormData.nameAr} onChange={e => setEditFormData({...editFormData, nameAr: e.target.value})} /> : b.nameAr}
                      </td>
                      <td className="px-4 py-2">
                        {isEditing ? <Input className={inputClass} value={editFormData.phone} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} /> : b.phone}
                      </td>
                      <td className="px-4 py-2">
                        {isEditing ? (
                          <select className={selectClass} value={editFormData.area} onChange={e => setEditFormData({...editFormData, area: e.target.value, campId: ''})}>
                            <option value="">-- اختر --</option>
                            {availableAreas.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                        ) : b.area}
                      </td>
                      <td className="px-4 py-2">
                        {isEditing ? (
                          <select className={selectClass} value={editFormData.campId} disabled={!editFormData.area} onChange={e => setEditFormData({...editFormData, campId: e.target.value})}>
                            <option value="">-- اختر --</option>
                            {filteredCampsForEdit.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        ) : b.campName}
                      </td>
                      <td className="px-4 py-2 text-center font-medium">
                        {isEditing ? (
                          <div className="flex flex-col gap-1 items-center">
                            <Input type="number" className="h-10 w-20 text-center border-blue-200" value={editFormData.familyCount} onChange={e => setEditFormData({...editFormData, familyCount: Number(e.target.value)})} />
                            {errors.familyCount && <p className="text-[10px] text-red-500 font-normal">{errors.familyCount}</p>}
                          </div>
                        ) : b.familyCount}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {isEditing ? (
                          <select className={selectClass} value={editFormData.priority} onChange={e => setEditFormData({...editFormData, priority: e.target.value as Priority})}>
                            <option value="عادي">عادي</option>
                            <option value="مستعجل">مستعجل</option>
                            <option value="حرج">حرج</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${b.priority === 'حرج' ? 'bg-red-100 text-red-700' : b.priority === 'مستعجل' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                            {b.priority}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {isEditing ? (
                            <>
                              <Button size="icon" className="h-8 w-8 rounded-full bg-green-500 hover:bg-green-600" onClick={() => handleSaveEdit(b.id)} disabled={submitting}>
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                              </Button>
                              <Button size="icon" className="h-8 w-8 rounded-full bg-slate-200" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                            </>
                          ) : (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingId(b.id); setEditFormData({...b}); }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
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

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[450px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-xl font-bold border-b pb-2">إضافة مستفيد جديد</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="space-y-1.5 text-right">
              <label className="text-sm font-semibold">اسم المستفيد</label>
              <Input placeholder="الاسم الرباعي" className={inputClass} value={addFormData.nameAr || ''} onChange={e => setAddFormData({...addFormData, nameAr: e.target.value})} />
              {errors.nameAr && <p className="text-xs text-red-500">{errors.nameAr}</p>}
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-sm font-semibold">رقم الهاتف</label>
              <Input placeholder="05xxxxxxxx" className={inputClass} value={addFormData.phone || ''} onChange={e => setAddFormData({...addFormData, phone: e.target.value})} />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4 text-right">
               <div className="space-y-1.5">
                 <label className="text-sm font-semibold">المنطقة</label>
                 <select className={selectClass} value={addFormData.area || ''} onChange={e => setAddFormData({...addFormData, area: e.target.value, campId: ''})}>
                   <option value="">-- اختر --</option>
                   {availableAreas.map(a => <option key={a} value={a}>{a}</option>)}
                 </select>
               </div>
               <div className="space-y-1.5">
                 <label className="text-sm font-semibold">المخيم</label>
                 <select className={selectClass} value={addFormData.campId || ''} disabled={!addFormData.area} onChange={e => setAddFormData({...addFormData, campId: e.target.value})}>
                   <option value="">-- اختر --</option>
                   {filteredCampsForAdd.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
               </div>
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-sm font-semibold">عدد الأفراد</label>
              <Input type="number" placeholder="مثلاً: 5" className={inputClass} value={addFormData.familyCount || ''} onChange={e => setAddFormData({...addFormData, familyCount: Number(e.target.value)})} />
              {errors.familyCount && <p className="text-xs text-red-500">{errors.familyCount}</p>}
            </div>
          </div>

          <DialogFooter className="mt-2 flex items-center justify-center gap-3 w-full">
            <Button onClick={handleAddSubmit} disabled={submitting} className="flex-1 bg-blue-600 h-11">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null} حفظ البيانات
            </Button>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1 h-11 text-slate-600">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}