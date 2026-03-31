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

import { Pencil, Trash2, Save, X, Plus, Search } from 'lucide-react'

type PresenceStatus = 'متاح' | 'غير متاح'

type Institution = {
  id: string
  instagramId: string
  nameAr: string
  email: string
  serviceType: string
  presence: PresenceStatus
}

type FieldErrors = Partial<
  Record<'instagramId' | 'nameAr' | 'email' | 'serviceType' | 'presence', string>
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

const normalizeInstagram = (v: string) => v.trim().replace(/\s+/g, '_')
const normalizeEmail = (v: string) => v.trim().toLowerCase()

export default function InstitutionsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Institution[]>(institutionsSeed)

  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'unavailable'>('all')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [addOpen, setAddOpen] = useState(false)
  const [instagramId, setInstagramId] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [email, setEmail] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [presence, setPresence] = useState<PresenceStatus>('متاح')
  const [addFieldErrors, setAddFieldErrors] = useState<FieldErrors>({})

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    instagramId: string
    nameAr: string
    email: string
    serviceType: string
    presence: PresenceStatus
  }>({
    instagramId: '',
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

      if (q.trim()) {
        params.set('q', q.trim())
      }

      if (statusFilter === 'available') {
        params.set('presence', 'متاح')
      } else if (statusFilter === 'unavailable') {
        params.set('presence', 'غير متاح')
      }

      const queryString = params.toString()
      const res = await fetch(`/api/project/projects/institutions${queryString ? `?${queryString}` : ''}`, {
        method: 'GET',
        cache: 'no-store',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'فشل في جلب المؤسسات')
      }

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

  const findDuplicateInstitution = (
    nextInstagramId: string,
    nextEmail: string,
    nextNameAr: string,
    nextServiceType: string,
    excludeId?: string
  ) => {
    const normalizedInstagramId = normalizeInstagram(nextInstagramId).toLowerCase()
    const normalizedEmailValue = normalizeEmail(nextEmail)
    const normalizedNameValue = nextNameAr.trim().toLowerCase()
    const normalizedServiceValue = nextServiceType.trim().toLowerCase()

    return items.some((item) => {
      if (excludeId && item.id === excludeId) return false

      return (
        item.instagramId.trim().toLowerCase() === normalizedInstagramId ||
        item.email.trim().toLowerCase() === normalizedEmailValue ||
        (item.nameAr.trim().toLowerCase() === normalizedNameValue &&
          item.serviceType.trim().toLowerCase() === normalizedServiceValue)
      )
    })
  }

  const validateEmail = (value: string) => {
    const emailValue = value.trim()
    return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.com$/.test(emailValue)
  }

  const validateAddForm = (): boolean => {
    const nextErrors: FieldErrors = {}

    const inst = normalizeInstagram(instagramId)
    const ar = nameAr.trim()
    const em = normalizeEmail(email)
    const st = serviceType.trim()

    if (!inst) nextErrors.instagramId = 'معرّف إنستغرام مطلوب'
    if (!ar) nextErrors.nameAr = 'اسم المؤسسة مطلوب'
    if (!em) {
      nextErrors.email = 'البريد الإلكتروني مطلوب'
    } else if (!validateEmail(em)) {
      nextErrors.email = 'البريد يجب أن يكون بالإنجليزية ويحتوي على @ وينتهي بـ .com'
    }
    if (!st) nextErrors.serviceType = 'نوع الخدمة مطلوب'

    if (!nextErrors.instagramId && !nextErrors.email && !nextErrors.nameAr && !nextErrors.serviceType) {
      if (findDuplicateInstitution(inst, em, ar, st)) {
        const existingInstagram = items.some(
          (item) => item.instagramId.trim().toLowerCase() === inst.toLowerCase()
        )
        const existingEmail = items.some((item) => item.email.trim().toLowerCase() === em.toLowerCase())
        const existingNameService = items.some(
          (item) =>
            item.nameAr.trim().toLowerCase() === ar.toLowerCase() &&
            item.serviceType.trim().toLowerCase() === st.toLowerCase()
        )

        if (existingInstagram) nextErrors.instagramId = 'معرّف إنستغرام مستخدم مسبقًا'
        if (existingEmail) nextErrors.email = 'البريد الإلكتروني مستخدم مسبقًا'
        if (existingNameService) {
          nextErrors.nameAr = 'البيانات مكررة'
          nextErrors.serviceType = 'البيانات مكررة'
        }
      }
    }

    setAddFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const validateEditForm = (id: string): boolean => {
    const nextErrors: FieldErrors = {}

    const inst = normalizeInstagram(editDraft.instagramId)
    const ar = editDraft.nameAr.trim()
    const em = normalizeEmail(editDraft.email)
    const st = editDraft.serviceType.trim()

    if (!inst) nextErrors.instagramId = 'معرّف إنستغرام مطلوب'
    if (!ar) nextErrors.nameAr = 'اسم المؤسسة مطلوب'
    if (!em) {
      nextErrors.email = 'البريد الإلكتروني مطلوب'
    } else if (!validateEmail(em)) {
      nextErrors.email = 'البريد يجب أن يكون بالإنجليزية ويحتوي على @ وينتهي بـ .com'
    }
    if (!st) nextErrors.serviceType = 'نوع الخدمة مطلوب'

    if (!nextErrors.instagramId && !nextErrors.email && !nextErrors.nameAr && !nextErrors.serviceType) {
      if (findDuplicateInstitution(inst, em, ar, st, id)) {
        const existingInstagram = items.some(
          (item) => item.id !== id && item.instagramId.trim().toLowerCase() === inst.toLowerCase()
        )
        const existingEmail = items.some(
          (item) => item.id !== id && item.email.trim().toLowerCase() === em.toLowerCase()
        )
        const existingNameService = items.some(
          (item) =>
            item.id !== id &&
            item.nameAr.trim().toLowerCase() === ar.toLowerCase() &&
            item.serviceType.trim().toLowerCase() === st.toLowerCase()
        )

        if (existingInstagram) nextErrors.instagramId = 'معرّف إنستغرام مستخدم مسبقًا'
        if (existingEmail) nextErrors.email = 'البريد الإلكتروني مستخدم مسبقًا'
        if (existingNameService) {
          nextErrors.nameAr = 'البيانات مكررة'
          nextErrors.serviceType = 'البيانات مكررة'
        }
      }
    }

    setEditFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const onAdd = async () => {
    if (!validateAddForm()) return

    const inst = normalizeInstagram(instagramId)
    const ar = nameAr.trim()
    const em = normalizeEmail(email)
    const st = serviceType.trim()

    try {
      setSubmitting(true)
      setErrorMessage('')
      setAddFieldErrors({})

      const res = await fetch('/api/project/projects/institutions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instagramId: inst,
          nameAr: ar,
          email: em,
          serviceType: st,
          presence,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data?.fieldErrors) {
          setAddFieldErrors(data.fieldErrors)
        }
        throw new Error(data?.message || 'فشلت إضافة المؤسسة')
      }

      setItems((prev) => [data, ...prev])
      setInstagramId('')
      setNameAr('')
      setEmail('')
      setServiceType('')
      setPresence('متاح')
      setAddFieldErrors({})
      setAddOpen(false)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء الإضافة')
    } finally {
      setSubmitting(false)
    }
  }

  const onDeleteOne = async (id: string) => {
    try {
      setSubmitting(true)
      setErrorMessage('')

      const res = await fetch(`/api/project/projects/institutions?id=${id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'فشل حذف المؤسسة')
      }

      if (editingId === id) setEditingId(null)
      setItems((prev) => prev.filter((x) => x.id !== id))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء الحذف')
    } finally {
      setSubmitting(false)
    }
  }

  const onDeleteAll = async () => {
    try {
      setSubmitting(true)
      setErrorMessage('')

      const res = await fetch('/api/project/projects/institutions?all=true', {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'فشل حذف جميع المؤسسات')
      }

      setItems([])
      setEditingId(null)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء حذف الكل')
    } finally {
      setSubmitting(false)
    }
  }

  const startEditRow = (ins: Institution) => {
    setEditingId(ins.id)
    setEditDraft({
      instagramId: ins.instagramId,
      nameAr: ins.nameAr,
      email: ins.email,
      serviceType: ins.serviceType,
      presence: ins.presence,
    })
    setEditFieldErrors({})
  }

  const cancelEditRow = () => {
    setEditingId(null)
    setEditFieldErrors({})
  }

  const saveEditRow = async (id: string) => {
    if (!validateEditForm(id)) return

    const inst = normalizeInstagram(editDraft.instagramId)
    const ar = editDraft.nameAr.trim()
    const em = normalizeEmail(editDraft.email)
    const st = editDraft.serviceType.trim()

    try {
      setSubmitting(true)
      setErrorMessage('')
      setEditFieldErrors({})

      const res = await fetch(`/api/project/projects/institutions?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instagramId: inst,
          nameAr: ar,
          email: em,
          serviceType: st,
          presence: editDraft.presence,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data?.fieldErrors) {
          setEditFieldErrors(data.fieldErrors)
        }
        throw new Error(data?.message || 'فشل تعديل المؤسسة')
      }

      setItems((prev) => prev.map((ins) => (ins.id === id ? data : ins)))
      setEditingId(null)
      setEditFieldErrors({})
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء التعديل')
    } finally {
      setSubmitting(false)
    }
  }

  const updatePresenceDirectly = async (institution: Institution, nextPresence: PresenceStatus) => {
    try {
      setSubmitting(true)
      setErrorMessage('')

      const res = await fetch(`/api/project/projects/institutions?id=${institution.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          presence: nextPresence,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'فشل تحديث الحالة')
      }

      setItems((prev) => prev.map((x) => (x.id === institution.id ? data : x)))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث الحالة')
    } finally {
      setSubmitting(false)
    }
  }

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

  const presenceBadgeClass = (p: PresenceStatus) =>
    p === 'متاح' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'

  return (
    <div className="w-full px-3 py-6 sm:px-6" dir="rtl">
      <div className="mb-6 text-right">
        <div className="text-2xl font-semibold text-foreground">المؤسسات</div>

        <div className="mt-1 text-sm text-muted-foreground">
          الرئيسية <span className="mx-1">{'>'}</span>{' '}
          <span className="text-foreground">إدارة المؤسسات</span>
        </div>
      </div>

      {!!errorMessage && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="w-full max-w-[1200px]">
        <Card>
          <CardContent className="p-0" dir="rtl">
            <div className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative w-full sm:w-[260px]">
                    <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={q}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
                      placeholder="ابحث عن مؤسسة"
                      className="!h-10 !rounded-lg border-slate-200 bg-white pr-9 pl-3 text-right text-sm outline-none focus:!ring-2 focus:!ring-slate-200"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as 'all' | 'available' | 'unavailable')
                    }
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-right text-sm outline-none focus:ring-2 focus:ring-slate-200 sm:w-[160px]"
                  >
                    <option value="all">كل الحالات</option>
                    <option value="available">متاح</option>
                    <option value="unavailable">غير متاح</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    className="inline-flex !h-10 items-center gap-2 !rounded-lg !bg-blue-600 !px-4 !text-sm !font-semibold !text-white hover:!bg-blue-700"
                    onClick={() => setAddOpen(true)}
                    disabled={submitting}
                  >
                    <Plus className="h-4 w-4" />
                    إضافة مؤسسة
                  </Button>

                  <Button
                    variant="outline"
                    className="!h-10 !rounded-lg border-slate-200 !px-4 !text-sm !font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={onDeleteAll}
                    disabled={submitting || items.length === 0}
                  >
                    حذف الكل
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t" />

            <div className="overflow-hidden rounded-b-lg">
              <div className="w-full overflow-x-auto">
                <table className="min-w-[1100px] w-full border-collapse text-right text-sm" dir="rtl">
                  <thead
                    style={{
                      backgroundColor: '#F9FAFB',
                      boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
                    }}
                  >
                    <tr className="text-right text-foreground/60">
                      <th className="border-b border-l px-4 py-3 font-normal text-right">المؤسسة</th>
                      <th className="border-b border-l px-4 py-3 font-normal text-right">معرّف إنستغرام</th>
                      <th className="border-b border-l px-4 py-3 font-normal text-right">البريد الإلكتروني</th>
                      <th className="border-b border-l px-4 py-3 font-normal text-right">نوع الخدمة</th>
                      <th className="border-b border-l px-4 py-3 font-normal text-right">الحالة</th>
                      <th className="border-b px-4 py-3 font-normal text-right">الإجراءات</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                          جاري تحميل البيانات...
                        </td>
                      </tr>
                    ) : (
                      <>
                        {pageItems.map((ins) => {
                          const isEditing = editingId === ins.id

                          return (
                            <tr key={ins.id} className="hover:bg-muted/30 align-top">
                              <td className="border-b border-l px-4 py-3 font-medium text-right">
                                {isEditing ? (
                                  <div className="space-y-1">
                                    <Input
                                      value={editDraft.nameAr}
                                      onChange={(e) => {
                                        const value = e.target.value
                                        setEditDraft((p) => ({ ...p, nameAr: value }))
                                      }}
                                      className="h-9 text-right"
                                    />
                                    {!!editFieldErrors.nameAr && (
                                      <div className="text-xs text-red-600">{editFieldErrors.nameAr}</div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-end">
                                    <span className="font-medium text-foreground">{ins.nameAr}</span>
                                    <span className="text-xs text-muted-foreground">{ins.id}</span>
                                  </div>
                                )}
                              </td>

                              <td className="border-b border-l px-4 py-3 text-right">
                                {isEditing ? (
                                  <div className="space-y-1">
                                    <Input
                                      value={editDraft.instagramId}
                                      onChange={(e) => {
                                        const value = e.target.value
                                        setEditDraft((p) => ({ ...p, instagramId: value }))
                                      }}
                                      className="h-9 text-right"
                                      placeholder="اسم الحساب فقط بدون رابط"
                                    />
                                    <div className="text-[11px] text-muted-foreground">
                                      اكتب اسم الحساب فقط مثل: redcrescent
                                    </div>
                                    {!!editFieldErrors.instagramId && (
                                      <div className="text-xs text-red-600">
                                        {editFieldErrors.instagramId}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  ins.instagramId
                                )}
                              </td>

                              <td className="border-b border-l px-4 py-3 text-right">
                                {isEditing ? (
                                  <div className="space-y-1">
                                    <Input
                                      value={editDraft.email}
                                      onChange={(e) => {
                                        const value = e.target.value
                                        setEditDraft((p) => ({ ...p, email: value }))
                                      }}
                                      className="h-9 text-right"
                                    />
                                    {!!editFieldErrors.email && (
                                      <div className="text-xs text-red-600">{editFieldErrors.email}</div>
                                    )}
                                  </div>
                                ) : (
                                  ins.email
                                )}
                              </td>

                              <td className="border-b border-l px-4 py-3 text-right">
                                {isEditing ? (
                                  <div className="space-y-1">
                                    <select
                                      value={editDraft.serviceType}
                                      onChange={(e) => {
                                        const value = e.target.value
                                        setEditDraft((p) => ({ ...p, serviceType: value }))
                                      }}
                                      className="h-9 w-full rounded-md border bg-background px-3 text-right"
                                    >
                                      <option value="">اختر نوع الخدمة</option>
                                      {serviceTypeOptions.map((option) => (
                                        <option key={option} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                    <div className="text-[11px] text-muted-foreground">
                                      المقصود بها نوع المساعدة التي تقدمها المؤسسة
                                    </div>
                                    {!!editFieldErrors.serviceType && (
                                      <div className="text-xs text-red-600">
                                        {editFieldErrors.serviceType}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  ins.serviceType
                                )}
                              </td>

                              <td className="border-b border-l px-4 py-3 text-right">
                                {isEditing ? (
                                  <select
                                    value={editDraft.presence}
                                    onChange={(e) =>
                                      setEditDraft((p) => ({ ...p, presence: e.target.value as PresenceStatus }))
                                    }
                                    className="h-9 rounded-md border bg-background px-3 text-right"
                                  >
                                    <option value="متاح">متاح</option>
                                    <option value="غير متاح">غير متاح</option>
                                  </select>
                                ) : (
                                  <select
                                    value={ins.presence}
                                    onChange={(e) => updatePresenceDirectly(ins, e.target.value as PresenceStatus)}
                                    className={`h-9 rounded-md border bg-background px-3 text-right ${presenceBadgeClass(ins.presence)}`}
                                    disabled={submitting}
                                  >
                                    <option value="متاح">متاح</option>
                                    <option value="غير متاح">غير متاح</option>
                                  </select>
                                )}
                              </td>

                              <td className="border-b px-4 py-3 text-right">
                                <div className="flex items-center justify-start gap-2">
                                  {!isEditing ? (
                                    <>
                                      <button
                                        type="button"
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-md border hover:bg-muted"
                                        title="تعديل"
                                        onClick={() => startEditRow(ins)}
                                        disabled={submitting}
                                      >
                                        <Pencil className="size-4" />
                                      </button>

                                      <button
                                        type="button"
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-md border hover:bg-muted"
                                        title="حذف"
                                        onClick={() => onDeleteOne(ins.id)}
                                        disabled={submitting}
                                      >
                                        <Trash2 className="size-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        size="sm"
                                        className="h-10"
                                        onClick={() => saveEditRow(ins.id)}
                                        disabled={
                                          submitting ||
                                          !editDraft.instagramId.trim() ||
                                          !editDraft.nameAr.trim() ||
                                          !editDraft.email.trim() ||
                                          !editDraft.serviceType.trim() ||
                                          !validateEmail(editDraft.email.trim())
                                        }
                                      >
                                        <Save className="size-4 ms-2" />
                                        حفظ
                                      </Button>

                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-10"
                                        onClick={cancelEditRow}
                                        disabled={submitting}
                                      >
                                        <X className="size-4 ms-2" />
                                        إلغاء
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}

                        {!pageItems.length && (
                          <tr>
                            <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                              لا توجد مؤسسات
                            </td>
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>عدد الصفوف</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">
                    {rangeStart} - {rangeEnd} من {filtered.length}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    السابق
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    التالي
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog
          open={addOpen}
          onOpenChange={(open) => {
            setAddOpen(open)
            if (!open) {
              setAddFieldErrors({})
            }
          }}
        >
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader dir="rtl" className="text-right">
              <DialogTitle>إضافة مؤسسة</DialogTitle>
              <DialogDescription>إدخال بيانات المؤسسة</DialogDescription>
            </DialogHeader>

            <div dir="rtl" className="grid gap-3">
              <div className="grid gap-2">
                <div className="text-sm">معرّف إنستغرام</div>
                <Input
                  value={instagramId}
                  onChange={(e) => {
                    const value = e.target.value
                    const inst = normalizeInstagram(value)

                    setInstagramId(value)

                    setAddFieldErrors((prev) => ({
                      ...prev,
                      instagramId: !inst ? 'معرّف إنستغرام مطلوب' : '',
                    }))
                  }}
                  placeholder="مثال: redcrescent"
                />
                <div className="text-[11px] text-muted-foreground">
                  المقصود به اسم الحساب فقط بدون رابط
                </div>
                {!!addFieldErrors.instagramId && (
                  <div className="text-xs text-red-600">{addFieldErrors.instagramId}</div>
                )}
              </div>

              <div className="grid gap-2">
                <div className="text-sm">اسم المؤسسة</div>
                <Input
                  value={nameAr}
                  onChange={(e) => {
                    const value = e.target.value
                    setNameAr(value)

                    setAddFieldErrors((prev) => ({
                      ...prev,
                      nameAr: !value.trim() ? 'اسم المؤسسة مطلوب' : '',
                    }))
                  }}
                  placeholder="مثال: الهلال الأحمر"
                />
                {!!addFieldErrors.nameAr && (
                  <div className="text-xs text-red-600">{addFieldErrors.nameAr}</div>
                )}
              </div>

              <div className="grid gap-2">
                <div className="text-sm">البريد الإلكتروني</div>
                <Input
                  value={email}
                  onChange={(e) => {
                    const value = e.target.value
                    const em = normalizeEmail(value)

                    setEmail(value)

                    setAddFieldErrors((prev) => ({
                      ...prev,
                      email: !em
                        ? 'البريد الإلكتروني مطلوب'
                        : !validateEmail(em)
                          ? 'البريد يجب أن يكون بالإنجليزية ويحتوي على @ وينتهي بـ .com'
                          : '',
                    }))
                  }}
                  placeholder="مثال: info@org.com"
                />
                <div className="text-[11px] text-muted-foreground">
                  يجب أن يكون بالإنجليزية ويحتوي على @ وينتهي بـ .com
                </div>
                {!!addFieldErrors.email && (
                  <div className="text-xs text-red-600">{addFieldErrors.email}</div>
                )}
              </div>

              <div className="grid gap-2">
                <div className="text-sm">نوع الخدمة</div>
                <select
                  value={serviceType}
                  onChange={(e) => {
                    const value = e.target.value
                    setServiceType(value)

                    setAddFieldErrors((prev) => ({
                      ...prev,
                      serviceType: !value.trim() ? 'نوع الخدمة مطلوب' : '',
                    }))
                  }}
                  className="h-10 rounded-md border bg-background px-3 text-right"
                >
                  <option value="">اختر نوع الخدمة</option>
                  {serviceTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <div className="text-[11px] text-muted-foreground">
                  المقصود بها نوع المساعدة التي تقدمها المؤسسة
                </div>
                {!!addFieldErrors.serviceType && (
                  <div className="text-xs text-red-600">{addFieldErrors.serviceType}</div>
                )}
              </div>

              <div className="grid gap-2">
                <div className="text-sm">حالة التواجد</div>
                <select
                  value={presence}
                  onChange={(e) => setPresence(e.target.value as PresenceStatus)}
                  className="h-10 rounded-md border bg-background px-3"
                >
                  <option value="متاح">متاح</option>
                  <option value="غير متاح">غير متاح</option>
                </select>
              </div>
            </div>

            <DialogFooter dir="rtl" className="gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)} disabled={submitting}>
                إغلاق
              </Button>
              <Button
                onClick={onAdd}
                disabled={
                  submitting ||
                  !instagramId.trim() ||
                  !nameAr.trim() ||
                  !email.trim() ||
                  !serviceType.trim() ||
                  !validateEmail(email.trim())
                }
              >
                {submitting ? 'جاري الإضافة...' : 'إضافة'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}