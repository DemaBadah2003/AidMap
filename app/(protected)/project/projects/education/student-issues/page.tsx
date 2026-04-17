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
  GraduationCap
} from 'lucide-react'

type EducationCase = {
  id: string
  caseType: string
  studyLevel: string
  studentName: string
  schoolName: string
  status: string
}

const BASE_URL = '/api/project/projects/education-cases' 
const topControlHeight = 'h-10'
const inputBaseClass = 'w-full min-w-0 rounded-lg border-slate-200 bg-white text-right text-xs sm:text-sm outline-none focus:!ring-2 focus:!ring-slate-100 font-normal'
const selectBaseClass = 'w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-right text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-100 font-normal'

// الخيارات المحددة للقوائم المنسدلة
const CASE_TYPES = ["تسجيل طالب جديد", "طلب قرطاسية", "انقطاع عن الدراسة", "احتياج دروس تقوية"]
const STUDY_LEVELS = ["ابتدائي", "إعدادي", "ثانوي"]
const CASE_STATUS = ["جديد", "تم توفير الخدمة", "قيد المتابعة"]

export default function EducationCasesPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<EducationCase[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5) 

  const [addOpen, setAddOpen] = useState(false)
  
  // الحالات (States) للإضافة
  const [caseType, setCaseType] = useState('')
  const [studyLevel, setStudyLevel] = useState('')
  const [studentName, setStudentName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [status, setStatus] = useState('جديد')
  
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Omit<EducationCase, 'id'>>({
    caseType: '', studyLevel: '', studentName: '', schoolName: '', status: ''
  })

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

  const isEditValid = useMemo(() => {
    return editDraft.caseType !== '' && editDraft.studentName !== '' && editDraft.schoolName !== ''
  }, [editDraft])

  const isAddValid = useMemo(() => {
    return caseType !== '' && studentName !== '' && schoolName !== ''
  }, [caseType, studentName, schoolName])

  const onAdd = async () => {
    if (!isAddValid) return
    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseType, studyLevel, studentName, schoolName, status })
      })
      if (res.ok) {
        await fetchData()
        setAddOpen(false)
        resetAddForm()
      }
    } finally { setSubmitting(false) }
  }

  const saveEditRow = async (id: string) => {
    if (!isEditValid) return
    try {
      const res = await fetch(`${BASE_URL}?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDraft)
      })
      if (res.ok) {
        await fetchData()
        setEditingId(null)
      }
    } catch (err) { console.error(err) }
  }

  const resetAddForm = () => {
    setCaseType(''); setStudyLevel(''); setStudentName(''); setSchoolName(''); setStatus('جديد');
  }

  const filtered = useMemo(() => {
    return items.filter((c) => !q || c.studentName.includes(q) || c.caseType.includes(q))
  }, [q, items])

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage, itemsPerPage])

  return (
    <div className="w-full px-4 py-6" dir="rtl">
      {/* العنوان على اليمين */}
      <div className="mb-6 flex items-center justify-start gap-2 font-arabic">
        <GraduationCap className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-slate-900">إدارة قضايا التعليم</h1>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl bg-white font-arabic">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row items-center gap-3 border-b">
            <div className="relative w-full max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث باسم الطالب أو نوع القضية..."
                className={`${inputBaseClass} ${topControlHeight} pr-10 bg-slate-50 border-none`}
              />
            </div>
            <Button onClick={() => setAddOpen(true)} className={`bg-blue-600 text-white hover:bg-blue-700 ${topControlHeight} px-4 rounded-lg mr-auto font-bold`}>
              <Plus className="h-4 w-4 ml-2" /> إضافة قضية جديدة
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="p-4 text-slate-500 font-bold">نوع القضية</th>
                  <th className="p-4 text-slate-500 font-bold">المرحلة</th>
                  <th className="p-4 text-slate-500 font-bold">اسم الطالب</th>
                  <th className="p-4 text-slate-500 font-bold">المدرسة</th>
                  <th className="p-4 text-slate-500 font-bold">الحالة</th>
                  <th className="p-4 text-center text-slate-500 font-bold">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr><td colSpan={6} className="p-20 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-600" /></td></tr>
                ) : paginatedData.map((c) => {
                  const isEditing = editingId === c.id;
                  return (
                    <tr key={c.id} className={isEditing ? 'bg-blue-50/40' : 'hover:bg-slate-50/50 transition-colors'}>
                      <td className="p-4">
                        {isEditing ? (
                          <select className={selectBaseClass} value={editDraft.caseType} onChange={e => setEditDraft({...editDraft, caseType: e.target.value})}>
                            <option value="">اختر نوع القضية</option>
                            {CASE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        ) : c.caseType}
                      </td>
                      <td className="p-4 font-bold">
                        {isEditing ? (
                          <select className={selectBaseClass} value={editDraft.studyLevel} onChange={e => setEditDraft({...editDraft, studyLevel: e.target.value})}>
                            <option value="">المرحلة</option>
                            {STUDY_LEVELS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        ) : c.studyLevel}
                      </td>
                      <td className="p-4">{c.studentName}</td>
                      <td className="p-4">{c.schoolName}</td>
                      <td className="p-4">
                         {isEditing ? (
                            <select className={selectBaseClass} value={editDraft.status} onChange={e => setEditDraft({...editDraft, status: e.target.value})}>
                              {CASE_STATUS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          ) : (
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${c.status === 'تم توفير الخدمة' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                              {c.status}
                            </span>
                          )}
                      </td>
                      <td className="p-4 text-center">
                        {isEditing ? (
                          <div className="flex gap-2 justify-center">
                            <Button size="sm" onClick={() => saveEditRow(c.id)}>حفظ</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>إلغاء</Button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingId(c.id); setEditDraft(c); }} className="p-2 hover:bg-blue-50 rounded-md text-slate-400 hover:text-blue-600 transition-colors">
                            <Pencil className="w-4 h-4"/>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* النافذة المنبثقة للإضافة */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="max-w-md font-arabic rounded-2xl shadow-2xl border-none">
          <DialogHeader>
            <DialogTitle className="text-right text-lg font-bold">إضافة قضية تعليمية جديدة</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-4 text-right">
            
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">نوع القضية</label>
               <select className={`${selectBaseClass} h-11 bg-slate-50 border-slate-200`} value={caseType} onChange={e => setCaseType(e.target.value)}>
                  <option value="">اختر نوع القضية</option>
                  {CASE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
               </select>
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">المرحلة الدراسية</label>
               <select className={`${selectBaseClass} h-11 bg-slate-50 border-slate-200`} value={studyLevel} onChange={e => setStudyLevel(e.target.value)}>
                  <option value="">اختر المرحلة</option>
                  {STUDY_LEVELS.map(t => <option key={t} value={t}>{t}</option>)}
               </select>
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">اسم الطالب</label>
               <select className={`${selectBaseClass} h-11 bg-slate-50 border-slate-200`} value={studentName} onChange={e => setStudentName(e.target.value)}>
                  <option value="">اختر طالباً...</option>
                  {/* هنا يتم السحب من جدول المواطنين برمجياً، وضعت أمثلة */}
                  <option value="ياسين محمود">ياسين محمود</option>
                  <option value="ليان عبدالله">ليان عبدالله</option>
               </select>
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">المدرسة المعنية</label>
               <select className={`${selectBaseClass} h-11 bg-slate-50 border-slate-200`} value={schoolName} onChange={e => setSchoolName(e.target.value)}>
                  <option value="">اختر المدرسة...</option>
                  {/* هنا يتم السحب من جدول المدارس برمجياً */}
                  <option value="مدرسة القدس">مدرسة القدس</option>
                  <option value="مدرسة العودة">مدرسة العودة</option>
               </select>
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">الحالة</label>
               <select className={`${selectBaseClass} h-11 bg-slate-50 border-slate-200`} value={status} onChange={e => setStatus(e.target.value)}>
                  {CASE_STATUS.map(t => <option key={t} value={t}>{t}</option>)}
               </select>
            </div>

          </div>

          <DialogFooter className="gap-3 mt-2">
            <Button onClick={onAdd} disabled={submitting || !isAddValid} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null} حفظ القضية
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1 h-11 border-slate-200 rounded-xl">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}