'use client'

import { useEffect, useMemo, useState } from 'react'
import { z, ZodError } from 'zod'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pencil, Plus, Search, Loader2, Check, X, ChevronRight, ChevronLeft } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [addFormData, setAddFormData] = useState<Partial<Beneficiary>>({ nameAr: '', idNumber: '', phone: '', familyCount: 0 })

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

  const totalPages = Math.ceil(filteredItems.length / pageSize)
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredItems.slice(start, start + pageSize)
  }, [filteredItems, currentPage, pageSize])

  useEffect(() => { setCurrentPage(1) }, [q, pageSize])

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
    <div className="w-full px-2 sm:px-4 py-6" dir="rtl">
      <div className="mb-6 text-right font-bold text-xl sm:text-2xl text-slate-900">إدارة المواطنين</div>

      <Card className="border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row items-center gap-3 border-b bg-white">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="بحث..."
                className="w-full h-10 pr-10 bg-slate-50 border-none rounded-lg text-sm"
              />
            </div>
            <Button
              onClick={() => { 
                setErrors({}); 
                setAddFormData({ nameAr: '', idNumber: '', phone: '', familyCount: 0 }); 
                setIsAddDialogOpen(true); 
              }}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 sm:mr-auto font-bold rounded-lg px-6"
            >
              <Plus className="h-4 w-4 ml-2" /> إضافة مواطن
            </Button>
          </div>

          {/* الحاوية المحدثة للتمرير العمودي */}
          <div className="relative overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(5 * 65px + 45px)' }}>
            <table className="w-full text-right text-sm min-w-[600px] sm:min-w-full">
              <thead className="bg-slate-50/80 border-b border-slate-100 sticky top-0 z-20">
                <tr>
                  <th className="p-4 font-bold text-slate-600 bg-slate-50">اسم المواطن</th>
                  <th className="p-4 font-bold text-slate-600 bg-slate-50">رقم الهوية</th>
                  <th className="p-4 font-bold text-slate-600 hidden md:table-cell bg-slate-50">رقم الهاتف</th>
                  <th className="p-4 text-center font-bold text-slate-600 hidden sm:table-cell bg-slate-50">أفراد العائلة</th>
                  <th className="p-4 text-center font-bold text-slate-600 bg-slate-50">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="p-10 text-center text-slate-400">جاري التحميل...</td></tr>
                ) : paginatedItems.map((b) => {
                  const isEditing = editingId === b.id;
                  return (
                    <tr key={b.id} className={`hover:bg-slate-50/50 transition-colors h-[65px] ${isEditing ? 'bg-blue-50/30' : ''}`}>
                      <td className="p-3">
                        {isEditing ? (
                          <div className="space-y-1 min-w-[150px]">
                            <Input className={`h-9 text-xs ${errors.nameAr ? 'border-red-500' : 'border-slate-200'}`} value={editFormData.nameAr} onChange={e => setEditFormData({...editFormData, nameAr: e.target.value})} />
                            {errors.nameAr && <p className="text-[9px] text-red-500 font-medium">{errors.nameAr}</p>}
                          </div>
                        ) : <div className="font-medium text-slate-700">{b.nameAr}</div>}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <div className="space-y-1">
                            <Input className={`h-9 text-xs w-28 ${errors.idNumber ? 'border-red-500' : 'border-slate-200'}`} value={editFormData.idNumber} onChange={e => setEditFormData({...editFormData, idNumber: e.target.value})} />
                            {errors.idNumber && <p className="text-[9px] text-red-500 font-medium">{errors.idNumber}</p>}
                          </div>
                        ) : b.idNumber}
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        {isEditing ? (
                          <div className="space-y-1">
                            <Input className={`h-9 text-xs w-28 ${errors.phone ? 'border-red-500' : 'border-slate-200'}`} value={editFormData.phone} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} />
                            {errors.phone && <p className="text-[9px] text-red-500 font-medium">{errors.phone}</p>}
                          </div>
                        ) : b.phone}
                      </td>
                      <td className="p-3 text-center hidden sm:table-cell">
                        {isEditing ? (
                          <div className="space-y-1">
                            <Input type="number" className={`h-9 w-16 mx-auto text-center text-xs ${errors.familyCount ? 'border-red-500' : 'border-slate-200'}`} value={editFormData.familyCount} onChange={e => setEditFormData({...editFormData, familyCount: Number(e.target.value)})} />
                            {errors.familyCount && <p className="text-[9px] text-red-500 font-medium">{errors.familyCount}</p>}
                          </div>
                        ) : b.familyCount}
                      </td>
                      <td className="p-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1 sm:gap-2">
                            <Button size="sm" onClick={() => handleSaveEdit(b.id)} disabled={submitting} className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700">
                              {submitting ? <Loader2 className="h-3 w-3 animate-spin"/> : <Check className="h-4 w-4"/>}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setErrors({}); }} className="h-8 w-8 p-0 text-slate-400">
                              <X className="h-4 w-4"/>
                            </Button>
                          </div>
                        ) : (
                          <button onClick={() => { setErrors({}); setEditFormData(b); setEditingId(b.id); }} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
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

          {/* Pagination */}
          <div className="p-4 flex items-center justify-between border-t bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 hidden sm:inline">عدد الصفوف:</span>
              <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="h-8 w-[70px] text-xs">
                  <SelectValue placeholder={pageSize} />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 20].map(size => (
                    <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 ml-2">صفحة {currentPage} من {totalPages || 1}</span>
              <Button variant="outline" size="sm" className="h-8 px-2" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                <ChevronRight className="h-4 w-4 ml-1" /> السابق
              </Button>
              <Button variant="outline" size="sm" className="h-8 px-2" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                التالي <ChevronLeft className="h-4 w-4 mr-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent dir="rtl" className="w-[95%] max-w-md rounded-2xl p-4 sm:p-6">
          <DialogHeader><DialogTitle className="text-right font-bold text-lg">إضافة مستفيد جديد</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-4 text-right">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">اسم المواطن</label>
              <Input className={`h-11 ${errors.nameAr ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200'}`} value={addFormData.nameAr} onChange={e => setAddFormData({...addFormData, nameAr: e.target.value})} placeholder="الاسم الرباعي" />
              {errors.nameAr && <p className="text-[10px] text-red-500 font-medium">{errors.nameAr}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">رقم الهوية</label>
              <Input className={`h-11 ${errors.idNumber ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200'}`} value={addFormData.idNumber} onChange={e => setAddFormData({...addFormData, idNumber: e.target.value})} placeholder="9 أرقام" />
              {errors.idNumber && <p className="text-[10px] text-red-500 font-medium">{errors.idNumber}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">رقم الهاتف</label>
              <Input className={`h-11 ${errors.phone ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200'}`} value={addFormData.phone} onChange={e => setAddFormData({...addFormData, phone: e.target.value})} placeholder="05xxxxxxxx" />
              {errors.phone && <p className="text-[10px] text-red-500 font-medium">{errors.phone}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">عدد أفراد العائلة</label>
              <Input className={`h-11 ${errors.familyCount ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200'}`} type="number" value={addFormData.familyCount} onChange={e => setAddFormData({...addFormData, familyCount: Number(e.target.value)})} />
              {errors.familyCount && <p className="text-[10px] text-red-500 font-medium">{errors.familyCount}</p>}
            </div>
          </div>
          <DialogFooter className="flex flex-row gap-3 mt-2">
            <Button onClick={handleAddSubmit} disabled={submitting} className="flex-1 bg-blue-600 font-bold h-11">
              {submitting && <Loader2 className="w-4 h-4 animate-spin ml-2" />} حفظ البيانات
            </Button>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1 h-11">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}