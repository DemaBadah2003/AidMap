'use client'

import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { z } from 'zod'

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

type Priority = 'مستعجل' | 'عادي' | 'حرج'

type Beneficiary = {
  id: string
  nameAr: string
  phone: string
  familyCount: number
  campId: string
  campName: string
  priority: Priority
}

type BeneficiaryApiItem = {
  id: string
  nameAr: string
  phone: string
  familyCount: number
  campId: string
  campName: string
  priority: Priority
}

type CampOption = {
  id: string
  name: string
}

type AddFormErrors = {
  nameAr: string
  phone: string
  familyCount: string
  campId: string
  priority: string
}

const BASE_URL = '/api/project/projects/beneficiaries'
const CAMPS_OPTIONS_URL = '/api/project/projects/camps?forBeneficiary=true'

const phoneRegex = /^(056|059)\d{7}$/
const hasNoOuterSpaces = (value: string) => value === value.trim()

const createBeneficiarySchema = z.object({
  nameAr: z
    .string()
    .min(1, 'اسم المستفيد مطلوب')
    .refine((value) => hasNoOuterSpaces(value), {
      message: 'اسم المستفيد يجب ألا يبدأ أو ينتهي بمسافة',
    })
    .refine((value) => value.trim().length > 0, {
      message: 'اسم المستفيد مطلوب',
    }),
  phone: z
    .string()
    .trim()
    .min(1, 'رقم الهاتف مطلوب')
    .regex(phoneRegex, 'رقم الهاتف يجب أن يبدأ بـ 056 أو 059 وبعده 7 أرقام'),
  familyCount: z.coerce.number().int().positive('يجب أن يكون عدد أفراد الأسرة أكبر من 0'),
  campId: z.string().trim().min(1, 'اسم المخيم مطلوب'),
  priority: z.enum(['مستعجل', 'عادي', 'حرج']),
})

const updateBeneficiarySchema = z
  .object({
    nameAr: z
      .string()
      .min(1, 'اسم المستفيد مطلوب')
      .refine((value) => hasNoOuterSpaces(value), {
        message: 'اسم المستفيد يجب ألا يبدأ أو ينتهي بمسافة',
      })
      .refine((value) => value.trim().length > 0, {
        message: 'اسم المستفيد مطلوب',
      })
      .optional(),
    phone: z
      .string()
      .trim()
      .min(1, 'رقم الهاتف مطلوب')
      .regex(phoneRegex, 'رقم الهاتف يجب أن يبدأ بـ 056 أو 059 وبعده 7 أرقام')
      .optional(),
    familyCount: z.coerce.number().int().positive().optional(),
    campId: z.string().trim().min(1).optional(),
    priority: z.enum(['مستعجل', 'عادي', 'حرج']).optional(),
  })
  .strict()

const toIntOnly = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

const normalizePhone = (value: string) => value.replace(/\D/g, '').trim()
const normalizeName = (value: string) => value.trim().toLowerCase()
const isValidPhone = (value: string) => phoneRegex.test(value)

const getEmptyAddErrors = (): AddFormErrors => ({
  nameAr: '',
  phone: '',
  familyCount: '',
  campId: '',
  priority: '',
})

const badgeClassByPriority = (p: Priority) => {
  if (p === 'مستعجل') return 'bg-primary text-primary-foreground'
  if (p === 'حرج') return 'bg-destructive text-destructive-foreground'
  return 'bg-muted text-foreground'
}

async function requestJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    cache: 'no-store',
  })

  const text = await res.text()
  let data: any = null

  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text || null
  }

  if (!res.ok) {
    const msg = data?.message ?? `فشل الطلب: ${res.status}`
    throw new Error(msg)
  }

  return data as T
}

async function readBeneficiaries(): Promise<BeneficiaryApiItem[]> {
  return requestJSON<BeneficiaryApiItem[]>(BASE_URL)
}

