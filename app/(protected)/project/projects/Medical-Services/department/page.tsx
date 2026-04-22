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

// قائمة شاملة للتخصصات والأقسام الطبية
const DEPARTMENTS_BY_SPECIALTY: Record<string, string[]> = {
  'الاستقبال والطوارئ': ['طوارئ كبار', 'طوارئ أطفال', 'وحدة الحوادث والإصابات', 'فرز الحالات (Triage)', 'الإسعاف الأولي'],
  'الجراحة العامة': ['غرفة العمليات الكبرى', 'جراحة المناظير', 'جراحة الأوعية الدموية', 'جراحة الجهاز الهضمي', 'قسم التعقيم'],
  'طب الأطفال': ['قسم الأطفال العام', 'الحضانة (حديثي الولادة)', 'العناية المركزة للأطفال (PICU)', 'تطعيمات الأطفال'],
  'النسائية والتوليد': ['غرف الولادة الطبيعية', 'عمليات القيصرية', 'رعاية ما قبل الولادة', 'قسم أمراض النساء'],
  'العناية المركزة والتخدير': ['العناية المركزة العامة (ICU)', 'عناية القلب (CCU)', 'عناية الحروق', 'وحدة الإفاقة'],
  'الأمراض الباطنية': ['قسم الباطنة العام', 'وحدة الكلى (غسيل الكلى)', 'قسم الجهاز الهضمي', 'قسم الصدرية', 'قسم القلب', 'الغدد الصماء والسكري'],
  'العظام والكسور': ['عيادة العظام', 'جراحة العظام والمفاصل', 'قسم الجبس والكسور'],
  'المختبر الطبي': ['وحدة سحب الدم', 'قسم الكيمياء الحيوية', 'قسم الأحياء الدقيقة (Microbiology)', 'بنك الدم'],
  'الأشعة والتصوير الطبي': ['الأشعة السينية (X-Ray)', 'الأشعة المقطعية (CT Scan)', 'الرنين المغناطيسي (MRI)', 'الأشعة فوق الصوتية (Ultrasound)'],
  'الأنف والأذن والحنجرة': ['عيادة ENT', 'وحدة قياس السمع', 'جراحة الأنف والأذن'],
  'العيون (الرمد)': ['عيادة العيون العامة', 'جراحة العيون والليزك', 'فحص النظر'],
  'العلاج الطبيعي والتأهيل': ['صالة التأهيل الحركي', 'وحدة العلاج الكهربائي', 'التأهيل بعد الإصابات'],
  'القلب والأوعية الدموية': ['وحدة قسطرة القلب', 'عيادة القلب', 'رسم القلب المجهود'],
  'الأعصاب وجراحة المخ': ['عيادة الأعصاب', 'وحدة التخطيط الدماغي', 'جراحة المخ والأعصاب']
}

type DepartmentRecord = {
  id: string
  deptName: string
  deptType: string
  status: string
  description: string
}

const BASE_URL = '/api/project/projects/departments'
const selectBaseClass = 'w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-right text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-100 font-normal'

