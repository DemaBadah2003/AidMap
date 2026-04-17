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

// البيانات الثابتة للقوائم المنسدلة
const LOCATIONS = ['شمال', 'جنوب', 'شرق', 'غرب']
const AREAS_BY_LOCATION: Record<string, string[]> = {
  'شمال': ['جباليا', 'بيت لاهيا', 'بيت حانون'],
  'جنوب': ['رفح', 'خانيونس'],
  'شرق': ['حي الشجاعية', 'الزيتون', 'التفاح'],
  'غرب': ['الرمال', 'مخيم الشاطئ', 'تل الهوى']
}
const STAGES = ['ابتدائي', 'اعدادى', 'ثانوى']
const STUDY_DAYS = ['السبت الاثنين الاربعاء', 'الاحد الثلاثاء الخميس']
const FEES_OPTIONS = ['فى رسوم', 'لا يوجد رسوم']
const SHIFTS = ['صباحى', 'مسائي']

type School = {
  id: string
  schoolName: string
  location: string
  area: string
  stage: string
  studyDays: string
  feesStatus: string
  shift: string
}

const BASE_URL = '/api/project/projects/medical/schools' 
const selectBaseClass = 'w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-right text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-100 font-normal'

export default function SchoolsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<School[]>([])
  const [loading, setLoading] = useState(true)

  // حقول الإضافة المحدثة
  const [addOpen, setAddOpen] = useState(false)
  const [schoolName, setSchoolName] = useState('')
  const [location, setLocation] = useState('')
  const [area, setArea] = useState('')
  const [stage, setStage] = useState('')
  const [studyDays, setStudyDays] = useState('')
  const [feesStatus, setFeesStatus] = useState('')
  const [shift, setShift] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchSchools = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL)
      const data = await res.json()
      setItems(data)
    } catch (err) { console.error('Fetch error:', err) } 
    finally { setLoading(false) }
  }

  useEffect(() => { fetchSchools() }, [])

  const isAddValid = useMemo(() => {
    return (
      schoolName.trim() !== '' &&
      location !== '' &&
      area !== '' &&
      stage !== '' &&
      studyDays !== '' &&
      feesStatus !== '' &&
      shift !== ''
    )
  }, [schoolName, location, area, stage, studyDays, feesStatus, shift])

  const onAdd = async () => {
    if (!isAddValid) return
    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolName, location, area, stage, studyDays, feesStatus, shift })
      })
      if (res.ok) {
        await fetchSchools()
        setAddOpen(false)
        resetAddForm()
      }
    } finally { setSubmitting(false) }
  }

  const resetAddForm = () => {
    setSchoolName(''); setLocation(''); setArea(''); setStage(''); setStudyDays(''); setFeesStatus(''); setShift('');
  }

  return (
    <div className="w-full px-4 py-6" dir="rtl">
      <div className="mb-6 text-right">
        <h1 className="text-2xl font-bold text-slate-900 font-arabic">إدارة المدارس</h1>
        <p className="text-sm text-slate-500 mt-1 font-normal font-arabic">الرئيسية &gt; جدول المدارس</p>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl bg-white font-arabic">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row items-center gap-3 border-b">
            <div className="relative w-full max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث عن مدرسة..."
                className="w-full pr-10 bg-slate-50 border-none h-10 rounded-lg text-sm"
              />
            </div>
            <Button onClick={() => setAddOpen(true)} className="bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 rounded-lg mr-auto font-bold shadow-sm">
              <Plus className="h-4 w-4 ml-2" /> إضافة مدرسة
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 font-bold text-slate-600">
                <tr>
                  <th className="p-4">اسم المدرسة</th>
                  <th className="p-4">الموقع / المنطقة</th>
                  <th className="p-4">المرحلة</th>
                  <th className="p-4">أيام الدراسة</th>
                  <th className="p-4">التوقيت</th>
                  <th className="p-4 text-center">الرسوم</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="p-10 text-center"><Loader2 className="animate-spin mx-auto w-6 h-6 text-slate-300" /></td></tr>
                ) : items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-700">{item.schoolName}</td>
                    <td className="p-4 text-slate-600">{item.location} - {item.area}</td>
                    <td className="p-4">{item.stage}</td>
                    <td className="p-4 text-slate-500 text-xs">{item.studyDays}</td>
                    <td className="p-4 font-medium">{item.shift}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${item.feesStatus === 'فى رسوم' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                        {item.feesStatus}
                      </span>
                    </td>
                    <td className="p-4 text-center"><Pencil className="w-4 h-4 mx-auto text-slate-400 cursor-pointer hover:text-blue-600" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="max-w-md font-arabic rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-right text-lg font-bold">إضافة مدرسة جديدة</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-4 text-right">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">اسم المدرسة</label>
              <Input className="h-11 bg-slate-50" placeholder="أدخل اسم المدرسة" value={schoolName} onChange={e => setSchoolName(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">الموقع</label>
              <select className={selectBaseClass + " h-11 bg-slate-50"} value={location} onChange={e => { setLocation(e.target.value); setArea(''); }}>
                <option value="">اختر الموقع</option>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">المنطقة</label>
              <select className={selectBaseClass + " h-11 bg-slate-50"} value={area} onChange={e => setArea(e.target.value)} disabled={!location}>
                <option value="">اختر المنطقة</option>
                {location && AREAS_BY_LOCATION[location].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">المرحلة الدراسية</label>
              <select className={selectBaseClass + " h-11 bg-slate-50"} value={stage} onChange={e => setStage(e.target.value)}>
                <option value="">اختر المرحلة</option>
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">مواعيد الدراسة (الأيام)</label>
              <select className={selectBaseClass + " h-11 bg-slate-50"} value={studyDays} onChange={e => setStudyDays(e.target.value)}>
                <option value="">اختر الأيام</option>
                {STUDY_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">التوقيت</label>
              <select className={selectBaseClass + " h-11 bg-slate-50"} value={shift} onChange={e => setShift(e.target.value)}>
                <option value="">اختر التوقيت</option>
                {SHIFTS.map(sh => <option key={sh} value={sh}>{sh}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">الرسوم الدراسية</label>
              <select className={selectBaseClass + " h-11 bg-slate-50"} value={feesStatus} onChange={e => setFeesStatus(e.target.value)}>
                <option value="">اختر حالة الرسوم</option>
                {FEES_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            {!isAddValid && (
              <div className="text-[11px] text-amber-600 flex items-center gap-2 bg-amber-50 p-2 rounded-lg border border-amber-100">
                <AlertCircle className="w-3.5 h-3.5 shrink-0"/> يرجى تعبئة كافة الحقول المطلوبة.
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