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
  BatteryCharging,
  Check,
  X,
  AlertCircle,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'

type WifiPoint = {
  id: string
  placeName: string
  powerSource: string
  wifiQuality: string
  seatsCount: number
  isFree: string
}

const BASE_URL = '/api/project/education/Internet' 

export default function WifiPointsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<WifiPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<WifiPoint | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [formData, setFormData] = useState({
    placeName: '', powerSource: '', wifiQuality: '', seatsCount: 0, isFree: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const isDataValid = (data: any) => {
    return (
      data.placeName.trim() !== '' &&
      data.powerSource !== '' &&
      data.wifiQuality !== '' &&
      data.isFree !== '' &&
      data.seatsCount >= 0
    )
  }

  const fetchPoints = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL)
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) { console.error(err) } 
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPoints() }, [])

  const startEdit = (item: WifiPoint) => {
    setEditingId(item.id)
    setEditData({ ...item })
  }

  const onUpdate = async () => {
    if (!editData || !editingId || !isDataValid(editData)) return
    setSubmitting(true)
    try {
      const res = await fetch(`${BASE_URL}?id=${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      })
      if (res.ok) {
        await fetchPoints()
        setEditingId(null)
      }
    } finally { setSubmitting(false) }
  }

  const onAdd = async () => {
    if (!isDataValid(formData)) return
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
        setFormData({ placeName: '', powerSource: '', wifiQuality: '', seatsCount: 0, isFree: '' })
      }
    } finally { setSubmitting(false) }
  }

  const filtered = useMemo(() => {
    return items.filter((c) => !q || c.placeName.includes(q))
  }, [q, items])

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage, itemsPerPage])

  return (
    <div className="w-full px-4 py-6" dir="rtl">
      <div className="mb-6 text-right">
        <h1 className="text-2xl font-bold text-slate-900">نقاط الإنترنت للدراسة</h1>
        <p className="text-sm text-slate-500 mt-1">الرئيسية &gt; خدمات الطلاب &gt; نقاط الإنترنت</p>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl bg-white flex flex-col">
        <CardContent className="p-0 flex flex-col h-full">
          <div className="p-4 flex flex-col sm:flex-row items-center gap-3 border-b bg-white z-20">
            <div className="relative w-full max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => { setQ(e.target.value); setCurrentPage(1); }}
                placeholder="بحث عن مكان..."
                className="w-full pr-10 bg-slate-50 border-none rounded-lg h-10 text-sm outline-none"
              />
            </div>
            <Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 h-10 px-4 rounded-lg mr-auto">
              <Plus className="h-4 w-4 ml-2" /> إضافة نقطة
            </Button>
          </div>

          <div className={`w-full overflow-x-auto ${paginatedData.length > 5 ? 'max-h-[400px] overflow-y-auto' : ''}`}>
            <table className="w-full text-right border-collapse text-sm">
              <thead className="bg-slate-50/90 sticky top-0 z-10 border-b backdrop-blur-sm">
                <tr>
                  <th className="p-4 text-slate-500 font-bold">اسم المكان</th>
                  <th className="p-4 text-slate-500 font-bold">مصدر الطاقة</th>
                  <th className="p-4 text-center text-slate-500 font-bold">الجودة</th>
                  <th className="p-4 text-center text-slate-500 font-bold">المقاعد</th>
                  <th className="p-4 text-center text-slate-500 font-bold">التكلفة</th>
                  <th className="p-4 text-center text-slate-500 font-bold">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="p-20 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                ) : paginatedData.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    {editingId === c.id ? (
                      <>
                        <td className="p-2"><Input className="h-8" value={editData?.placeName} onChange={e => setEditData({...editData!, placeName: e.target.value})} /></td>
                        <td className="p-2">
                          <select className="w-full border rounded-lg h-8 px-2 text-xs" value={editData?.powerSource} onChange={e => setEditData({...editData!, powerSource: e.target.value})}>
                            <option value="">اختر</option>
                            <option value="طاقة شمسية">طاقة شمسية</option>
                            <option value="مولد">مولد</option>
                            <option value="بطاريات">بطاريات</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <select className="w-full border rounded-lg h-8 px-2 text-xs text-center" value={editData?.wifiQuality} onChange={e => setEditData({...editData!, wifiQuality: e.target.value})}>
                            <option value="">اختر</option>
                            <option value="ضعيفة">ضعيفة</option>
                            <option value="متوسطة">متوسطة</option>
                            <option value="جيدة">جيدة</option>
                          </select>
                        </td>
                        <td className="p-2"><Input type="number" className="h-8 text-center" value={editData?.seatsCount} onChange={e => setEditData({...editData!, seatsCount: Number(e.target.value)})} /></td>
                        <td className="p-2">
                          <select className="w-full border rounded-lg h-8 px-2 text-xs text-center" value={editData?.isFree} onChange={e => setEditData({...editData!, isFree: e.target.value})}>
                            <option value="">اختر</option>
                            <option value="مجانية">مجانية</option>
                            <option value="بمقابل بسيط">بمقابل بسيط</option>
                          </select>
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex justify-center gap-1">
                            <Button size="sm" variant="ghost" onClick={onUpdate} disabled={!isDataValid(editData)} className="text-emerald-600 h-8 w-8 p-0"><Check className="w-4 h-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="text-red-500 h-8 w-8 p-0"><X className="w-4 h-4" /></Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 font-bold text-slate-900">{c.placeName}</td>
                        <td className="p-4 flex items-center gap-2 text-slate-600"><BatteryCharging className="w-3.5 h-3.5 text-orange-500" /> {c.powerSource}</td>
                        <td className="p-4 text-center"><span className={`px-2 py-0.5 rounded text-[10px] ${c.wifiQuality === 'جيدة' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{c.wifiQuality}</span></td>
                        <td className="p-4 text-center font-medium">{c.seatsCount} مقعد</td>
                        <td className="p-4 text-center"><span className={c.isFree === 'مجانية' ? 'text-emerald-600 font-bold' : 'text-blue-600'}>{c.isFree}</span></td>
                        <td className="p-4 text-center">
                          <button onClick={() => startEdit(c)} className="p-2 hover:bg-slate-100 rounded-md text-slate-400"><Pencil className="w-4 h-4"/></button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t flex flex-row justify-between items-center bg-slate-50/50 mt-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">عرض:</span>
              <select className="border rounded-md text-xs h-8 px-1 outline-none" value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                {[5, 10, 15, 20].map(val => (<option key={val} value={val}>{val}</option>))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 ml-2">صفحة {currentPage} من {totalPages || 1}</span>
              <Button variant="outline" size="sm" className="h-8 px-2 text-xs" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>السابق <ChevronRight className="w-3 h-3 mr-1" /></Button>
              <Button variant="outline" size="sm" className="h-8 px-2 text-xs" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => prev + 1)}>التالي <ChevronLeft className="w-3 h-3 ml-1" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* نافذة الإضافة المحدثة بترتيب الأزرار المطلوب */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="text-right text-emerald-700 font-bold">إضافة نقطة إنترنت جديدة</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-4 text-right">
            <div className="space-y-1"><label className="text-xs font-bold text-slate-600">اسم المكان *</label><Input placeholder="مثلاً: خيمة الشباب" value={formData.placeName} onChange={e => setFormData({...formData, placeName: e.target.value})} /></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-600">مصدر الطاقة *</label><select className="w-full border rounded-lg h-10 px-3 text-sm bg-slate-50" value={formData.powerSource} onChange={e => setFormData({...formData, powerSource: e.target.value})}><option value="">اختر</option><option value="طاقة شمسية">طاقة شمسية</option><option value="مولد">مولد</option><option value="بطاريات">بطاريات</option></select></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-600">جودة الإنترنت *</label><select className="w-full border rounded-lg h-10 px-3 text-sm bg-slate-50" value={formData.wifiQuality} onChange={e => setFormData({...formData, wifiQuality: e.target.value})}><option value="">اختر</option><option value="ضعيفة">ضعيفة</option><option value="متوسطة">متوسطة</option><option value="جيدة">جيدة</option></select></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-600">عدد المقاعد *</label><Input type="number" value={formData.seatsCount} onChange={e => setFormData({...formData, seatsCount: Number(e.target.value)})} /></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-600">التكلفة *</label><select className="w-full border rounded-lg h-10 px-3 text-sm bg-slate-50" value={formData.isFree} onChange={e => setFormData({...formData, isFree: e.target.value})}><option value="">اختر</option><option value="مجانية">مجانية</option><option value="بمقابل بسيط">بمقابل بسيط</option></select></div>
            
            {!isDataValid(formData) && (
              <div className="flex items-center gap-2 text-[10px] text-amber-600 bg-amber-50 p-2 rounded-lg">
                <AlertCircle className="w-3 h-3" />
                <span>يرجى ملء جميع الحقول للحفظ.</span>
              </div>
            )}
          </div>
          
          {/* الأزرار بجانب بعضها: حفظ على اليمين، إلغاء على اليسار */}
          <DialogFooter className="flex flex-row gap-2 sm:justify-start">
            <Button 
              onClick={onAdd} 
              disabled={submitting || !isDataValid(formData)} 
              className={`flex-1 bg-emerald-600 hover:bg-emerald-700 h-11 rounded-xl ${!isDataValid(formData) && 'opacity-50'}`}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : 'حفظ النقطة'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setAddOpen(false)} 
              className="flex-1 h-11 rounded-xl border-slate-200 text-slate-600"
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}