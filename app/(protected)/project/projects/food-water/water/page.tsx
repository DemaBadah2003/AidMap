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
  MapPin,
  Check,
  X,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'

type WaterPoint = {
  id: string
  pointName: string 
  waterType: string 
  status: string 
  region: string    
  location: string  
}

const regionData: Record<string, string[]> = {
  "شمال": ["جباليا", "بيت لاهيا", "بيت حانون", "التوام"],
  "جنوب": ["رفح", "خانيونس", "القرارة", "بني سهيلا"],
  "شرق": ["الشجاعية", "التفاح", "الدرج", "الزيتون"],
  "غرب": ["الرمال", "النصر", "الشيخ رضوان", "مخيم الشاطئ"]
}

const BASE_URL = '/api/Catering/water'
const inputBaseClass = 'w-full rounded-md border-slate-200 bg-white text-right text-sm outline-none focus:ring-2 focus:ring-blue-100'
const selectBaseClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 text-right text-sm outline-none focus:ring-2 focus:ring-slate-100 font-normal'

export default function WaterPointsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<WaterPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [addFormData, setAddFormData] = useState<Omit<WaterPoint, 'id'>>({
    pointName: '', waterType: '', status: '', region: '', location: ''
  })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<Omit<WaterPoint, 'id'>>({
    pointName: '', waterType: '', status: '', region: '', location: ''
  })

  // دالة التحقق من الحقول
  const isFormValid = (data: Omit<WaterPoint, 'id'>) => {
    return Object.values(data).every(value => value.trim() !== '');
  }

  // 1. جلب البيانات
  const fetchPoints = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL)
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) { 
        console.error('Fetch error:', err) 
    } finally { 
        setLoading(false) 
    }
  }

  useEffect(() => { fetchPoints() }, [])

  // 2. إضافة نقطة جديدة
  const handleAddSubmit = async () => {
    if (!isFormValid(addFormData)) return
    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addFormData)
      })
      if (res.ok) {
        await fetchPoints()
        setIsAddDialogOpen(false)
        setAddFormData({ pointName: '', waterType: '', status: '', region: '', location: '' })
      }
    } finally { setSubmitting(false) }
  }

  // 3. بدء التعديل
  const startEdit = (item: WaterPoint) => {
    setEditingId(item.id)
    setEditFormData({
      pointName: item.pointName,
      waterType: item.waterType,
      status: item.status,
      region: item.region,
      location: item.location
    })
  }

  // 4. حفظ التعديل
  const handleSaveEdit = async (id: string) => {
    if (!isFormValid(editFormData)) return
    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editFormData })
      })
      if (res.ok) {
        await fetchPoints()
        setEditingId(null)
      }
    } finally { setSubmitting(false) }
  }

  // منطق البحث المطور
  const filtered = useMemo(() => {
    const searchLower = q.trim().toLowerCase();
    if (!searchLower) return items;

    return items.filter((s) => 
      s.pointName?.toLowerCase().includes(searchLower) || 
      s.region?.toLowerCase().includes(searchLower) ||
      s.location?.toLowerCase().includes(searchLower)
    )
  }, [q, items])

  // منطق الترقيم
  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage, pageSize])

  useEffect(() => { 
    setCurrentPage(1) 
  }, [q, pageSize])

  return (
    <div className="w-full px-2 sm:px-4 py-6" dir="rtl">
      {/* Header Section */}
      <div className="mb-6 flex items-center justify-start gap-3">
        <Droplets className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
        <div>
           <h1 className="text-xl sm:text-2xl font-bold text-slate-900">إدارة نقاط توزيع المياه</h1>
           <p className="text-slate-500 text-[10px] sm:text-xs">تتبع حالة وتوفر مصادر المياه في المناطق المختلفة</p>
        </div>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl bg-white">
        <CardContent className="p-0">
          {/* Search & Add Button */}
          <div className="p-4 flex flex-col sm:flex-row items-center gap-3 border-b bg-white">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="بحث باسم النقطة أو المنطقة..."
                className="pr-10 bg-slate-50 border-none h-10 rounded-lg text-sm font-bold focus-visible:ring-blue-500"
              />
            </div>

            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 rounded-lg sm:mr-auto shadow-sm font-bold text-xs"
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة نقطة مياه
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-right border-collapse text-sm min-w-[700px]">
              <thead className="bg-slate-50/80 border-b border-slate-100 sticky top-0 z-10">
                <tr>
                  <th className="p-4 text-slate-500 font-bold">الموقع (الاتجاه)</th>
                  <th className="p-4 text-slate-500 font-bold">المنطقة</th>
                  <th className="p-4 text-slate-500 font-bold">اسم النقطة</th>
                  <th className="p-4 text-slate-500 font-bold text-center">نوع الماء</th>
                  <th className="p-4 text-slate-500 font-bold text-center">الحالة</th>
                  <th className="p-4 text-center text-slate-500 font-bold">الاجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr><td colSpan={6} className="p-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></td></tr>
                ) : paginatedItems.length === 0 ? (
                  <tr><td colSpan={6} className="p-10 text-center text-slate-400 font-bold">لا توجد نتائج مطابقة للبحث</td></tr>
                ) : paginatedItems.map((s) => (
                  <tr key={s.id} className={`transition-colors ${editingId === s.id ? 'bg-orange-50/30' : 'hover:bg-slate-50/50'}`}>
                    {editingId === s.id ? (
                      <>
                        <td className="p-2">
                          <select 
                            className={`${inputBaseClass} h-9 px-2 text-xs font-bold`} 
                            value={editFormData.location} 
                            onChange={e => setEditFormData({...editFormData, location: e.target.value, region: ''})}
                          >
                            <option value="شرق">شرق</option>
                            <option value="غرب">غرب</option>
                            <option value="شمال">شمال</option>
                            <option value="جنوب">جنوب</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <select 
                            className={`${inputBaseClass} h-9 px-2 text-xs font-bold`} 
                            value={editFormData.region} 
                            onChange={e => setEditFormData({...editFormData, region: e.target.value})}
                          >
                            <option value="">اختر المنطقة</option>
                            {editFormData.location && regionData[editFormData.location]?.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2"><Input className="h-9 text-xs" value={editFormData.pointName} onChange={e => setEditFormData({...editFormData, pointName: e.target.value})} /></td>
                        <td className="p-2">
                          <select className={`${inputBaseClass} h-9 px-2 text-xs`} value={editFormData.waterType} onChange={e => setEditFormData({...editFormData, waterType: e.target.value})}>
                            <option value="حلوة">حلوة</option>
                            <option value="مالحة">مالحة</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <select className={`${inputBaseClass} h-9 px-2 text-xs`} value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value})}>
                            <option value="تعمل حالياً">تعمل حالياً</option>
                            <option value="متوقفة">متوقفة</option>
                          </select>
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex justify-center gap-2">
                            <Button size="sm" variant="ghost" className="text-green-600 hover:bg-green-50" onClick={() => handleSaveEdit(s.id)} disabled={submitting || !isFormValid(editFormData)}>
                              {submitting ? <Loader2 className="w-3 h-3 animate-spin"/> : <Check className="w-4 h-4"/>}
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-50" onClick={() => setEditingId(null)}><X className="w-4 h-4"/></Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 text-slate-900 font-bold">{s.location}</td>
                        <td className="p-4 text-slate-600 font-medium">{s.region}</td>
                        <td className="p-4 font-bold text-slate-900">{s.pointName}</td>
                        <td className="p-4 text-center">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${s.waterType === 'حلوة' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                {s.waterType}
                            </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${s.status === 'تعمل حالياً' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button onClick={() => startEdit(s)} className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-md border border-slate-100 text-slate-400 transition-colors">
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

          {/* Pagination */}
          <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between bg-slate-50/50 gap-4">
            <div className="flex items-center gap-2 order-2 sm:order-1">
              <span className="text-xs text-slate-500 font-bold">عرض:</span>
              <select 
                value={pageSize} 
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-8 rounded border border-slate-200 bg-white text-xs outline-none px-2 font-bold"
              >
                {[5, 10, 15, 20].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4 order-1 sm:order-2">
              <span className="text-xs text-slate-500 font-bold">صفحة {currentPage} من {totalPages || 1}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-8 w-20 text-xs gap-1 font-bold" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                   <ChevronRight className="h-3 w-3" /> السابق
                </Button>
                <Button variant="outline" size="sm" className="h-8 w-20 text-xs gap-1 font-bold" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}>
                  التالي <ChevronLeft className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent dir="rtl" className="w-[95vw] sm:max-w-md rounded-2xl p-4 sm:p-6 overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-right text-lg font-bold text-blue-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" /> تسجيل نقطة مياه جديدة
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 py-4 text-right">
            <div className="space-y-1">
               <label className="text-xs font-bold text-slate-700">الموقع (الاتجاه)</label>
               <select 
                className={`${selectBaseClass} h-11 font-bold`} 
                value={addFormData.location} 
                onChange={e => setAddFormData({...addFormData, location: e.target.value, region: ''})}
               >
                  <option value="">اختر الإتجاه</option>
                  <option value="شرق">شرق</option>
                  <option value="غرب">غرب</option>
                  <option value="شمال">شمال</option>
                  <option value="جنوب">جنوب</option>
               </select>
            </div>

            <div className="space-y-1">
               <label className="text-xs font-bold text-slate-700">المنطقة</label>
               <select 
                className={`${selectBaseClass} h-11 font-bold`} 
                value={addFormData.region} 
                disabled={!addFormData.location}
                onChange={e => setAddFormData({...addFormData, region: e.target.value})}
               >
                  <option value="">اختر المنطقة</option>
                  {addFormData.location && regionData[addFormData.location]?.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
               </select>
            </div>

            <div className="space-y-1">
               <label className="text-xs font-bold text-slate-700">اسم النقطة</label>
               <Input className="h-11 bg-slate-50 font-bold text-sm" value={addFormData.pointName} onChange={e => setAddFormData({...addFormData, pointName: e.target.value})} placeholder="مثال: بئر الشفاء" />
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">نوع الماء</label>
                <select className={`${selectBaseClass} h-11 font-bold`} value={addFormData.waterType} onChange={e => setAddFormData({...addFormData, waterType: e.target.value})}>
                    <option value="">اختر النوع</option>
                    <option value="حلوة">حلوة</option>
                    <option value="مالحة">مالحة</option>
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">الحالة</label>
                <select className={`${selectBaseClass} h-11 font-bold`} value={addFormData.status} onChange={e => setAddFormData({...addFormData, status: e.target.value})}>
                    <option value="">اختر الحالة</option>
                    <option value="تعمل حالياً">تعمل حالياً</option>
                    <option value="متوقفة">متوقفة</option>
                </select>
            </div>
          </div>
          
          {/* تم تعديل ترتيب الأزرار هنا */}
          <DialogFooter className="flex flex-row gap-2 mt-4">
            <Button 
              onClick={handleAddSubmit} 
              disabled={submitting || !isFormValid(addFormData)} 
              className="flex-1 bg-blue-600 hover:bg-blue-700 h-11 rounded-xl font-bold"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : "حفظ بيانات النقطة"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsAddDialogOpen(false)} 
              className="flex-1 h-11 rounded-xl font-bold"
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}