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
  DialogDescription,
  DialogFooter,
} from '../../../../../../components/ui/dialog'
import { Pencil, Save, X, Plus, Search, MapPin } from 'lucide-react'

// --- الأنواع والتنسيقات ---
type Supervisor = {
  id: string
  nameAr: string
  phone: string
  area: string
  status: 'نشط' | 'موقوف'
}

type SupervisorApiItem = {
  id: string
  name: string      
  phone: string | null
  area: string | null
  status: 'ACTIVE' | 'INACTIVE'
}

const API_URL = '/api/project/camp/supervisior'

const areaMap: Record<string, string> = {
  'east': 'شرق',
  'west': 'غرب',
  'north': 'شمال',
  'middle': 'وسطى',
  'south': 'جنوب',
}

// --- الدوال المساعدة ---
const normalizePhone = (value: string) => value.replace(/[^\d]/g, '')
const isValidPalestinePhone = (phone: string) => /^(056|059)\d{7}$/.test(phone)
const isValidName = (name: string) => name.trim().length >= 3
const toUiStatus = (status?: string): Supervisor['status'] => (status === 'INACTIVE' ? 'موقوف' : 'نشط')

async function requestJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options?.headers ?? {}),
    },
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message ?? `خطأ: ${res.status}`)
  return data as T
}

