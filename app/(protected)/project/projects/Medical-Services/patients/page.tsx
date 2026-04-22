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
  DialogFooter,
} from '../../../../../../components/ui/dialog'
import { 
  Pencil, 
  Plus, 
  Search, 
  Loader2, 
  AlertCircle 
} from 'lucide-react'

type Patient = {
  id: string
  name: string
  phone: string
  diseaseType: string
}

const BASE_URL = '/api/project/projects/medical/patients'
const topControlHeight = 'h-10'
const inputBaseClass = 'w-full min-w-0 rounded-lg border-slate-200 bg-white text-right text-xs sm:text-sm outline-none focus:!ring-2 focus:!ring-slate-100 font-normal'

export default function PatientsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5) 

  const [addOpen, setAddOpen] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [diseaseType, setDiseaseType] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchPatients = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL)
      const data = await res.json()
      setItems(data)
    } catch (err) { console.error('Fetch error:', err) } 
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPatients() }, [])

  const isPhoneValid = useMemo(() => {
    const phoneRegex = /^(056|059)\d{7}$/
    return phoneRegex.test(phone)
  }, [phone])

  const isAddValid = useMemo(() => {
    return (
      name.trim() !== '' && 
      diseaseType.trim() !== '' && 
      isPhoneValid
    )
  }, [name, diseaseType, isPhoneValid])

  const onAdd = async () => {
    if (!isAddValid) return
    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, diseaseType })
      })
      if (res.ok) {
        await fetchPatients()
        setAddOpen(false)
        resetAddForm()
        setCurrentPage(1)
      }
    } finally { setSubmitting(false) }
  }

  const resetAddForm = () => {
    setName(''); setPhone(''); setDiseaseType('');
  }

  const filtered = useMemo(() => {
    return items.filter((p) => {
      return !q || p.name.includes(q) || p.phone.includes(q) || p.diseaseType.includes(q)
    })
  }, [q, items])

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage, itemsPerPage])

  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const rangeEnd = Math.min(currentPage * itemsPerPage, filtered.length)

  return (
    <div className="w-full px-4 py-6" dir="rtl">
      <div className="mb-6 text-right">
        <h1 className="text-2xl font-bold text-slate-900">إدارة المرضى</h1>
        <p className="text-sm text-slate-500 mt-1 font-normal">الرئيسية &gt; جدول المرضى</p>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl bg-white">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row items-center gap-3 border-b">
            <div className="relative w-full max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث بالاسم أو الهاتف..."
                className={`${inputBaseClass} ${topControlHeight} pr-10 bg-slate-50 border-none`}
              />
            </div>

            <Button
              onClick={() => setAddOpen(true)}
              className={`bg-blue-600 text-white hover:bg-blue-700 ${topControlHeight} px-4 rounded-lg mr-auto shadow-sm font-bold`}
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة مريض
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="p-4 text-slate-500 font-bold">اسم المريض</th>
                  <th className="p-4 text-slate-500 font-bold">نوع المرض</th>
                  <th className="p-4 text-center text-slate-500 font-bold">رقم الهاتف</th>
                  <th className="p-4 text-center text-slate-500 font-bold">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-arabic">
                {loading ? (
                  <tr><td colSpan={4} className="p-20 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />جاري التحميل...</td></tr>
                ) : paginatedData.length === 0 ? (
                  <tr><td colSpan={4} className="p-20 text-center text-slate-400 italic">لا توجد بيانات مرضى.</td></tr>
                ) : paginatedData.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-700">{p.name}</td>
                    <td className="p-4 text-slate-600">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[11px] font-bold">{p.diseaseType}</span>
                    </td>
                    <td className="p-4 text-center font-medium text-slate-600">{p.phone}</td>
                    <td className="p-4 text-center text-slate-400"><Pencil className="w-4 h-4 mx-auto cursor-pointer hover:text-blue-600"/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 flex items-center justify-between border-t bg-slate-50/30">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>عرض صفوف:</span>
              <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="border rounded-md h-8 px-1 bg-white outline-none">
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
            </div>
            <div className="flex items-center gap-4 text-sm font-medium">
              <span className="text-slate-500">{rangeStart} - {rangeEnd} من {filtered.length}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 border-slate-200" disabled={currentPage <= 1} onClick={() => setCurrentPage(prev => prev - 1)}>السابق</Button>
                <Button variant="outline" size="sm" className="h-8 border-slate-200" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>التالي</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="max-w-md font-arabic rounded-2xl shadow-2xl">
          <DialogHeader><DialogTitle className="text-right text-lg font-bold">إضافة مريض جديد</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-4 text-right">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">اسم المريض</label>
              <Input 
                className="h-11 bg-slate-50" 
                placeholder="أدخل اسم المريض الرباعي" 
                value={name} 
                onChange={e => setName(e.target.value)} 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">نوع المرض</label>
              <Input 
                className="h-11 bg-slate-50" 
                placeholder="أدخل نوع المرض (مثلاً: سكري، ضغط...)" 
                value={diseaseType} 
                onChange={e => setDiseaseType(e.target.value)} 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">رقم الهاتف</label>
              <Input 
                className={`h-11 text-left bg-slate-50 ${phone && !isPhoneValid ? 'border-red-400 focus:ring-red-100' : 'border-slate-200'}`}
                dir="ltr" 
                placeholder="059XXXXXXX" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
              />
              {phone && !isPhoneValid && (
                <p className="text-[10px] text-red-500 font-medium">يجب أن يبدأ بـ 056 أو 059 ويتكون من 10 أرقام.</p>
              )}
            </div>

            {!isAddValid && (
              <div className="text-[11px] text-amber-600 flex items-center gap-2 bg-amber-50 p-3 rounded-xl border border-amber-100 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0"/> يرجى التأكد من تعبئة كافة الحقول وصحة رقم الهاتف.
              </div>
            )}

          </div>
          <DialogFooter className="flex flex-row gap-3 mt-2">
            <Button onClick={onAdd} disabled={!isAddValid || submitting} className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null} حفظ البيانات
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1 h-11 rounded-xl font-medium">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}