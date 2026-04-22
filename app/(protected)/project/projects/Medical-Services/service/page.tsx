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

const AVAILABLE_MEDICAL_SERVICES = [
  'إنعاش قلبي رئوي', 'خياطة جروح عميقة', 'تثبيت كسور عاجل', 'إعطاء محاليل وريدية',
  'استئصال زائدة دودية', 'استئصال مرارة بالمنظار', 'إصلاح فتق',
  'فحص نمو', 'علاج نزلات معوية', 'متابعة سوء تغذية',
  'تخطيط قلب ECG', 'تصوير قلب صدى (Echo)', 'غسيل كلى دموي',
  'أشعة سينية X-Ray', 'أشعة مقطعية CT', 'رنين مغناطيسي MRI',
  'فحص دم كامل CBC', 'تحليل وظائف كبد وكلى', 'زراعة مخبرية'
]

type ServiceRecord = {
  id: string
  serviceName: string
  cost: string
  status: string
}

const BASE_URL = '/api/project/projects/services'
// إعادة التحديد باللون الأزرق
const selectBaseClass = 'w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-right text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-600 font-normal appearance-none'

export default function ServicesPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<ServiceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
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

  const isAddValid = useMemo(() => serviceName !== '', [serviceName])

  const onAdd = async () => {
    if (!isAddValid) return
    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceName, cost, status })
      })
      if (res.ok) {
        await fetchData()
        setAddOpen(false)
        resetAddForm()
      }
    } finally { setSubmitting(false) }
  }

  const resetAddForm = () => {
    setServiceName(''); setCost(''); setStatus('متاحة');
  }

  const filteredItems = items.filter(item => 
    item.serviceName?.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div className="w-full px-4 py-6" dir="rtl">
      <div className="mb-6 text-right font-arabic">
        <h1 className="text-2xl font-bold text-slate-900 text-right">سجل الخدمات الطبية</h1>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl bg-white font-arabic">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row items-center gap-3 border-b">
            <div className="relative w-full max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث عن خدمة..."
                className="w-full pr-10 bg-slate-50 border-none h-10 rounded-lg text-sm"
              />
            </div>
            {/* الزر باللون الأزرق */}
            <Button onClick={() => setAddOpen(true)} className="bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 rounded-lg mr-auto font-bold shadow-sm transition-all">
              <Plus className="h-4 w-4 ml-2" /> إضافة خدمة جديدة
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 font-bold text-slate-600">
                <tr>
                  <th className="p-4 text-right">الخدمة الطبية</th>
                  <th className="p-4 text-right">التكلفة</th>
                  <th className="p-4 text-right">الحالة</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr><td colSpan={4} className="p-10 text-center"><Loader2 className="animate-spin mx-auto w-6 h-6 text-slate-300" /></td></tr>
                ) : filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-700">{item.serviceName}</td>
                    {/* التكلفة باللون الأزرق */}
                    <td className="p-4 font-mono text-blue-600 font-bold">{item.cost || '0'} $</td>
                    <td className="p-4 text-right">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${item.status === 'متاحة' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                        <Pencil className="w-4 h-4 mx-auto text-slate-400 cursor-pointer hover:text-blue-600" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="max-w-md font-arabic rounded-2xl max-h-[90vh] overflow-visible shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-right text-lg font-bold border-b pb-2">إضافة بيانات الخدمة</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-5 py-6 text-right">
            
            <div className="space-y-2 text-right">
              <label className="text-sm font-bold text-slate-800 block">اسم الخدمة الطبية</label>
              <div className="relative">
                <select 
                  className={selectBaseClass + " h-12 bg-blue-50/30 border-blue-100 font-bold text-blue-700 focus:border-blue-600"} 
                  value={serviceName} 
                  onChange={e => setServiceName(e.target.value)}
                >
                  <option value="">اختر الخدمة الطبية من القائمة</option>
                  {AVAILABLE_MEDICAL_SERVICES.map(ser => <option key={ser} value={ser}>{ser}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-right">
                <label className="text-sm font-bold text-slate-800 block">التكلفة الإجمالية ($)</label>
                <Input 
                  type="number" 
                  className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-blue-600 focus-visible:border-blue-600 transition-all text-right" 
                  value={cost} 
                  onChange={e => setCost(e.target.value)} 
                  placeholder="0.00" 
                />
            </div>

            <div className="space-y-2 text-right">
                <label className="text-sm font-bold text-slate-800 block">حالة توفر الخدمة</label>
                <div className="relative">
                  <select 
                    className={selectBaseClass + " h-12 bg-slate-50 border-slate-200 text-slate-700"} 
                    value={status} 
                    onChange={e => setStatus(e.target.value)}
                  >
                      <option value="متاحة">متاحة الآن</option>
                      <option value="غير متوفرة">غير متوفرة حالياً</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
            </div>

            {!isAddValid && (
              <div className="text-[12px] text-amber-700 flex items-center gap-2 bg-amber-50 p-3 rounded-xl border border-amber-200 mt-2">
                <AlertCircle className="w-4 h-4 shrink-0"/> يرجى تحديد نوع الخدمة الطبية لإتمام عملية الحفظ.
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
            {/* زر الحفظ بالأزرق */}
            <Button 
              onClick={onAdd} 
              disabled={!isAddValid || submitting} 
              className="w-full bg-blue-600 text-white font-bold h-12 rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95"
            >
              {submitting ? <Loader2 className="animate-spin ml-2 h-4 w-4" /> : null} حفظ البيانات
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {setAddOpen(false); resetAddForm();}} 
              className="w-full h-12 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}