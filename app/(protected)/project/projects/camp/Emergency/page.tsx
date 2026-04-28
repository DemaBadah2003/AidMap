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
  
  // حالات التعديل
  const [editType, setEditType] = useState('')
  const [editLevel, setEditLevel] = useState<EmergencyLevel | ''>('')
  const [editStatus, setEditStatus] = useState<EmergencyStatus | ''>('')

  // حالات الإضافة (جعل القيم الابتدائية فارغة للتحقق من الاختيار)
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

  // التحقق من صحة البيانات للإضافة
  const isAddValid = newType !== '' && newLevel !== '' && newStatus !== ''

  const onAdd = async () => {
    if (!isAddValid) return; // منع الحفظ إذا كانت الحقول فارغة
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

  // التحقق من صحة البيانات للتعديل
  const isEditValid = editType !== '' && editLevel !== '' && editStatus !== ''

  const onSaveEdit = async (id: string) => {
    if (!isEditValid) return; // منع الحفظ إذا كانت الحقول فارغة
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
    <div className="w-full px-4 py-8 sm:px-10" dir="rtl">
      <div className="mb-8 text-right px-2">
        <h1 className="text-3xl font-extrabold text-slate-900">إدارة حالات الطوارئ</h1>
        <p className="text-sm text-muted-foreground mt-1 font-normal">الرئيسية {'>'} متابعة البلاغات والتعديل المباشر</p>
      </div>

      <Card className="border shadow-md bg-white rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="p-5 border-b flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50/50">
            <div className="flex items-center gap-3 w-full sm:w-auto order-2 sm:order-1">
              <div className="relative w-full sm:w-72">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث عن بلاغ..." className="pr-9 text-right bg-white border-slate-200 focus:ring-blue-500 rounded-lg" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 px-4 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer">
                <option value="كل الحالات">كل الحالات</option>
                {EMERGENCY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="w-full sm:w-auto order-1 sm:order-2">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 w-full sm:px-6 shadow-sm rounded-lg shadow-blue-200" onClick={() => setAddOpen(true)}>
                <Plus className="h-5 w-5" /> إضافة بلاغ جديد
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm text-right border-separate border-spacing-y-3">
              <thead>
                <tr className="text-slate-500">
                  <th className="px-6 py-3 font-semibold">نوع الطوارئ</th>
                  <th className="px-6 py-3 font-semibold text-center">المستوى</th>
                  <th className="px-6 py-3 font-semibold text-center">الحالة</th>
                  <th className="px-8 py-3 font-semibold text-center">الإجراءات</th>
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
                        <td className="px-6 py-4 border-y border-r rounded-r-xl border-blue-100">
                          <select value={editType} onChange={(e) => setEditType(e.target.value)} className="w-full h-10 border border-blue-200 rounded-lg px-2 bg-white">
                            <option value="" disabled>اختر النوع</option>
                            {EMERGENCY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </td>
                        <td className="px-6 py-4 border-y border-blue-100 text-center">
                          <select value={editLevel} onChange={(e) => setEditLevel(e.target.value as EmergencyLevel)} className="h-10 border border-blue-200 rounded-lg px-2 bg-white">
                            <option value="" disabled>المستوى</option>
                            {EMERGENCY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                          </select>
                        </td>
                        <td className="px-6 py-4 border-y border-blue-100 text-center">
                          <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as EmergencyStatus)} className="h-10 border border-blue-200 rounded-lg px-2 bg-white">
                            <option value="" disabled>الحالة</option>
                            {EMERGENCY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="px-6 py-4 border-y border-l rounded-l-xl border-blue-100">
                          <div className="flex justify-center gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => onSaveEdit(item.id)} 
                              disabled={!isEditValid || submitting}
                              className={`h-9 w-9 p-0 rounded-full shadow-sm ${isEditValid ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-300'}`}
                            >
                              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-5 w-5 text-white" />}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} className="h-9 w-9 p-0 text-slate-400 hover:text-red-500 transition-colors"><X className="h-5 w-5" /></Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 font-bold text-slate-800 border-y border-r rounded-r-xl border-slate-100 group-hover:border-slate-200 bg-white">
                          {item.emergencyType}
                        </td>
                        <td className="px-6 py-4 text-center border-y border-slate-100 group-hover:border-slate-200 bg-white">
                          <span className={`inline-block px-4 py-1 rounded-full text-[11px] font-extrabold shadow-sm ${
                            item.level === 'مرتفع' ? 'bg-red-50 text-red-600' : 
                            item.level === 'متوسط' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {item.level}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center border-y border-slate-100 group-hover:border-slate-200 bg-white">
                          <span className={`font-bold ${
                            item.status === 'جديدة' ? 'text-blue-600' : 
                            item.status === 'قيد المعالجة' ? 'text-yellow-600' : 
                            'text-green-600'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 border-y border-l rounded-l-xl border-slate-100 group-hover:border-slate-200 bg-white">
                          <div className="flex justify-center">
                            <Button variant="ghost" size="sm" onClick={() => startEdit(item)} className="h-9 w-9 p-0 text-blue-500 hover:bg-blue-50 hover:text-blue-700 rounded-full transition-all">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 flex items-center justify-between border-t bg-slate-50/30">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>عرض صفوف:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => setItemsPerPage(Number(e.target.value))} 
                className="border rounded-md h-8 px-1 bg-white outline-none cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
              </select>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-500 font-medium">
                {rangeStart} - {rangeEnd} <span className="mx-1 text-slate-300">|</span> من {filtered.length}
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-3 border-slate-200 hover:bg-white font-normal rounded-lg" 
                  disabled={currentPage <= 1} 
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  السابق
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-3 border-slate-200 hover:bg-white font-normal rounded-lg" 
                  disabled={currentPage >= totalPages} 
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  التالي
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* مودال الإضافة - تم تعديل الحقول لتصبح كل حقل في سطر */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="text-right sm:max-w-[450px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900 text-center pb-2 border-b">إضافة بلاغ طوارئ جديد</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 mr-1">نوع الطوارئ <span className="text-red-500">*</span></label>
              <select value={newType} onChange={(e) => setNewType(e.target.value)} className="h-12 border border-slate-200 rounded-xl px-4 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 transition-all">
                <option value="" disabled>اختر نوع البلاغ...</option>
                {EMERGENCY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 mr-1">المستوى <span className="text-red-500">*</span></label>
              <select value={newLevel} onChange={(e) => setNewLevel(e.target.value as EmergencyLevel)} className="h-12 border border-slate-200 rounded-xl px-4 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 transition-all">
                <option value="" disabled>اختر مستوى الخطورة...</option>
                {EMERGENCY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 mr-1">الحالة <span className="text-red-500">*</span></label>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as EmergencyStatus)} className="h-12 border border-slate-200 rounded-xl px-4 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 transition-all">
                <option value="" disabled>اختر الحالة الحالية...</option>
                {EMERGENCY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter className="gap-3 sm:justify-center border-t pt-6">
            <Button 
              onClick={onAdd} 
              disabled={!isAddValid || submitting} 
              className={`font-bold h-12 px-8 rounded-xl flex-1 shadow-md transition-all ${isAddValid ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100' : 'bg-slate-300 cursor-not-allowed'}`}
            >
              {submitting ? <Loader2 className="animate-spin" /> : 'حفظ البلاغ'}
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="h-12 px-8 rounded-xl flex-1 border-slate-200 text-slate-600">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}