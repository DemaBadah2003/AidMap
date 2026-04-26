'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '../../../../../../components/ui/card'
import { Button } from '../../../../../../components/ui/button'
import { Input } from '../../../../../../components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../../../../components/ui/dialog'
import { Pencil, Plus, Search, Loader2, Check, X } from 'lucide-react'

const AVAILABLE_MEDICAL_SERVICES = [
  'إنعاش قلبي رئوي', 'خياطة جروح عميقة', 'تثبيت كسور عاجل', 'إعطاء محاليل وريدية',
  'استئصال زائدة دودية', 'استئصال مرارة بالمنظار', 'إصلاح فتق',
  'فحص نمو', 'علاج نزلات معوية', 'متابعة سوء تغذية',
  'تخطيط قلب ECG', 'تصوير قلب صدى (Echo)', 'غسيل كلى دموي',
  'أشعة سينية X-Ray', 'أشعة مقطعية CT', 'رنين مغناطيسي MRI',
  'فحص دم كامل CBC', 'تحليل وظائف كبد وكلى', 'زراعة مخبرية'
]

// تأكد أن هذا الرابط هو نفس الرابط الذي يعمل في الـ GET والـ POST عندك
const BASE_URL = '/api/project/Medical-Services/services' 

export default function ServicesPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  
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
    
    // ملاحظة: إذا كان الباك آند لا يدعم PUT، جرب تغييرها إلى POST مع إرسال الـ id
    const method = editId ? 'PUT' : 'POST'
    
    try {
      const res = await fetch(BASE_URL, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: editId, // هذا الحقل أساسي لنجاح التعديل
          serviceName, 
          cost, 
          status 
        })
      })
      
      if (res.ok) {
        await fetchData()
        setAddOpen(false)
        resetForm()
      } else {
        const errorText = await res.text();
        console.error("فشل الحفظ:", errorText);
        alert("لم يتم الحفظ، تأكد من إعدادات الـ API لتستقبل طلبات PUT");
      }
    } catch (err) {
      console.error(err);
    } finally { 
      setSubmitting(false) 
    }
  }




  const resetForm = () => {
    setEditId(null); setServiceName(''); setCost(''); setStatus('متاحة');
  }

  const filteredItems = items.filter((item: any) => 
    item.serviceName?.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div className="w-full px-4 py-6 text-right" dir="rtl">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 font-arabic">سجل الخدمات الطبية</h1>
        <Button onClick={() => { resetForm(); setAddOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg h-10 px-6 shadow-md">
          <Plus className="ml-2 h-4 w-4" /> إضافة خدمة جديدة
        </Button>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl bg-white">
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <div className="relative w-full max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن خدمة..." className="pr-10 bg-slate-50 border-none h-10 rounded-lg text-sm" />
            </div>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b font-bold text-slate-600">
              <tr>
                <th className="p-4 text-right">الخدمة الطبية</th>
                <th className="p-4 text-right">التكلفة</th>
                <th className="p-4 text-right">الحالة</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-slate-300" /></td></tr>
              ) : filteredItems.map((item: any) => (
                <tr key={item.id} className={editId === item.id ? "bg-blue-50/50" : "hover:bg-slate-50"}>
                  <td className="p-4">
                    {editId === item.id ? (
                      <select className="w-full border rounded p-1" value={serviceName} onChange={e => setServiceName(e.target.value)}>
                        {AVAILABLE_MEDICAL_SERVICES.map(ser => <option key={ser} value={ser}>{ser}</option>)}
                      </select>
                    ) : item.serviceName}
                  </td>
                  <td className="p-4">
                    {editId === item.id ? (
                      <Input className="w-20" type="number" value={cost} onChange={e => setCost(e.target.value)} />
                    ) : <span className="text-blue-600 font-bold">${item.cost}</span>}
                  </td>
                  <td className="p-4">
                    {editId === item.id ? (
                      <select className="border rounded p-1" value={status} onChange={e => setStatus(e.target.value)}>
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
                          <Check onClick={onSave} className="w-5 h-5 text-green-600 cursor-pointer" />
                          <X onClick={resetForm} className="w-5 h-5 text-red-600 cursor-pointer" />
                        </>
                      ) : (
                        <>
                          <Pencil onClick={() => startInPlaceEdit(item)} className="w-4 h-4 text-slate-400 cursor-pointer hover:text-blue-600" />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* الـ Dialog للإضافة فقط */}
      <Dialog open={addOpen} onOpenChange={(val) => { if(!val) resetForm(); setAddOpen(val); }}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle className="text-right">إضافة خدمة</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <select className="w-full border rounded-xl p-3" value={serviceName} onChange={e => setServiceName(e.target.value)}>
              <option value="">اختر الخدمة</option>
              {AVAILABLE_MEDICAL_SERVICES.map(ser => <option key={ser} value={ser}>{ser}</option>)}
            </select>
            <Input type="number" placeholder="التكلفة" value={cost} onChange={e => setCost(e.target.value)} />
            <select className="w-full border rounded-xl p-3" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="متاحة">متاحة</option>
              <option value="غير متوفرة">غير متوفرة</option>
            </select>
          </div>
          <DialogFooter>
            <Button onClick={onSave} disabled={submitting} className="w-full bg-blue-600 text-white">
              {submitting ? <Loader2 className="animate-spin" /> : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}