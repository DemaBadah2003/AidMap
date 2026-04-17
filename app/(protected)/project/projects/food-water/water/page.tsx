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
  Droplets,
  MapPin
} from 'lucide-react'

// التعريف الجديد لنوع البيانات: نقاط توزيع المياه
type WaterPoint = {
  id: string
  pointName: string    // اسم النقطة
  waterType: string    // نوع الماء (حلوة / مالحة)
  lat: string          // خط العرض
  lng: string          // خط الطول
  status: string       // الحالة (تعمل حالياً / متوقفة)
}

const BASE_URL = '/api/project/projects/water-points'
const topControlHeight = 'h-10'
const inputBaseClass = 'w-full min-w-0 rounded-lg border-slate-200 bg-white text-right text-xs sm:text-sm outline-none focus:!ring-2 focus:!ring-slate-100 font-normal'
const selectBaseClass = 'w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-right text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-100 font-normal'

export default function WaterPointsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<WaterPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [addOpen, setAddOpen] = useState(false)
  
  const [formData, setFormData] = useState<Omit<WaterPoint, 'id'>>({
    pointName: '',
    waterType: '',
    lat: '',
    lng: '',
    status: ''
  })

  const [submitting, setSubmitting] = useState(false)

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
    return data.pointName.trim() !== '' && data.waterType !== '' && data.status !== ''
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
      pointName: '', waterType: '', lat: '', lng: '', status: ''
    })
  }

  const filtered = useMemo(() => {
    return items.filter((s) => !q || s.pointName.includes(q))
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
      {/* العنوان على اليمين */}
      <div className="mb-6 flex items-center justify-start gap-2">
        <Droplets className="w-8 h-8 text-blue-600" />
        <h1 className="text-2xl font-bold text-slate-900">نقاط توزيع المياه (Water)</h1>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl bg-white">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row items-center gap-3 border-b">
            <div className="relative w-full max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="بحث باسم النقطة..."
                className={`${inputBaseClass} ${topControlHeight} pr-10 bg-slate-50 border-none`}
              />
            </div>

            <Button
              onClick={() => setAddOpen(true)}
              className={`bg-blue-600 text-white hover:bg-blue-700 ${topControlHeight} px-4 rounded-lg mr-auto shadow-sm`}
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة نقطة جديدة
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="p-4 text-slate-500 font-bold">اسم النقطة</th>
                  <th className="p-4 text-slate-500 font-bold">نوع الماء</th>
                  <th className="p-4 text-slate-500 font-bold">Lat (عرض)</th>
                  <th className="p-4 text-slate-500 font-bold">Log (طول)</th>
                  <th className="p-4 text-slate-500 font-bold">الحالة</th>
                  <th className="p-4 text-center text-slate-500 font-bold">تعديل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr><td colSpan={6} className="p-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></td></tr>
                ) : paginatedData.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{s.pointName}</td>
                    <td className="p-4 text-slate-600">{s.waterType}</td>
                    <td className="p-4 font-mono text-slate-500 text-xs">{s.lat}</td>
                    <td className="p-4 font-mono text-slate-500 text-xs">{s.lng}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${s.status === 'تعمل حالياً' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-md border border-slate-100 text-slate-400">
                        <Pencil className="w-4 h-4"/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 flex items-center justify-between border-t bg-slate-50/30">
            <span className="text-xs text-slate-500 font-medium">عرض {rangeStart} - {rangeEnd} من {filtered.length}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>السابق</Button>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>التالي</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="max-w-md shadow-2xl border-none rounded-2xl font-arabic overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-right text-lg font-bold text-blue-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              تسجيل نقطة مياه جديدة
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 py-4 text-right">
            <div className="space-y-1.5 w-full">
               <label className="text-xs font-bold text-slate-700">اسم النقطة</label>
               <Input className="h-11 bg-slate-50" value={formData.pointName} onChange={e => setFormData({...formData, pointName: e.target.value})} placeholder="مثل: بئر الشفاء" />
            </div>

            <div className="space-y-1.5 w-full">
               <label className="text-xs font-bold text-slate-700">نوع الماء</label>
               <select className={`${selectBaseClass} h-11 bg-slate-50`} value={formData.waterType} onChange={e => setFormData({...formData, waterType: e.target.value})}>
                  <option value="">اختر النوع</option>
                  <option value="حلوة">حلوة</option>
                  <option value="مالحة">مالحة</option>
               </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 w-full">
                 <label className="text-xs font-bold text-slate-700">Latitude (Lat)</label>
                 <Input className="h-11 bg-slate-50 font-mono" value={formData.lat} onChange={e => setFormData({...formData, lat: e.target.value})} placeholder="0.0000" />
              </div>
              <div className="space-y-1.5 w-full">
                 <label className="text-xs font-bold text-slate-700">Longitude (Log)</label>
                 <Input className="h-11 bg-slate-50 font-mono" value={formData.lng} onChange={e => setFormData({...formData, lng: e.target.value})} placeholder="0.0000" />
              </div>
            </div>

            <div className="space-y-1.5 w-full">
               <label className="text-xs font-bold text-slate-700">الحالة</label>
               <select className={`${selectBaseClass} h-11 bg-slate-50`} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="">اختر الحالة</option>
                  <option value="تعمل حالياً">تعمل حالياً</option>
                  <option value="متوقفة">متوقفة</option>
               </select>
            </div>
          </div>
          
          <DialogFooter className="mt-4 flex flex-col sm:flex-row items-center gap-3 w-full">
            <Button onClick={onAdd} disabled={submitting || !isFormValid(formData)} className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 h-11 rounded-xl font-bold text-white transition-all shadow-md">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : "حفظ بيانات النقطة"}
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="w-full sm:flex-1 h-11 rounded-xl text-slate-600">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}