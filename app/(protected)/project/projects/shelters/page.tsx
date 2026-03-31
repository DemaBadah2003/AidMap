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

type Shelter = {
  id: string
  nameAr: string
  areaAr: string
  supervisorAr: string
  phone: string
  familiesCount: number
  capacity: number
  fillStatus?: FillStatus
}

type FillStatus = 'ممتلئ' | 'غير ممتلئ'

type ApiErrorResponse = {
  message?: string
  fieldErrors?: Partial<
    Record<
      'nameAr' | 'areaAr' | 'supervisorAr' | 'phone' | 'capacity' | 'familiesCount' | 'fillStatus' | 'placeId',
      string
    >
  >
}

const defaultFillStatus = (families: number, capacity: number): FillStatus =>
  families >= capacity ? 'ممتلئ' : 'غير ممتلئ'

const toIntOnly = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

const hasEdgeSpaces = (value: string) => value !== value.trim()
const normalizeSpaces = (value: string) => value.trim().replace(/\s+/g, ' ')
const toPhoneDigitsOnly = (value: string) => value.replace(/\D/g, '').slice(0, 10)
const isValidPhone = (value: string) => /^(056|059)\d{7}$/.test(value)

export default function SheltersPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Shelter[]>([])

  const [statusFilter, setStatusFilter] = useState<'الكل' | 'ممتلئ' | 'غير ممتلئ'>('الكل')
  const [statusPick, setStatusPick] = useState<Record<string, FillStatus>>({})

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [addOpen, setAddOpen] = useState(false)
  const [nameAr, setNameAr] = useState('')
  const [areaAr, setAreaAr] = useState('')
  const [supervisorAr, setSupervisorAr] = useState('')
  const [phone, setPhone] = useState('')
  const [capacity, setCapacity] = useState<number>(0)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    nameAr: string
    areaAr: string
    supervisorAr: string
    phone: string
    capacity: number
    fillStatus: FillStatus
  }>({
    nameAr: '',
    areaAr: '',
    supervisorAr: '',
    phone: '',
    capacity: 1,
    fillStatus: 'غير ممتلئ',
  })

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [phoneError, setPhoneError] = useState('')
  const [editPhoneError, setEditPhoneError] = useState('')

  const [capacityError, setCapacityError] = useState('')
  const [editCapacityError, setEditCapacityError] = useState('')

  const topControlHeight = 'h-10 sm:h-11'
  const fixedButtonClass =
    'h-10 sm:h-11 min-w-[110px] sm:min-w-[130px] px-4 sm:px-5 rounded-lg text-xs sm:text-sm shrink-0 flex-none whitespace-nowrap'
  const fixedIconButtonClass =
    'inline-flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 flex-none items-center justify-center rounded-lg border'
  const tableBtnClass =
    'h-8 sm:h-10 rounded-lg px-2.5 sm:px-4 text-[11px] sm:text-sm font-semibold shrink-0 flex-none whitespace-nowrap'
  const selectBaseClass =
    'w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-right text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-200'
  const inputBaseClass =
    'w-full min-w-0 rounded-lg border-slate-200 bg-white text-right text-xs sm:text-sm outline-none focus:!ring-2 focus:!ring-slate-200'

  const clearAddFieldErrors = () => {
    setPhoneError('')
    setCapacityError('')
  }

  const clearEditFieldErrors = () => {
    setEditPhoneError('')
    setEditCapacityError('')
  }

  const getPhoneError = (value: string) => {
    if (!value) return 'رقم الهاتف مطلوب'
    if (!/^\d+$/.test(value)) return 'رقم الهاتف يجب أن يحتوي على أرقام فقط'
    if (value.length !== 10) return 'رقم الهاتف يجب أن يكون 10 أرقام'
    if (!value.startsWith('056') && !value.startsWith('059')) {
      return 'رقم الهاتف يجب أن يبدأ بـ 056 أو 059'
    }
    if (!isValidPhone(value)) {
      return 'رقم الهاتف يجب أن يبدأ بـ 056 أو 059 وبعده 7 أرقام'
    }
    return ''
  }

  const validateShelterInputs = (values: {
    nameAr: string
    areaAr: string
    supervisorAr: string
    phone: string
    capacity: number
  }) => {
    if (!values.nameAr || !values.areaAr || !values.supervisorAr || !values.phone) {
      return 'جميع الحقول مطلوبة'
    }

    if (hasEdgeSpaces(values.nameAr)) {
      return 'اسم المركز لا يجب أن يبدأ أو ينتهي بمسافة'
    }

    if (hasEdgeSpaces(values.areaAr)) {
      return 'المنطقة لا يجب أن تبدأ أو تنتهي بمسافة'
    }

    if (hasEdgeSpaces(values.supervisorAr)) {
      return 'اسم المشرف لا يجب أن يبدأ أو ينتهي بمسافة'
    }

    if (!Number.isInteger(values.capacity) || values.capacity <= 0) {
      return 'يجب أن تكون السعة أكبر من 0'
    }

    return ''
  }

  const fetchShelters = async () => {
    try {
      setLoading(true)
      setErrorMessage('')

      const res = await fetch('/api/project/projects/shelter', {
        method: 'GET',
        cache: 'no-store',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'فشل في جلب مراكز الإيواء')
      }

      const normalizedItems: Shelter[] = Array.isArray(data) ? data : []
      setItems(normalizedItems)

      const nextStatusPick: Record<string, FillStatus> = {}
      normalizedItems.forEach((item) => {
        nextStatusPick[item.id] =
          item.fillStatus ?? defaultFillStatus(item.familiesCount, item.capacity)
      })
      setStatusPick(nextStatusPick)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء جلب البيانات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShelters()
  }, [])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()

    return items.filter((sh) => {
      const matchSearch = !s || sh.nameAr.trim().toLowerCase().includes(s)

      const rowStatus: FillStatus =
        statusPick[sh.id] ?? sh.fillStatus ?? defaultFillStatus(sh.familiesCount, sh.capacity)

      const matchStatus =
        statusFilter === 'الكل'
          ? true
          : statusFilter === 'ممتلئ'
            ? rowStatus === 'ممتلئ'
            : rowStatus === 'غير ممتلئ'

      return matchSearch && matchStatus
    })
  }, [q, items, statusFilter, statusPick])

  useEffect(() => {
    setPage(1)
  }, [q, statusFilter, pageSize])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  const handleDuplicateOrFieldErrorsForAdd = (data: ApiErrorResponse) => {
    const duplicateMessage =
      data?.fieldErrors?.capacity ||
      (data?.message?.includes('مكررة') ? data.message : '') ||
      (data?.fieldErrors?.nameAr || data?.fieldErrors?.areaAr || data?.fieldErrors?.supervisorAr
        ? 'البيانات مكررة'
        : '')

    if (duplicateMessage) {
      setCapacityError(duplicateMessage)
      setErrorMessage('')
      return true
    }

    if (data?.fieldErrors?.phone) {
      setPhoneError(data.fieldErrors.phone)
      setErrorMessage('')
      return true
    }

    return false
  }

  const handleDuplicateOrFieldErrorsForEdit = (data: ApiErrorResponse) => {
    const duplicateMessage =
      data?.fieldErrors?.capacity ||
      (data?.message?.includes('مكررة') ? data.message : '') ||
      (data?.fieldErrors?.nameAr || data?.fieldErrors?.areaAr || data?.fieldErrors?.supervisorAr
        ? 'البيانات مكررة'
        : '')

    if (duplicateMessage) {
      setEditCapacityError(duplicateMessage)
      setErrorMessage('')
      return true
    }

    if (data?.fieldErrors?.phone) {
      setEditPhoneError(data.fieldErrors.phone)
      setErrorMessage('')
      return true
    }

    return false
  }

  const onAdd = async () => {
    clearAddFieldErrors()

    const payload = {
      nameAr,
      areaAr,
      supervisorAr,
      phone,
      capacity,
    }

    const validationMessage = validateShelterInputs(payload)
    if (validationMessage) {
      setErrorMessage(validationMessage)
      return
    }

    const nextPhoneError = getPhoneError(phone)
    setPhoneError(nextPhoneError)
    if (nextPhoneError) return

    try {
      setSubmitting(true)
      setErrorMessage('')

      const res = await fetch('/api/project/projects/shelter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nameAr: normalizeSpaces(nameAr),
          areaAr: normalizeSpaces(areaAr),
          supervisorAr: normalizeSpaces(supervisorAr),
          phone,
          capacity,
        }),
      })

      const data: ApiErrorResponse = await res.json()

      if (!res.ok) {
        const handled = handleDuplicateOrFieldErrorsForAdd(data)
        if (handled) return
        throw new Error(data?.message || 'فشلت إضافة مركز الإيواء')
      }

      setNameAr('')
      setAreaAr('')
      setSupervisorAr('')
      setPhone('')
      setCapacity(0)
      clearAddFieldErrors()
      setAddOpen(false)

      await fetchShelters()
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

      const res = await fetch(`/api/project/projects/shelter?id=${id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'فشل حذف مركز الإيواء')
      }

      if (editingId === id) setEditingId(null)

      await fetchShelters()
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

      const res = await fetch('/api/project/projects/shelter?all=true', {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'فشل حذف جميع مراكز الإيواء')
      }

      setEditingId(null)
      await fetchShelters()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء حذف الكل')
    } finally {
      setSubmitting(false)
    }
  }

  const startEditRow = (sh: Shelter) => {
    const currentStatus: FillStatus =
      statusPick[sh.id] ?? sh.fillStatus ?? defaultFillStatus(sh.familiesCount, sh.capacity)

    setEditingId(sh.id)
    setEditDraft({
      nameAr: sh.nameAr,
      areaAr: sh.areaAr,
      supervisorAr: sh.supervisorAr,
      phone: sh.phone,
      capacity: sh.capacity,
      fillStatus: currentStatus,
    })
    clearEditFieldErrors()
    setErrorMessage('')
  }

  const cancelEditRow = () => {
    setEditingId(null)
    clearEditFieldErrors()
  }

  const saveEditRow = async (id: string) => {
    clearEditFieldErrors()

    const payload = {
      nameAr: editDraft.nameAr,
      areaAr: editDraft.areaAr,
      supervisorAr: editDraft.supervisorAr,
      phone: editDraft.phone,
      capacity: editDraft.capacity,
    }

    const validationMessage = validateShelterInputs(payload)
    if (validationMessage) {
      setErrorMessage(validationMessage)
      return
    }

    const nextPhoneError = getPhoneError(editDraft.phone)
    setEditPhoneError(nextPhoneError)
    if (nextPhoneError) return

    try {
      setSubmitting(true)
      setErrorMessage('')

      const res = await fetch(`/api/project/projects/shelter?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nameAr: normalizeSpaces(editDraft.nameAr),
          areaAr: normalizeSpaces(editDraft.areaAr),
          supervisorAr: normalizeSpaces(editDraft.supervisorAr),
          phone: editDraft.phone,
          capacity: editDraft.capacity,
          fillStatus: editDraft.fillStatus,
        }),
      })

      const data: ApiErrorResponse = await res.json()

      if (!res.ok) {
        const handled = handleDuplicateOrFieldErrorsForEdit(data)
        if (handled) return
        throw new Error(data?.message || 'فشل تعديل مركز الإيواء')
      }

      setEditingId(null)
      clearEditFieldErrors()
      await fetchShelters()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء التعديل')
    } finally {
      setSubmitting(false)
    }
  }

  const updateStatusDirectly = async (shelter: Shelter, nextStatus: FillStatus) => {
    try {
      setSubmitting(true)
      setErrorMessage('')

      const res = await fetch(`/api/project/projects/shelter?id=${shelter.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fillStatus: nextStatus,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'فشل تحديث الحالة')
      }

      setStatusPick((prev) => ({...prev, [shelter.id]: nextStatus}))
      await fetchShelters()
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
          مراكز الإيواء
        </div>

        <div className="mt-1 text-[11px] text-muted-foreground sm:text-sm">
          الرئيسية <span className="mx-1">{'>'}</span>
          <span className="text-foreground">إدارة مراكز الإيواء</span>
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
                      placeholder="ابحث باسم مركز الإيواء"
                      className={`${inputBaseClass} ${topControlHeight} pr-9 pl-3`}
                    />
                  </div>

                  <div className="min-w-[120px] max-w-[140px] sm:min-w-[150px] sm:max-w-[160px] shrink-0">
                    <select
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(e.target.value as 'الكل' | 'ممتلئ' | 'غير ممتلئ')
                      }
                      className={`${selectBaseClass} ${topControlHeight} truncate`}
                    >
                      <option value="الكل">كل الحالات</option>
                      <option value="ممتلئ">ممتلئ</option>
                      <option value="غير ممتلئ">غير ممتلئ</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Button
                    className={`!bg-blue-600 !text-white hover:!bg-blue-700 ${fixedButtonClass}`}
                    onClick={() => {
                      setAddOpen(true)
                      clearAddFieldErrors()
                      setErrorMessage('')
                    }}
                    disabled={submitting}
                  >
                    <Plus className="ms-1 h-4 w-4 shrink-0" />
                    إضافة مركز إيواء
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
                  className="w-full min-w-[820px] sm:min-w-[980px] lg:min-w-[1120px] table-fixed border-collapse text-[11px] sm:text-sm lg:text-base"
                  dir="rtl"
                >
                  <thead
                    style={{
                      backgroundColor: '#F9FAFB',
                      boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
                    }}
                  >
                    <tr className="text-right text-foreground/60">
                      <th className="w-[18%] border-b border-l px-2 py-3 text-right text-[11px] font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        اسم مركز الإيواء
                      </th>
                      <th className="w-[13%] border-b border-l px-2 py-3 text-right text-[11px] font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        المنطقة
                      </th>
                      <th className="w-[14%] border-b border-l px-2 py-3 text-right text-[11px] font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        المشرف
                      </th>
                      <th className="w-[15%] border-b border-l px-2 py-3 text-right text-[11px] font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        الهاتف
                      </th>
                      <th className="w-[9%] border-b border-l px-2 py-3 text-right text-[11px] font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        السعة
                      </th>
                      <th className="w-[13%] border-b border-l px-2 py-3 text-right text-[11px] font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        الحالة
                      </th>
                      <th className="w-[18%] border-b px-2 py-3 text-right text-[11px] font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                          جاري تحميل البيانات...
                        </td>
                      </tr>
                    ) : (
                      <>
                        {pageItems.map((sh) => {
                          const isEditing = editingId === sh.id
                          const currentStatus: FillStatus =
                            statusPick[sh.id] ??
                            sh.fillStatus ??
                            defaultFillStatus(sh.familiesCount, sh.capacity)

                          return (
                            <tr key={sh.id} className="align-top hover:bg-muted/30">
                              <td className="border-b border-l px-2 py-3 text-right font-medium break-words sm:px-4 sm:py-4 lg:px-5">
                                {isEditing ? (
                                  <Input
                                    value={editDraft.nameAr}
                                    onChange={(e) => {
                                      setEditDraft((p) => ({...p, nameAr: e.target.value}))
                                      setEditCapacityError('')
                                    }}
                                    className="h-8 sm:h-10 lg:h-11 rounded-lg text-right text-[11px] sm:text-sm lg:text-base font-medium"
                                  />
                                ) : (
                                  <span className="block break-words text-[11px] sm:text-sm lg:text-base font-medium leading-5 sm:leading-7">
                                    {sh.nameAr}
                                  </span>
                                )}
                              </td>

                              <td className="border-b border-l px-2 py-3 text-right break-words sm:px-4 sm:py-4 lg:px-5">
                                {isEditing ? (
                                  <Input
                                    value={editDraft.areaAr}
                                    onChange={(e) => {
                                      setEditDraft((p) => ({...p, areaAr: e.target.value}))
                                      setEditCapacityError('')
                                    }}
                                    className="h-8 sm:h-10 lg:h-11 rounded-lg text-right text-[11px] sm:text-sm lg:text-base font-medium"
                                  />
                                ) : (
                                  <span className="block break-words text-[11px] sm:text-sm lg:text-base font-medium leading-5 sm:leading-7">
                                    {sh.areaAr}
                                  </span>
                                )}
                              </td>

                              <td className="border-b border-l px-2 py-3 text-right break-words sm:px-4 sm:py-4 lg:px-5">
                                {isEditing ? (
                                  <Input
                                    value={editDraft.supervisorAr}
                                    onChange={(e) => {
                                      setEditDraft((p) => ({...p, supervisorAr: e.target.value}))
                                      setEditCapacityError('')
                                    }}
                                    className="h-8 sm:h-10 lg:h-11 rounded-lg text-right text-[11px] sm:text-sm lg:text-base font-medium"
                                  />
                                ) : (
                                  <span className="block break-words text-[11px] sm:text-sm lg:text-base font-medium leading-5 sm:leading-7">
                                    {sh.supervisorAr}
                                  </span>
                                )}
                              </td>

                              <td className="border-b border-l px-2 py-3 text-right break-words sm:px-4 sm:py-4 lg:px-5">
                                {isEditing ? (
                                  <div className="max-w-full">
                                    <Input
                                      value={editDraft.phone}
                                      onChange={(e) => {
                                        const onlyDigits = toPhoneDigitsOnly(e.target.value)
                                        setEditDraft((p) => ({
                                          ...p,
                                          phone: onlyDigits,
                                        }))
                                        setEditPhoneError(
                                          onlyDigits ? getPhoneError(onlyDigits) : 'رقم الهاتف مطلوب'
                                        )
                                      }}
                                      onBlur={() => {
                                        setEditPhoneError(getPhoneError(editDraft.phone))
                                      }}
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      maxLength={10}
                                      className={`h-8 sm:h-10 lg:h-11 rounded-lg text-right text-[11px] sm:text-sm lg:text-base ${editPhoneError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                      placeholder="0599123456"
                                    />
                                    {editPhoneError && (
                                      <div className="mt-1 text-[10px] sm:text-xs text-red-600 leading-4">
                                        {editPhoneError}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="block break-words text-[11px] sm:text-sm lg:text-base font-medium leading-5 sm:leading-7">
                                    {sh.phone}
                                  </span>
                                )}
                              </td>

                              <td className="border-b border-l px-2 py-3 text-right sm:px-4 sm:py-4 lg:px-5">
                                {isEditing ? (
                                  <div className="max-w-full">
                                    <Input
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      type="text"
                                      value={editDraft.capacity ? String(editDraft.capacity) : ''}
                                      onChange={(e) => {
                                        setEditDraft((p) => ({
                                          ...p,
                                          capacity: toIntOnly(e.target.value),
                                        }))
                                        setEditCapacityError('')
                                      }}
                                      className={`h-8 sm:h-10 lg:h-11 rounded-lg text-right text-[11px] sm:text-sm lg:text-base ${editCapacityError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                    />
                                    {editCapacityError && (
                                      <div className="mt-1 text-[10px] sm:text-xs text-red-600 leading-4">
                                        {editCapacityError}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="block break-words text-[11px] sm:text-sm lg:text-base font-medium leading-5 sm:leading-7">
                                    {sh.capacity}
                                  </span>
                                )}
                              </td>

                              <td className="border-b border-l px-2 py-3 text-right sm:px-4 sm:py-4 lg:px-5">
                                <div className="w-[100px] sm:w-[135px] lg:w-[150px] max-w-full">
                                  {isEditing ? (
                                    <select
                                      value={editDraft.fillStatus}
                                      onChange={(e) =>
                                        setEditDraft((p) => ({
                                          ...p,
                                          fillStatus: e.target.value as FillStatus,
                                        }))
                                      }
                                      className="h-8 sm:h-10 lg:h-11 w-full min-w-0 rounded-lg border bg-background px-2 sm:px-3 text-right text-[11px] sm:text-sm lg:text-base truncate"
                                    >
                                      <option value="ممتلئ">ممتلئ</option>
                                      <option value="غير ممتلئ">غير ممتلئ</option>
                                    </select>
                                  ) : (
                                    <select
                                      value={currentStatus}
                                      onChange={(e) =>
                                        updateStatusDirectly(sh, e.target.value as FillStatus)
                                      }
                                      className="h-8 sm:h-10 lg:h-11 w-full min-w-0 rounded-lg border bg-background px-2 sm:px-3 text-right text-[11px] sm:text-sm lg:text-base truncate"
                                      disabled={submitting}
                                    >
                                      <option value="ممتلئ">ممتلئ</option>
                                      <option value="غير ممتلئ">غير ممتلئ</option>
                                    </select>
                                  )}
                                </div>
                              </td>

                              <td className="border-b px-2 py-3 sm:px-4 sm:py-4 lg:px-5">
                                <div className="flex flex-nowrap items-center justify-start gap-1.5 sm:gap-2 overflow-visible">
                                  {!isEditing ? (
                                    <>
                                      <button
                                        type="button"
                                        className={`${fixedIconButtonClass} hover:bg-muted`}
                                        title="تعديل"
                                        onClick={() => startEditRow(sh)}
                                        disabled={submitting}
                                      >
                                        <Pencil className="size-3.5 sm:size-4" />
                                      </button>

                                      <button
                                        type="button"
                                        className={`${fixedIconButtonClass} hover:bg-muted`}
                                        title="حذف"
                                        onClick={() => onDeleteOne(sh.id)}
                                        disabled={submitting}
                                      >
                                        <Trash2 className="size-3.5 sm:size-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        className={tableBtnClass}
                                        onClick={() => saveEditRow(sh.id)}
                                        disabled={
                                          submitting ||
                                          !editDraft.nameAr ||
                                          !editDraft.areaAr ||
                                          !editDraft.supervisorAr ||
                                          !editDraft.phone ||
                                          !!editPhoneError ||
                                          !Number.isInteger(editDraft.capacity) ||
                                          editDraft.capacity <= 0
                                        }
                                      >
                                        <Save className="ms-1 size-3.5 sm:size-4" />
                                        حفظ
                                      </Button>

                                      <Button
                                        variant="outline"
                                        className={tableBtnClass}
                                        onClick={cancelEditRow}
                                        disabled={submitting}
                                      >
                                        <X className="ms-1 size-3.5 sm:size-4" />
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
                            <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                              لا توجد مراكز إيواء
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
              clearAddFieldErrors()
            }
          }}
        >
          <DialogContent
            className="w-[95vw] max-w-[95vw] rounded-xl sm:max-w-[560px]"
            dir="rtl"
          >
            <DialogHeader className="text-right">
              <DialogTitle>إضافة مركز إيواء</DialogTitle>
              <DialogDescription>إدخال بيانات المركز</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 text-right">
              <div className="grid gap-2">
                <div className="text-sm">اسم المركز *</div>
                <Input
                  value={nameAr}
                  onChange={(e) => {
                    setNameAr(e.target.value)
                    setCapacityError('')
                  }}
                  placeholder="مثال: مركز إيواء الشمال A"
                  className="h-10 text-right sm:h-11"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">المنطقة *</div>
                <Input
                  value={areaAr}
                  onChange={(e) => {
                    setAreaAr(e.target.value)
                    setCapacityError('')
                  }}
                  placeholder="مثال: شمال غزة"
                  className="h-10 text-right sm:h-11"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">المشرف *</div>
                <Input
                  value={supervisorAr}
                  onChange={(e) => {
                    setSupervisorAr(e.target.value)
                    setCapacityError('')
                  }}
                  placeholder="مثال: أحمد علي"
                  className="h-10 text-right sm:h-11"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">رقم التواصل *</div>
                <Input
                  value={phone}
                  onChange={(e) => {
                    const onlyDigits = toPhoneDigitsOnly(e.target.value)
                    setPhone(onlyDigits)
                    setPhoneError(onlyDigits ? getPhoneError(onlyDigits) : 'رقم الهاتف مطلوب')
                  }}
                  onBlur={() => {
                    setPhoneError(getPhoneError(phone))
                  }}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  placeholder="مثال: 0599123456"
                  className={`h-10 text-right sm:h-11 ${phoneError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                {phoneError && <div className="text-xs text-red-600 sm:text-sm">{phoneError}</div>}
              </div>

              <div className="grid gap-2">
                <div className="text-sm">السعة *</div>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="text"
                  value={capacity ? String(capacity) : ''}
                  onChange={(e) => {
                    setCapacity(toIntOnly(e.target.value))
                    setCapacityError('')
                  }}
                  placeholder="مثال: 1500"
                  className={`h-10 text-right sm:h-11 ${capacityError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                {capacityError && (
                  <div className="text-xs text-red-600 sm:text-sm">{capacityError}</div>
                )}
              </div>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row" dir="rtl">
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
                  !nameAr ||
                  !areaAr ||
                  !supervisorAr ||
                  !phone ||
                  !!phoneError ||
                  !Number.isInteger(capacity) ||
                  capacity <= 0
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