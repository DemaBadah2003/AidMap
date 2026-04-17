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
  AlertCircle, 
} from 'lucide-react'

// تعريف نوع البيانات لمركز الدعم النفسي
type TherapyCenter = {
  id: string
  centerName: string          // اسم المركز
  serviceType: string         // نوع الخدمة
  specialistName: string      // اسم الأخصائي
  contactMethod: string       // وسيلة تواصل سريعة
  activitySchedule: string    // مواعيد الأنشطة
  capacity: number            // السعة القصوى
  currentCount: number        // العدد الحالي
}

const BASE_URL = '/api/project/projects/therapy-centers'
const topControlHeight = 'h-10'
const inputBaseClass = 'w-full min-w-0 rounded-lg border-slate-200 bg-white text-right text-xs sm:text-sm outline-none focus:!ring-2 focus:!ring-slate-100 font-normal'
const selectBaseClass = 'w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-right text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-100 font-normal'

export default function TherapyCentersPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<TherapyCenter[]>([])
  const [loading, setLoading] = useState(true)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  // Add Form States
  const [addOpen, setAddOpen] = useState(false)
  const [formData, setFormData] = useState({
    centerName: '',
    serviceType: '',
    specialistName: '',
    contactMethod: '',
    activitySchedule: '',
    capacity: 0,
    currentCount: 0
  })

  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const fetchCenters = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL)
      const data = await res.json()
      setItems(data)
    } catch (err) { console.error('Fetch error:', err) } 
    finally { setLoading(false) }
  }

  useEffect(() => { fetchCenters() }, [])

  const isFormValid = (data: any) => {
    return data.centerName.trim() !== '' && data.serviceType !== '' && data.specialistName !== '' && data.contactMethod !== ''
  }

  const onAdd = async () => {
    if (!isFormValid(formData)) return
    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        await fetchCenters()
        setAddOpen(false)
        resetForm()
        setCurrentPage(1)
      }
    } finally { setSubmitting(false) }
  }

  const resetForm = () => {
    setFormData({
      centerName: '', serviceType: '', specialistName: '', 
      contactMethod: '', activitySchedule: '', capacity: 0, currentCount: 0
    })
  }

  const filtered = useMemo(() => {
    return items.filter((c) => {
      return !q || c.centerName.includes(q) || c.specialistName.includes(q) || c.serviceType.includes(q)
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
        <h1 className="text-2xl font-bold text-slate-900">إدارة مراكز الدعم النفسي</h1>
        <p className="text-sm text-slate-500 mt-1 font-normal">الرئيسية &gt; مراكز الدعم</p>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl bg-white">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row items-center gap-3 border-b">
            <div className="relative w-full max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="بحث عن مركز أو أخصائي..."
                className={`${inputBaseClass} ${topControlHeight} pr-10 bg-slate-50 border-none`}
              />
            </div>

            <Button
              onClick={() => setAddOpen(true)}
              className={`bg-purple-600 text-white hover:bg-purple-700 ${topControlHeight} px-4 rounded-lg mr-auto shadow-sm`}
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة مركز دعم
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="p-4 text-slate-500 font-bold">اسم المركز</th>
                  <th className="p-4 text-slate-500 font-bold">نوع الخدمة</th>
                  <th className="p-4 text-slate-500 font-bold">الأخصائي</th>
                  <th className="p-4 text-slate-500 font-bold">التواصل</th>
                  <th className="p-4 text-center text-slate-500 font-bold">المواعيد</th>
                  <th className="p-4 text-center text-slate-500 font-bold">الحالات</th>
                  <th className="p-4 text-center text-slate-500 font-bold">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-arabic">
                {loading ? (
                  <tr><td colSpan={7} className="p-20 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />جاري التحميل...</td></tr>
                ) : paginatedData.length === 0 ? (
                  <tr><td colSpan={7} className="p-20 text-center text-slate-400 italic">لا توجد نتائج مطابقة لبحثك.</td></tr>
                ) : paginatedData.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-purple-900">{c.centerName}</td>
                    <td className="p-4 text-xs font-medium text-slate-600">{c.serviceType}</td>
                    <td className="p-4">{c.specialistName}</td>
                    <td className="p-4 text-blue-600 font-mono">{c.contactMethod}</td>
                    <td className="p-4 text-center text-xs">{c.activitySchedule}</td>
                    <td className="p-4 text-center font-bold">{c.currentCount}/{c.capacity}</td>
                    <td className="p-4 text-center">
                      <button className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-md border border-slate-100 text-slate-400">
                        <Pencil className="w-4 h-4"/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 flex items-center justify-between border-t bg-slate-50/30">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>عرض صفوف:</span>
              <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="border rounded h-8 bg-white">
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>السابق</Button>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>التالي</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="max-w-md shadow-2xl border-none rounded-2xl font-arabic overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-right text-lg font-bold text-purple-700">إضافة مركز دعم نفسي</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 py-4 text-right">
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">اسم المركز</label>
               <Input className="h-11 bg-slate-50" value={formData.centerName} onChange={e => setFormData({...formData, centerName: e.target.value})} placeholder="أدخل اسم المركز" />
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">نوع الخدمة</label>
               <select className={`${selectBaseClass} h-11 bg-slate-50`} value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value})}>
                  <option value="">اختر الخدمة</option>
                  <option value="تفريغ نفسي">تفريغ نفسي</option>
                  <option value="جلسات فردية">جلسات فردية</option>
                  <option value="دعم أمهات">دعم أمهات</option>
               </select>
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">اسم الأخصائي</label>
               <Input className="h-11 bg-slate-50" value={formData.specialistName} onChange={e => setFormData({...formData, specialistName: e.target.value})} placeholder="أدخل اسم الأخصائي" />
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">وسيلة التواصل (واتساب/اتصال)</label>
               <Input className="h-11 bg-slate-50" value={formData.contactMethod} onChange={e => setFormData({...formData, contactMethod: e.target.value})} placeholder="059xxxxxxx" />
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">مواعيد الأنشطة</label>
               <Input className="h-11 bg-slate-50" value={formData.activitySchedule} onChange={e => setFormData({...formData, activitySchedule: e.target.value})} placeholder="مثال: يومياً من 4 لـ 6 مساءً" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-700">السعة القصوى</label>
                 <Input type="number" className="h-11 bg-slate-50" value={formData.capacity || ''} onChange={e => setFormData({...formData, capacity: Number(e.target.value)})} />
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-700">الحالات الحالية</label>
                 <Input type="number" className="h-11 bg-slate-50" value={formData.currentCount || ''} onChange={e => setFormData({...formData, currentCount: Number(e.target.value)})} />
              </div>
            </div>
          </div>
          
          <DialogFooter className="mt-2 flex flex-row items-center gap-3 w-full">
            <Button onClick={onAdd} disabled={submitting || !isFormValid(formData)} className="flex-1 bg-purple-600 hover:bg-purple-700 h-11 rounded-xl">
              حفظ المركز
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1 h-11 rounded-xl">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}