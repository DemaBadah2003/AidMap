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
import { Plus, Search, Loader2, AlertCircle } from 'lucide-react'

const SPECIALIZATIONS = ['طب باطني', 'طب أطفال', 'جراحة عامة', 'نسائية وتوليد', 'طب طوارئ']

type DoctorData = {
  id: string
  name: string
  specialization: string
  hospitalName: string
  phone: string
  workSchedule: string
  description: string
}

const BASE_URL = '/api/project/Medical-Services/doctors'
// تأكدي أن هذا المسار هو الصحيح لجلب قائمة المستشفيات في مشروعك
const HOSPITALS_URL = '/api/project/Medical-Services/hospitals' 

export default function DoctorsPage() {
  const [items, setItems] = useState<DoctorData[]>([])
  const [hospitals, setHospitals] = useState<{id: string, name: string}[]>([]) 
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: '',
    hospitalId: '', 
    specialization: '',
    phone: '',
    workSchedule: '',
    description: ''
  })

  const isPhoneValid = useMemo(() => {
    const phoneRegex = /^(056|059)\d{7}$/
    return phoneRegex.test(form.phone)
  }, [form.phone])

  const isFormValid = useMemo(() => {
    return (
      form.name.trim() !== '' &&
      form.hospitalId !== '' &&
      form.specialization !== '' &&
      isPhoneValid &&
      form.workSchedule !== ''
    )
  }, [form, isPhoneValid])

  // دالة جلب البيانات المحسنة لجلب المستشفيات أيضاً
  const fetchData = async () => {
    setLoading(true)
    try {
      const [docRes, hospRes] = await Promise.all([
        fetch(BASE_URL),
        fetch(HOSPITALS_URL)
      ])
      
      const docData = await docRes.json()
      const hospData = await hospRes.json()
      
      setItems(docData.doctors || [])
      // استخراج المصفوفة الصحيحة من الرد (تأكدي من هيكلة الـ JSON الراجع من API المستشفيات)
      setHospitals(hospData.hospitals || hospData || []) 
    } catch (err) { 
      console.error("Error loading data:", err) 
    } finally { 
      setLoading(false) 
    }
  }

  useEffect(() => { fetchData() }, [])

  const onSave = async () => {
    if (!isFormValid) return
    setSubmitting(true)
    
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (res.ok) {
        await fetchData()
        setAddOpen(false)
        resetForm()
      } else {
        const errorData = await res.json()
        alert(errorData.message || "حدث خطأ أثناء الحفظ")
      }
    } catch (error) {
      console.error("Save Error:", error)
    } finally { setSubmitting(false) }
  }

  const resetForm = () => {
    setForm({
      name: '',
      hospitalId: '',
      specialization: '',
      phone: '',
      workSchedule: '',
      description: ''
    })
  }

  return (
    <div className="w-full px-4 py-8 sm:px-10 font-arabic" dir="rtl">
      <div className="mb-8 text-right px-2">
        <h1 className="text-3xl font-extrabold text-slate-900">إدارة سجل الأطباء</h1>
        <p className="text-sm text-muted-foreground mt-1">إضافة وتعديل بيانات الأطباء والمنشآت والمواعيد</p>
      </div>

      <div className="flex justify-between items-center mb-6 gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
            placeholder="بحث عن طبيب..." 
            className="pr-9 text-right rounded-lg border-slate-200" 
          />
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 px-6 rounded-lg shadow-sm" 
          onClick={() => { resetForm(); setAddOpen(true); }}
        >
          <Plus className="h-5 w-5" /> إضافة طبيب جديد
        </Button>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="text-right sm:max-w-[500px] rounded-2xl font-arabic overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center justify-center gap-2 border-b pb-4">
               إضافة طبيب جديد
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-1">
              <label className="text-xs font-bold text-slate-600">اسم الطبيب</label>
              <Input 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                placeholder="أدخل اسم الطبيب" 
                className="h-11 rounded-xl bg-slate-50 border-slate-200" 
              />
            </div>

            {/* حقل المستشفى - Dropdown ديناميكي من جدول المستشفيات */}
            <div className="grid gap-1">
              <label className="text-xs font-bold text-slate-600">المستشفى</label>
              <select 
                className="h-11 border border-slate-200 rounded-xl px-2 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500" 
                value={form.hospitalId} 
                onChange={e => setForm({...form, hospitalId: e.target.value})}
              >
                <option value="">اختر المستشفى المرتبط</option>
                {hospitals.length > 0 ? (
                  hospitals.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))
                ) : (
                  <option disabled>لا توجد مستشفيات متاحة</option>
                )}
              </select>
            </div>

            <div className="grid gap-1">
              <label className="text-xs font-bold text-slate-600">التخصص</label>
              <select 
                className="h-11 border border-slate-200 rounded-xl px-2 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500" 
                value={form.specialization} 
                onChange={e => setForm({...form, specialization: e.target.value})}
              >
                <option value="">اختر التخصص</option>
                {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="grid gap-1">
              <label className="text-xs font-bold text-slate-600">رقم الهاتف</label>
              <Input 
                placeholder="056XXXXXXX" 
                value={form.phone} 
                onChange={e => setForm({...form, phone: e.target.value})} 
                className={`h-11 rounded-xl bg-slate-50 ${!isPhoneValid && form.phone ? 'border-red-500' : 'border-slate-200'}`} 
                dir="ltr" 
              />
            </div>

            <div className="grid gap-1">
              <label className="text-xs font-bold text-slate-600">مواعيد العمل</label>
              <select 
                className="h-11 border border-slate-200 rounded-xl px-2 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={form.workSchedule} 
                onChange={e => setForm({...form, workSchedule: e.target.value})}
              >
                <option value="">اختر أيام العمل</option>
                <option value="السبت، الاثنين، الأربعاء">السبت، الاثنين، الأربعاء</option>
                <option value="الأحد، الثلاثاء، الخميس">الأحد، الثلاثاء، الخميس</option>
              </select>
            </div>

            <div className="grid gap-1">
              <label className="text-xs font-bold text-slate-600">وصف إضافي</label>
              <textarea 
                className="w-full min-h-[80px] border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="ملاحظات أخرى..." 
                value={form.description} 
                onChange={e => setForm({...form, description: e.target.value})} 
              />
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
              <p className="text-[10px] text-orange-700 leading-relaxed">
                يرجى التأكد من اختيار المستشفى من القائمة لضمان صحة الربط وتجنب خطأ 400.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button 
              onClick={onSave} 
              disabled={!isFormValid || submitting} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 flex-1 rounded-xl shadow-md disabled:bg-slate-300"
            >
               {submitting ? <Loader2 className="animate-spin" /> : 'حفظ الطبيب'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setAddOpen(false)} 
              className="h-12 flex-1 rounded-xl border-slate-200 text-slate-600"
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="border shadow-sm rounded-xl overflow-hidden mt-6">
        <CardContent className="p-0 text-right">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b">
                <tr>
                  <th className="px-6 py-4 font-semibold text-right">الطبيب</th>
                  <th className="px-6 py-4 font-semibold text-right">المستشفى</th>
                  <th className="px-6 py-4 font-semibold text-right">التخصص</th>
                  <th className="px-6 py-4 font-semibold text-right">رقم الهاتف</th>
                  <th className="px-6 py-4 font-semibold text-right">المواعيد</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={5} className="p-10 text-center text-slate-400">لا يوجد أطباء مسجلين حالياً</td></tr>
                ) : items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{item.name}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{item.hospitalName}</td>
                    <td className="px-6 py-4 text-slate-600">{item.specialization}</td>
                    <td className="px-6 py-4 font-mono text-xs" dir="ltr">{item.phone}</td>
                    <td className="px-6 py-4 text-xs text-blue-600 font-medium">{item.workSchedule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}