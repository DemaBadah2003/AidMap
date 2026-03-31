'use client'

import {useEffect, useMemo, useState, type ChangeEvent} from 'react'

import {Card, CardContent} from '../../../../../components/ui/card'
import {Button} from '../../../../../components/ui/button'
import {Input} from '../../../../../components/ui/input'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../../../components/ui/dialog'

import {Pencil, Trash2, Save, X, Plus, Search} from 'lucide-react'

type ClinicStatus = 'مفتوحة' | 'مغلقة'

type Clinic = {
  id: string
  nameAr: string
  specialtyAr: string
  capacityPerDay: number
  status: ClinicStatus
}

type FieldErrors = Partial<Record<'nameAr' | 'specialtyAr' | 'capacityPerDay' | 'status', string>>

const clinicsSeed: Clinic[] = []

const toIntOnly = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

const normalizeText = (value: string) => value.trim().toLocaleLowerCase()

export default function ClinicsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Clinic[]>(clinicsSeed)
  const [statusFilter, setStatusFilter] = useState<'الكل' | 'مفتوحة' | 'مغلقة'>('الكل')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [addOpen, setAddOpen] = useState(false)
  const [nameAr, setNameAr] = useState('')
  const [specialtyAr, setSpecialtyAr] = useState('')
  const [capacityPerDay, setCapacityPerDay] = useState<number>(0)
  const [status, setStatus] = useState<ClinicStatus>('مفتوحة')
  const [addFieldErrors, setAddFieldErrors] = useState<FieldErrors>({})

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    nameAr: string
    specialtyAr: string
    capacityPerDay: number
    status: ClinicStatus
  }>({
    nameAr: '',
    specialtyAr: '',
    capacityPerDay: 1,
    status: 'مفتوحة',
  })
  const [editFieldErrors, setEditFieldErrors] = useState<FieldErrors>({})

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const topControlHeight = 'h-10 sm:h-11'
  const fixedButtonClass =
    'h-10 sm:h-11 min-w-[110px] sm:min-w-[130px] px-4 sm:px-5 rounded-lg text-xs sm:text-sm shrink-0 flex-none whitespace-nowrap'
  const fixedIconButtonClass =
    'inline-flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 flex-none items-center justify-center rounded-lg border'
  const tableBtnClass =
    'h-9 sm:h-10 rounded-lg px-3 sm:px-4 text-xs sm:text-sm font-semibold shrink-0 flex-none whitespace-nowrap'
  const selectBaseClass =
    'w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-right text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-200'
  const inputBaseClass =
    'w-full min-w-0 rounded-lg border-slate-200 bg-white text-right text-xs sm:text-sm outline-none focus:!ring-2 focus:!ring-slate-200'

  const fetchClinics = async () => {
    try {
      setLoading(true)
      setErrorMessage('')

      const res = await fetch('/api/project/projects/clinic', {
        method: 'GET',
        cache: 'no-store',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'فشل في جلب العيادات')
      }

      setItems(Array.isArray(data) ? data : [])
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء جلب البيانات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClinics()
  }, [])

  const filtered = useMemo(() => {
    const s = q.trim()

    return items.filter((c) => {
      const matchSearch =
        !s ||
        c.nameAr.includes(s) ||
        c.specialtyAr.includes(s) ||
        String(c.capacityPerDay).includes(s) ||
        c.status.includes(s)

      const matchStatus =
        statusFilter === 'الكل'
          ? true
          : statusFilter === 'مفتوحة'
            ? c.status === 'مفتوحة'
            : c.status === 'مغلقة'

      return matchSearch && matchStatus
    })
  }, [q, items, statusFilter])

  useEffect(() => {
    setPage(1)
  }, [q, statusFilter, pageSize])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  const findDuplicateClinic = (name: string, specialty: string, excludeId?: string) => {
    const normalizedName = normalizeText(name)
    const normalizedSpecialty = normalizeText(specialty)

    return items.some((item) => {
      if (excludeId && item.id === excludeId) return false

      return (
        normalizeText(item.nameAr) === normalizedName &&
        normalizeText(item.specialtyAr) === normalizedSpecialty
      )
    })
  }

  const validateAddForm = (): boolean => {
    const nextErrors: FieldErrors = {}
    const ar = nameAr.trim()
    const sp = specialtyAr.trim()

    if (!ar) nextErrors.nameAr = 'اسم العيادة مطلوب'
    if (!sp) nextErrors.specialtyAr = 'التخصص مطلوب'

    if (!nextErrors.nameAr && !nextErrors.specialtyAr && findDuplicateClinic(ar, sp)) {
      nextErrors.nameAr = 'البيانات مكررة'
      nextErrors.specialtyAr = 'البيانات مكررة'
    }

    if (!Number.isInteger(capacityPerDay) || capacityPerDay <= 0) {
      nextErrors.capacityPerDay = 'يجب أن تكون السعة اليومية أكبر من 0'
    }

    setAddFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const validateEditForm = (id: string): boolean => {
    const nextErrors: FieldErrors = {}
    const ar = editDraft.nameAr.trim()
    const sp = editDraft.specialtyAr.trim()

    if (!ar) nextErrors.nameAr = 'اسم العيادة مطلوب'
    if (!sp) nextErrors.specialtyAr = 'التخصص مطلوب'

    if (!nextErrors.nameAr && !nextErrors.specialtyAr && findDuplicateClinic(ar, sp, id)) {
      nextErrors.nameAr = 'البيانات مكررة'
      nextErrors.specialtyAr = 'البيانات مكررة'
    }

    if (!Number.isInteger(editDraft.capacityPerDay) || editDraft.capacityPerDay <= 0) {
      nextErrors.capacityPerDay = 'يجب أن تكون السعة اليومية أكبر من 0'
    }

    setEditFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const onAdd = async () => {
    if (!validateAddForm()) return

    const ar = nameAr.trim()
    const sp = specialtyAr.trim()

    try {
      setSubmitting(true)
      setErrorMessage('')
      setAddFieldErrors({})

      const res = await fetch('/api/project/projects/clinic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nameAr: ar,
          specialtyAr: sp,
          capacityPerDay,
          status,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data?.fieldErrors) {
          setAddFieldErrors(data.fieldErrors)
        }
        throw new Error(data?.message || 'فشلت إضافة العيادة')
      }

      setItems((prev) => [data, ...prev])
      setNameAr('')
      setSpecialtyAr('')
      setCapacityPerDay(0)
      setStatus('مفتوحة')
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

      const res = await fetch(`/api/project/projects/clinic?id=${id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'فشل حذف العيادة')
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

      const res = await fetch('/api/project/projects/clinic?all=true', {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'فشل حذف جميع العيادات')
      }

      setItems([])
      setEditingId(null)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء حذف الكل')
    } finally {
      setSubmitting(false)
    }
  }

  const startEditRow = (c: Clinic) => {
    setEditingId(c.id)
    setEditDraft({
      nameAr: c.nameAr,
      specialtyAr: c.specialtyAr,
      capacityPerDay: c.capacityPerDay,
      status: c.status,
    })
    setEditFieldErrors({})
  }

  const cancelEditRow = () => {
    setEditingId(null)
    setEditFieldErrors({})
  }

  const saveEditRow = async (id: string) => {
    if (!validateEditForm(id)) return

    const ar = editDraft.nameAr.trim()
    const sp = editDraft.specialtyAr.trim()

    try {
      setSubmitting(true)
      setErrorMessage('')
      setEditFieldErrors({})

      const res = await fetch(`/api/project/projects/clinic?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nameAr: ar,
          specialtyAr: sp,
          capacityPerDay: editDraft.capacityPerDay,
          status: editDraft.status,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data?.fieldErrors) {
          setEditFieldErrors(data.fieldErrors)
        }
        throw new Error(data?.message || 'فشل تعديل العيادة')
      }

      setItems((prev) => prev.map((c) => (c.id === id ? data : c)))
      setEditingId(null)
      setEditFieldErrors({})
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء التعديل')
    } finally {
      setSubmitting(false)
    }
  }

  const updateStatusDirectly = async (clinic: Clinic, nextStatus: ClinicStatus) => {
    try {
      setSubmitting(true)
      setErrorMessage('')

      const res = await fetch(`/api/project/projects/clinic?id=${clinic.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: nextStatus,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'فشل تحديث الحالة')
      }

      setItems((prev) => prev.map((x) => (x.id === clinic.id ? data : x)))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث الحالة')
    } finally {
      setSubmitting(false)
    }
  }

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

  return (
    <div className="w-full px-2 py-3 sm:px-4 sm:py-5 lg:px-6" dir="rtl">
      <div className="mb-4 sm:mb-6 text-right">
        <div className="text-base font-semibold text-foreground sm:text-xl lg:text-2xl">
          العيادات
        </div>

        <div className="mt-1 text-[11px] text-muted-foreground sm:text-sm">
          الرئيسية <span className="mx-1">{'>'}</span>
          <span className="text-foreground">إدارة العيادات</span>
        </div>

        {loading && (
          <div className="mt-2 text-[11px] text-muted-foreground sm:text-sm">
            جاري تحميل البيانات...
          </div>
        )}

        {!!errorMessage && (
          <div className="mt-2 text-[11px] text-red-600 sm:text-sm">{errorMessage}</div>
        )}
      </div>

      <div className="w-full max-w-full">
        <Card className="overflow-hidden">
          <CardContent className="p-0" dir="rtl">
            <div className="p-2 sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 flex-nowrap items-center gap-2 sm:gap-3 overflow-x-auto pb-1">
                  <div className="relative min-w-[170px] flex-1 sm:min-w-[220px] sm:max-w-[280px]">
                    <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={q}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
                      placeholder="ابحث عن عيادة"
                      className={`${inputBaseClass} ${topControlHeight} pr-9 pl-3`}
                    />
                  </div>

                  <div className="min-w-[120px] max-w-[140px] sm:min-w-[150px] sm:max-w-[160px] shrink-0">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as 'الكل' | 'مفتوحة' | 'مغلقة')}
                      className={`${selectBaseClass} ${topControlHeight} truncate`}
                    >
                      <option value="الكل">كل الحالات</option>
                      <option value="مفتوحة">مفتوحة</option>
                      <option value="مغلقة">مغلقة</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Button
                    className={`!bg-blue-600 !text-white hover:!bg-blue-700 ${fixedButtonClass}`}
                    onClick={() => setAddOpen(true)}
                    disabled={submitting}
                  >
                    <Plus className="ms-1 h-4 w-4 shrink-0" />
                    إضافة عيادة
                  </Button>

                  <Button
                    variant="outline"
                    className={`border-slate-200 text-slate-700 hover:bg-slate-50 ${fixedButtonClass}`}
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
                <table
                  className="w-full min-w-[760px] sm:min-w-[860px] lg:min-w-[980px] table-fixed border-collapse text-xs sm:text-sm lg:text-base"
                  dir="rtl"
                >
                  <thead
                    style={{
                      backgroundColor: '#F9FAFB',
                      boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
                    }}
                  >
                    <tr className="text-right text-foreground/60">
                      <th className="w-[24%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        اسم العيادة
                      </th>
                      <th className="w-[24%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        التخصص
                      </th>
                      <th className="w-[16%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        السعة اليومية
                      </th>
                      <th className="w-[16%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        الحالة
                      </th>
                      <th className="w-[20%] border-b px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                          جاري تحميل البيانات...
                        </td>
                      </tr>
                    ) : (
                      <>
                        {pageItems.map((c) => {
                          const isEditing = editingId === c.id

                          return (
                            <tr key={c.id} className="align-top hover:bg-muted/30">
                              <td className="border-b border-l px-2 py-3 text-right font-medium break-words sm:px-4 sm:py-4 lg:px-5">
                                {isEditing ? (
                                  <div className="space-y-1">
                                    <Input
                                      value={editDraft.nameAr}
                                      onChange={(e) => {
                                        const value = e.target.value
                                        const trimmedName = value.trim()
                                        const trimmedSpecialty = editDraft.specialtyAr.trim()

                                        setEditDraft((p) => ({...p, nameAr: value}))

                                        setEditFieldErrors((prev) => {
                                          const next = {...prev}

                                          next.nameAr = !trimmedName ? 'اسم العيادة مطلوب' : ''

                                          if (!trimmedSpecialty) {
                                            next.specialtyAr = 'التخصص مطلوب'
                                          } else if (
                                            trimmedName &&
                                            findDuplicateClinic(trimmedName, trimmedSpecialty, c.id)
                                          ) {
                                            next.nameAr = 'البيانات مكررة'
                                            next.specialtyAr = 'البيانات مكررة'
                                          } else {
                                            if (next.nameAr === 'البيانات مكررة') next.nameAr = ''
                                            if (next.specialtyAr === 'البيانات مكررة')
                                              next.specialtyAr = ''
                                          }

                                          return next
                                        })
                                      }}
                                      className="h-9 sm:h-10 lg:h-11 rounded-lg text-right text-xs sm:text-sm lg:text-base font-medium"
                                    />
                                    {!!editFieldErrors.nameAr && (
                                      <div className="text-xs text-red-600">{editFieldErrors.nameAr}</div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="block break-words text-xs sm:text-sm lg:text-base font-medium leading-6 sm:leading-7">
                                    {c.nameAr}
                                  </span>
                                )}
                              </td>

                              <td className="border-b border-l px-2 py-3 text-right break-words sm:px-4 sm:py-4 lg:px-5">
                                {isEditing ? (
                                  <div className="space-y-1">
                                    <Input
                                      value={editDraft.specialtyAr}
                                      onChange={(e) => {
                                        const value = e.target.value
                                        const trimmedName = editDraft.nameAr.trim()
                                        const trimmedSpecialty = value.trim()

                                        setEditDraft((p) => ({...p, specialtyAr: value}))

                                        setEditFieldErrors((prev) => {
                                          const next = {...prev}

                                          next.specialtyAr = !trimmedSpecialty ? 'التخصص مطلوب' : ''

                                          if (!trimmedName) {
                                            next.nameAr = 'اسم العيادة مطلوب'
                                          } else if (
                                            trimmedSpecialty &&
                                            findDuplicateClinic(trimmedName, trimmedSpecialty, c.id)
                                          ) {
                                            next.nameAr = 'البيانات مكررة'
                                            next.specialtyAr = 'البيانات مكررة'
                                          } else {
                                            if (next.nameAr === 'البيانات مكررة') next.nameAr = ''
                                            if (next.specialtyAr === 'البيانات مكررة')
                                              next.specialtyAr = ''
                                          }

                                          return next
                                        })
                                      }}
                                      className="h-9 sm:h-10 lg:h-11 rounded-lg text-right text-xs sm:text-sm lg:text-base font-medium"
                                    />
                                    {!!editFieldErrors.specialtyAr && (
                                      <div className="text-xs text-red-600">
                                        {editFieldErrors.specialtyAr}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="block break-words text-xs sm:text-sm lg:text-base font-medium leading-6 sm:leading-7">
                                    {c.specialtyAr}
                                  </span>
                                )}
                              </td>

                              <td className="border-b border-l px-2 py-3 text-right sm:px-4 sm:py-4 lg:px-5">
                                {isEditing ? (
                                  <div className="space-y-1">
                                    <Input
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      type="text"
                                      value={editDraft.capacityPerDay ? String(editDraft.capacityPerDay) : ''}
                                      onChange={(e) => {
                                        const nextValue = toIntOnly(e.target.value)
                                        setEditDraft((p) => ({
                                          ...p,
                                          capacityPerDay: nextValue,
                                        }))
                                        setEditFieldErrors((prev) => ({
                                          ...prev,
                                          capacityPerDay:
                                            !Number.isInteger(nextValue) || nextValue <= 0
                                              ? 'يجب أن تكون السعة اليومية أكبر من 0'
                                              : '',
                                        }))
                                      }}
                                      className="h-9 sm:h-10 lg:h-11 rounded-lg text-right text-xs sm:text-sm lg:text-base font-medium"
                                    />
                                    {!!editFieldErrors.capacityPerDay && (
                                      <div className="text-xs text-red-600">
                                        {editFieldErrors.capacityPerDay}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="block break-words text-xs sm:text-sm lg:text-base font-medium leading-6 sm:leading-7">
                                    {c.capacityPerDay}
                                  </span>
                                )}
                              </td>

                              <td className="border-b border-l px-2 py-3 text-right sm:px-4 sm:py-4 lg:px-5">
                                <div className="w-[120px] sm:w-[135px] lg:w-[150px] max-w-full">
                                  {isEditing ? (
                                    <select
                                      value={editDraft.status}
                                      onChange={(e) =>
                                        setEditDraft((p) => ({
                                          ...p,
                                          status: e.target.value as ClinicStatus,
                                        }))
                                      }
                                      className="h-9 sm:h-10 lg:h-11 w-full min-w-0 rounded-lg border bg-background px-2 sm:px-3 text-right text-xs sm:text-sm lg:text-base truncate"
                                    >
                                      <option value="مفتوحة">مفتوحة</option>
                                      <option value="مغلقة">مغلقة</option>
                                    </select>
                                  ) : (
                                    <select
                                      value={c.status}
                                      onChange={(e) =>
                                        updateStatusDirectly(c, e.target.value as ClinicStatus)
                                      }
                                      className="h-9 sm:h-10 lg:h-11 w-full min-w-0 rounded-lg border bg-background px-2 sm:px-3 text-right text-xs sm:text-sm lg:text-base truncate"
                                      disabled={submitting}
                                    >
                                      <option value="مفتوحة">مفتوحة</option>
                                      <option value="مغلقة">مغلقة</option>
                                    </select>
                                  )}
                                </div>
                              </td>

                              <td className="border-b px-2 py-3 sm:px-4 sm:py-4 lg:px-5">
                                <div className="flex flex-nowrap items-center justify-start gap-2 overflow-x-auto">
                                  {!isEditing ? (
                                    <>
                                      <button
                                        type="button"
                                        className={`${fixedIconButtonClass} hover:bg-muted`}
                                        title="تعديل"
                                        onClick={() => startEditRow(c)}
                                        disabled={submitting}
                                      >
                                        <Pencil className="size-4" />
                                      </button>

                                      <button
                                        type="button"
                                        className={`${fixedIconButtonClass} hover:bg-muted`}
                                        title="حذف"
                                        onClick={() => onDeleteOne(c.id)}
                                        disabled={submitting}
                                      >
                                        <Trash2 className="size-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        className={tableBtnClass}
                                        onClick={() => saveEditRow(c.id)}
                                        disabled={
                                          submitting ||
                                          !!editFieldErrors.nameAr ||
                                          !!editFieldErrors.specialtyAr ||
                                          !!editFieldErrors.capacityPerDay ||
                                          !editDraft.nameAr.trim() ||
                                          !editDraft.specialtyAr.trim() ||
                                          !Number.isInteger(editDraft.capacityPerDay) ||
                                          editDraft.capacityPerDay <= 0
                                        }
                                      >
                                        <Save className="ms-1 size-4" />
                                        حفظ
                                      </Button>

                                      <Button
                                        variant="outline"
                                        className={tableBtnClass}
                                        onClick={cancelEditRow}
                                        disabled={submitting}
                                      >
                                        <X className="ms-1 size-4" />
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
                            <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                              لا توجد عيادات
                            </td>
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground sm:text-sm">
                  <span>عدد الصفوف</span>

                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="h-8 sm:h-9 rounded-md border bg-background px-2 text-xs sm:text-sm"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="text-[11px] text-muted-foreground sm:text-sm">
                    {rangeStart} - {rangeEnd} من {filtered.length}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      disabled={safePage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={tableBtnClass}
                    >
                      السابق
                    </Button>

                    <Button
                      variant="outline"
                      disabled={safePage >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className={tableBtnClass}
                    >
                      التالي
                    </Button>
                  </div>
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
          <DialogContent
            className="w-[95vw] max-w-[95vw] rounded-xl sm:max-w-[560px]"
            dir="rtl"
          >
            <DialogHeader className="text-right">
              <DialogTitle>إضافة عيادة</DialogTitle>
              <DialogDescription>إدخال بيانات العيادة</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 text-right">
              <div className="grid gap-2">
                <div className="text-sm">اسم العيادة *</div>
                <Input
                  value={nameAr}
                  onChange={(e) => {
                    const value = e.target.value
                    const trimmedName = value.trim()
                    const trimmedSpecialty = specialtyAr.trim()

                    setNameAr(value)

                    setAddFieldErrors((prev) => {
                      const next = {...prev}

                      next.nameAr = !trimmedName ? 'اسم العيادة مطلوب' : ''

                      if (!trimmedSpecialty) {
                        next.specialtyAr = 'التخصص مطلوب'
                      } else if (trimmedName && findDuplicateClinic(trimmedName, trimmedSpecialty)) {
                        next.nameAr = 'البيانات مكررة'
                        next.specialtyAr = 'البيانات مكررة'
                      } else {
                        if (next.nameAr === 'البيانات مكررة') next.nameAr = ''
                        if (next.specialtyAr === 'البيانات مكررة') next.specialtyAr = ''
                      }

                      return next
                    })
                  }}
                  placeholder="مثال: عيادة الشفاء"
                  className="h-10 text-right sm:h-11"
                />
                {!!addFieldErrors.nameAr && (
                  <div className="text-xs text-red-600 sm:text-sm">{addFieldErrors.nameAr}</div>
                )}
              </div>

              <div className="grid gap-2">
                <div className="text-sm">التخصص *</div>
                <Input
                  value={specialtyAr}
                  onChange={(e) => {
                    const value = e.target.value
                    const trimmedName = nameAr.trim()
                    const trimmedSpecialty = value.trim()

                    setSpecialtyAr(value)

                    setAddFieldErrors((prev) => {
                      const next = {...prev}

                      next.specialtyAr = !trimmedSpecialty ? 'التخصص مطلوب' : ''

                      if (!trimmedName) {
                        next.nameAr = 'اسم العيادة مطلوب'
                      } else if (trimmedSpecialty && findDuplicateClinic(trimmedName, trimmedSpecialty)) {
                        next.nameAr = 'البيانات مكررة'
                        next.specialtyAr = 'البيانات مكررة'
                      } else {
                        if (next.nameAr === 'البيانات مكررة') next.nameAr = ''
                        if (next.specialtyAr === 'البيانات مكررة') next.specialtyAr = ''
                      }

                      return next
                    })
                  }}
                  placeholder="مثال: طب عام"
                  className="h-10 text-right sm:h-11"
                />
                {!!addFieldErrors.specialtyAr && (
                  <div className="text-xs text-red-600 sm:text-sm">{addFieldErrors.specialtyAr}</div>
                )}
              </div>

              <div className="grid gap-2">
                <div className="text-sm">السعة / يوم *</div>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="text"
                  value={capacityPerDay ? String(capacityPerDay) : ''}
                  onChange={(e) => {
                    const nextValue = toIntOnly(e.target.value)
                    setCapacityPerDay(nextValue)
                    setAddFieldErrors((prev) => ({
                      ...prev,
                      capacityPerDay:
                        !Number.isInteger(nextValue) || nextValue <= 0
                          ? 'يجب أن تكون السعة اليومية أكبر من 0'
                          : '',
                    }))
                  }}
                  placeholder="مثال: 120"
                  className="h-10 text-right sm:h-11"
                />
                {!!addFieldErrors.capacityPerDay && (
                  <div className="text-xs text-red-600 sm:text-sm">
                    {addFieldErrors.capacityPerDay}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <div className="text-sm">الحالة *</div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ClinicStatus)}
                  className={`h-10 rounded-md border bg-background px-3 text-right sm:h-11 ${addFieldErrors.status ? 'border-red-500' : ''}`}
                >
                  <option value="مفتوحة">مفتوحة</option>
                  <option value="مغلقة">مغلقة</option>
                </select>
              </div>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => setAddOpen(false)}
                disabled={submitting}
                className={`w-full sm:w-auto ${fixedButtonClass}`}
              >
                إغلاق
              </Button>

              <Button
                onClick={onAdd}
                disabled={
                  submitting ||
                  !!addFieldErrors.nameAr ||
                  !!addFieldErrors.specialtyAr ||
                  !!addFieldErrors.capacityPerDay ||
                  !nameAr.trim() ||
                  !specialtyAr.trim() ||
                  capacityPerDay <= 0
                }
                className={`w-full sm:w-auto ${fixedButtonClass}`}
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