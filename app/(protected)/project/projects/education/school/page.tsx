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
  Check, 
  X, 
  AlertCircle 
} from 'lucide-react'

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

const BASE_URL = '/api/project/education/schools'
const inlineInputClass = "h-9 text-xs p-2 bg-white border-slate-200 focus:ring-1 focus:ring-blue-400"

export default function SchoolsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<School[]>([])
  const [loading, setLoading] = useState(true)

  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<School>>({})

  const [addOpen, setAddOpen] = useState(false)
  const [newSchool, setNewSchool] = useState({
    schoolName: '', location: '', area: '', stage: '', studyDays: '', feesStatus: '', shift: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchSchools = async (searchQuery: string = q) => {
    setLoading(true)
    try {
      const res = await fetch(`${BASE_URL}?q=${encodeURIComponent(searchQuery.trim())}`)
      const data = await res.json()
      setItems(data)
    } catch (err) { console.error(err) } 
    finally { setLoading(false) }
  }

  useEffect(() => {
    const timer = setTimeout(() => fetchSchools(), 300)
    return () => clearTimeout(timer)
  }, [q])

  // --- شروط التحقق الصارمة ---
  
  // فحص حقول الإضافة
  const isNewSchoolComplete = useMemo(() => {
    return Object.values(newSchool).every(value => value.trim() !== '')
  }, [newSchool])

  // فحص حقول التعديل المباشر
  const isEditDataComplete = (data: Partial<School>) => {
    const fields = ['schoolName', 'location', 'area', 'stage', 'studyDays', 'feesStatus', 'shift']
    return fields.every(field => data[field as keyof School]?.trim() !== '')
  }

  // --- العمليات ---

  const startEditing = (school: School) => {
    setEditingRowId(school.id)
    setEditData(school)
  }

  const saveInlineEdit = async (id: string) => {
    // شرط صارم: لا ترسل الطلب إذا كانت الحقول ناقصة
    if (!isEditDataComplete(editData)) {
      alert("يرجى إكمال جميع الحقول قبل الحفظ")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editData })
      })
      if (res.ok) {
        await fetchSchools()
        setEditingRowId(null)
      }
    } finally { setSubmitting(false) }
  }

  const onAdd = async () => {
    // شرط صارم: لا ترسل الطلب إذا كانت الحقول ناقصة
    if (!isNewSchoolComplete) return

    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchool)
      })
      if (res.ok) {
        await fetchSchools()
        setAddOpen(false)
        setNewSchool({ schoolName: '', location: '', area: '', stage: '', studyDays: '', feesStatus: '', shift: '' })
      }
    } finally { setSubmitting(false) }
  }

  return (
    <div className="w-full px-4 py-6 font-arabic" dir="rtl">
      <div className="mb-6 text-right">
        <h1 className="text-2xl font-bold text-slate-900">إدارة المدارس</h1>
        <p className="text-sm text-slate-500 mt-1">الرئيسية &gt; جدول المدارس</p>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl bg-white">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row items-center gap-3 border-b">
            <div className="relative w-full max-w-xs">
              <Search 
                className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 cursor-pointer" 
                onClick={() => fetchSchools()}
              />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchSchools()}
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
                  <th className="p-4">الموقع</th>
                  <th className="p-4">المنطقة</th>
                  <th className="p-4">المرحلة</th>
                  <th className="p-4">أيام الدراسة</th>
                  <th className="p-4">التوقيت</th>
                  <th className="p-4 text-center">الرسوم</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={8} className="p-10 text-center"><Loader2 className="animate-spin mx-auto w-6 h-6 text-slate-300" /></td></tr>
                ) : items.map((item) => (
                  <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${editingRowId === item.id ? 'bg-blue-50/30' : ''}`}>
                    {editingRowId === item.id ? (
                      <>
                        <td className="p-2"><Input className={inlineInputClass} value={editData.schoolName} onChange={e => setEditData({...editData, schoolName: e.target.value})} /></td>
                        <td className="p-2">
                          <select className="w-full h-9 text-xs border border-slate-200 rounded-md" value={editData.location} onChange={e => setEditData({...editData, location: e.target.value, area: ''})}>
                            <option value="">اختر..</option>
                            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <select className="w-full h-9 text-xs border border-slate-200 rounded-md" value={editData.area} onChange={e => setEditData({...editData, area: e.target.value})} disabled={!editData.location}>
                            <option value="">اختر..</option>
                            {editData.location && AREAS_BY_LOCATION[editData.location].map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <select className="w-full h-9 text-xs border border-slate-200 rounded-md" value={editData.stage} onChange={e => setEditData({...editData, stage: e.target.value})}>
                            <option value="">اختر..</option>
                            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <select className="w-full h-9 text-xs border border-slate-200 rounded-md" value={editData.studyDays} onChange={e => setEditData({...editData, studyDays: e.target.value})}>
                            <option value="">اختر..</option>
                            {STUDY_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <select className="w-full h-9 text-xs border border-slate-200 rounded-md" value={editData.shift} onChange={e => setEditData({...editData, shift: e.target.value})}>
                            <option value="">اختر..</option>
                            {SHIFTS.map(sh => <option key={sh} value={sh}>{sh}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <select className="w-full h-9 text-xs border border-slate-200 rounded-md" value={editData.feesStatus} onChange={e => setEditData({...editData, feesStatus: e.target.value})}>
                            <option value="">اختر..</option>
                            {FEES_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </td>
                        <td className="p-4 flex items-center justify-center gap-2">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className={`h-8 w-8 ${isEditDataComplete(editData) ? 'text-green-600 hover:bg-green-50' : 'text-slate-300 cursor-not-allowed'}`}
                            onClick={() => isEditDataComplete(editData) && saveInlineEdit(item.id)}
                            disabled={!isEditDataComplete(editData) || submitting}
                          >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => setEditingRowId(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 font-bold text-slate-700">{item.schoolName}</td>
                        <td className="p-4 text-slate-600">{item.location}</td>
                        <td className="p-4 text-slate-600">{item.area}</td>
                        <td className="p-4">{item.stage}</td>
                        <td className="p-4 text-slate-500 text-[11px]">{item.studyDays}</td>
                        <td className="p-4 font-medium">{item.shift}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold ${item.feesStatus === 'فى رسوم' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                            {item.feesStatus}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <Pencil onClick={() => startEditing(item)} className="w-4 h-4 mx-auto text-slate-400 cursor-pointer hover:text-blue-600" />
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="max-w-md font-arabic rounded-2xl">
          <DialogHeader><DialogTitle className="text-right text-lg font-bold">إضافة مدرسة جديدة</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-4 text-right">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">اسم المدرسة *</label>
              <Input className="h-11 bg-slate-50" placeholder="اسم المدرسة" value={newSchool.schoolName} onChange={e => setNewSchool({...newSchool, schoolName: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">الموقع *</label>
                <select className="w-full h-11 border border-slate-200 rounded-lg px-3 bg-slate-50" value={newSchool.location} onChange={e => setNewSchool({...newSchool, location: e.target.value, area: ''})}>
                  <option value="">اختر الموقع</option>
                  {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">المنطقة *</label>
                <select className="w-full h-11 border border-slate-200 rounded-lg px-3 bg-slate-50" value={newSchool.area} onChange={e => setNewSchool({...newSchool, area: e.target.value})} disabled={!newSchool.location}>
                  <option value="">اختر المنطقة</option>
                  {newSchool.location && AREAS_BY_LOCATION[newSchool.location].map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">المرحلة *</label>
                <select className="w-full h-11 border border-slate-200 rounded-lg px-3 bg-slate-50" value={newSchool.stage} onChange={e => setNewSchool({...newSchool, stage: e.target.value})}>
                  <option value="">اختر المرحلة</option>
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">التوقيت *</label>
                <select className="w-full h-11 border border-slate-200 rounded-lg px-3 bg-slate-50" value={newSchool.shift} onChange={e => setNewSchool({...newSchool, shift: e.target.value})}>
                  <option value="">اختر التوقيت</option>
                  {SHIFTS.map(sh => <option key={sh} value={sh}>{sh}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">أيام الدراسة *</label>
              <select className="w-full h-11 border border-slate-200 rounded-lg px-3 bg-slate-50" value={newSchool.studyDays} onChange={e => setNewSchool({...newSchool, studyDays: e.target.value})}>
                <option value="">اختر الأيام</option>
                {STUDY_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">الرسوم *</label>
              <select className="w-full h-11 border border-slate-200 rounded-lg px-3 bg-slate-50" value={newSchool.feesStatus} onChange={e => setNewSchool({...newSchool, feesStatus: e.target.value})}>
                <option value="">اختر حالة الرسوم</option>
                {FEES_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            {!isNewSchoolComplete && (
              <p className="text-[10px] text-red-500 bg-red-50 p-2 rounded border border-red-100 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> جميع الحقول مطلوبة للمتابعة.
              </p>
            )}
          </div>
          <DialogFooter className="flex flex-row gap-3">
            <Button 
              onClick={onAdd} 
              disabled={!isNewSchoolComplete || submitting} 
              className={`flex-1 font-bold h-11 rounded-xl ${isNewSchoolComplete ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
            >
              {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'حفظ البيانات'}
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1 h-11 rounded-xl">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}