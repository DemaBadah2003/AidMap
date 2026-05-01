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
  Pencil, Plus, Search, Loader2, User, GraduationCap, AlertCircle, Check, X, ChevronRight, ChevronLeft
} from 'lucide-react'

type Student = {
  id: string
  studentName: string
  nationalId: string
  birthDate: string
  gradeLevel: string
  parentName: string
  parentPhone: string
}

const BASE_URL = '/api/project/education/students'

export default function StudentsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Omit<Student, 'id'>>({
    studentName: '', nationalId: '', birthDate: '', gradeLevel: '', parentName: '', parentPhone: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRowData, setEditRowData] = useState<Student | null>(null)

  const getErrors = (data: Omit<Student, 'id'>, isEditing = false, currentId?: string) => {
    const e: Record<string, string> = {}
    
    if (data.studentName && data.studentName.trim().split(/\s+/).length < 4) 
      e.studentName = "يجب إدخال الاسم رباعياً على الأقل"
    
    if (data.nationalId && !/^\d{9}$/.test(data.nationalId)) {
      e.nationalId = "رقم الهوية يجب أن يتكون من 9 أرقام"
    } else if (data.nationalId) {
      const isDuplicate = items.some(item => 
        item.nationalId === data.nationalId && (!isEditing || item.id !== currentId)
      )
      if (isDuplicate) e.nationalId = "رقم الهوية هذا مسجل مسبقاً"
    }

    if (data.parentPhone && !/^(056|059)\d{7}$/.test(data.parentPhone)) 
      e.parentPhone = "يجب أن يبدأ بـ 056 أو 059 ويتبعه 7 أرقام"
    
    return e
  }

  const canSave = (data: Omit<Student, 'id'>, isEditing = false, currentId?: string) => {
    const hasEmptyFields = Object.values(data).some(val => val.trim() === '')
    const hasErrors = Object.keys(getErrors(data, isEditing, currentId)).length > 0
    return !hasEmptyFields && !hasErrors
  }

  const addErrors = useMemo(() => getErrors(formData), [formData, items])
  const editErrors = useMemo(() => editRowData ? getErrors(editRowData, true, editingId!) : {}, [editRowData, items])

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL)
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) { setItems([]) } finally { setLoading(false) }
  }

  useEffect(() => { fetchStudents() }, [])

  const handleAddSubmit = async () => {
    if (!canSave(formData)) return
    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        await fetchStudents()
        setAddDialogOpen(false)
        setFormData({ studentName: '', nationalId: '', birthDate: '', gradeLevel: '', parentName: '', parentPhone: '' })
      }
    } finally { setSubmitting(false) }
  }

  const handleSaveEdit = async () => {
    if (!editRowData || !canSave(editRowData, true, editingId!)) return
    setSubmitting(true)
    try {
      const res = await fetch(`${BASE_URL}?id=${editRowData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editRowData)
      })
      if (res.ok) {
        await fetchStudents()
        setEditingId(null)
      }
    } finally { setSubmitting(false) }
  }

  const filtered = useMemo(() => {
    return items.filter(s => !q || s.studentName.includes(q) || s.nationalId.includes(q))
  }, [q, items])

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filtered.length / itemsPerPage)

  return (
    <div className="w-full px-2 sm:px-4 py-6 font-arabic" dir="rtl">
      <div className="mb-6 flex items-center justify-start gap-2">
        <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">نظام إدارة الطلاب</h1>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl bg-white">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row items-center gap-3 border-b bg-white sticky top-0 z-10">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => {setQ(e.target.value); setCurrentPage(1);}}
                placeholder="بحث بالاسم أو الهوية..."
                className="w-full h-10 pr-10 bg-slate-50 border-none rounded-lg text-sm"
              />
            </div>
            <Button onClick={() => setAddDialogOpen(true)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white sm:mr-auto font-bold">
              <Plus className="h-4 w-4 ml-2" /> إضافة طالب جديد
            </Button>
          </div>

          <div className="overflow-x-auto max-h-[500px] scrollbar-thin scrollbar-thumb-slate-200">
            <table className="w-full text-right text-sm min-w-[800px]">
              <thead className="bg-slate-50 border-b text-slate-500 font-bold sticky top-0 z-20">
                <tr>
                  <th className="p-4 text-xs font-bold text-slate-700">اسم الطالب</th>
                  <th className="p-4 text-xs font-bold text-slate-700">رقم الهوية</th>
                  <th className="p-4 text-xs font-bold text-slate-700">المرحلة</th>
                  <th className="p-4 text-xs font-bold text-slate-700">تاريخ الميلاد</th>
                  <th className="p-4 text-xs font-bold text-slate-700">ولي الأمر</th>
                  <th className="p-4 text-xs font-bold text-slate-700">رقم الهاتف</th>
                  <th className="p-4 text-center text-xs font-bold text-slate-700">تعديل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></td></tr>
                ) : paginatedData.map((s) => (
                  <tr key={s.id} className={`${editingId === s.id ? 'bg-blue-50/40' : 'hover:bg-slate-50 transition-colors'}`}>
                    {editingId === s.id ? (
                      <>
                        <td className="p-2">
                           <Input className={`h-9 text-xs ${editErrors.studentName ? 'border-red-500' : ''}`} value={editRowData?.studentName} onChange={e => setEditRowData({...editRowData!, studentName: e.target.value})} />
                           {editErrors.studentName && <p className="text-[9px] text-red-500 mt-1 font-bold">{editErrors.studentName}</p>}
                        </td>
                        <td className="p-2">
                           <Input className={`h-9 text-xs ${editErrors.nationalId ? 'border-red-500' : ''}`} value={editRowData?.nationalId} onChange={e => setEditRowData({...editRowData!, nationalId: e.target.value})} />
                           {editErrors.nationalId && <p className="text-[9px] text-red-500 mt-1 font-bold">{editErrors.nationalId}</p>}
                        </td>
                        <td className="p-2">
                          <select className="h-9 w-full border rounded-md text-[11px] px-2" value={editRowData?.gradeLevel} onChange={e => setEditRowData({...editRowData!, gradeLevel: e.target.value})}>
                            <option value="ابتدائي">ابتدائي</option>
                            <option value="إعدادي">إعدادي</option>
                            <option value="ثانوي">ثانوي</option>
                          </select>
                        </td>
                        <td className="p-2"><Input type="date" className="h-9 text-xs" value={editRowData?.birthDate} onChange={e => setEditRowData({...editRowData!, birthDate: e.target.value})} /></td>
                        <td className="p-2"><Input className="h-9 text-xs" value={editRowData?.parentName} onChange={e => setEditRowData({...editRowData!, parentName: e.target.value})} /></td>
                        <td className="p-2">
                           <Input className={`h-9 text-xs ${editErrors.parentPhone ? 'border-red-500' : ''}`} value={editRowData?.parentPhone} onChange={e => setEditRowData({...editRowData!, parentPhone: e.target.value})} />
                           {editErrors.parentPhone && <p className="text-[9px] text-red-500 mt-1 font-bold">{editErrors.parentPhone}</p>}
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex justify-center gap-1">
                            <button disabled={!canSave(editRowData!, true, editingId!)} onClick={handleSaveEdit} className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-30"><Check className="w-5 h-5"/></button>
                            <button onClick={() => setEditingId(null)} className="p-1 text-red-600 hover:bg-red-50 rounded"><X className="w-5 h-5"/></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 font-bold text-slate-900">{s.studentName}</td>
                        <td className="p-4 font-mono text-slate-600">{s.nationalId}</td>
                        <td className="p-4 text-slate-600">{s.gradeLevel}</td>
                        <td className="p-4 font-mono text-slate-600">{s.birthDate}</td>
                        <td className="p-4 text-slate-600">{s.parentName}</td>
                        <td className="p-4 font-mono text-blue-600">{s.parentPhone}</td>
                        <td className="p-4 text-center">
                          <button onClick={() => { setEditingId(s.id); setEditRowData(s); }} className="p-2 text-slate-400 hover:text-blue-600 border border-slate-100 rounded-md">
                            <Pencil className="w-4 h-4"/>
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Section - متجاوب مع الاتجاهات المطلوبة */}
          <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between bg-slate-50/50 gap-4">
            {/* يمين: التحكم في عدد الصفوف */}
            <div className="flex items-center gap-2 order-1">
              <span className="text-xs text-slate-500">عرض:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="text-xs border rounded p-1 outline-none bg-white font-bold text-slate-700"
              >
                {[5, 10, 15, 20].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            {/* يسار: السابق والتالي */}
            <div className="flex items-center gap-2 order-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="h-8 px-2 text-xs"
              >
                <ChevronRight className="h-4 w-4 ml-1" /> السابق
              </Button>
              <span className="text-[10px] sm:text-xs font-bold px-2 text-slate-600">صفحة {currentPage} من {totalPages || 1}</span>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="h-8 px-2 text-xs"
              >
                التالي <ChevronLeft className="h-4 w-4 mr-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent dir="rtl" className="w-[95vw] max-w-md rounded-2xl p-4 sm:p-6">
          <DialogHeader><DialogTitle className="text-right text-blue-700 flex items-center gap-2"><User className="w-5 h-5"/> تسجيل طالب جديد</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3 sm:gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">اسم الطالب رباعي</label>
              <Input className={`h-11 bg-slate-50 text-sm ${addErrors.studentName ? 'border-red-400' : ''}`} value={formData.studentName} onChange={e => setFormData({...formData, studentName: e.target.value})} />
              {addErrors.studentName && <span className="text-[10px] text-red-500 flex items-center gap-1 font-bold"><AlertCircle className="w-3 h-3"/> {addErrors.studentName}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">رقم الهوية</label>
              <Input className={`h-11 bg-slate-50 text-sm ${addErrors.nationalId ? 'border-red-400' : ''}`} value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})} />
              {addErrors.nationalId && <span className="text-[10px] text-red-500 flex items-center gap-1 font-bold"><AlertCircle className="w-3 h-3"/> {addErrors.nationalId}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">المرحلة الدراسية</label>
              <select className="h-11 bg-slate-50 border rounded-lg px-3 text-sm outline-none focus:ring-1 focus:ring-blue-500" value={formData.gradeLevel} onChange={e => setFormData({...formData, gradeLevel: e.target.value})}>
                <option value="">اختر المرحلة</option>
                <option value="ابتدائي">ابتدائي</option>
                <option value="إعدادي">إعدادي</option>
                <option value="ثانوي">ثانوي</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">تاريخ الميلاد</label>
              <Input type="date" className="h-11 bg-slate-50 text-sm" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">اسم ولي الأمر</label>
              <Input className="h-11 bg-slate-50 text-sm" value={formData.parentName} onChange={e => setFormData({...formData, parentName: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">رقم هاتف ولي الأمر</label>
              <Input className={`h-11 bg-slate-50 text-sm ${addErrors.parentPhone ? 'border-red-400' : ''}`} value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} />
              {addErrors.parentPhone && <span className="text-[10px] text-red-500 flex items-center gap-1 font-bold"><AlertCircle className="w-3 h-3"/> {addErrors.parentPhone}</span>}
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row-reverse gap-2 sm:gap-3 pt-4 border-t">
            <Button 
              onClick={handleAddSubmit} 
              disabled={submitting || !canSave(formData)} 
              className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 h-11 text-white rounded-xl shadow-lg shadow-blue-100 font-bold order-1 sm:order-2"
            >
              {submitting ? <Loader2 className="animate-spin" /> : "حفظ البيانات"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setAddDialogOpen(false);
                setFormData({ studentName: '', nationalId: '', birthDate: '', gradeLevel: '', parentName: '', parentPhone: '' });
              }} 
              className="w-full sm:flex-1 h-11 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50 order-2 sm:order-1"
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}