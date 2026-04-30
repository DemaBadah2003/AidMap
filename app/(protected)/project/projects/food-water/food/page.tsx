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
  Utensils,
  MapPin,
  Check,
  X,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'

const regionData: Record<string, string[]> = {
  "شمال": ["جباليا", "بيت لاهيا", "بيت حانون", "التوام"],
  "جنوب": ["رفح", "خانيونس", "القرارة", "بني سهيلا"],
  "شرق": ["الشجاعية", "التفاح", "الدرج", "الزيتون"],
  "غرب": ["الرمال", "النصر", "الشيخ رضوان", "مخيم الشاطئ"]
}

type FoodPoint = {
  id: string
  location: string
  region: string
  foodType: string
  distDate: string
  distTime: string
  status: string
}

const BASE_URL = '/api/Catering/food'
const selectBaseClass = 'w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-right text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-100 font-normal'

export default function FoodPointsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<FoodPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<FoodPoint | null>(null)

  const [formData, setFormData] = useState<Omit<FoodPoint, 'id'>>({
    location: '', region: '', foodType: '', distDate: '', distTime: '', status: ''
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

  const filtered = useMemo(() => {
    return items.filter((s) => !q || s.location.includes(q) || s.region.includes(q))
  }, [q, items])

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage, itemsPerPage])

  const startEdit = (item: FoodPoint) => {
    setEditingId(item.id)
    setEditFormData({ ...item })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditFormData(null)
  }

  // دالة التحقق من التعديل
  const onSaveEdit = async () => {
    if (!editFormData) return
    
    // شرط التحقق: التأكد أن جميع الحقول المطلوبة تحتوي على قيم
    if (!editFormData.location || !editFormData.region || !editFormData.foodType || !editFormData.status) {
      alert("يرجى ملء جميع الحقول المطلوبة للتعديل")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      })
      if (res.ok) {
        await fetchPoints()
        setEditingId(null)
      }
    } finally { setSubmitting(false) }
  }

  // دالة التحقق من الإضافة
  const onAdd = async () => {
    // شرط التحقق: التأكد أن جميع الحقول المطلوبة تحتوي على قيم
    if (!formData.location || !formData.region || !formData.foodType || !formData.status) {
      alert("يرجى إكمال جميع البيانات قبل الحفظ")
      return
    }

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
        setFormData({ location: '', region: '', foodType: '', distDate: '', distTime: '', status: '' })
      }
    } finally { setSubmitting(false) }
  }

  return (
    <div className="w-full px-4 py-6" dir="rtl">
      <div className="mb-6 flex items-center justify-start gap-2">
        <Utensils className="w-8 h-8 text-orange-500" />
        <h1 className="text-2xl font-bold text-slate-900">نقاط توزيع الطعام (Food)</h1>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl bg-white">
        <CardContent className="p-0 flex flex-col">
          <div className="p-4 flex flex-col sm:flex-row items-center gap-3 border-b">
            <div className="relative w-full max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => { setQ(e.target.value); setCurrentPage(1); }}
                placeholder="بحث بالموقع أو المنطقة..."
                className="w-full h-10 pr-10 bg-slate-50 border-none rounded-lg text-right"
              />
            </div>
            <Button
              onClick={() => { setEditingId(null); setAddOpen(true); }}
              className="bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 rounded-lg mr-auto shadow-sm"
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة نقطة توزيع
            </Button>
          </div>

          <div className="overflow-x-auto overflow-y-auto max-h-[380px] scrollbar-thin scrollbar-thumb-slate-200">
            <table className="w-full text-right border-collapse text-sm">
              <thead className="bg-slate-50 sticky top-0 z-20 shadow-sm">
                <tr className="border-b">
                  <th className="p-4 text-slate-500 font-bold">الموقع</th>
                  <th className="p-4 text-slate-500 font-bold">المنطقة</th>
                  <th className="p-4 text-slate-500 font-bold">نوع الأكل</th>
                  <th className="p-4 text-slate-500 font-bold text-center">الحالة</th>
                  <th className="p-4 text-center text-slate-500 font-bold">الاجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></td></tr>
                ) : paginatedData.map((s) => (
                  <tr key={s.id} className={`${editingId === s.id ? 'bg-blue-50/40' : 'hover:bg-slate-50/50'} transition-colors h-[60px]`}>
                    {editingId === s.id ? (
                      <>
                        <td className="p-2">
                          <select className="w-full h-9 border rounded-md px-1 text-xs" value={editFormData?.location} onChange={e => setEditFormData({...editFormData!, location: e.target.value, region: ''})}>
                            <option value="">اختر الموقع</option>
                            {Object.keys(regionData).map(loc => <option key={loc} value={loc}>{loc}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <select className="w-full h-9 border rounded-md px-1 text-xs" value={editFormData?.region} onChange={e => setEditFormData({...editFormData!, region: e.target.value})}>
                            <option value="">اختر المنطقة</option>
                            {regionData[editFormData?.location!]?.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <select className="w-full h-9 border rounded-md px-1 text-xs" value={editFormData?.foodType} onChange={e => setEditFormData({...editFormData!, foodType: e.target.value})}>
                            <option value="">النوع</option>
                            <option value="وجبات مطبوخة">وجبات مطبوخة</option>
                            <option value="طرود">طرود</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <select className="w-full h-9 border rounded-md px-1 text-xs text-center" value={editFormData?.status} onChange={e => setEditFormData({...editFormData!, status: e.target.value})}>
                            <option value="">الحالة</option>
                            <option value="متاح">متاح</option>
                            <option value="انتهى">انتهى</option>
                          </select>
                        </td>
                        <td className="p-2 text-center flex justify-center gap-2 items-center h-[60px]">
                          <button onClick={onSaveEdit} className="p-2 bg-green-500 text-white rounded hover:bg-green-600">
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </button>
                          <button onClick={cancelEdit} className="p-2 bg-slate-200 text-slate-600 rounded hover:bg-slate-300">
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 font-bold text-slate-900">{s.location}</td>
                        <td className="p-4 text-slate-600">{s.region}</td>
                        <td className="p-4"><span className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs font-medium">{s.foodType}</span></td>
                        <td className="p-4 text-center"><span className={`px-3 py-1 rounded-full text-[10px] font-bold ${s.status === 'متاح' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.status}</span></td>
                        <td className="p-4 text-center">
                          <button onClick={() => startEdit(s)} className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-md border border-slate-100 text-slate-400 transition-all">
                            <Pencil className="w-4 h-4"/>
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 mt-auto">
            <div className="flex items-center gap-2 order-2 sm:order-1">
              <span className="text-xs text-slate-500 font-medium">عرض صفوف:</span>
              <select className="h-8 border rounded-md text-xs px-2 bg-white outline-none focus:ring-2 focus:ring-blue-100" value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                {[5, 10, 15, 20].map(num => <option key={num} value={num}>{num}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <span className="text-[11px] text-slate-500 ml-2 font-medium">صفحة {currentPage} من {totalPages || 1}</span>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="h-8 w-8 p-0 bg-white"><ChevronRight className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 w-8 p-0 bg-white"><ChevronLeft className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="max-w-md shadow-2xl border-none rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-right text-lg font-bold text-orange-600 flex items-center gap-2">
              <MapPin className="w-5 h-5" />تسجيل نقطة توزيع جديدة
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4 text-right">
            <div className="space-y-1.5 w-full">
              <label className="text-xs font-bold text-slate-700">الموقع (الاتجاه)</label>
              <select className={`${selectBaseClass} h-11 bg-slate-50`} value={formData.location} onChange={e => setFormData({...formData, location: e.target.value, region: ''})}>
                <option value="">اختر الموقع</option>
                {Object.keys(regionData).map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>
            <div className="space-y-1.5 w-full">
              <label className="text-xs font-bold text-slate-700">المنطقة</label>
              <select className={`${selectBaseClass} h-11 bg-slate-50`} value={formData.region} disabled={!formData.location} onChange={e => setFormData({...formData, region: e.target.value})}>
                <option value="">اختر المنطقة</option>
                {formData.location && regionData[formData.location]?.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-1.5 w-full">
              <label className="text-xs font-bold text-slate-700">نوع الأكل</label>
              <select className={`${selectBaseClass} h-11 bg-slate-50`} value={formData.foodType} onChange={e => setFormData({...formData, foodType: e.target.value})}>
                <option value="">اختر النوع</option>
                <option value="وجبات مطبوخة">وجبات مطبوخة</option>
                <option value="طرود">طرود</option>
              </select>
            </div>
            <div className="space-y-1.5 w-full">
              <label className="text-xs font-bold text-slate-700">الحالة</label>
              <select className={`${selectBaseClass} h-11 bg-slate-50`} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="">اختر الحالة</option>
                <option value="متاح">متاح</option>
                <option value="انتهى">انتهى</option>
              </select>
            </div>
          </div>
          <DialogFooter className="mt-4 gap-3 w-full">
            <Button 
              onClick={onAdd} 
              disabled={submitting} 
              className="w-full bg-orange-600 hover:bg-orange-700 h-11 rounded-xl font-bold text-white transition-all shadow-md"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : "حفظ بيانات النقطة"}
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="w-full h-11 rounded-xl text-slate-600">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}