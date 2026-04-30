'use client'

import { useEffect, useMemo, useState } from 'react'
import { z, ZodError } from 'zod'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pencil, Plus, Search, Loader2, AlertCircle, Check, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

// --- التعريفات ---
type Beneficiary = {
  id: string
  nameAr: string
  idNumber: string
  phone: string
  familyCount: number
  area: string
  campId: string
  campName: string
}

const BASE_URL = '/api/project/camp/citizens'

// شروط التحقق الصارمة باللغة العربية
const phoneRegex = /^(056|059)\d{7}$/
const idRegex = /^\d{9}$/ 
const fourNamesRegex = /^[^\s]+\s+[^\s]+\s+[^\s]+\s+[^\s]+.*$/

const beneficiarySchema = z.object({
  nameAr: z.string().min(1, 'يجب إدخال الاسم').regex(fourNamesRegex, 'يجب أن يكون الاسم رباعياً على الأقل'),
  idNumber: z.string().min(1, 'يجب إدخال رقم الهوية').regex(idRegex, 'رقم الهوية يجب أن يتكون من 9 أرقام'),
  phone: z.string().min(1, 'يجب إدخال رقم الهاتف').regex(phoneRegex, 'رقم الهاتف يجب أن يبدأ بـ 056 أو 059 وبعده 7 أرقام'),
  familyCount: z.coerce.number().min(2, 'يجب أن يكون عدد أفراد العائلة يتكون من 2 أو أكثر'),
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
  const [items, setItems] = useState<Beneficiary[]>([])
  const [loading, setLoading] = useState(false)
  
  // حالات الإضافة (Modal)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [addFormData, setAddFormData] = useState<Partial<Beneficiary>>({ nameAr: '', idNumber: '', phone: '', familyCount: 0 })

  // حالات التعديل (In-place)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<Beneficiary>>({})
  
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const bens = await requestJSON<Beneficiary[]>(BASE_URL)
        setItems(bens)
      } catch (err: any) { console.error(err.message) }
      finally { setLoading(false) }
    }
    loadData()
  }, [])

  const filteredItems = useMemo(() => {
    return items.filter(b => !q || b.nameAr.includes(q) || b.phone.includes(q) || (b.idNumber && b.idNumber.includes(q)))
  }, [q, items])

  // تنفيذ الإضافة
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
      setAddFormData({ nameAr: '', idNumber: '', phone: '', familyCount: 0 })
    } catch (err) {
      if (err instanceof ZodError) {
        const errs: Record<string, string> = {}
        err.issues.forEach(i => errs[i.path[0] as string] = i.message)
        setErrors(errs)
      }
    } finally { setSubmitting(false) }
  }

  // تنفيذ التعديل (In-place)
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
      }
    } finally { setSubmitting(false) }
  }

  return (
    <div className="w-full px-4 py-6" dir="rtl">
      <div className="mb-6 text-right font-bold text-2xl text-slate-900">إدارة المواطنين</div>

      <Card className="border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 flex items-center gap-3 border-b bg-white">
            <div className="relative w-full max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="بحث بالاسم أو الهوية..."
                className="w-full h-10 pr-10 bg-slate-50 border-none rounded-lg text-sm"
              />
            </div>
            <Button
              onClick={() => { 
                setErrors({}); 
                setAddFormData({ nameAr: '', idNumber: '', phone: '', familyCount: 0 }); 
                setIsAddDialogOpen(true); 
              }}
              className="bg-blue-600 hover:bg-blue-700 mr-auto font-bold rounded-lg"
            >
              <Plus className="h-4 w-4 ml-2" /> إضافة مواطن
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="p-4 font-bold text-slate-600">اسم المواطن</th>
                  <th className="p-4 font-bold text-slate-600">رقم الهوية</th>
                  <th className="p-4 font-bold text-slate-600">رقم الهاتف</th>
                  <th className="p-4 text-center font-bold text-slate-600">أفراد العائلة</th>
                  <th className="p-4 text-center font-bold text-slate-600">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="p-10 text-center text-slate-400">جاري التحميل...</td></tr>
                ) : filteredItems.map((b) => {
                  const isEditing = editingId === b.id;
                  return (
                    <tr key={b.id} className={`hover:bg-slate-50/50 transition-colors ${isEditing ? 'bg-blue-50/30' : ''}`}>
                      <td className="p-3">
                        {isEditing ? (
                          <div className="space-y-1">
                            <Input 
                              className={`h-9 text-xs ${errors.nameAr ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200'}`}
                              value={editFormData.nameAr} 
                              onChange={e => setEditFormData({...editFormData, nameAr: e.target.value})} 
                            />
                            {errors.nameAr && <p className="text-[9px] text-red-500 font-medium">{errors.nameAr}</p>}
                          </div>
                        ) : b.nameAr}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <div className="space-y-1">
                            <Input 
                              className={`h-9 text-xs ${errors.idNumber ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200'}`}
                              value={editFormData.idNumber} 
                              onChange={e => setEditFormData({...editFormData, idNumber: e.target.value})} 
                            />
                            {errors.idNumber && <p className="text-[9px] text-red-500 font-medium">{errors.idNumber}</p>}
                          </div>
                        ) : b.idNumber}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <div className="space-y-1">
                            <Input 
                              className={`h-9 text-xs ${errors.phone ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200'}`}
                              value={editFormData.phone} 
                              onChange={e => setEditFormData({...editFormData, phone: e.target.value})} 
                            />
                            {errors.phone && <p className="text-[9px] text-red-500 font-medium">{errors.phone}</p>}
                          </div>
                        ) : b.phone}
                      </td>
                      <td className="p-3 text-center">
                        {isEditing ? (
                          <div className="space-y-1">
                            <Input 
                              type="number"
                              className={`h-9 w-20 mx-auto text-center text-xs ${errors.familyCount ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200'}`}
                              value={editFormData.familyCount} 
                              onChange={e => setEditFormData({...editFormData, familyCount: Number(e.target.value)})} 
                            />
                            {errors.familyCount && <p className="text-[9px] text-red-500 font-medium">{errors.familyCount}</p>}
                          </div>
                        ) : b.familyCount}
                      </td>
                      <td className="p-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-2">
                            <Button size="sm" onClick={() => handleSaveEdit(b.id)} disabled={submitting} className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700">
                              {submitting ? <Loader2 className="h-3 w-3 animate-spin"/> : <Check className="h-4 w-4"/>}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setErrors({}); }} className="h-8 w-8 p-0 text-slate-400">
                              <X className="h-4 w-4"/>
                            </Button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => { setErrors({}); setEditFormData(b); setEditingId(b.id); }}
                            className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                          >
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
        </CardContent>
      </Card>

      {/* Modal الإضافة (كما هو بطلبك) */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent dir="rtl" className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="text-right font-bold">إضافة مستفيد جديد</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-4 text-right">
            <div className="space-y-1.5">
              <label className="text-xs font-bold">اسم المواطن</label>
              <Input 
                className={`${errors.nameAr ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200'}`} 
                value={addFormData.nameAr} 
                onChange={e => setAddFormData({...addFormData, nameAr: e.target.value})} 
                placeholder="الاسم الرباعي" 
              />
              {errors.nameAr && <p className="text-[10px] text-red-500 font-medium">{errors.nameAr}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold">رقم الهوية</label>
              <Input 
                className={`${errors.idNumber ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200'}`} 
                value={addFormData.idNumber} 
                onChange={e => setAddFormData({...addFormData, idNumber: e.target.value})} 
                placeholder="9 أرقام" 
              />
              {errors.idNumber && <p className="text-[10px] text-red-500 font-medium">{errors.idNumber}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold">رقم الهاتف</label>
              <Input 
                className={`${errors.phone ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200'}`} 
                value={addFormData.phone} 
                onChange={e => setAddFormData({...addFormData, phone: e.target.value})} 
                placeholder="05xxxxxxxx" 
              />
              {errors.phone && <p className="text-[10px] text-red-500 font-medium">{errors.phone}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold">عدد أفراد العائلة</label>
              <Input 
                className={`${errors.familyCount ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200'}`} 
                type="number" 
                value={addFormData.familyCount} 
                onChange={e => setAddFormData({...addFormData, familyCount: Number(e.target.value)})} 
              />
              {errors.familyCount && <p className="text-[10px] text-red-500 font-medium">{errors.familyCount}</p>}
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button onClick={handleAddSubmit} disabled={submitting} className="flex-1 bg-blue-600 font-bold">
              {submitting && <Loader2 className="w-4 h-4 animate-spin ml-2" />} حفظ البيانات
            </Button>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}