export default function SupervisorsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Supervisor[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all')
  
  const [addOpen, setAddOpen] = useState(false)
  const [nameAr, setNameAr] = useState('')
  const [phone, setPhone] = useState('')
  const [area, setArea] = useState('') 
  const [status, setStatus] = useState<Supervisor['status']>('نشط')
  const [submitting, setSubmitting] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Omit<Supervisor, 'id'>>({
    nameAr: '', phone: '', area: '', status: 'نشط'
  })
  
  const [editErrors, setEditErrors] = useState<{name?: string, phone?: string}>({})
  const [fieldErrors, setFieldErrors] = useState<{name?: string, phone?: string, area?: string}>({})

  const fetchSupervisors = async () => {
    setLoading(true)
    try {
      const data = await requestJSON<SupervisorApiItem[]>(statusFilter !== 'all' ? `${API_URL}?status=${statusFilter}` : API_URL)
      setItems(data.map(x => ({
        id: x.id,
        nameAr: x.name,
        phone: x.phone ?? '',
        area: x.area ?? '',
        status: toUiStatus(x.status)
      })))
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'فشل تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSupervisors() }, [statusFilter])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return items.filter(sp => !s || sp.nameAr.toLowerCase().includes(s) || sp.phone.includes(s))
  }, [q, items])

  const onAdd = async () => {
    const errors: any = {}
    if (!isValidName(nameAr)) errors.name = 'الاسم يجب أن يكون 3 حروف على الأقل'
    if (!isValidPalestinePhone(phone)) errors.phone = 'رقم الجوال غير صحيح (يجب أن يبدأ بـ 056 أو 059)'
    
    // فحص التكرار عند الإضافة
    if (items.some(sp => sp.phone === normalizePhone(phone))) {
        errors.phone = 'رقم الجوال مسجل مسبقاً لمشرف آخر'
    }

    if (!area) errors.area = 'يرجى اختيار المنطقة'
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setSubmitting(true)
    setFieldErrors({})
    try {
      const created = await requestJSON<SupervisorApiItem>(API_URL, {
        method: 'POST',
        body: JSON.stringify({
          name: nameAr,
          phone: normalizePhone(phone),
          area,
          status: status === 'نشط' ? 'ACTIVE' : 'INACTIVE',
        }),
      })
      setItems(prev => [{ 
        id: created.id, 
        nameAr: created.name, 
        phone: created.phone || '', 
        area: created.area || '', 
        status: toUiStatus(created.status) 
      }, ...prev])
      setAddOpen(false)
      setNameAr(''); setPhone(''); setArea(''); setStatus('نشط')
    } catch (err: any) { 
        setFieldErrors({ phone: err.message.includes('phone') || err.message.includes('مسجل') ? 'رقم الجوال مسجل مسبقاً' : undefined })
    } finally { setSubmitting(false) }
  }

  const saveEditRow = async (id: string) => {
    const errors: any = {}
    const normalizedEditPhone = normalizePhone(editDraft.phone)

    if (!isValidName(editDraft.nameAr)) errors.name = 'الاسم غير صحيح'
    
    // شرط التحقق من صيغة رقم الجوال
    if (!isValidPalestinePhone(normalizedEditPhone)) {
        errors.phone = 'رقم الجوال غير صحيح (يجب أن يبدأ بـ 056 أو 059)'
    } 
    // شرط منع تكرار الرقم مع مشرف آخر غير الذي يتم تعديله حالياً
    else if (items.some(sp => sp.phone === normalizedEditPhone && sp.id !== id)) {
        errors.phone = 'رقم الجوال مسجل مسبقاً لمشرف آخر'
    }
    
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors)
      return
    }

    try {
      const updated = await requestJSON<SupervisorApiItem>(`${API_URL}?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          name: editDraft.nameAr, 
          phone: normalizedEditPhone, 
          area: editDraft.area, 
          status: editDraft.status === 'نشط' ? 'ACTIVE' : 'INACTIVE' 
        }),
      })
      setItems(prev => prev.map(sp => sp.id === id ? { 
        ...sp, 
        nameAr: updated.name, 
        phone: updated.phone || '', 
        area: updated.area || '', 
        status: toUiStatus(updated.status) 
      } : sp))
      setEditingId(null)
      setEditErrors({})
    } catch (err: any) { 
        setEditErrors({ phone: 'خطأ: الرقم مسجل بالفعل أو حدث فشل في التحديث' })
    }
  }

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, filtered.length)
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="w-full px-3 py-6 sm:px-6" dir="rtl">
      <div className="mb-6 text-right">
        <h1 className="text-2xl font-bold text-slate-800 font-sans">المشرفون</h1>
        <p className="text-sm text-slate-500">الرئيسية <span className="mx-1">{'>'}</span> <span className="text-slate-800">إدارة المشرفين</span></p>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 border-b border-slate-100 bg-white">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-[260px]">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    value={q} onChange={(e) => setQ(e.target.value)} 
                    placeholder="ابحث عن مشرف" className="pr-9" 
                  />
                </div>
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm sm:w-[160px] outline-none focus:ring-2 focus:ring-slate-100"
                >
                  <option value="all">كل الحالات</option>
                  <option value="active">نشط</option>
                  <option value="blocked">موقوف</option>
                </select>
              </div>

              <Button onClick={() => { setAddOpen(true); setFieldErrors({}); }} className="bg-blue-600 hover:bg-blue-700 font-semibold gap-2">
                <Plus className="h-4 w-4" /> إضافة مشرف
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-sans">
                <tr>
                  <th className="px-4 py-3 font-semibold">المشرف</th>
                  <th className="px-4 py-3 font-semibold">رقم الجوال</th>
                  <th className="px-4 py-3 font-semibold">المنطقة</th>
                  <th className="px-4 py-3 font-semibold">الحالة</th>
                  <th className="px-4 py-3 font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="py-10 text-center text-slate-400 font-medium">جاري تحميل البيانات...</td></tr>
                ) : pageItems.length > 0 ? pageItems.map((sp) => {
                  const isEditing = editingId === sp.id
                  return (
                    <tr key={sp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        {isEditing ? (
                            <div className="space-y-1">
                                <Input className={editErrors.name ? 'border-red-500' : ''} value={editDraft.nameAr} onChange={e => setEditDraft({...editDraft, nameAr: e.target.value})} />
                                {editErrors.name && <p className="text-[10px] text-red-500">{editErrors.name}</p>}
                            </div>
                        ) : sp.nameAr}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {isEditing ? (
                            <div className="space-y-1">
                                <Input className={editErrors.phone ? 'border-red-500' : ''} value={editDraft.phone} onChange={e => setEditDraft({...editDraft, phone: e.target.value})} maxLength={10} />
                                {editErrors.phone && <p className="text-[10px] text-red-500 font-sans">{editErrors.phone}</p>}
                            </div>
                        ) : sp.phone}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {isEditing ? (
                          <select className="h-9 border rounded-md px-2 w-full" value={editDraft.area} onChange={e => setEditDraft({...editDraft, area: e.target.value})}>
                             <option value="east">شرق</option>
                             <option value="west">غرب</option>
                             <option value="north">شمال</option>
                             <option value="middle">وسطى</option>
                             <option value="south">جنوب</option>
                          </select>
                        ) : <div className="flex items-center gap-1"><MapPin className="size-3 text-slate-400" />{areaMap[sp.area] || sp.area}</div>}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select className="h-9 border rounded-md px-2 w-full" value={editDraft.status} onChange={e => setEditDraft({...editDraft, status: e.target.value as any})}>
                            <option value="نشط">نشط</option>
                            <option value="موقوف">موقوف</option>
                          </select>
                        ) : (
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${sp.status === 'نشط' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{sp.status}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {isEditing ? (
                            <>
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-8 px-2" onClick={() => saveEditRow(sp.id)}><Save className="size-4" /></Button>
                              <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => { setEditingId(null); setEditErrors({}); }}><X className="size-4" /></Button>
                            </>
                          ) : (
                            <Button size="sm" variant="outline" className="text-slate-600 hover:text-blue-600 h-9 w-9 p-0" onClick={() => {
                              setEditingId(sp.id); 
                              setEditDraft({ nameAr: sp.nameAr, phone: sp.phone, area: sp.area, status: sp.status });
                              setEditErrors({});
                            }}><Pencil className="size-4" /></Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                }) : <tr><td colSpan={5} className="py-10 text-center text-slate-400">لا توجد بيانات للمشرفين</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="text-sm text-slate-600 font-medium font-sans">عرض {rangeStart} - {rangeEnd} من {filtered.length}</div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>السابق</Button>
              <div className="h-9 px-3 flex items-center bg-white border rounded-md text-blue-600 font-bold text-sm">{page} / {Math.max(1, Math.ceil(filtered.length / pageSize))}</div>
              <Button size="sm" variant="outline" disabled={page >= Math.ceil(filtered.length / pageSize)} onClick={() => setPage(p => p + 1)}>التالي</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="text-xl font-sans">إضافة مشرف جديد</DialogTitle>
            <DialogDescription className="font-sans">يرجى إدخال بيانات المشرف وتحديد منطقته بدقة.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5 text-right">
              <label className="text-sm font-bold text-slate-700">الاسم <span className="text-red-500">*</span></label>
              <Input className={fieldErrors.name ? 'border-red-500' : ''} placeholder="الاسم الثلاثي" value={nameAr} onChange={e => setNameAr(e.target.value)} />
              {fieldErrors.name && <p className="text-xs text-red-500">{fieldErrors.name}</p>}
            </div>
            <div className="space-y-1.5 text-right">
              <label className="text-sm font-bold text-slate-700">الجوال <span className="text-red-500">*</span></label>
              <Input className={fieldErrors.phone ? 'border-red-500' : ''} placeholder="059xxxxxxx" value={phone} onChange={e => setPhone(normalizePhone(e.target.value))} maxLength={10} />
              {fieldErrors.phone && <p className="text-xs text-red-500">{fieldErrors.phone}</p>}
            </div>
            <div className="space-y-1.5 text-right">
              <label className="text-sm font-bold text-slate-700">المنطقة <span className="text-red-500">*</span></label>
              <select className={`w-full h-11 border rounded-md px-3 outline-none focus:ring-2 focus:ring-blue-100 font-sans ${fieldErrors.area ? 'border-red-500' : ''}`} value={area} onChange={e => setArea(e.target.value)}>
                <option value="">اختر المنطقة...</option>
                <option value="east">شرق</option>
                <option value="west">غرب</option>
                <option value="north">شمال</option>
                <option value="middle">وسطى</option>
                <option value="south">جنوب</option>
              </select>
              {fieldErrors.area && <p className="text-xs text-red-500">{fieldErrors.area}</p>}
            </div>
            <div className="space-y-1.5 text-right">
              <label className="text-sm font-bold text-slate-700 font-sans">الحالة</label>
              <select className="w-full h-11 border rounded-md px-3 outline-none focus:ring-2 focus:ring-blue-100 font-sans" value={status} onChange={e => setStatus(e.target.value as any)}>
                <option value="نشط">نشط</option>
                <option value="موقوف">موقوف</option>
              </select>
            </div>
          </div>
          <DialogFooter className="flex flex-row-reverse gap-2 border-t pt-4">
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={onAdd} disabled={submitting}>
              {submitting ? 'جاري الحفظ...' : 'حفظ البيانات'}
            </Button>
            <Button className="flex-1 font-sans" variant="outline" onClick={() => setAddOpen(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}