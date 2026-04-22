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

type HospitalRecord = {
  id: string
  hospitalType: string
  hospitalName: string
  phone: string
  status: string // حقل الحالة الجديد
  description: string
}

const BASE_URL = '/api/project/projects/doctors'
const selectBaseClass = 'w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-right text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-100 font-normal'

export default function HospitalsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<HospitalRecord[]>([])
  const [loading, setLoading] = useState(true)

  // States للإضافة
  const [addOpen, setAddOpen] = useState(false)
  const [hospitalType, setHospitalType] = useState('')
  const [hospitalName, setHospitalName] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState('') // حالة المستشفى
  const [description, setDescription] = useState('')
  
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL)
      const data = await res.json()
      setItems(data)
    } catch (err) { console.error('Fetch error:', err) } 
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const isAddValid = useMemo(() => {
    return hospitalName.trim() !== '' && hospitalType !== '' && phone.trim() !== '' && status !== ''
  }, [hospitalName, hospitalType, phone, status])

  const onAdd = async () => {
    if (!isAddValid) return
    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospitalType, hospitalName, phone, status, description })
      })
      if (res.ok) {
        await fetchData()
        setAddOpen(false)
        resetAddForm()
      }
    } finally { setSubmitting(false) }
  }

  const resetAddForm = () => {
    setHospitalType(''); setHospitalName(''); setPhone(''); setStatus(''); setDescription('');
  }

  const filteredItems = items.filter(item => 
    item.hospitalName?.toLowerCase().includes(q.toLowerCase()) ||
    item.hospitalType?.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div className="w-full px-4 py-6" dir="rtl">
      <div className="mb-6 text-right font-arabic">
        <h1 className="text-2xl font-bold text-slate-900">إدارة سجل المستشفيات</h1>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl bg-white font-arabic">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row items-center gap-3 border-b">
            <div className="relative w-full max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث..."
                className="w-full pr-10 bg-slate-50 border-none h-10 rounded-lg text-sm"
              />
            </div>
            <Button onClick={() => setAddOpen(true)} className="bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 rounded-lg mr-auto font-bold shadow-sm">
              <Plus className="h-4 w-4 ml-2" /> إضافة سجل جديد
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 font-bold text-slate-600">
                <tr>
                  <th className="p-4">نوع المستشفى</th>
                  <th className="p-4">اسم المستشفى</th>
                  <th className="p-4">رقم الهاتف</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4">ملاحظات</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr><td colSpan={6} className="p-10 text-center"><Loader2 className="animate-spin mx-auto w-6 h-6 text-slate-300" /></td></tr>
                ) : filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-blue-600">{item.hospitalType}</td>
                    <td className="p-4 font-bold text-slate-700">{item.hospitalName}</td>
                    <td className="p-4">{item.phone}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${item.status === 'بيشتغل' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 max-w-[150px] truncate text-slate-500">{item.description || '-'}</td>
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
        <DialogContent dir="rtl" className="max-w-md font-arabic rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-right text-lg font-bold">إضافة بيانات جديدة</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-4 text-right">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">نوع المستشفى</label>
              <select className={selectBaseClass + " h-11 bg-slate-50"} value={hospitalType} onChange={e => setHospitalType(e.target.value)}>
                <option value="">اختر النوع</option>
                <option value="حكومى">حكومى</option>
                <option value="وكالة">وكالة</option>
                <option value="خاص">خاص</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">اسم المستشفى</label>
              <Input 
                className="h-11 bg-slate-50" 
                placeholder="ادخل اسم المستشفى" 
                value={hospitalName} 
                onChange={e => setHospitalName(e.target.value)} 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">رقم الهاتف</label>
              <Input className="h-11 bg-slate-50" placeholder="05XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">حالة المستشفى</label>
              <select className={selectBaseClass + " h-11 bg-slate-50"} value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">اختر الحالة</option>
                <option value="بيشتغل">بيشتغل</option>
                <option value="خارج االخدمة">خارج االخدمة</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">ملاحظات / وصف</label>
              <textarea className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm outline-none min-h-[60px]" value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            {!isAddValid && (
              <div className="text-[11px] text-amber-600 flex items-center gap-2 bg-amber-50 p-2 rounded-lg border border-amber-100">
                <AlertCircle className="w-3.5 h-3.5 shrink-0"/> يرجى تعبئة الحقول الأساسية للحفظ.
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-row gap-3">
            <Button onClick={onAdd} disabled={!isAddValid || submitting} className="flex-1 bg-blue-600 text-white font-bold h-11 rounded-xl shadow-lg">
              {submitting ? <Loader2 className="animate-spin ml-2" /> : null} حفظ البيانات
            </Button>
            <Button variant="outline" onClick={() => {setAddOpen(false); resetAddForm();}} className="flex-1 h-11 rounded-xl">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}