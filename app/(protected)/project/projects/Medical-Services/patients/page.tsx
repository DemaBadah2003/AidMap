'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Check, X, Pencil, Plus, Search, Loader2, ChevronRight, ChevronLeft } from 'lucide-react'

type Patient = {
  id: string;
  name: string;
  nationalId: string;
  age: string;
  address: string;
  phone: string;
  hospitalId: string;
  hospital?: { name: string };
}

type Hospital = { id: string; name: string; }

const BASE_URL = '/api/project/Medical-Services/patients'

export default function PatientsPage() {
  const [items, setItems] = useState<Patient[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', nationalId: '', age: '', address: '', phone: '', hospitalId: '' })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Patient>>({})

  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [submitting, setSubmitting] = useState(false)

  // --- دالة التحقق المركزية (تستخدم للإضافة والتعديل) ---
  const validate = (formData: any, currentId: string | null = null) => {
    let newErrors: { [key: string]: string } = {}
    
    // 1. الاسم الرباعي وتكراره
    const nameParts = formData.name?.trim().split(/\s+/) || []
    if (nameParts.length < 4) {
      newErrors.name = "يجب إدخال الاسم رباعياً"
    } else {
      const isNameExists = items.some(p => p.name === formData.name && p.id !== currentId)
      if (isNameExists) newErrors.name = "هذا الاسم مسجل مسبقاً"
    }

    // 2. رقم الهوية 9 أرقام وتكراره
    if (!/^\d{9}$/.test(formData.nationalId)) {
      newErrors.nationalId = "يجب أن يتكون من 9 أرقام"
    } else {
      const isIdExists = items.some(p => p.nationalId === formData.nationalId && p.id !== currentId)
      if (isIdExists) newErrors.nationalId = "رقم الهوية مسجل مسبقاً"
    }

    // 3. اختيار المستشفى
    if (!formData.hospitalId) newErrors.hospitalId = "يرجى اختيار المستشفى"

    // 4. رقم الهاتف (056 أو 059) وتكراره
    const phoneRegex = /^(056|059)\d{7}$/
    if (!formData.phone || !phoneRegex.test(formData.phone)) {
      newErrors.phone = "يبدأ بـ 056 أو 059"
    } else {
      const isPhoneExists = items.some(p => p.phone === formData.phone && p.id !== currentId)
      if (isPhoneExists) newErrors.phone = "الهاتف مستخدم مسبقاً"
    }

    // 5. العمر
    const ageNum = Number(formData.age)
    if (!formData.age || isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
      newErrors.age = "بين 1 و 150"
    }

    // 6. العنوان
    if (!formData.address || formData.address.trim() === "") {
      newErrors.address = "العنوان مطلوب"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, hRes] = await Promise.all([
        fetch(BASE_URL),
        fetch(`${BASE_URL}?type=hospitals`)
      ])
      const pData = await pRes.json()
      const hData = await hRes.json()
      setItems(pData.patients || [])
      setHospitals(hData || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const onAdd = async () => {
    if (!validate(addForm)) return
    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm)
      })
      if (res.ok) {
        await fetchData(); setAddOpen(false); setErrors({});
        setAddForm({ name: '', nationalId: '', age: '', address: '', phone: '', hospitalId: '' })
      }
    } finally { setSubmitting(false) }
  }

  const handleUpdate = async (id: string) => {
    // التحقق من البيانات أثناء التعديل
    if (!validate(editForm, id)) return
    
    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editForm })
      })
      if (res.ok) { 
        await fetchData(); 
        setEditingId(null); 
        setErrors({}); 
      }
    } finally { setSubmitting(false) }
  }

  const filtered = useMemo(() => items.filter(p =>
    p.name.includes(q) || p.nationalId.includes(q)
  ), [q, items])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage, pageSize])

  return (
    <div className="w-full px-2 md:px-4 py-6 font-sans text-right overflow-hidden" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800">إدارة سجلات المرضى</h1>
      </div>

      <Card className="rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col w-full">
        <CardContent className="p-0">
          <div className="p-4 border-b bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="بحث باسم المريض أو الهوية..." className="pr-9 bg-white" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Button onClick={() => { setErrors({}); setAddOpen(true) }} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="ml-2 h-4 w-4" /> إضافة مريض جديد
            </Button>
          </div>

          <div className="w-full overflow-x-auto border-b border-slate-200">
            <div className="max-h-[500px] overflow-y-auto relative">
              <table className="w-full text-sm min-w-[1000px] border-collapse table-fixed">
                <thead className="bg-slate-100 border-b font-bold text-slate-600 sticky top-0 z-20 shadow-sm">
                  <tr>
                    <th className="p-4 text-right bg-slate-100 w-1/4">اسم المريض</th>
                    <th className="p-4 text-right bg-slate-100">رقم الهوية</th>
                    <th className="p-4 text-right bg-slate-100">المستشفى</th>
                    <th className="p-4 text-right bg-slate-100 w-24">العمر</th>
                    <th className="p-4 text-right bg-slate-100">رقم الهاتف</th>
                    <th className="p-4 text-right bg-slate-100">العنوان</th>
                    <th className="p-4 text-center bg-slate-100 w-24">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y bg-white">
                  {paginatedItems.map((p) => (
                    <tr key={p.id} className={editingId === p.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'}>
                      {editingId === p.id ? (
                        <>
                          <td className="p-2 align-top">
                            <Input className={errors.name ? "border-red-500" : ""} value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                            {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name}</p>}
                          </td>
                          <td className="p-2 align-top">
                            <Input className={errors.nationalId ? "border-red-500" : ""} value={editForm.nationalId} onChange={e => setEditForm({...editForm, nationalId: e.target.value})} />
                            {errors.nationalId && <p className="text-[10px] text-red-500 mt-1">{errors.nationalId}</p>}
                          </td>
                          <td className="p-2 align-top">
                             <select className={`w-full border rounded h-9 px-1 bg-white ${errors.hospitalId ? "border-red-500" : ""}`} value={editForm.hospitalId} onChange={e => setEditForm({...editForm, hospitalId: e.target.value})}>
                               {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                             </select>
                             {errors.hospitalId && <p className="text-[10px] text-red-500 mt-1">{errors.hospitalId}</p>}
                          </td>
                          <td className="p-2 align-top">
                            <Input type="number" className={errors.age ? "border-red-500" : ""} value={editForm.age} onChange={e => setEditForm({...editForm, age: e.target.value})} />
                            {errors.age && <p className="text-[10px] text-red-500 mt-1">{errors.age}</p>}
                          </td>
                          <td className="p-2 align-top">
                            <Input className={errors.phone ? "border-red-500" : ""} value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                            {errors.phone && <p className="text-[10px] text-red-500 mt-1">{errors.phone}</p>}
                          </td>
                          <td className="p-2 align-top">
                            <Input className={errors.address ? "border-red-500" : ""} value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
                            {errors.address && <p className="text-[10px] text-red-500 mt-1">{errors.address}</p>}
                          </td>
                          <td className="p-2 text-center flex justify-center gap-1 align-top pt-3">
                            <Button size="sm" variant="ghost" className="text-green-600" onClick={() => handleUpdate(p.id)} disabled={submitting}>
                              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => { setEditingId(null); setErrors({}); }}><X className="h-4 w-4" /></Button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-4 font-bold truncate">{p.name}</td>
                          <td className="p-4 font-mono">{p.nationalId}</td>
                          <td className="p-4"><span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold truncate block text-center">{p.hospital?.name}</span></td>
                          <td className="p-4">{p.age} سنة</td>
                          <td className="p-4 font-mono">{p.phone}</td>
                          <td className="p-4 text-slate-500 truncate">{p.address}</td>
                          <td className="p-4 text-center">
                            <Button variant="ghost" size="sm" onClick={() => { setEditingId(p.id); setEditForm(p); setErrors({}); }}><Pencil className="w-4 h-4 text-slate-400" /></Button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 border-t flex flex-row items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">عرض:</span>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="border rounded px-2 py-1 text-xs bg-white font-bold">
                {[5, 10, 15, 20].map(val => <option key={val} value={val}>{val}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>السابق</Button>
              <div className="text-xs font-bold bg-white border rounded px-3 py-1.5 shadow-sm">{currentPage} / {totalPages || 1}</div>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0}>التالي</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={(val) => { setAddOpen(val); if (!val) setErrors({}); }}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-lg shadow-xl" dir="rtl">
          <DialogHeader><DialogTitle className="text-right font-bold text-lg">إضافة مريض جديد</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-4 text-right">
            <div>
              <label className="text-xs font-bold mb-1 block text-slate-500">الاسم الرباعي</label>
              <Input className={errors.name ? "border-red-500" : ""} placeholder="الاسم الرباعي كاملاً" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} />
              {errors.name && <p className="text-[11px] text-red-500 mt-1 font-bold">{errors.name}</p>}
            </div>
            <div>
              <label className="text-xs font-bold mb-1 block text-slate-500">رقم الهوية</label>
              <Input className={errors.nationalId ? "border-red-500" : ""} placeholder="9 أرقام" value={addForm.nationalId} onChange={e => setAddForm({ ...addForm, nationalId: e.target.value })} />
              {errors.nationalId && <p className="text-[11px] text-red-500 mt-1 font-bold">{errors.nationalId}</p>}
            </div>
            <div>
              <label className="text-xs font-bold mb-1 block text-slate-500">المستشفى</label>
              <select className={`w-full border rounded h-10 px-2 bg-white ${errors.hospitalId ? "border-red-500" : ""}`} value={addForm.hospitalId} onChange={e => setAddForm({ ...addForm, hospitalId: e.target.value })}>
                <option value="">اختر المستشفى</option>
                {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
              {errors.hospitalId && <p className="text-[11px] text-red-500 mt-1 font-bold">{errors.hospitalId}</p>}
            </div>
            <div>
              <label className="text-xs font-bold mb-1 block text-slate-500">العمر</label>
              <Input type="number" className={errors.age ? "border-red-500" : ""} value={addForm.age} onChange={e => setAddForm({ ...addForm, age: e.target.value })} />
              {errors.age && <p className="text-[11px] text-red-500 mt-1 font-bold">{errors.age}</p>}
            </div>
            <div>
              <label className="text-xs font-bold mb-1 block text-slate-500">رقم الهاتف</label>
              <Input className={errors.phone ? "border-red-500" : ""} placeholder="05XXXXXXXX" value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })} />
              {errors.phone && <p className="text-[11px] text-red-500 mt-1 font-bold">{errors.phone}</p>}
            </div>
            <div>
              <label className="text-xs font-bold mb-1 block text-slate-500">العنوان</label>
              <Input className={errors.address ? "border-red-500" : ""} value={addForm.address} onChange={e => setAddForm({ ...addForm, address: e.target.value })} />
              {errors.address && <p className="text-[11px] text-red-500 mt-1 font-bold">{errors.address}</p>}
            </div>
          </div>
          <DialogFooter className="flex flex-row justify-end gap-3 mt-4 border-t pt-4">
            <Button onClick={onAdd} disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold order-1">
              {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'حفظ البيانات'}
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1 order-2">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}