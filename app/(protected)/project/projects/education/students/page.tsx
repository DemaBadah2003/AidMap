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
  User,
  GraduationCap
} from 'lucide-react'

// تعريف نوع البيانات للحقول الستة المطلوبة
type Student = {
  id: string
  studentName: string       // اسم الطالب
  nationalId: string        // رقم الهوية
  birthDate: string         // تاريخ الميلاد
  gradeLevel: string        // المرحلة الدراسية
  parentName: string        // اسم ولي الأمر
  parentPhone: string       // رقم هاتف ولي الأمر
}

const BASE_URL = '/api/project/projects/students'
const topControlHeight = 'h-10'
const inputBaseClass = 'w-full min-w-0 rounded-lg border-slate-200 bg-white text-right text-xs sm:text-sm outline-none focus:!ring-2 focus:!ring-slate-100 font-normal'
const selectBaseClass = 'w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-right text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-100 font-normal'

export default function StudentsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  // Add Form States
  const [addOpen, setAddOpen] = useState(false)
  const [formData, setFormData] = useState<Omit<Student, 'id'>>({
    studentName: '',
    nationalId: '',
    birthDate: '',
    gradeLevel: '',
    parentName: '',
    parentPhone: ''
  })

  const [submitting, setSubmitting] = useState(false)

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL)
      const data = await res.json()
      setItems(data)
    } catch (err) { console.error('Fetch error:', err) } 
    finally { setLoading(false) }
  }

  useEffect(() => { fetchStudents() }, [])

  const isFormValid = (data: any) => {
    return data.studentName.trim() !== '' && data.nationalId.trim() !== '' && data.gradeLevel !== ''
  }

  const onAdd = async () => {
    if (!isFormValid(formData)) return
    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        await fetchStudents()
        setAddOpen(false)
        resetForm()
        setCurrentPage(1)
      }
    } finally { setSubmitting(false) }
  }

  const resetForm = () => {
    setFormData({
      studentName: '', nationalId: '', birthDate: '',
      gradeLevel: '', parentName: '', parentPhone: ''
    })
  }

  const filtered = useMemo(() => {
    return items.filter((s) => {
      return !q || s.studentName.includes(q) || s.nationalId.includes(q)
    })
  }, [q, items])

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage, itemsPerPage])

  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const rangeEnd = Math.min(currentPage * itemsPerPage, filtered.length)

  return (
    <div className="w-full px-4 py-6" dir="rtl">
      {/* العنوان على اليمين تماماً */}
      <div className="mb-6 flex items-center justify-start gap-2">
        <GraduationCap className="w-8 h-8 text-blue-600" />
        <h1 className="text-2xl font-bold text-slate-900">سجل بيانات الطلاب</h1>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl bg-white">
        <CardContent className="p-0">
          {/* شريط الأدوات العلوي */}
          <div className="p-4 flex flex-col sm:flex-row items-center gap-3 border-b">
            <div className="relative w-full max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="بحث بالاسم أو الهوية..."
                className={`${inputBaseClass} ${topControlHeight} pr-10 bg-slate-50 border-none`}
              />
            </div>

            <Button
              onClick={() => setAddOpen(true)}
              className={`bg-blue-600 text-white hover:bg-blue-700 ${topControlHeight} px-4 rounded-lg mr-auto shadow-sm`}
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة طالب جديد
            </Button>
          </div>

          {/* عرض الجدول - ترتيب الحقول المطلوب */}
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="p-4 text-slate-500 font-bold">اسم الطالب</th>
                  <th className="p-4 text-slate-500 font-bold">رقم الهوية</th>
                  <th className="p-4 text-slate-500 font-bold">المرحلة</th>
                  <th className="p-4 text-slate-500 font-bold">تاريخ الميلاد</th>
                  <th className="p-4 text-slate-500 font-bold">اسم ولي الأمر</th>
                  <th className="p-4 text-slate-500 font-bold">رقم هاتف ولي الأمر</th>
                  <th className="p-4 text-center text-slate-500 font-bold">تعديل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr><td colSpan={7} className="p-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></td></tr>
                ) : paginatedData.length === 0 ? (
                  <tr><td colSpan={7} className="p-10 text-center text-slate-400">لا توجد بيانات متاحة</td></tr>
                ) : paginatedData.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{s.studentName}</td>
                    <td className="p-4 font-mono text-slate-600">{s.nationalId}</td>
                    <td className="p-4 text-slate-600">{s.gradeLevel}</td>
                    <td className="p-4 text-slate-600 font-mono">{s.birthDate}</td>
                    <td className="p-4 text-slate-600">{s.parentName}</td>
                    <td className="p-4 text-blue-600 font-mono">{s.parentPhone}</td>
                    <td className="p-4 text-center">
                      <button className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-md border border-slate-100 text-slate-400">
                        <Pencil className="w-4 h-4"/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* الترقيم */}
          <div className="p-4 flex items-center justify-between border-t bg-slate-50/30">
            <span className="text-xs text-slate-500 font-medium">عرض {rangeStart} - {rangeEnd} من {filtered.length}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>السابق</Button>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>التالي</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* نافذة إضافة طالب */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="max-w-md shadow-2xl border-none rounded-2xl font-arabic overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-right text-lg font-bold text-blue-800 flex items-center gap-2">
              <User className="w-5 h-5" />
              تسجيل بيانات طالب جديد
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 py-4 text-right">
            <div className="space-y-1.5 w-full">
               <label className="text-xs font-bold text-slate-700">اسم الطالب رباعي</label>
               <Input className="h-11 bg-slate-50" value={formData.studentName} onChange={e => setFormData({...formData, studentName: e.target.value})} placeholder="الاسم الكامل" />
            </div>

            <div className="space-y-1.5 w-full">
               <label className="text-xs font-bold text-slate-700">رقم الهوية</label>
               <Input className="h-11 bg-slate-50" value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})} placeholder="9 أرقام" />
            </div>

            <div className="space-y-1.5 w-full">
               <label className="text-xs font-bold text-slate-700">تاريخ الميلاد</label>
               <Input type="date" className="h-11 bg-slate-50 text-right" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
            </div>

            <div className="space-y-1.5 w-full">
               <label className="text-xs font-bold text-slate-700">المرحلة الدراسية</label>
               <select className={`${selectBaseClass} h-11 bg-slate-50`} value={formData.gradeLevel} onChange={e => setFormData({...formData, gradeLevel: e.target.value})}>
                  <option value="">اختر المرحلة</option>
                  <option value="ابتدائي">ابتدائي</option>
                  <option value="إعدادي">إعدادي</option>
                  <option value="ثانوي">ثانوي</option>
               </select>
            </div>

            <div className="space-y-1.5 w-full">
               <label className="text-xs font-bold text-slate-700">اسم ولي الأمر</label>
               <Input className="h-11 bg-slate-50" value={formData.parentName} onChange={e => setFormData({...formData, parentName: e.target.value})} placeholder="الاسم كاملاً" />
            </div>

            <div className="space-y-1.5 w-full">
               <label className="text-xs font-bold text-slate-700">رقم هاتف ولي الأمر</label>
               <Input className="h-11 bg-slate-50" value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} placeholder="059XXXXXXX" />
            </div>
          </div>
          
          <DialogFooter className="mt-4 flex flex-col sm:flex-row items-center gap-3 w-full">
            <Button onClick={onAdd} disabled={submitting || !isFormValid(formData)} className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 h-11 rounded-xl font-bold text-white transition-all shadow-md">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : "حفظ بيانات الطالب"}
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="w-full sm:flex-1 h-11 rounded-xl">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}