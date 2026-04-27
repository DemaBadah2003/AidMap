'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent } from '../../../../../../components/ui/card'
import { Button } from '../../../../../../components/ui/button'
import { Input } from '../../../../../../components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../../../../components/ui/dialog'
import { Pencil, Plus, Search, Loader2, Check, X, ChevronRight, ChevronLeft } from 'lucide-react'

const AVAILABLE_MEDICAL_SERVICES = [
  'إنعاش قلبي رئوي', 'خياطة جروح عميقة', 'تثبيت كسور عاجل', 'إعطاء محاليل وريدية',
  'استئصال زائدة دودية', 'استئصال مرارة بالمنظار', 'إصلاح فتق',
  'فحص نمو', 'علاج نزلات معوية', 'متابعة سوء تغذية',
  'تخطيط قلب ECG', 'تصوير قلب صدى (Echo)', 'غسيل كلى دموي',
  'أشعة سينية X-Ray', 'أشعة مقطعية CT', 'رنين مغناطيسي MRI',
  'فحص دم كامل CBC', 'تحليل وظائف كبد وكلى', 'زراعة مخبرية'
]

const BASE_URL = '/api/project/Medical-Services/services'

export default function ServicesPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5) 

  const [editId, setEditId] = useState<string | null>(null) 
  const [serviceName, setServiceName] = useState('')
  const [cost, setCost] = useState('')
  const [status, setStatus] = useState('متاحة')
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL)
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) { console.error('Fetch error:', err) } 
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const startInPlaceEdit = (item: any) => {
    setEditId(item.id)
    setServiceName(item.serviceName)
    setCost(item.cost)
    setStatus(item.status)
  }

  const onSave = async () => {
    if (!serviceName) return
    setSubmitting(true)
    const method = editId ? 'PUT' : 'POST'
    try {
      const res = await fetch(BASE_URL, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, serviceName, cost, status })
      })
      if (res.ok) {
        await fetchData()
        setAddOpen(false)
        resetForm()
      }
    } catch (err) { console.error(err) } 
    finally { setSubmitting(false) }
  }

  const resetForm = () => {
    setEditId(null); setServiceName(''); setCost(''); setStatus('متاحة');
  }

  const filteredItems = useMemo(() => {
    return items.filter((item: any) => 
      item.serviceName?.toLowerCase().includes(q.toLowerCase())
    )
  }, [items, q])

  const totalPages = Math.ceil(filteredItems.length / pageSize)
  
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredItems.slice(start, start + pageSize)
  }, [filteredItems, currentPage, pageSize])

  useEffect(() => { setCurrentPage(1) }, [q])

  return (
    <div className="w-full px-4 py-6 text-right font-sans" dir="rtl">
      {/* العنوان الخارجي فقط */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">سجل الخدمات الطبية</h1>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl bg-white">
        <CardContent className="p-0">
          
          {/* تعديل: شريط البحث وزر الإضافة داخل الكارد وقبال بعض */}
          <div className="p-4 border-b bg-slate-50/50 flex flex-row justify-between items-center gap-4">
            <div className="relative w-full max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
                placeholder="ابحث عن خدمة..." 
                className="pr-10 bg-white border-slate-200 h-10 rounded-lg text-sm" 
              />
            </div>

            <Button 
              onClick={() => { resetForm(); setAddOpen(true); }} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg h-10 px-6 shadow-sm shrink-0"
            >
              <Plus className="ml-2 h-4 w-4" /> إضافة خدمة جديدة
            </Button>
          </div>

          {/* حاوية الجدول مع السكرول */}
          <div className="w-full overflow-x-auto overflow-y-auto max-h-[420px] scrollbar-thin scrollbar-thumb-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b font-bold text-slate-600 text-right sticky top-0 z-10">
                <tr>
                  <th className="p-4">الخدمة الطبية</th>
                  <th className="p-4">التكلفة</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={4} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-slate-300" /></td></tr>
                ) : paginatedItems.map((item: any) => (
                  <tr key={item.id} className={editId === item.id ? "bg-blue-50/50" : "hover:bg-slate-50"}>
                    <td className="p-4 font-medium">
                      {editId === item.id ? (
                        <select className="w-full border rounded p-1 text-sm bg-white outline-none" value={serviceName} onChange={e => setServiceName(e.target.value)}>
                          {AVAILABLE_MEDICAL_SERVICES.map(ser => <option key={ser} value={ser}>{ser}</option>)}
                        </select>
                      ) : item.serviceName}
                    </td>
                    <td className="p-4 font-mono font-semibold">
                      {editId === item.id ? (
                        <Input className="w-24 h-8" type="number" value={cost} onChange={e => setCost(e.target.value)} />
                      ) : <span className="text-blue-600">${item.cost}</span>}
                    </td>
                    <td className="p-4">
                      {editId === item.id ? (
                        <select className="border rounded p-1 text-xs bg-white outline-none" value={status} onChange={e => setStatus(e.target.value)}>
                          <option value="متاحة">متاحة</option>
                          <option value="غير متوفرة">غير متوفرة</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${item.status === 'متاحة' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {item.status}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        {editId === item.id ? (
                          <>
                            <Check onClick={onSave} className="w-5 h-5 text-green-600 cursor-pointer hover:bg-green-100 rounded p-0.5" />
                            <X onClick={resetForm} className="w-5 h-5 text-red-600 cursor-pointer hover:bg-red-100 rounded p-0.5" />
                          </>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => startInPlaceEdit(item)}>
                            <Pencil className="w-4 h-4 text-slate-400 hover:text-blue-600" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer الترقيم */}
          <div className="p-4 border-t flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-bold">عرض:</span>
              <select 
                value={pageSize} 
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="border rounded px-2 py-1 text-xs bg-white outline-none"
              >
                {[5, 10, 15, 20].map(val => <option key={val} value={val}>{val}</option>)}
              </select>
              <span className="text-xs text-slate-400 mr-2">إجمالي {filteredItems.length} عنصر</span>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                variant="outline" size="sm" className="text-xs px-3 h-8"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronRight className="h-4 w-4 ml-1" /> السابق
              </Button>

              <div className="flex items-center gap-1 text-xs font-mono">
                <span className="text-blue-600 font-bold">{currentPage}</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600">{totalPages || 1}</span>
              </div>

              <Button 
                variant="outline" size="sm" className="text-xs px-3 h-8"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                التالي <ChevronLeft className="h-4 w-4 mr-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog إضافة خدمة */}
      <Dialog open={addOpen} onOpenChange={(val) => { if(!val) resetForm(); setAddOpen(val); }}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader><DialogTitle className="text-right font-bold">إضافة خدمة طبية جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4 text-right">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">اسم الخدمة</label>
              <select className="w-full border rounded-lg p-2.5 text-sm bg-white" value={serviceName} onChange={e => setServiceName(e.target.value)}>
                <option value="">اختر الخدمة...</option>
                {AVAILABLE_MEDICAL_SERVICES.map(ser => <option key={ser} value={ser}>{ser}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">التكلفة ($)</label>
              <Input type="number" placeholder="0.00" value={cost} onChange={e => setCost(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">الحالة</label>
              <select className="w-full border rounded-lg p-2.5 text-sm bg-white" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="متاحة">متاحة</option>
                <option value="غير متوفرة">غير متوفرة</option>
              </select>
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button onClick={onSave} disabled={submitting} className="flex-1 bg-blue-600 font-bold">
              {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : "حفظ البيانات"}
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}