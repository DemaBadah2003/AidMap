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
  Utensils,
  Clock,
  Store
} from 'lucide-react'

// تعريف نوع البيانات الجديد لنقاط توزيع الطعام
type FoodPoint = {
  id: string
  kitchenName: string    // اسم التكية
  foodType: string       // نوع الأكل (وجبات مطبوخة / طرود)
  distTime: string       // موعد التوزيع
  status: string         // الحالة (متاح / انتهى)
}

const BASE_URL = '/api/project/projects/food-points'
const topControlHeight = 'h-10'
const inputBaseClass = 'w-full min-w-0 rounded-lg border-slate-200 bg-white text-right text-xs sm:text-sm outline-none focus:!ring-2 focus:!ring-slate-100 font-normal'
const selectBaseClass = 'w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-right text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-100 font-normal'

export default function FoodPointsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<FoodPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [addOpen, setAddOpen] = useState(false)
  
  const [formData, setFormData] = useState<Omit<FoodPoint, 'id'>>({
    kitchenName: '',
    foodType: '',
    distTime: '',
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
    return data.kitchenName.trim() !== '' && data.foodType !== '' && data.status !== ''
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
      kitchenName: '', foodType: '', distTime: '', status: ''
    })
  }

  const filtered = useMemo(() => {
    return items.filter((s) => !q || s.kitchenName.includes(q))
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
        <Utensils className="w-8 h-8 text-orange-500" />
        <h1 className="text-2xl font-bold text-slate-900">نقاط توزيع الطعام (Food)</h1>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl bg-white">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row items-center gap-3 border-b">
            <div className="relative w-full max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="بحث باسم التكية..."
                className={`${inputBaseClass} ${topControlHeight} pr-10 bg-slate-50 border-none`}
              />
            </div>

            <Button
              onClick={() => setAddOpen(true)}
              className={`bg-blue-600 text-white hover:bg-blue-700 ${topControlHeight} px-4 rounded-lg mr-auto shadow-sm`}
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة تكية جديدة
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="p-4 text-slate-500 font-bold">اسم التكية</th>
                  <th className="p-4 text-slate-500 font-bold">نوع الأكل</th>
                  <th className="p-4 text-slate-500 font-bold">موعد التوزيع</th>
                  <th className="p-4 text-slate-500 font-bold text-center">الحالة</th>
                  <th className="p-4 text-center text-slate-500 font-bold">تعديل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></td></tr>
                ) : paginatedData.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{s.kitchenName}</td>
                    <td className="p-4 text-slate-600">
                      <span className="bg-slate-100 px-2 py-1 rounded text-xs">{s.foodType}</span>
                    </td>
                    <td className="p-4 text-slate-600 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {s.distTime}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${s.status === 'متاح' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
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
            <DialogTitle className="text-right text-lg font-bold text-orange-600 flex items-center gap-2">
              <Store className="w-5 h-5" />
              تسجيل تكية / نقطة توزيع جديدة
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 py-4 text-right">
            <div className="space-y-1.5 w-full">
               <label className="text-xs font-bold text-slate-700">اسم التكية</label>
               <Input className="h-11 bg-slate-50" value={formData.kitchenName} onChange={e => setFormData({...formData, kitchenName: e.target.value})} placeholder="مثل: تكية الشمال" />
            </div>

            <div className="space-y-1.5 w-full">
               <label className="text-xs font-bold text-slate-700">نوع الأكل (Droplist)</label>
               <select className={`${selectBaseClass} h-11 bg-slate-50`} value={formData.foodType} onChange={e => setFormData({...formData, foodType: e.target.value})}>
                  <option value="">اختر النوع</option>
                  <option value="وجبات مطبوخة">وجبات مطبوخة</option>
                  <option value="طرود">طرود</option>
               </select>
            </div>

            <div className="space-y-1.5 w-full">
               <label className="text-xs font-bold text-slate-700">موعد التوزيع</label>
               <Input className="h-11 bg-slate-50" value={formData.distTime} onChange={e => setFormData({...formData, distTime: e.target.value})} placeholder="مثلاً: الساعة 12 ظهراً" />
            </div>

            <div className="space-y-1.5 w-full">
               <label className="text-xs font-bold text-slate-700">الحالة (Droplist)</label>
               <select className={`${selectBaseClass} h-11 bg-slate-50`} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="">اختر الحالة</option>
                  <option value="متاح">متاح</option>
                  <option value="انتهى">انتهى</option>
               </select>
            </div>
          </div>
          
          <DialogFooter className="mt-4 flex flex-col sm:flex-row items-center gap-3 w-full">
            <Button onClick={onAdd} disabled={submitting || !isFormValid(formData)} className="w-full sm:flex-1 bg-orange-600 hover:bg-orange-700 h-11 rounded-xl font-bold text-white transition-all shadow-md">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : "حفظ بيانات التكية"}
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="w-full sm:flex-1 h-11 rounded-xl text-slate-600">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}