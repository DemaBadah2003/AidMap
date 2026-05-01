'use client'

import { useMemo, useState, useEffect } from 'react'
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
import { Pencil, Plus, Search, Check, X, Loader2 } from 'lucide-react'

type EmergencyStatus = 'جديدة' | 'قيد المعالجة' | 'مغلقة'
type EmergencyLevel = 'منخفض' | 'متوسط' | 'مرتفع'

type Emergency = {
  id: string
  emergencyType: string
  level: EmergencyLevel
  status: EmergencyStatus
}

const BASE_URL = '/api/project/camp/Emergency'
const EMERGENCY_TYPES = ["إخلاء طارئ", "تعليم طارئ", "نقص موارد", "حالة طبية حرجة", "أزمة مياه", "أخرى"]
const EMERGENCY_LEVELS: EmergencyLevel[] = ["منخفض", "متوسط", "مرتفع"]
const EMERGENCY_STATUSES: EmergencyStatus[] = ["جديدة", "قيد المعالجة", "مغلقة"]

export default function EmergencyPage() {
  const [items, setItems] = useState<Emergency[]>([])
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('كل الحالات')
  
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  const [addOpen, setAddOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [editType, setEditType] = useState('')
  const [editLevel, setEditLevel] = useState<EmergencyLevel | ''>('')
  const [editStatus, setEditStatus] = useState<EmergencyStatus | ''>('')

  const [newType, setNewType] = useState('')
  const [newLevel, setNewLevel] = useState<EmergencyLevel | ''>('')
  const [newStatus, setNewStatus] = useState<EmergencyStatus | ''>('')
  
  const [submitting, setSubmitting] = useState(false)

  const fetchEmergencies = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL)
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchEmergencies() }, [])

  const isAddValid = newType !== '' && newLevel !== '' && newStatus !== ''

  const onAdd = async () => {
    if (!isAddValid) return; 
    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emergencyType: newType, level: newLevel, status: newStatus }),
      })
      if (res.ok) {
        fetchEmergencies()
        setAddOpen(false)
        setNewType('')
        setNewLevel('')
        setNewStatus('')
        setCurrentPage(1)
      }
    } finally { setSubmitting(false) }
  }

  const isEditValid = editType !== '' && editLevel !== '' && editStatus !== ''

  const onSaveEdit = async (id: string) => {
    if (!isEditValid) return; 
    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, emergencyType: editType, level: editLevel, status: editStatus }),
      })
      if (res.ok) {
        setEditingId(null)
        fetchEmergencies()
      }
    } finally { setSubmitting(false) }
  }

  const startEdit = (item: Emergency) => {
    setEditingId(item.id)
    setEditType(item.emergencyType)
    setEditLevel(item.level)
    setEditStatus(item.status)
  }

  const filtered = useMemo(() => {
    return items.filter((x) => {
      const matchesSearch = x.emergencyType?.toLowerCase().includes(q.toLowerCase())
      const matchesStatus = statusFilter === 'كل الحالات' || x.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [q, statusFilter, items])

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage, itemsPerPage])

  useEffect(() => { setCurrentPage(1) }, [q, statusFilter, itemsPerPage])

  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const rangeEnd = Math.min(currentPage * itemsPerPage, filtered.length)

  return (
    <div className="w-full px-2 py-6 sm:px-6 md:px-10" dir="rtl">
      <div className="mb-6 text-right px-2">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">إدارة حالات الطوارئ</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1 font-normal">الرئيسية {'>'} متابعة البلاغات والتعديل المباشر</p>
      </div>

      <Card className="border shadow-md bg-white rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 md:p-5 border-b flex flex-col gap-4 bg-slate-50/50 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-64 lg:w-72">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث عن بلاغ..." className="pr-9 text-right bg-white border-slate-200 focus:ring-blue-500 rounded-lg w-full" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 w-full sm:w-auto px-4 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                <option value="كل الحالات">كل الحالات</option>
                {EMERGENCY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="w-full md:w-auto">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 w-full sm:w-auto sm:px-6 rounded-lg" onClick={() => setAddOpen(true)}>
                <Plus className="h-5 w-5" /> إضافة بلاغ جديد
              </Button>
            </div>
          </div>

          {/* Container مع السكرول العمودي المرتجع */}
          <div className="p-2 md:p-4">
            <div className="overflow-x-auto overflow-y-auto max-h-[450px] rounded-lg border border-slate-100 scrollbar-thin scrollbar-thumb-slate-200">
              <table className="w-full min-w-[700px] text-sm text-right border-separate border-spacing-y-2 px-1">
                <thead className="sticky top-0 bg-white z-20 shadow-sm">
                  <tr className="text-slate-500">
                    <th className="px-4 py-3 font-semibold">نوع الطوارئ</th>
                    <th className="px-4 py-3 font-semibold text-center">المستوى</th>
                    <th className="px-4 py-3 font-semibold text-center">الحالة</th>
                    <th className="px-4 py-3 font-semibold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-transparent">
                  {loading ? (
                     <tr><td colSpan={4} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></td></tr>
                  ) : paginatedData.length === 0 ? (
                    <tr><td colSpan={4} className="p-10 text-center text-slate-400 italic">لا توجد نتائج مطابقة.</td></tr>
                  ) : paginatedData.map((item) => (
                    <tr key={item.id} className={`group transition-all duration-200 ${editingId === item.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                      {editingId === item.id ? (
                        <>
                          <td className="px-4 py-3 border-y border-r rounded-r-xl border-blue-100">
                            <select value={editType} onChange={(e) => setEditType(e.target.value)} className="w-full h-9 border border-blue-200 rounded-lg px-2 bg-white text-sm">
                              <option value="" disabled>اختر النوع</option>
                              {EMERGENCY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-3 border-y border-blue-100 text-center">
                            <select value={editLevel} onChange={(e) => setEditLevel(e.target.value as EmergencyLevel)} className="h-9 w-full max-w-[100px] border border-blue-200 rounded-lg px-2 bg-white text-sm">
                              <option value="" disabled>المستوى</option>
                              {EMERGENCY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-3 border-y border-blue-100 text-center">
                            <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as EmergencyStatus)} className="h-9 w-full max-w-[120px] border border-blue-200 rounded-lg px-2 bg-white text-sm">
                              <option value="" disabled>الحالة</option>
                              {EMERGENCY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-3 border-y border-l rounded-l-xl border-blue-100">
                            <div className="flex justify-center gap-1">
                              <Button size="sm" onClick={() => onSaveEdit(item.id)} disabled={!isEditValid || submitting} className={`h-8 w-8 p-0 rounded-full ${isEditValid ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-300'}`}>
                                {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-4 w-4 text-white" />}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"><X className="h-4 w-4" /></Button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-bold text-slate-800 border-y border-r rounded-r-xl border-slate-100 bg-white">
                            {item.emergencyType}
                          </td>
                          <td className="px-4 py-3 text-center border-y border-slate-100 bg-white">
                            <span className={`inline-block px-3 py-0.5 rounded-full text-[10px] md:text-[11px] font-extrabold shadow-sm ${
                              item.level === 'مرتفع' ? 'bg-red-50 text-red-600' : 
                              item.level === 'متوسط' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                              {item.level}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center border-y border-slate-100 bg-white">
                            <span className={`font-bold text-xs md:text-sm ${
                              item.status === 'جديدة' ? 'text-blue-600' : 
                              item.status === 'قيد المعالجة' ? 'text-yellow-600' : 
                              'text-green-600'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 border-y border-l rounded-l-xl border-slate-100 bg-white text-center">
                            <Button variant="ghost" size="sm" onClick={() => startEdit(item)} className="h-8 w-8 p-0 text-blue-500 hover:bg-blue-50 rounded-full">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer المتجاوب - دروب لست يمين، أزرار يسار */}
          <div className="p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t bg-slate-50/30">
            {/* يمين: اختيار الحجم والبيانات */}
            <div className="flex items-center justify-between sm:justify-start gap-3 order-2 sm:order-1">
              <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500">
                <span>عرض صفوف:</span>
                <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="border rounded-md h-8 px-1 bg-white outline-none cursor-pointer">
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                </select>
              </div>
              <span className="text-xs md:text-sm font-medium text-slate-500 mr-2">
                {rangeStart} - {rangeEnd} من {filtered.length}
              </span>
            </div>

            {/* يسار: أزرار التنقل */}
            <div className="flex gap-2 justify-center order-1 sm:order-2">
              <Button variant="outline" size="sm" className="h-8 px-3 text-xs md:text-sm border-slate-200 rounded-lg bg-white" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>السابق</Button>
              <div className="h-8 px-3 flex items-center bg-white border border-slate-100 rounded-lg text-blue-600 font-bold text-xs">
                {currentPage} / {totalPages}
              </div>
              <Button variant="outline" size="sm" className="h-8 px-3 text-xs md:text-sm border-slate-200 rounded-lg bg-white" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>التالي</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal الإضافة بدون تغيير */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="text-right w-[95%] max-w-[450px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-bold text-slate-900 text-center pb-2 border-b">إضافة بلاغ طوارئ جديد</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">نوع الطوارئ <span className="text-red-500">*</span></label>
              <select value={newType} onChange={(e) => setNewType(e.target.value)} className="h-11 border border-slate-200 rounded-xl px-4 bg-slate-50 text-sm">
                <option value="" disabled>اختر نوع البلاغ...</option>
                {EMERGENCY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">المستوى <span className="text-red-500">*</span></label>
              <select value={newLevel} onChange={(e) => setNewLevel(e.target.value as EmergencyLevel)} className="h-11 border border-slate-200 rounded-xl px-4 bg-slate-50 text-sm">
                <option value="" disabled>اختر مستوى الخطورة...</option>
                {EMERGENCY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">الحالة <span className="text-red-500">*</span></label>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as EmergencyStatus)} className="h-11 border border-slate-200 rounded-xl px-4 bg-slate-50 text-sm">
                <option value="" disabled>اختر الحالة الحالية...</option>
                {EMERGENCY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2 flex-col-reverse sm:flex-row border-t pt-4">
            <Button variant="outline" onClick={() => setAddOpen(false)} className="h-11 rounded-xl flex-1 border-slate-200">إلغاء</Button>
            <Button onClick={onAdd} disabled={!isAddValid || submitting} className={`font-bold h-11 rounded-xl flex-1 ${isAddValid ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300'}`}>
              {submitting ? <Loader2 className="animate-spin" /> : 'حفظ البلاغ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}