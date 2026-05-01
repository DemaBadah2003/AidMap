'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Search, Loader2, Pencil, Check, X, ChevronRight, ChevronLeft } from 'lucide-react'

// --- Types & Interfaces ---
interface Doctor {
  id: string
  name: string
  phone: string
  specialty: string
  workSchedule: string
  description?: string | null
  hospitalId: string
  departmentId?: string | null
  hospital?: { id: string, name: string }
  department?: { id: string, name: string }
}

interface SelectionOption {
  id: string
  name: string
}

const API_URL = '/api/project/Medical-Services/doctors'

export default function DoctorsPage() {
  const [items, setItems] = useState<Doctor[]>([])
  const [hospitals, setHospitals] = useState<SelectionOption[]>([])
  const [departments, setDepartments] = useState<SelectionOption[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Doctor> | null>(null)

  const initialForm: Partial<Doctor> = { name: '', phone: '', specialty: '', workSchedule: '', description: '', hospitalId: '', departmentId: '' }
  const [addForm, setAddForm] = useState<Partial<Doctor>>(initialForm)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [docRes, hospRes, deptRes] = await Promise.all([
        fetch(API_URL), fetch(`${API_URL}?type=hospitals`), fetch(`${API_URL}?type=departments`)
      ])
      const docsData = await docRes.json()
      setItems(docsData.doctors || [])
      setHospitals(await hospRes.json() || [])
      setDepartments(await deptRes.json() || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = useMemo(() => {
    return items.filter(i => i.name?.toLowerCase().includes(q.toLowerCase()))
  }, [items, q])

  const { currentItems, totalPages } = useMemo(() => {
    const lastIdx = currentPage * itemsPerPage
    const firstIdx = lastIdx - itemsPerPage
    return {
      currentItems: filtered.slice(firstIdx, lastIdx),
      totalPages: Math.ceil(filtered.length / (itemsPerPage || 10)) || 1
    }
  }, [filtered, currentPage, itemsPerPage])

  useEffect(() => { setCurrentPage(1) }, [q])

  // دالة التحقق - تعمل للإضافة والتعديل
  const validate = async (form: Partial<Doctor>, id: string | null = null) => {
    let newErrors: Record<string, string> = {}
    
    // فحص الاسم
    if (!form.name || form.name.trim().length < 3) {
        newErrors.name = "الاسم يجب أن يكون 3 حروف على الأقل"
    }

    // فحص الهاتف (يجب أن يبدأ بـ 056 أو 059 ويتبعه 7 أرقام)
    const phoneRegex = /^(056|059)\d{7}$/
    if (!form.phone) {
      newErrors.phone = "يرجى إدخال رقم الهاتف"
    } else if (!phoneRegex.test(form.phone)) {
      newErrors.phone = "تنسيق الهاتف غير صحيح (059xxxxxxx)"
    } else {
      // فحص التكرار: استثناء الطبيب الحالي في حالة التعديل
      const isDuplicate = items.find(doc => doc.phone === form.phone && doc.id !== id)
      if (isDuplicate) newErrors.phone = "رقم الهاتف مستخدم مسبقاً"
    }

    if (!form.hospitalId) newErrors.hospitalId = "يرجى اختيار المستشفى"
    if (!form.departmentId) newErrors.departmentId = "يرجى اختيار القسم"
    if (!form.workSchedule) newErrors.workSchedule = "يرجى تحديد جدول العمل"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const onAdd = async () => {
    if (!(await validate(addForm))) return
    setSubmitting(true)
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm)
      })
      if (res.ok) {
        await fetchData(); setAddOpen(false); setAddForm(initialForm); setErrors({})
      }
    } catch (err) { console.error(err) }
    finally { setSubmitting(false) }
  }

  const onSaveEdit = async () => {
    // استدعاء التحقق مع تمرير id الطبيب الحالي لمنع تعارض رقم الهاتف مع نفسه
    if (!editForm || !(await validate(editForm, editingId))) return
    
    setSubmitting(true)
    try {
      const res = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, id: editingId })
      })
      if (res.ok) {
        await fetchData(); setEditingId(null); setEditForm(null); setErrors({})
      }
    } catch (err) { console.error(err) }
    finally { setSubmitting(false) }
  }

  const startEdit = (item: Doctor) => {
    setErrors({})
    setEditingId(item.id)
    setEditForm({ ...item, description: item.description || '' })
  }

  return (
    <div className="p-8 font-sans text-right" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">إدارة سجل الأطباء</h1>
      </div>

      <Card className="rounded-2xl border-slate-200 overflow-hidden bg-white shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute right-3 top-3 h-5 w-5 text-slate-400" />
              <Input 
                placeholder="بحث سريع عن طبيب..." 
                className="pr-10 h-11 rounded-xl focus-visible:ring-blue-500 bg-white" 
                value={q} 
                onChange={e => setQ(e.target.value)} 
              />
            </div>
            <Button onClick={() => { setErrors({}); setAddOpen(true) }} className="bg-blue-600 rounded-xl px-6 h-11 text-white hover:bg-blue-700 shadow-md transition-all whitespace-nowrap">
              <Plus className="ml-2 h-5 w-5" /> إضافة طبيب جديد
            </Button>
          </div>

          <div className="overflow-x-auto overflow-y-auto max-h-[400px] relative">
            <table className="w-full text-right text-sm border-collapse">
              <thead className="bg-slate-50 border-b text-slate-600 font-bold sticky top-0 z-20 shadow-sm">
                <tr>
                  <th className="p-4 bg-slate-50">اسم الطبيب</th>
                  <th className="p-4 bg-slate-50">المستشفى</th>
                  <th className="p-4 bg-slate-50">التخصص</th>
                  <th className="p-4 bg-slate-50">رقم التواصل</th>
                  <th className="p-4 bg-slate-50">جدول العمل</th>
                  <th className="p-4 text-center bg-slate-50">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y bg-white">
                {loading ? (
                  <tr><td colSpan={6} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan={6} className="p-10 text-center text-slate-400 font-bold">لا توجد بيانات متاحة</td></tr>
                ) : currentItems.map(item => (
                  <tr key={item.id} className={`transition-colors ${editingId === item.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                    {editingId === item.id && editForm ? (
                      <>
                        <td className="p-2">
                            <Input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className={`h-9 text-xs ${errors.name ? 'border-red-500' : ''}`} />
                            {errors.name && <p className="text-[9px] text-red-500 mt-0.5">{errors.name}</p>}
                        </td>
                        <td className="p-2">
                          <select className="w-full border rounded-md h-9 text-xs" value={editForm.hospitalId} onChange={e => setEditForm({...editForm, hospitalId: e.target.value})}>
                            {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <select className="w-full border rounded-md h-9 text-xs" value={editForm.departmentId || ''} onChange={e => setEditForm({...editForm, departmentId: e.target.value})}>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                            <Input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className={`h-9 text-xs ${errors.phone ? 'border-red-500' : ''}`} dir="ltr" />
                            {errors.phone && <p className="text-[9px] text-red-500 mt-0.5">{errors.phone}</p>}
                        </td>
                        <td className="p-2">
                          <select className="w-full border rounded-md h-9 text-xs" value={editForm.workSchedule} onChange={e => setEditForm({...editForm, workSchedule: e.target.value})}>
                            <option value="السبت، الاثنين، الأربعاء">السبت، الاثنين، الأربعاء</option>
                            <option value="الأحد، الثلاثاء، الخميس">الأحد، الثلاثاء، الخميس</option>
                          </select>
                        </td>
                        <td className="p-2 text-center flex justify-center gap-1">
                          <Button onClick={onSaveEdit} disabled={submitting} className="h-8 w-8 p-0 bg-green-600 text-white rounded-full">
                            {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-4 w-4" />}
                          </Button>
                          <Button onClick={() => { setEditingId(null); setErrors({}); }} className="h-8 w-8 p-0 bg-slate-200 text-slate-600 rounded-full"><X className="h-4 w-4" /></Button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 font-bold text-slate-800">{item.name}</td>
                        <td className="p-4 text-slate-600">{item.hospital?.name}</td>
                        <td className="p-4"><span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold">{item.specialty}</span></td>
                        <td className="p-4 font-mono text-slate-700">{item.phone}</td>
                        <td className="p-4 text-xs text-slate-500">{item.workSchedule}</td>
                        <td className="p-4 text-center">
                          <Button variant="ghost" onClick={() => startEdit(item)} className="text-blue-600 h-9 w-9 p-0 rounded-full"><Pencil className="h-4 w-4" /></Button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && filtered.length > 0 && (
            <div className="p-4 border-t flex items-center justify-between bg-slate-50/50 relative z-30">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500">عدد الأسطر:</span>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} 
                  className="border rounded px-2 py-1 text-xs bg-white outline-none font-bold"
                >
                  {[5, 10, 15, 20].map(val => (<option key={val} value={val}>{val}</option>))}
                </select>
              </div>
              <div className="flex items-center gap-2" dir="rtl">
                <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-bold" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                   <ChevronRight className="h-4 w-4" /> السابق
                </Button>
                <div className="text-xs font-bold px-3 py-1.5 bg-white border rounded-md">{currentPage} / {totalPages}</div>
                <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-bold" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  التالي <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={(val) => { setAddOpen(val); if(!val) setErrors({}); }}>
        <DialogContent className="text-right sm:max-w-[450px] rounded-2xl font-sans p-6" dir="rtl">
          <DialogHeader><DialogTitle className="text-right font-bold text-xl border-b pb-3">إضافة طبيب جديد</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-5 py-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">اسم الطبيب الرباعي</label>
              <Input value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className={errors.name ? 'border-red-500' : ''} />
              {errors.name && <p className="text-[11px] text-red-500">{errors.name}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">المستشفى</label>
              <select className="w-full border rounded-lg p-2.5 h-11 bg-slate-50 text-sm outline-none" value={addForm.hospitalId} onChange={e => setAddForm({...addForm, hospitalId: e.target.value})}>
                <option value="">اختر المستشفى</option>
                {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
              {errors.hospitalId && <p className="text-[11px] text-red-500">{errors.hospitalId}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">القسم</label>
              <select className="w-full border rounded-lg p-2.5 h-11 bg-slate-50 text-sm outline-none" value={addForm.departmentId || ''} onChange={e => setAddForm({...addForm, departmentId: e.target.value, specialty: departments.find(d => d.id === e.target.value)?.name || ''})}>
                <option value="">اختر القسم</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {errors.departmentId && <p className="text-[11px] text-red-500">{errors.departmentId}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">رقم الهاتف</label>
              <Input value={addForm.phone} onChange={e => setAddForm({...addForm, phone: e.target.value})} dir="ltr" className={errors.phone ? 'border-red-500' : ''} />
              {errors.phone && <p className="text-[11px] text-red-500">{errors.phone}</p>}
            </div>
          </div>
          <DialogFooter className="flex gap-2 border-t pt-5">
            <Button onClick={onAdd} disabled={submitting} className="flex-[2] bg-blue-600 text-white hover:bg-blue-700">
              {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'حفظ البيانات'}
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}