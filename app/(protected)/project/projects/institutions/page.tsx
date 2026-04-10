'use client'

import { useMemo, useState, useEffect, type ChangeEvent } from 'react'
import { Card, CardContent } from '../../../../../components/ui/card'
import { Button } from '../../../../../components/ui/button'
import { Input } from '../../../../../components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../../../components/ui/dialog'
import { Pencil, Save, X, Plus, Search } from 'lucide-react'

type PresenceStatus = 'متاح' | 'غير متاح'

type Institution = {
  id: string
  managerName: string
  nameAr: string
  email: string
  serviceType: string
  presence: PresenceStatus
}

type FieldErrors = Partial<
  Record<'managerName' | 'nameAr' | 'email' | 'serviceType' | 'presence', string>
>

const institutionsSeed: Institution[] = []

const serviceTypeOptions = [
  'إغاثة',
  'دعم نفسي',
  'مساعدات غذائية',
  'خدمات طبية',
  'خدمات لوجستية',
  'تعليم',
  'إيواء',
] as const

const normalizeEmail = (v: string) => v.trim().toLowerCase()

export default function InstitutionsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Institution[]>(institutionsSeed)
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'unavailable'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [addOpen, setAddOpen] = useState(false)
  const [managerName, setManagerName] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [email, setEmail] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [presence, setPresence] = useState<PresenceStatus>('متاح')
  const [addFieldErrors, setAddFieldErrors] = useState<FieldErrors>({})

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    managerName: string
    nameAr: string
    email: string
    serviceType: string
    presence: PresenceStatus
  }>({
    managerName: '',
    nameAr: '',
    email: '',
    serviceType: '',
    presence: 'متاح',
  })
  const [editFieldErrors, setEditFieldErrors] = useState<FieldErrors>({})

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const fetchInstitutions = async () => {
    try {
      setLoading(true)
      setErrorMessage('')
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      if (statusFilter === 'available') params.set('presence', 'متاح')
      else if (statusFilter === 'unavailable') params.set('presence', 'غير متاح')

      const queryString = params.toString()
      const res = await fetch(`/api/project/projects/institutions${queryString ? `?${queryString}` : ''}`, {
        method: 'GET',
        cache: 'no-store',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'فشل في جلب المؤسسات')
      setItems(Array.isArray(data) ? data : [])
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء جلب البيانات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInstitutions()
  }, [q, statusFilter])

  const filtered = useMemo(() => items, [items])

  useEffect(() => {
    setPage(1)
  }, [q, statusFilter, pageSize])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  const validateEmail = (value: string) => {
    const emailValue = value.trim()
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/
    return emailRegex.test(emailValue)
  }

  const validateAddForm = (): boolean => {
    const nextErrors: FieldErrors = {}
    if (!nameAr.trim()) nextErrors.nameAr = 'اسم المؤسسة مطلوب'
    if (!managerName.trim()) nextErrors.managerName = 'اسم المسؤول مطلوب'
    if (!email.trim()) {
      nextErrors.email = 'البريد الإلكتروني مطلوب'
    } else if (!validateEmail(email)) {
      nextErrors.email = 'البريد غير صالح (يجب أن ينتهي بـ .com)'
    }
    if (!serviceType) nextErrors.serviceType = 'نوع الخدمة مطلوب'
    
    setAddFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const validateEditForm = (): boolean => {
    const nextErrors: FieldErrors = {}
    if (!editDraft.nameAr.trim()) nextErrors.nameAr = 'الحقل مطلوب'
    if (!editDraft.managerName.trim()) nextErrors.managerName = 'الحقل مطلوب'
    if (!editDraft.serviceType) nextErrors.serviceType = 'الحقل مطلوب'
    if (!editDraft.email.trim()) {
      nextErrors.email = 'الحقل مطلوب'
    } else if (!validateEmail(editDraft.email)) {
      nextErrors.email = 'البريد غير صالح (ينتهي بـ .com)'
    }
    setEditFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const onAdd = async () => {
    if (!validateAddForm()) return
    try {
      setSubmitting(true)
      const res = await fetch('/api/project/projects/institutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          managerName: managerName.trim(),
          nameAr: nameAr.trim(),
          email: normalizeEmail(email),
          serviceType,
          presence,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'فشلت إضافة المؤسسة')
      setItems((prev) => [data, ...prev])
      setAddOpen(false)
      setManagerName(''); setNameAr(''); setEmail(''); setServiceType(''); setPresence('متاح')
      setAddFieldErrors({})
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ')
    } finally {
      setSubmitting(false)
    }
  }

  const startEditRow = (ins: Institution) => {
    setEditingId(ins.id)
    setEditDraft({
      managerName: ins.managerName,
      nameAr: ins.nameAr,
      email: ins.email,
      serviceType: ins.serviceType,
      presence: ins.presence,
    })
    setEditFieldErrors({})
  }

  const saveEditRow = async (id: string) => {
    if (!validateEditForm()) return
    try {
      setSubmitting(true)
      const res = await fetch(`/api/project/projects/institutions?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          managerName: editDraft.managerName.trim(),
          nameAr: editDraft.nameAr.trim(),
          email: normalizeEmail(editDraft.email),
          serviceType: editDraft.serviceType,
          presence: editDraft.presence,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'فشل التعديل')
      setItems((prev) => prev.map((ins) => (ins.id === id ? data : ins)))
      setEditingId(null)
      setEditFieldErrors({})
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ')
    } finally {
      setSubmitting(false)
    }
  }

  const updatePresenceDirectly = async (institution: Institution, nextPresence: PresenceStatus) => {
    try {
      setSubmitting(true)
      const res = await fetch(`/api/project/projects/institutions?id=${institution.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presence: nextPresence }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error('فشل تحديث الحالة')
      setItems((prev) => prev.map((x) => (x.id === institution.id ? data : x)))
    } catch (error) {
      setErrorMessage('حدث خطأ أثناء تحديث الحالة')
    } finally {
      setSubmitting(false)
    }
  }

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

  return (
    <div className="w-full flex flex-col min-h-screen bg-slate-50/50" dir="rtl">
      {/* Header Section */}
      <div className="mb-6 pt-6 px-6 text-right">
        <div className="text-2xl font-semibold text-foreground">المؤسسات</div>
        <div className="mt-1 text-sm text-muted-foreground">
          الرئيسية <span className="mx-1">{'>'}</span> <span className="text-foreground">إدارة المؤسسات</span>
        </div>
      </div>

      {!!errorMessage && (
        <div className="mx-6 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Main Card */}
      <div className="px-6 pb-8">
        <Card className="w-full rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
          <CardContent className="p-0">
            {/* Toolbar */}
            <div className="p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-[280px]">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="ابحث عن مؤسسة..."
                    className="!h-10 pr-9 text-right bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-blue-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                >
                  <option value="all">كل الحالات</option>
                  <option value="available">متاح</option>
                  <option value="unavailable">غير متاح</option>
                </select>
              </div>

              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-10 px-5 shadow-sm"
                onClick={() => setAddOpen(true)}
                disabled={submitting}
              >
                <Plus className="h-4 w-4" />
                إضافة مؤسسة
              </Button>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-right text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b text-slate-500 font-medium">
                    <th className="px-6 py-4 font-semibold">المؤسسة</th>
                    <th className="px-6 py-4 font-semibold">مسؤول المؤسسة</th>
                    <th className="px-6 py-4 font-semibold">البريد الإلكتروني</th>
                    <th className="px-6 py-4 font-semibold">نوع الخدمة</th>
                    <th className="px-6 py-4 font-semibold text-center">الحالة</th>
                    <th className="px-6 py-4 font-semibold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={6} className="py-20 text-center text-slate-400">جاري تحميل البيانات...</td></tr>
                  ) : pageItems.length === 0 ? (
                    <tr><td colSpan={6} className="py-20 text-center text-slate-400">لا توجد مؤسسات مطابقة للبحث</td></tr>
                  ) : (
                    pageItems.map((ins) => {
                      const isEditing = editingId === ins.id
                      return (
                        <tr key={ins.id} className="hover:bg-slate-50/50 transition-colors align-middle">
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <div className="flex flex-col gap-1">
                                <Input value={editDraft.nameAr} onChange={(e) => setEditDraft({...editDraft, nameAr: e.target.value})} className={`h-9 ${editFieldErrors.nameAr ? 'border-red-500' : ''}`} />
                                {editFieldErrors.nameAr && <span className="text-[10px] text-red-500">{editFieldErrors.nameAr}</span>}
                              </div>
                            ) : (
                              <div className="font-medium text-slate-900">{ins.nameAr}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {isEditing ? (
                              <div className="flex flex-col gap-1">
                                <Input value={editDraft.managerName} onChange={(e) => setEditDraft({...editDraft, managerName: e.target.value})} className={`h-9 ${editFieldErrors.managerName ? 'border-red-500' : ''}`} />
                                {editFieldErrors.managerName && <span className="text-[10px] text-red-500">{editFieldErrors.managerName}</span>}
                              </div>
                            ) : (
                                <span className="bg-slate-100 px-2 py-1 rounded text-xs">{ins.managerName}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {isEditing ? (
                              <div className="flex flex-col gap-1">
                                <Input dir="ltr" value={editDraft.email} onChange={(e) => setEditDraft({...editDraft, email: e.target.value})} className={`h-9 text-left ${editFieldErrors.email ? 'border-red-500' : ''}`} />
                                {editFieldErrors.email && <span className="text-[10px] text-red-500">{editFieldErrors.email}</span>}
                              </div>
                            ) : ins.email}
                          </td>
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <div className="flex flex-col gap-1">
                                <select value={editDraft.serviceType} onChange={(e) => setEditDraft({...editDraft, serviceType: e.target.value})} className={`h-9 border rounded w-full px-2 ${editFieldErrors.serviceType ? 'border-red-500' : ''}`}>
                                  <option value="">اختر...</option>
                                  {serviceTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                                {editFieldErrors.serviceType && <span className="text-[10px] text-red-500">{editFieldErrors.serviceType}</span>}
                              </div>
                            ) : (
                                <span className="text-slate-600">{ins.serviceType}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <select 
                              value={isEditing ? editDraft.presence : ins.presence} 
                              onChange={(e) => isEditing ? setEditDraft({...editDraft, presence: e.target.value as any}) : updatePresenceDirectly(ins, e.target.value as any)}
                              className={`h-8 rounded-full px-3 text-[11px] font-bold border transition-all cursor-pointer outline-none ${
                                (isEditing ? editDraft.presence : ins.presence) === 'متاح' 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' 
                                : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                              }`}
                            >
                              <option value="متاح">متاح</option>
                              <option value="غير متاح">غير متاح</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-2">
                              {isEditing ? (
                                <>
                                  <Button size="sm" onClick={() => saveEditRow(ins.id)} className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={submitting}><Save className="size-3.5 ml-1" /> حفظ</Button>
                                  <Button size="sm" variant="outline" onClick={() => {setEditingId(null); setEditFieldErrors({})}} className="h-8 border-slate-200"><X className="size-3.5 ml-1" /> إلغاء</Button>
                                </>
                              ) : (
                                <button onClick={() => startEditRow(ins)} className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-md border border-slate-100 text-slate-400 transition-all" title="تعديل">
                                  <Pencil className="size-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Area */}
            <div className="p-4 flex items-center justify-between border-t bg-slate-50/30">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>عرض صفوف:</span>
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="border rounded-md h-8 px-1 bg-white outline-none">
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-500 font-medium">{rangeStart} - {rangeEnd} <span className="mx-1 text-slate-300">|</span> من {filtered.length}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-8 px-3 border-slate-200 hover:bg-white" disabled={safePage <= 1} onClick={() => setPage(p => p - 1)}>السابق</Button>
                  <Button variant="outline" size="sm" className="h-8 px-3 border-slate-200 hover:bg-white" disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)}>التالي</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Modal */}
      <Dialog open={addOpen} onOpenChange={(val) => {setAddOpen(val); if(!val) setAddFieldErrors({})}}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="text-xl">إضافة مؤسسة جديدة</DialogTitle>
            <DialogDescription>يرجى ملء جميع الحقول المطلوبة بشكل صحيح.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4 text-right">
            {/* اسم المؤسسة */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">اسم المؤسسة <span className="text-red-500">*</span></label>
              <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="مثال: مؤسسة الأمل للإغاثة" className={`h-11 bg-slate-50 focus:bg-white ${addFieldErrors.nameAr ? 'border-red-500' : ''}`} />
              {addFieldErrors.nameAr && <p className="text-xs text-red-500">{addFieldErrors.nameAr}</p>}
            </div>

            {/* مسؤول المؤسسة */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">مسؤول المؤسسة <span className="text-red-500">*</span></label>
              <Input value={managerName} onChange={(e) => setManagerName(e.target.value)} placeholder="اسم الشخص المسؤول" className={`h-11 bg-slate-50 focus:bg-white ${addFieldErrors.managerName ? 'border-red-500' : ''}`} />
              {addFieldErrors.managerName && <p className="text-xs text-red-500">{addFieldErrors.managerName}</p>}
            </div>

            {/* البريد الإلكتروني */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">البريد الإلكتروني <span className="text-red-500">*</span></label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@mail.com" className={`h-11 text-left bg-slate-50 focus:bg-white ${addFieldErrors.email ? 'border-red-500' : ''}`} dir="ltr" />
              {addFieldErrors.email && <p className="text-xs text-red-500">{addFieldErrors.email}</p>}
            </div>

            {/* نوع الخدمة */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">نوع الخدمة <span className="text-red-500">*</span></label>
              <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className={`w-full h-11 border rounded-lg px-3 bg-slate-50 focus:bg-white outline-none ${addFieldErrors.serviceType ? 'border-red-500' : ''}`}>
                <option value="">اختر نوع الخدمة...</option>
                {serviceTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              {addFieldErrors.serviceType && <p className="text-xs text-red-500">{addFieldErrors.serviceType}</p>}
            </div>

            {/* الحالة */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">الحالة <span className="text-red-500">*</span></label>
              <select 
                value={presence} 
                onChange={(e) => setPresence(e.target.value as PresenceStatus)} 
                className="w-full h-11 border rounded-lg px-3 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="متاح">متاح</option>
                <option value="غير متاح">غير متاح</option>
              </select>
            </div>
          </div>
          <DialogFooter className="flex flex-row-reverse gap-3 pt-4 border-t">
            <Button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700 text-white flex-1 h-11 rounded-xl" disabled={submitting}>حفظ البيانات</Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1 h-11 rounded-xl border-slate-200">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}