export default function DepartmentsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<DepartmentRecord[]>([])
  const [loading, setLoading] = useState(true)

  // States للإضافة
  const [addOpen, setAddOpen] = useState(false)
  const [deptType, setDeptType] = useState('') 
  const [deptName, setDeptName] = useState('') 
  const [status, setStatus] = useState('يعمل بكفاءة')
  const [description, setDescription] = useState('')
  
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL)
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) { 
        console.error('Fetch error:', err) 
        setItems([])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const isAddValid = useMemo(() => {
    return deptName !== '' && deptType !== '' && status !== ''
  }, [deptName, deptType, status])

  const onAdd = async () => {
    if (!isAddValid) return
    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deptName, deptType, status, description })
      })
      if (res.ok) {
        await fetchData()
        setAddOpen(false)
        resetAddForm()
      }
    } finally { setSubmitting(false) }
  }

  const resetAddForm = () => {
    setDeptType(''); setDeptName(''); setStatus('يعمل بكفاءة'); setDescription('');
  }

  const filteredItems = items.filter(item => 
    item.deptName?.toLowerCase().includes(q.toLowerCase()) ||
    item.deptType?.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div className="w-full px-4 py-6" dir="rtl">
      <div className="mb-6 text-right font-arabic">
        <h1 className="text-2xl font-bold text-slate-900">إدارة الأقسام الطبية</h1>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl bg-white font-arabic">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row items-center gap-3 border-b">
            <div className="relative w-full max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث عن قسم..."
                className="w-full pr-10 bg-slate-50 border-none h-10 rounded-lg text-sm"
              />
            </div>
            <Button onClick={() => setAddOpen(true)} className="bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 rounded-lg mr-auto font-bold shadow-sm">
              <Plus className="h-4 w-4 ml-2" /> إضافة قسم جديد
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 font-bold text-slate-600">
                <tr>
                  {/* تم تعديل الترتيب هنا */}
                  <th className="p-4">نوع التخصص</th>
                  <th className="p-4">اسم القسم</th>
                  <th className="p-4">الحالة التشغيلية</th>
                  <th className="p-4">وصف الخدمات / ملاحظات</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="animate-spin mx-auto w-6 h-6 text-slate-300" /></td></tr>
                ) : filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    {/* تم تعديل الترتيب هنا أيضاً ليتوافق مع الرأس */}
                    <td className="p-4 font-medium text-blue-600">{item.deptType}</td>
                    <td className="p-4 font-bold text-slate-700">{item.deptName}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        item.status === 'يعمل بكفاءة' ? 'bg-emerald-100 text-emerald-700' : 
                        item.status === 'مزدحم' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 max-w-[200px] truncate text-slate-500">{item.description || '-'}</td>
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
          <DialogHeader><DialogTitle className="text-right text-lg font-bold">إضافة بيانات القسم</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-4 text-right">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">نوع التخصص</label>
              <select 
                className={selectBaseClass + " h-11 bg-slate-50"} 
                value={deptType} 
                onChange={e => {
                  setDeptType(e.target.value);
                  setDeptName(''); 
                }}
              >
                <option value="">اختر التخصص</option>
                {Object.keys(DEPARTMENTS_BY_SPECIALTY).map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">اسم القسم</label>
              <select 
                className={selectBaseClass + " h-11 bg-slate-50"} 
                value={deptName} 
                onChange={e => setDeptName(e.target.value)}
                disabled={!deptType}
              >
                <option value="">{deptType ? 'اختر القسم التابع للتخصص' : 'يجب اختيار التخصص أولاً'}</option>
                {deptType && DEPARTMENTS_BY_SPECIALTY[deptType] && DEPARTMENTS_BY_SPECIALTY[deptType].map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">الحالة التشغيلية</label>
              <select className={selectBaseClass + " h-11 bg-slate-50"} value={status} onChange={e => setStatus(e.target.value)}>
                <option value="يعمل بكفاءة">يعمل بكفاءة</option>
                <option value="مزدحم">مزدحم</option>
                <option value="خارج الخدمة">خارج الخدمة</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">ملاحظات</label>
              <textarea className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm outline-none min-h-[80px]" value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            {!isAddValid && (
              <div className="text-[11px] text-amber-600 flex items-center gap-2 bg-amber-50 p-2 rounded-lg border border-amber-100">
                <AlertCircle className="w-3.5 h-3.5 shrink-0"/> يرجى اختيار التخصص والقسم للحفظ.
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-row gap-3">
            <Button onClick={onAdd} disabled={!isAddValid || submitting} className="flex-1 bg-blue-600 text-white font-bold h-11 rounded-xl shadow-lg">
              {submitting ? <Loader2 className="animate-spin ml-2" /> : null} حفظ البيانات
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1 h-11 rounded-xl">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}