async function readCampOptions(): Promise<CampOption[]> {
  return requestJSON<CampOption[]>(CAMPS_OPTIONS_URL)
}

async function assertNoDuplicateBeneficiary(
  nameAr: string,
  phone: string,
  excludeId?: string
) {
  const current = await readBeneficiaries()

  const normalizedPhone = normalizePhone(phone)

  const duplicatedPhone = current.some(
    (b) => b.id !== excludeId && normalizePhone(b.phone) === normalizedPhone
  )

  if (duplicatedPhone) {
    throw new Error('رقم الهاتف مكرر بالفعل.')
  }
}

async function createBeneficiary(input: unknown): Promise<BeneficiaryApiItem> {
  const body = createBeneficiarySchema.parse(input)

  await assertNoDuplicateBeneficiary(body.nameAr, body.phone)

  return requestJSON<BeneficiaryApiItem>(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

async function updateBeneficiary(id: string, input: unknown): Promise<BeneficiaryApiItem> {
  if (!id) throw new Error('معرّف المستفيد مفقود')

  const body = updateBeneficiarySchema.parse(input)

  if (body.phone) {
    await assertNoDuplicateBeneficiary(body.nameAr ?? '', body.phone, id)
  }

  return requestJSON<BeneficiaryApiItem>(`${BASE_URL}?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

async function deleteBeneficiary(id: string): Promise<void> {
  if (!id) throw new Error('معرّف المستفيد مفقود')

  await requestJSON(`${BASE_URL}?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

async function deleteAllBeneficiaries(): Promise<void> {
  await requestJSON(`${BASE_URL}?all=true`, {
    method: 'DELETE',
  })
}

const beneficiariesApi = {
  list: readBeneficiaries,
  create: createBeneficiary,
  update: updateBeneficiary,
  remove: deleteBeneficiary,
  removeAll: deleteAllBeneficiaries,
}

export default function BeneficiariesPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Beneficiary[]>([])
  const [campOptions, setCampOptions] = useState<CampOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [priorityFilter, setPriorityFilter] =
    useState<'all' | 'مستعجل' | 'عادي' | 'حرج'>('all')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [addOpen, setAddOpen] = useState(false)
  const [nameAr, setNameAr] = useState('')
  const [phone, setPhone] = useState('')
  const [familyCount, setFamilyCount] = useState<number>(0)
  const [campId, setCampId] = useState('')
  const [priority, setPriority] = useState<Priority>('عادي')
  const [submitting, setSubmitting] = useState(false)
  const [addErrors, setAddErrors] = useState<AddFormErrors>(getEmptyAddErrors())

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    nameAr: string
    phone: string
    familyCount: number
    campId: string
    priority: Priority
  }>({
    nameAr: '',
    phone: '',
    familyCount: 1,
    campId: '',
    priority: 'عادي',
  })

  const unifiedButtonClass =
    'h-11 rounded-lg px-5 text-sm font-bold sm:h-12 sm:text-base'
  const unifiedIconButtonClass =
    'inline-flex h-11 w-11 items-center justify-center rounded-lg border sm:h-12 sm:w-12'
  const unifiedSmallButtonClass =
    'h-11 rounded-lg px-5 text-sm font-semibold sm:h-12 sm:text-base'

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError('')

      try {
        const [beneficiaries, camps] = await Promise.all([
          beneficiariesApi.list(),
          readCampOptions(),
        ])

        setItems(
          beneficiaries.map((b) => ({
            id: b.id,
            nameAr: b.nameAr,
            phone: b.phone,
            familyCount: b.familyCount,
            campId: b.campId,
            campName: b.campName,
            priority: b.priority,
          }))
        )

        setCampOptions(camps)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'فشل في تحميل المستفيدين')
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()

    return items.filter((b) => {
      const matchSearch =
        !s ||
        b.nameAr.toLowerCase().includes(s) ||
        b.phone.toLowerCase().includes(s) ||
        b.campName.toLowerCase().includes(s)

      const matchPriority =
        priorityFilter === 'all' ? true : b.priority === priorityFilter

      return matchSearch && matchPriority
    })
  }, [q, items, priorityFilter])

  useEffect(() => {
    setPage(1)
  }, [q, priorityFilter, pageSize])

  const validateAddForm = () => {
    const nextErrors = getEmptyAddErrors()

    const rawName = nameAr
    const trimmedName = nameAr.trim()
    const normalizedPhoneValue = normalizePhone(phone)

    if (!rawName) {
      nextErrors.nameAr = 'اسم المستفيد مطلوب'
    } else if (!hasNoOuterSpaces(rawName)) {
      nextErrors.nameAr = 'اسم المستفيد يجب ألا يبدأ أو ينتهي بمسافة'
    } else if (!trimmedName) {
      nextErrors.nameAr = 'اسم المستفيد مطلوب'
    }

    if (!normalizedPhoneValue) {
      nextErrors.phone = 'رقم الهاتف مطلوب'
    } else if (!/^\d+$/.test(normalizedPhoneValue)) {
      nextErrors.phone = 'رقم الهاتف يجب أن يحتوي على أرقام فقط'
    } else if (!isValidPhone(normalizedPhoneValue)) {
      nextErrors.phone = 'رقم الهاتف يجب أن يبدأ بـ 056 أو 059 وبعده 7 أرقام'
    } else {
      const duplicatePhone = items.some(
        (item) => normalizePhone(item.phone) === normalizedPhoneValue
      )

      if (duplicatePhone) {
        nextErrors.phone = 'رقم الهاتف مكرر بالفعل'
      }
    }

    if (!Number.isInteger(familyCount) || familyCount <= 0) {
      nextErrors.familyCount = 'عدد أفراد الأسرة يجب أن يكون أكبر من 0'
    }

    if (!campId) {
      nextErrors.campId = 'اسم المخيم مطلوب'
    }

    if (!priority) {
      nextErrors.priority = 'الأولوية مطلوبة'
    }

    setAddErrors(nextErrors)

    return Object.values(nextErrors).every((value) => !value)
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  const resetAddForm = () => {
    setNameAr('')
    setPhone('')
    setFamilyCount(0)
    setCampId('')
    setPriority('عادي')
    setAddErrors(getEmptyAddErrors())
  }

  const isAddFormValid =
    !!nameAr &&
    hasNoOuterSpaces(nameAr) &&
    !!nameAr.trim() &&
    !!phone &&
    /^\d+$/.test(normalizePhone(phone)) &&
    isValidPhone(normalizePhone(phone)) &&
    !!campId &&
    !!priority &&
    Number.isInteger(familyCount) &&
    familyCount > 0 &&
    !items.some((item) => normalizePhone(item.phone) === normalizePhone(phone))

  const onAdd = async () => {
    const rawName = nameAr
    const ar = nameAr.trim()
    const ph = normalizePhone(phone)

    const isValid = validateAddForm()
    if (!isValid) return

    if (!rawName || !ar || !ph || !campId || !Number.isInteger(familyCount) || familyCount <= 0) {
      const message = 'يرجى تعبئة جميع الحقول المطلوبة قبل الإضافة'
      setError(message)
      return
    }

    if (!hasNoOuterSpaces(rawName)) {
      const message = 'اسم المستفيد يجب ألا يبدأ أو ينتهي بمسافة'
      setError(message)
      return
    }

    if (!/^\d+$/.test(ph)) {
      const message = 'رقم الهاتف يجب أن يحتوي على أرقام فقط'
      setError(message)
      return
    }

    if (!isValidPhone(ph)) {
      const message = 'رقم الهاتف يجب أن يبدأ بـ 056 أو 059 وبعده 7 أرقام'
      setError(message)
      return
    }

    const duplicatePhone = items.some(
      (item) => normalizePhone(item.phone) === ph
    )

    if (duplicatePhone) {
      setAddErrors((prev) => ({
        ...prev,
        phone: 'رقم الهاتف مكرر بالفعل',
      }))
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const created = await beneficiariesApi.create({
        nameAr: ar,
        phone: ph,
        familyCount,
        campId,
        priority,
      })

      setItems((prev) => [
        {
          id: created.id,
          nameAr: created.nameAr,
          phone: created.phone,
          familyCount: created.familyCount,
          campId: created.campId,
          campName: created.campName,
          priority: created.priority,
        },
        ...prev,
      ])

      resetAddForm()
      setAddOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'فشل في إضافة المستفيد'
      setError(message)

      if (message.includes('رقم الهاتف مكرر')) {
        setAddErrors((prev) => ({
          ...prev,
          phone: 'رقم الهاتف مكرر بالفعل',
        }))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const onDeleteOne = async (id: string) => {
    try {
      setError('')
      await beneficiariesApi.remove(id)

      if (editingId === id) setEditingId(null)

      setItems((prev) => prev.filter((x) => x.id !== id))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'فشل في حذف المستفيد'
      setError(message)
      alert(message)
    }
  }

  const onDeleteAll = async () => {
    try {
      setError('')
      await beneficiariesApi.removeAll()
      setItems([])
      setEditingId(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'فشل في حذف جميع المستفيدين'
      setError(message)
      alert(message)
    }
  }

  const startEditRow = (b: Beneficiary) => {
    setEditingId(b.id)
    setEditDraft({
      nameAr: b.nameAr,
      phone: b.phone,
      familyCount: b.familyCount,
      campId: b.campId,
      priority: b.priority,
    })
  }

  const cancelEditRow = () => setEditingId(null)

  const saveEditRow = async (id: string) => {
    const rawName = editDraft.nameAr
    const ar = editDraft.nameAr.trim()
    const ph = normalizePhone(editDraft.phone)

    if (
      !rawName ||
      !ar ||
      !ph ||
      !editDraft.campId ||
      !Number.isInteger(editDraft.familyCount) ||
      editDraft.familyCount <= 0
    ) {
      const message = 'يرجى تعبئة جميع الحقول المطلوبة قبل الحفظ'
      setError(message)
      alert(message)
      return
    }

    if (!hasNoOuterSpaces(rawName)) {
      const message = 'اسم المستفيد يجب ألا يبدأ أو ينتهي بمسافة'
      setError(message)
      alert(message)
      return
    }

    if (!/^\d+$/.test(ph)) {
      const message = 'رقم الهاتف يجب أن يحتوي على أرقام فقط'
      setError(message)
      alert(message)
      return
    }

    if (!isValidPhone(ph)) {
      const message = 'رقم الهاتف يجب أن يبدأ بـ 056 أو 059 وبعده 7 أرقام'
      setError(message)
      alert(message)
      return
    }

    try {
      setError('')

      const updated = await beneficiariesApi.update(id, {
        nameAr: ar,
        phone: ph,
        familyCount: editDraft.familyCount,
        campId: editDraft.campId,
        priority: editDraft.priority,
      })

      setItems((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                nameAr: updated.nameAr,
                phone: updated.phone,
                familyCount: updated.familyCount,
                campId: updated.campId,
                campName: updated.campName,
                priority: updated.priority,
              }
            : b
        )
      )

      setEditingId(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'فشل في تعديل المستفيد'
      setError(message)
      alert(message)
    }
  }

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

  return (
    <div className="w-full px-2 py-4 sm:px-4 sm:py-6 lg:px-6" dir="rtl">
      <div className="mb-6 text-right">
        <div className="text-xl font-semibold text-foreground sm:text-2xl">
          المستفيدون
        </div>

        <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
          الرئيسية <span className="mx-1">{'>'}</span>{' '}
          <span className="text-foreground">إدارة المستفيدين</span>
        </div>

        {loading && (
          <div className="mt-2 text-xs text-muted-foreground sm:text-sm">
            جارٍ التحميل...
          </div>
        )}

        {!!error && <div className="mt-2 text-xs text-red-600 sm:text-sm">{error}</div>}
      </div>

      <div className="w-full max-w-[1200px]">
        <Card>
          <CardContent className="p-0" dir="rtl">
            <div className="p-3 sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="order-1 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center lg:justify-start">
                  <div className="relative w-full min-w-0 sm:w-[260px]">
                    <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={q}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
                      placeholder="ابحث عن مستفيد"
                      className="!h-10 !w-full !rounded-lg border-slate-200 bg-white pr-9 pl-3 text-right text-sm outline-none focus:!ring-2 focus:!ring-slate-200"
                    />
                  </div>

                  <select
                    value={priorityFilter}
                    onChange={(e) =>
                      setPriorityFilter(e.target.value as 'all' | 'مستعجل' | 'عادي' | 'حرج')
                    }
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-right text-sm outline-none focus:ring-2 focus:ring-slate-200 sm:w-[180px]"
                  >
                    <option value="all">كل الأولويات</option>
                    <option value="مستعجل">مستعجل</option>
                    <option value="عادي">عادي</option>
                    <option value="حرج">حرج</option>
                  </select>
                </div>

                <div className="order-2 flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <Button
                    className="inline-flex w-full items-center justify-center gap-2 !bg-blue-600 !text-white hover:!bg-blue-700 sm:w-auto h-11 rounded-lg px-5 text-sm font-bold sm:h-12 sm:text-base"
                    onClick={() => setAddOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    إضافة مستفيد
                  </Button>

                  <Button
                    variant="outline"
                    className="h-11 w-full rounded-lg border-slate-200 px-5 text-sm font-normal text-slate-700 hover:bg-slate-50 sm:h-12 sm:w-auto sm:text-base"
                    onClick={onDeleteAll}
                  >
                    حذف الكل
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t" />

            <div className="overflow-hidden rounded-b-lg">
              <div className="w-full overflow-x-auto">
                <table className="w-full table-fixed border-collapse text-sm sm:text-base" dir="rtl">
                  <thead
                    style={{
                      backgroundColor: '#F9FAFB',
                      boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
                    }}
                  >
                    <tr className="text-right text-foreground/60">
                      <th className="w-[22%] border-b border-l px-3 py-4 text-right text-sm font-medium sm:px-5 sm:py-4 sm:text-base">
                        اسم المستفيد
                      </th>
                      <th className="w-[18%] border-b border-l px-3 py-4 text-right text-sm font-medium sm:px-5 sm:py-4 sm:text-base">
                        رقم الهاتف
                      </th>
                      <th className="w-[16%] border-b border-l px-3 py-4 text-right text-sm font-medium sm:px-5 sm:py-4 sm:text-base">
                        عدد أفراد الأسرة
                      </th>
                      <th className="w-[20%] border-b border-l px-3 py-4 text-right text-sm font-medium sm:px-5 sm:py-4 sm:text-base">
                        اسم المخيم
                      </th>
                      <th className="w-[12%] border-b border-l px-3 py-4 text-right text-sm font-medium sm:px-5 sm:py-4 sm:text-base">
                        الأولوية
                      </th>
                      <th className="w-[12%] border-b px-3 py-4 text-right text-sm font-medium sm:px-5 sm:py-4 sm:text-base">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageItems.map((b) => {
                      const isEditing = editingId === b.id

                      return (
                        <tr key={b.id} className="align-top hover:bg-muted/30">
                          <td className="border-b border-l px-3 py-4 text-right font-medium break-words sm:px-5 sm:py-4">
                            {isEditing ? (
                              <Input
                                value={editDraft.nameAr}
                                onChange={(e) =>
                                  setEditDraft((p) => ({ ...p, nameAr: e.target.value }))
                                }
                                className="h-12 rounded-lg text-right text-base font-medium sm:h-14 sm:text-lg"
                              />
                            ) : (
                              <span className="block break-words text-base font-medium leading-7 sm:text-lg">
                                {b.nameAr}
                              </span>
                            )}
                          </td>

                          <td className="border-b border-l px-3 py-4 text-right break-words sm:px-5 sm:py-4">
                            {isEditing ? (
                              <Input
                                value={editDraft.phone}
                                onChange={(e) =>
                                  setEditDraft((p) => ({
                                    ...p,
                                    phone: e.target.value.replace(/\D/g, ''),
                                  }))
                                }
                                className="h-12 rounded-lg text-right text-base font-medium sm:h-14 sm:text-lg"
                                placeholder="0599123456"
                                inputMode="numeric"
                              />
                            ) : (
                              <span className="block break-words text-base font-medium leading-7 sm:text-lg">
                                {b.phone}
                              </span>
                            )}
                          </td>

                          <td className="border-b border-l px-3 py-4 text-right sm:px-5 sm:py-4">
                            {isEditing ? (
                              <Input
                                inputMode="numeric"
                                pattern="[0-9]*"
                                type="text"
                                value={editDraft.familyCount ? String(editDraft.familyCount) : ''}
                                onChange={(e) =>
                                  setEditDraft((p) => ({
                                    ...p,
                                    familyCount: toIntOnly(e.target.value),
                                  }))
                                }
                                className="h-12 rounded-lg text-right text-base font-medium sm:h-14 sm:text-lg"
                              />
                            ) : (
                              <span className="block break-words text-base font-medium leading-7 sm:text-lg">
                                {b.familyCount}
                              </span>
                            )}
                          </td>

                          <td className="border-b border-l px-3 py-4 text-right sm:px-5 sm:py-4">
                            {isEditing ? (
                              <select
                                value={editDraft.campId}
                                onChange={(e) =>
                                  setEditDraft((p) => ({ ...p, campId: e.target.value }))
                                }
                                className="h-12 min-w-[150px] rounded-lg border bg-background px-4 text-right text-base sm:h-14 sm:text-lg"
                              >
                                <option value="">اختر المخيم</option>
                                {campOptions.map((camp) => (
                                  <option key={camp.id} value={camp.id}>
                                    {camp.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="block break-words text-base font-medium leading-7 sm:text-lg">
                                {b.campName}
                              </span>
                            )}
                          </td>

                          <td className="border-b border-l px-3 py-4 text-right sm:px-5 sm:py-4">
                            {isEditing ? (
                              <select
                                value={editDraft.priority}
                                onChange={(e) =>
                                  setEditDraft((p) => ({
                                    ...p,
                                    priority: e.target.value as Priority,
                                  }))
                                }
                                className="h-12 min-w-[150px] rounded-lg border bg-background px-4 text-right text-base sm:h-14 sm:text-lg"
                              >
                                <option value="مستعجل">مستعجل</option>
                                <option value="عادي">عادي</option>
                                <option value="حرج">حرج</option>
                              </select>
                            ) : (
                              <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium sm:text-base ${badgeClassByPriority(
                                  b.priority
                                )}`}
                              >
                                {b.priority}
                              </span>
                            )}
                          </td>

                          <td className="border-b px-3 py-4 sm:px-5 sm:py-4">
                            <div className="flex flex-wrap items-center justify-start gap-2">
                              {!isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    className={`${unifiedIconButtonClass} hover:bg-muted`}
                                    title="تعديل"
                                    onClick={() => startEditRow(b)}
                                  >
                                    <Pencil className="size-4" />
                                  </button>

                                  <button
                                    type="button"
                                    className={`${unifiedIconButtonClass} hover:bg-muted`}
                                    title="حذف"
                                    onClick={() => onDeleteOne(b.id)}
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    className={unifiedSmallButtonClass}
                                    onClick={() => saveEditRow(b.id)}
                                    disabled={
                                      !editDraft.nameAr ||
                                      !hasNoOuterSpaces(editDraft.nameAr) ||
                                      !editDraft.phone.trim() ||
                                      !/^\d+$/.test(normalizePhone(editDraft.phone)) ||
                                      !isValidPhone(normalizePhone(editDraft.phone)) ||
                                      !editDraft.campId ||
                                      !Number.isInteger(editDraft.familyCount) ||
                                      editDraft.familyCount <= 0
                                    }
                                  >
                                    <Save className="ms-2 size-4" />
                                    حفظ
                                  </Button>

                                  <Button
                                    variant="outline"
                                    className={unifiedSmallButtonClass}
                                    onClick={cancelEditRow}
                                  >
                                    <X className="ms-2 size-4" />
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
                          لا يوجد مستفيدون
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
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

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="text-xs text-muted-foreground sm:text-sm">
                    {rangeStart} - {rangeEnd} من {filtered.length}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      disabled={safePage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={unifiedSmallButtonClass}
                    >
                      السابق
                    </Button>

                    <Button
                      variant="outline"
                      disabled={safePage >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className={unifiedSmallButtonClass}
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
              resetAddForm()
            }
          }}
        >
          <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[560px]" dir="rtl">
            <DialogHeader className="text-right">
              <DialogTitle>إضافة مستفيد</DialogTitle>
              <DialogDescription>إدخال بيانات المستفيد</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 text-right">
              <div className="grid gap-2">
                <div className="text-sm">اسم المستفيد *</div>
                <Input
                  value={nameAr}
                  onChange={(e) => {
                    setNameAr(e.target.value)
                    setAddErrors((prev) => ({ ...prev, nameAr: '' }))
                  }}
                  onBlur={() => {
                    const rawValue = nameAr
                    const trimmedValue = nameAr.trim()

                    if (!rawValue) {
                      setAddErrors((prev) => ({
                        ...prev,
                        nameAr: 'اسم المستفيد مطلوب',
                      }))
                      return
                    }

                    if (!hasNoOuterSpaces(rawValue)) {
                      setAddErrors((prev) => ({
                        ...prev,
                        nameAr: 'اسم المستفيد يجب ألا يبدأ أو ينتهي بمسافة',
                      }))
                      return
                    }

                    if (!trimmedValue) {
                      setAddErrors((prev) => ({
                        ...prev,
                        nameAr: 'اسم المستفيد مطلوب',
                      }))
                      return
                    }

                    setAddErrors((prev) => ({
                      ...prev,
                      nameAr: '',
                    }))
                  }}
                  placeholder="مثال: أحمد محمد"
                  className="text-right"
                />
                {!!addErrors.nameAr && (
                  <div className="text-xs text-red-600">{addErrors.nameAr}</div>
                )}
              </div>

              <div className="grid gap-2">
                <div className="text-sm">رقم الهاتف *</div>
                <Input
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, ''))
                    setAddErrors((prev) => ({ ...prev, phone: '' }))
                  }}
                  onBlur={() => {
                    const normalizedValue = normalizePhone(phone)

                    if (!normalizedValue) {
                      setAddErrors((prev) => ({
                        ...prev,
                        phone: 'رقم الهاتف مطلوب',
                      }))
                      return
                    }

                    if (!/^\d+$/.test(normalizedValue)) {
                      setAddErrors((prev) => ({
                        ...prev,
                        phone: 'رقم الهاتف يجب أن يحتوي على أرقام فقط',
                      }))
                      return
                    }

                    if (!isValidPhone(normalizedValue)) {
                      setAddErrors((prev) => ({
                        ...prev,
                        phone: 'رقم الهاتف يجب أن يبدأ بـ 056 أو 059 وبعده 7 أرقام',
                      }))
                      return
                    }

                    const duplicatePhone = items.some(
                      (item) => normalizePhone(item.phone) === normalizedValue
                    )

                    if (duplicatePhone) {
                      setAddErrors((prev) => ({
                        ...prev,
                        phone: 'رقم الهاتف مكرر بالفعل',
                      }))
                      return
                    }

                    setAddErrors((prev) => ({
                      ...prev,
                      phone: '',
                    }))
                  }}
                  placeholder="مثال: 0599123456"
                  className="text-right"
                  inputMode="numeric"
                  maxLength={10}
                />
                {!!addErrors.phone && (
                  <div className="text-xs text-red-600">{addErrors.phone}</div>
                )}
              </div>

              <div className="grid gap-2">
                <div className="text-sm">عدد أفراد الأسرة *</div>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="text"
                  value={familyCount ? String(familyCount) : ''}
                  onChange={(e) => {
                    setFamilyCount(toIntOnly(e.target.value))
                    setAddErrors((prev) => ({ ...prev, familyCount: '' }))
                  }}
                  onBlur={() => {
                    if (!Number.isInteger(familyCount) || familyCount <= 0) {
                      setAddErrors((prev) => ({
                        ...prev,
                        familyCount: 'عدد أفراد الأسرة يجب أن يكون أكبر من 0',
                      }))
                      return
                    }

                    setAddErrors((prev) => ({
                      ...prev,
                      familyCount: '',
                    }))
                  }}
                  placeholder="مثال: 6"
                  className="text-right"
                />
                {!!addErrors.familyCount && (
                  <div className="text-xs text-red-600">{addErrors.familyCount}</div>
                )}
              </div>

              <div className="grid gap-2">
                <div className="text-sm">اسم المخيم *</div>
                <select
                  value={campId}
                  onChange={(e) => {
                    setCampId(e.target.value)
                    setAddErrors((prev) => ({ ...prev, campId: '' }))
                  }}
                  onBlur={() => {
                    if (!campId) {
                      setAddErrors((prev) => ({
                        ...prev,
                        campId: 'اسم المخيم مطلوب',
                      }))
                      return
                    }

                    setAddErrors((prev) => ({
                      ...prev,
                      campId: '',
                    }))
                  }}
                  className="h-10 rounded-md border bg-background px-3 text-right"
                >
                  <option value="">اختر المخيم</option>
                  {campOptions.map((camp) => (
                    <option key={camp.id} value={camp.id}>
                      {camp.name}
                    </option>
                  ))}
                </select>
                {!!addErrors.campId && (
                  <div className="text-xs text-red-600">{addErrors.campId}</div>
                )}
              </div>

              <div className="grid gap-2">
                <div className="text-sm">الأولوية *</div>
                <select
                  value={priority}
                  onChange={(e) => {
                    setPriority(e.target.value as Priority)
                    setAddErrors((prev) => ({ ...prev, priority: '' }))
                  }}
                  onBlur={() => {
                    if (!priority) {
                      setAddErrors((prev) => ({
                        ...prev,
                        priority: 'الأولوية مطلوبة',
                      }))
                      return
                    }

                    setAddErrors((prev) => ({
                      ...prev,
                      priority: '',
                    }))
                  }}
                  className="h-10 rounded-md border bg-background px-3 text-right"
                >
                  <option value="مستعجل">مستعجل</option>
                  <option value="عادي">عادي</option>
                  <option value="حرج">حرج</option>
                </select>
                {!!addErrors.priority && (
                  <div className="text-xs text-red-600">{addErrors.priority}</div>
                )}
              </div>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => setAddOpen(false)}
                className={`w-full sm:w-auto ${unifiedButtonClass}`}
              >
                إغلاق
              </Button>

              <Button
                onClick={onAdd}
                disabled={submitting || !isAddFormValid}
                className={`w-full sm:w-auto ${unifiedButtonClass}`}
              >
                {submitting ? 'جارٍ الإضافة...' : 'إضافة'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}