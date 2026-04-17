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
  Wifi,
  BatteryCharging 
} from 'lucide-react'

// تعريف نوع البيانات لنقطة الإنترنت
type WifiPoint = {
  id: string
  placeName: string         // اسم المكان (مقهى، بيت، مركز)
  powerSource: string       // مصدر الطاقة
  wifiQuality: string       // جودة الإنترنت
  seatsCount: number        // عدد الكراسي
  isFree: string            // مجانية أم بمقابل
  roadSafetyNotes: string   // أمان الطريق
}

const BASE_URL = '/api/project/projects/wifi-points'
const topControlHeight = 'h-10'
const inputBaseClass = 'w-full min-w-0 rounded-lg border-slate-200 bg-white text-right text-xs sm:text-sm outline-none focus:!ring-2 focus:!ring-slate-100 font-normal'
const selectBaseClass = 'w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-right text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-100 font-normal'

export default function WifiPointsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<WifiPoint[]>([])
  const [loading, setLoading] = useState(true)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  // Add Form States
  const [addOpen, setAddOpen] = useState(false)
  const [formData, setFormData] = useState({
    placeName: '',
    powerSource: '',
    wifiQuality: '',
    seatsCount: 0,
    isFree: '',
    roadSafetyNotes: ''
  })

  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const fetchPoints = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL)
      const data = await res.json()
      setItems(data)
    } catch (err) { console.error('Fetch error:', err) } 
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPoints() }, [])

  const isFormValid = (data: any) => {
    return data.placeName.trim() !== '' && data.powerSource !== '' && data.wifiQuality !== '' && data.isFree !== ''
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
        await fetchPoints()
        setAddOpen(false)
        resetForm()
        setCurrentPage(1)
      }
    } finally { setSubmitting(false) }
  }

  const resetForm = () => {
    setFormData({
      placeName: '', powerSource: '', wifiQuality: '', 
      seatsCount: 0, isFree: '', roadSafetyNotes: ''
    })
  }

  const filtered = useMemo(() => {
    return items.filter((c) => {
      return !q || c.placeName.includes(q) || c.powerSource.includes(q) || c.roadSafetyNotes.includes(q)
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
        <h1 className="text-2xl font-bold text-slate-900">نقاط الإنترنت للدراسة</h1>
        <p className="text-sm text-slate-500 mt-1 font-normal">الرئيسية &gt; خدمات الطلاب &gt; نقاط الإنترنت</p>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl bg-white">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row items-center gap-3 border-b">
            <div className="relative w-full max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="بحث عن مكان أو ملاحظة..."
                className={`${inputBaseClass} ${topControlHeight} pr-10 bg-slate-50 border-none`}
              />
            </div>

            <Button
              onClick={() => setAddOpen(true)}
              className={`bg-emerald-600 text-white hover:bg-emerald-700 ${topControlHeight} px-4 rounded-lg mr-auto shadow-sm`}
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة نقطة جديدة
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="p-4 text-slate-500 font-bold">اسم المكان</th>
                  <th className="p-4 text-slate-500 font-bold">مصدر الطاقة</th>
                  <th className="p-4 text-center text-slate-500 font-bold">الجودة</th>
                  <th className="p-4 text-center text-slate-500 font-bold">المقاعد</th>
                  <th className="p-4 text-center text-slate-500 font-bold">التكلفة</th>
                  <th className="p-4 text-slate-500 font-bold">أمان الطريق</th>
                  <th className="p-4 text-center text-slate-500 font-bold">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-arabic">
                {loading ? (
                  <tr><td colSpan={7} className="p-20 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />جاري التحميل...</td></tr>
                ) : paginatedData.length === 0 ? (
                  <tr><td colSpan={7} className="p-20 text-center text-slate-400 italic">لا توجد نقاط إنترنت مسجلة حالياً.</td></tr>
                ) : paginatedData.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{c.placeName}</td>
                    <td className="p-4 flex items-center gap-2">
                      <BatteryCharging className="w-3.5 h-3.5 text-orange-500" />
                      {c.powerSource}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${c.wifiQuality === 'جيدة' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {c.wifiQuality}
                      </span>
                    </td>
                    <td className="p-4 text-center font-medium">{c.seatsCount} مقعد</td>
                    <td className="p-4 text-center">
                       <span className={c.isFree === 'مجانية' ? 'text-emerald-600 font-bold' : 'text-blue-600'}>
                         {c.isFree}
                       </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500 max-w-[150px] truncate" title={c.roadSafetyNotes}>
                      {c.roadSafetyNotes}
                    </td>
                    <td className="p-4 text-center">
                      <button className="p-2 hover:bg-slate-100 rounded-md border border-slate-100 text-slate-400">
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
              <span>عرض:</span>
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
        <DialogContent dir="rtl" className="max-w-md shadow-2xl border-none rounded-2xl font-arabic">
          <DialogHeader>
            <DialogTitle className="text-right text-lg font-bold text-emerald-700">تسجيل نقطة إنترنت جديدة</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 py-4 text-right">
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">اسم المكان</label>
               <Input className="h-11 bg-slate-50" value={formData.placeName} onChange={e => setFormData({...formData, placeName: e.target.value})} placeholder="مثلاً: مقهى الأمل، بيت سكني، مركز الشباب" />
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">مصدر الطاقة</label>
               <select className={`${selectBaseClass} h-11 bg-slate-50`} value={formData.powerSource} onChange={e => setFormData({...formData, powerSource: e.target.value})}>
                  <option value="">اختر المصدر</option>
                  <option value="طاقة شمسية">طاقة شمسية</option>
                  <option value="مولد">مولد</option>
                  <option value="بطاريات">بطاريات</option>
               </select>
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">جودة الإنترنت</label>
               <select className={`${selectBaseClass} h-11 bg-slate-50`} value={formData.wifiQuality} onChange={e => setFormData({...formData, wifiQuality: e.target.value})}>
                  <option value="">حدد الجودة</option>
                  <option value="ضعيفة">ضعيفة</option>
                  <option value="متوسطة">متوسطة</option>
                  <option value="جيدة">جيدة</option>
               </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-700">المقاعد المتاحة</label>
                 <Input type="number" className="h-11 bg-slate-50" value={formData.seatsCount || ''} onChange={e => setFormData({...formData, seatsCount: Number(e.target.value)})} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-700">التكلفة للطلاب</label>
                 <select className={`${selectBaseClass} h-11 bg-slate-50`} value={formData.isFree} onChange={e => setFormData({...formData, isFree: e.target.value})}>
                    <option value="">حدد التكلفة</option>
                    <option value="مجانية">مجانية</option>
                    <option value="بمقابل بسيط">بمقابل مادي بسيط</option>
                 </select>
              </div>
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">ملاحظات حول أمان الطريق</label>
               <Input className="h-11 bg-slate-50" value={formData.roadSafetyNotes} onChange={e => setFormData({...formData, roadSafetyNotes: e.target.value})} placeholder="مثلاً: طريق مضاء، هادئ، يفضل الذهاب جماعات" />
            </div>
          </div>
          
          <DialogFooter className="mt-2 flex flex-row items-center gap-3 w-full">
            <Button onClick={onAdd} disabled={submitting || !isFormValid(formData)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-11 rounded-xl">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null} حفظ النقطة
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1 h-11 rounded-xl">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}