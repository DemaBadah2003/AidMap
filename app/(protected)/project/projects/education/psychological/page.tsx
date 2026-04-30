'use client'

import { useEffect, useMemo, useState } from 'react'
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
  Pencil, 
  Plus, 
  Search, 
  Loader2, 
  HeartHandshake,
  Save,
  X,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'

const BASE_URL = '/api/project/education/psychological' 
const SERVICE_TYPES = ["جلسات فردية", "تفريغ نفسي جماعي", "دعم أطفال", "إرشاد أسري"]

export default function PsychologicalCentersPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState<any>({})
  const [addOpen, setAddOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  // Form States & Errors
  const [centerName, setCenterName] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [specialist, setSpecialist] = useState('')
  const [contact, setContact] = useState('')
  const [appointments, setAppointments] = useState('')
  const [capacity, setCapacity] = useState('')
  const [currentCount, setCurrentCount] = useState('')
  const [serverError, setServerError] = useState<{field?: string, message?: string}>({})

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL)
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) { setItems([]) } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const validatePhone = (phone: string) => {
    const regex = /^(056|059)\d{7}$/
    return regex.test(phone)
  }

  const isAddFormComplete = () => {
    return centerName && serviceType && specialist && validatePhone(contact) && appointments && capacity && currentCount
  }

  const onAdd = async () => {
    if (!isAddFormComplete()) return;
    setSubmitting(true)
    setServerError({})
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: centerName, service: serviceType, spec: specialist, phone: contact,
          appts: appointments, cap: capacity, count: currentCount,
          status: Number(currentCount) >= Number(capacity) ? 'ممتلئ' : 'متاح'
        })
      })
      const result = await res.json();
      if (res.ok) {
        fetchData();
        setAddOpen(false);
        resetForm();
      } else {
        if (result.error.includes("اسم المركز")) setServerError({field: 'name', message: result.error});
        else if (result.error.includes("رقم الهاتف")) setServerError({field: 'phone', message: result.error});
      }
    } finally { setSubmitting(false) }
  }

  const handleInlineSave = async (id: string) => {
    if (!editForm.centerName || !validatePhone(editForm.phoneNumber)) return;
    setServerError({});
    try {
      const res = await fetch(`${BASE_URL}?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.centerName, spec: editForm.specialist, phone: editForm.phoneNumber,
          cap: editForm.capacity, count: editForm.currentCount,
          status: Number(editForm.currentCount) >= Number(editForm.capacity) ? 'ممتلئ' : 'متاح'
        })
      })
      if (res.ok) { setEditingId(null); fetchData(); }
      else { const r = await res.json(); setServerError({field: 'edit', message: r.error}); }
    } catch (err) { console.error(err) }
  }

  const resetForm = () => {
    setCenterName(''); setServiceType(''); setSpecialist(''); setContact('');
    setAppointments(''); setCapacity(''); setCurrentCount(''); setServerError({});
  }

  const filteredItems = useMemo(() => {
    return items.filter(i => !q || i.centerName?.includes(q) || i.specialist?.includes(q))
  }, [q, items])

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredItems.slice(start, start + pageSize)
  }, [filteredItems, currentPage, pageSize])

  const totalPages = Math.ceil(filteredItems.length / pageSize)

  return (
    <div className="w-full px-4 py-6 font-arabic text-right" dir="rtl">
      <div className="mb-6 flex items-center gap-2">
        <HeartHandshake className="w-6 h-6 text-purple-600" />
        <h1 className="text-2xl font-bold text-slate-900">إدارة مراكز الدعم النفسي</h1>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl bg-white">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row items-center gap-3 border-b bg-white sticky top-0 z-10">
            <div className="relative w-full max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={q} onChange={(e) => {setQ(e.target.value); setCurrentPage(1);}} placeholder="ابحث عن مركز..." className="pr-10 h-10 bg-slate-50 border-none text-right" />
            </div>
            <Button onClick={() => setAddOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white mr-auto h-10">
              <Plus className="h-4 w-4 ml-2" /> إضافة مركز دعم
            </Button>
          </div>

          <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
            <table className="w-full text-right text-sm relative border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-20 shadow-sm">
                <tr>
                  <th className="p-4 font-bold text-slate-500 border-b">اسم المركز</th>
                  <th className="p-4 font-bold text-slate-500 border-b">الأخصائي</th>
                  <th className="p-4 font-bold text-slate-500 border-b">رقم الهاتف</th>
                  <th className="p-4 font-bold text-slate-500 border-b">السعة</th>
                  <th className="p-4 font-bold text-slate-500 border-b">الموجود</th>
                  <th className="p-4 font-bold text-slate-500 border-b">الحالة</th>
                  <th className="p-4 text-center font-bold text-slate-500 border-b">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                   <tr><td colSpan={7} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-purple-600" /></td></tr>
                ) : paginatedItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    {editingId === item.id ? (
                      <>
                        <td className="p-2">
                          <Input value={editForm.centerName} onChange={e => setEditForm({...editForm, centerName: e.target.value})} className="h-8 text-xs text-right" />
                          {serverError.field === 'edit' && serverError.message?.includes("الاسم") && <p className="text-[8px] text-red-500">{serverError.message}</p>}
                        </td>
                        <td className="p-2"><Input value={editForm.specialist} onChange={e => setEditForm({...editForm, specialist: e.target.value})} className="h-8 text-xs text-right" /></td>
                        <td className="p-2">
                          <Input value={editForm.phoneNumber} onChange={e => setEditForm({...editForm, phoneNumber: e.target.value})} className={`h-8 text-xs text-right font-mono ${editForm.phoneNumber && !validatePhone(editForm.phoneNumber) ? 'border-red-500' : ''}`} />
                          {editForm.phoneNumber && !validatePhone(editForm.phoneNumber) && <p className="text-[8px] text-red-500">يجب أن يبدأ بـ 056 أو 059</p>}
                        </td>
                        <td className="p-2"><Input type="number" value={editForm.capacity} onChange={e => setEditForm({...editForm, capacity: e.target.value})} className="h-8 text-xs text-right" /></td>
                        <td className="p-2"><Input type="number" value={editForm.currentCount} onChange={e => setEditForm({...editForm, currentCount: e.target.value})} className="h-8 text-xs text-right" /></td>
                        <td colSpan={2} className="p-2 text-center flex justify-center gap-2">
                           <Button onClick={() => handleInlineSave(item.id)} variant="ghost" size="sm" className="text-green-600"><Save size={14}/></Button>
                           <Button onClick={() => {setEditingId(null); setServerError({});}} variant="ghost" size="sm" className="text-red-600"><X size={14}/></Button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 font-bold text-purple-900">{item.centerName}</td>
                        <td className="p-4">{item.specialist}</td>
                        <td className="p-4 text-blue-600 font-mono">{item.phoneNumber}</td>
                        <td className="p-4">{item.capacity}</td>
                        <td className="p-4 font-bold">{item.currentCount}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${item.status === 'ممتلئ' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                           <button onClick={() => { setEditingId(item.id); setEditForm({...item}); setServerError({}); }} className="p-2 text-slate-400 hover:text-purple-600"><Pencil className="w-4 h-4"/></button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t bg-slate-50 flex items-center justify-between">
            {/* اليمين: رقم الصفحة + Droplist */}
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500 font-bold">صفحة {currentPage} من {totalPages || 1}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold">عرض:</span>
                <select 
                  value={pageSize} 
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="h-8 border border-slate-200 rounded-md text-xs px-2 bg-white outline-none focus:ring-1 focus:ring-purple-600 cursor-pointer"
                >
                  {[5, 10, 15, 20].map(size => <option key={size} value={size}>{size}</option>)}
                </select>
              </div>
            </div>

            {/* اليسار: أزرار التنقل فقط */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2 border-slate-200"
              >
                 <ChevronRight className="h-4 w-4 ml-1" /> السابق
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 px-2 border-slate-200"
              >
                التالي <ChevronLeft className="h-4 w-4 mr-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="max-w-md font-arabic text-right">
          <DialogHeader><DialogTitle className="text-right text-purple-900 font-bold">إضافة مركز دعم جديد</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2 text-right">
            <div>
              <label className="text-xs font-bold mb-1 block">اسم المركز</label>
              <Input value={centerName} onChange={e => {setCenterName(e.target.value); setServerError({});}} className={`text-right ${serverError.field === 'name' ? 'border-red-500' : ''}`} />
              {serverError.field === 'name' && <p className="text-[10px] text-red-500 mt-1">{serverError.message}</p>}
            </div>
            <div>
              <label className="text-xs font-bold mb-1 block">رقم الهاتف</label>
              <Input value={contact} onChange={e => {setContact(e.target.value); setServerError({});}} className={`text-right ${contact && !validatePhone(contact) || serverError.field === 'phone' ? 'border-red-500' : ''}`} />
              {contact && !validatePhone(contact) && <p className="text-[10px] text-red-500 mt-1">يجب أن يبدأ بـ 056 أو 059</p>}
              {serverError.field === 'phone' && <p className="text-[10px] text-red-500 mt-1">{serverError.message}</p>}
            </div>
            <div><label className="text-xs font-bold mb-1 block">نوع الخدمة</label>
              <select className="w-full border rounded-lg h-10 px-2 text-sm text-right" value={serviceType} onChange={e => setServiceType(e.target.value)}>
                <option value="">اختر...</option>
                {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2 text-right">
              <div><label className="text-xs font-bold mb-1 block">السعة</label><Input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} /></div>
              <div><label className="text-xs font-bold mb-1 block">الموجود</label><Input type="number" value={currentCount} onChange={e => setCurrentCount(e.target.value)} /></div>
            </div>
            <div><label className="text-xs font-bold mb-1 block">الأخصائي</label><Input value={specialist} onChange={e => setSpecialist(e.target.value)} /></div>
          </div>
          <DialogFooter className="flex flex-row-reverse gap-2 sm:justify-start">
            <Button onClick={onAdd} disabled={!isAddFormComplete() || submitting} className="flex-1 bg-purple-600 hover:bg-purple-700">حفظ المركز</Button>
            <Button onClick={() => setAddOpen(false)} variant="outline" className="flex-1 border-slate-200">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}