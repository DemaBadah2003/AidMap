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

type FillStatus = 'ممتلئ' | 'غير ممتلئ'

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

type ShelterApiItem = {
  id: string
  nameAr: string
  areaAr: string
  supervisorAr: string
  phone: string
  familiesCount: number
  capacity: number
  fillStatus?: FillStatus
}

const BASE_URL = '/api/project/projects/shelter'

const createShelterSchema = z.object({
  nameAr: z.string().trim().min(1, 'اسم المركز مطلوب'),
  areaAr: z.string().trim().min(1, 'المنطقة مطلوبة'),
  supervisorAr: z.string().trim().min(1, 'اسم المشرف مطلوب'),
  phone: z
    .string()
    .trim()
    .min(1, 'رقم الهاتف مطلوب')
    .regex(/^(056|059)\d{7}$/, 'رقم الهاتف يجب أن يبدأ بـ 056 أو 059 وبعده 7 أرقام'),
  capacity: z.coerce.number().int().positive('يجب أن تكون السعة أكبر من 0'),
  fillStatus: z.enum(['ممتلئ', 'غير ممتلئ']).optional(),
})

const updateShelterSchema = z
  .object({
    nameAr: z.string().trim().min(1, 'اسم المركز مطلوب').optional(),
    areaAr: z.string().trim().min(1, 'المنطقة مطلوبة').optional(),
    supervisorAr: z.string().trim().min(1, 'اسم المشرف مطلوب').optional(),
    phone: z
      .string()
      .trim()
      .regex(/^(056|059)\d{7}$/, 'رقم الهاتف يجب أن يبدأ بـ 056 أو 059 وبعده 7 أرقام')
      .optional(),
    capacity: z.coerce.number().int().positive('يجب أن تكون السعة أكبر من 0').optional(),
    fillStatus: z.enum(['ممتلئ', 'غير ممتلئ']).optional(),
  })
  .strict()

const defaultFillStatus = (families: number, capacity: number): FillStatus =>
  families >= capacity ? 'ممتلئ' : 'غير ممتلئ'

const toIntOnly = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

const toPhoneDigitsOnly = (value: string) => value.replace(/\D/g, '').slice(0, 10)

const normalizeText = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()

function getErrorMessage(err: unknown) {
  if (err instanceof z.ZodError) {
    return err.issues[0]?.message ?? 'البيانات المدخلة غير صحيحة'
  }

  return err instanceof Error ? err.message : 'حدث خطأ غير متوقع'
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

async function readShelters(): Promise<ShelterApiItem[]> {
  return requestJSON<ShelterApiItem[]>(BASE_URL)
}

function findDuplicateShelter(
  shelters: ShelterApiItem[],
  input: { nameAr: string; areaAr: string; supervisorAr: string; phone: string },
  excludeId?: string
) {
  const normalizedName = normalizeText(input.nameAr)
  const normalizedArea = normalizeText(input.areaAr)
  const normalizedSupervisor = normalizeText(input.supervisorAr)
  const normalizedPhone = input.phone.trim()

  const duplicate = shelters.find(
    (s) =>
      s.id !== excludeId &&
      normalizeText(s.nameAr ?? '') === normalizedName &&
      normalizeText(s.areaAr ?? '') === normalizedArea &&
      normalizeText(s.supervisorAr ?? '') === normalizedSupervisor &&
      (s.phone ?? '').trim() === normalizedPhone
  )

  if (duplicate) {
    return 'بيانات مركز الإيواء مكررة بالفعل.'
  }

  return ''
}

async function assertShelterBusinessValidation(
  input: {
    nameAr: string
    areaAr: string
    supervisorAr: string
    phone: string
    capacity: number
    fillStatus?: FillStatus
  },
  excludeId?: string
) {
  const normalizedName = normalizeText(input.nameAr)
  const normalizedArea = normalizeText(input.areaAr)
  const normalizedSupervisor = normalizeText(input.supervisorAr)
  const phone = input.phone.trim()

  if (!normalizedName) {
    throw new Error('اسم المركز مطلوب')
  }

  if (!normalizedArea) {
    throw new Error('المنطقة مطلوبة')
  }

  if (!normalizedSupervisor) {
    throw new Error('اسم المشرف مطلوب')
  }

  if (!/^(056|059)\d{7}$/.test(phone)) {
    throw new Error('رقم الهاتف يجب أن يبدأ بـ 056 أو 059 وبعده 7 أرقام')
  }

  if (!Number.isInteger(input.capacity) || input.capacity <= 0) {
    throw new Error('يجب أن تكون السعة أكبر من 0')
  }

  const current = await readShelters()
  const duplicateMessage = findDuplicateShelter(current, input, excludeId)

  if (duplicateMessage) {
    throw new Error(duplicateMessage)
  }
}

async function createShelter(input: unknown): Promise<ShelterApiItem> {
  const body = createShelterSchema.parse(input)

  await assertShelterBusinessValidation({
    nameAr: body.nameAr,
    areaAr: body.areaAr,
    supervisorAr: body.supervisorAr,
    phone: body.phone,
    capacity: body.capacity,
    fillStatus: body.fillStatus,
  })

  return requestJSON<ShelterApiItem>(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

async function updateShelter(id: string, input: unknown): Promise<ShelterApiItem> {
  if (!id) throw new Error('معرّف مركز الإيواء مفقود')

  const body = updateShelterSchema.parse(input)

  const current = await readShelters()
  const existing = current.find((s) => s.id === id)

  if (!existing) {
    throw new Error('مركز الإيواء غير موجود')
  }

  const merged = {
    nameAr: body.nameAr ?? existing.nameAr ?? '',
    areaAr: body.areaAr ?? existing.areaAr ?? '',
    supervisorAr: body.supervisorAr ?? existing.supervisorAr ?? '',
    phone: body.phone ?? existing.phone ?? '',
    capacity: body.capacity ?? existing.capacity,
    fillStatus:
      body.fillStatus ??
      existing.fillStatus ??
      defaultFillStatus(existing.familiesCount, existing.capacity),
  }

  await assertShelterBusinessValidation(merged, id)

  return requestJSON<ShelterApiItem>(`${BASE_URL}?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

async function deleteShelter(id: string): Promise<void> {
  if (!id) throw new Error('معرّف مركز الإيواء مفقود')

  await requestJSON(`${BASE_URL}?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

async function deleteAllShelters(): Promise<void> {
  await requestJSON(`${BASE_URL}?all=true`, {
    method: 'DELETE',
  })
}

const sheltersApi = {
  list: readShelters,
  create: createShelter,
  update: updateShelter,
  remove: deleteShelter,
  removeAll: deleteAllShelters,
}

export default function SheltersPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Shelter[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
  const [fillStatus, setFillStatus] = useState<FillStatus>('غير ممتلئ')
  const [submitting, setSubmitting] = useState(false)
  const [addFormError, setAddFormError] = useState('')

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

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError('')

      try {
        const data = await sheltersApi.list()

        setItems(
          data.map((x) => ({
            id: x.id,
            nameAr: x.nameAr,
            areaAr: x.areaAr,
            supervisorAr: x.supervisorAr,
            phone: x.phone,
            familiesCount: x.familiesCount ?? 0,
            capacity: x.capacity,
            fillStatus: x.fillStatus,
          }))
        )

        const pick: Record<string, FillStatus> = {}
        data.forEach((x) => {
          pick[x.id] = x.fillStatus ?? defaultFillStatus(x.familiesCount ?? 0, x.capacity)
        })
        setStatusPick(pick)
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()

    return items.filter((sh) => {
      const matchSearch =
        !s ||
        sh.nameAr.toLowerCase().includes(s) ||
        sh.areaAr.toLowerCase().includes(s) ||
        sh.supervisorAr.toLowerCase().includes(s) ||
        sh.phone.includes(q)

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

  const resetAddForm = () => {
    setNameAr('')
    setAreaAr('')
    setSupervisorAr('')
    setPhone('')
    setCapacity(0)
    setFillStatus('غير ممتلئ')
    setAddFormError('')
  }

  const isAddFormValid =
    !!nameAr.trim() &&
    !!areaAr.trim() &&
    !!supervisorAr.trim() &&
    /^(056|059)\d{7}$/.test(phone.trim()) &&
    Number.isInteger(capacity) &&
    capacity > 0 &&
    !!fillStatus

  const onAdd = async () => {
    const ar = nameAr.trim()
    const area = areaAr.trim()
    const supervisor = supervisorAr.trim()
    const phoneValue = phone.trim()

    if (
      !ar ||
      !area ||
      !supervisor ||
      !/^(056|059)\d{7}$/.test(phoneValue) ||
      !Number.isInteger(capacity) ||
      capacity <= 0
    ) {
      setAddFormError('يرجى تعبئة جميع الحقول المطلوبة بشكل صحيح')
      return
    }

    setSubmitting(true)
    setError('')
    setAddFormError('')

    try {
      const created = await sheltersApi.create({
        nameAr: ar,
        areaAr: area,
        supervisorAr: supervisor,
        phone: phoneValue,
        capacity,
        fillStatus,
      })

      setItems((prev) => [
        {
          id: created.id,
          nameAr: created.nameAr,
          areaAr: created.areaAr,
          supervisorAr: created.supervisorAr,
          phone: created.phone,
          familiesCount: created.familiesCount ?? 0,
          capacity: created.capacity,
          fillStatus: created.fillStatus,
        },
        ...prev,
      ])

      setStatusPick((prev) => ({
        ...prev,
        [created.id]:
          created.fillStatus ?? defaultFillStatus(created.familiesCount ?? 0, created.capacity),
      }))

      resetAddForm()
      setAddOpen(false)
    } catch (err) {
      setAddFormError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const onDeleteOne = async (id: string) => {
    try {
      setError('')
      await sheltersApi.remove(id)

      if (editingId === id) setEditingId(null)

      setItems((prev) => prev.filter((x) => x.id !== id))
      setStatusPick((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    } catch (err) {
      setError(getErrorMessage(err))
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
  }

  const cancelEditRow = () => setEditingId(null)

  const saveEditRow = async (id: string) => {
    const ar = editDraft.nameAr.trim()
    const area = editDraft.areaAr.trim()
    const supervisor = editDraft.supervisorAr.trim()
    const phoneValue = editDraft.phone.trim()

    if (
      !ar ||
      !area ||
      !supervisor ||
      !/^(056|059)\d{7}$/.test(phoneValue) ||
      !Number.isInteger(editDraft.capacity) ||
      editDraft.capacity <= 0
    ) {
      setError('يرجى تعبئة البيانات بشكل صحيح قبل الحفظ')
      return
    }

    try {
      setError('')

      const updated = await sheltersApi.update(id, {
        nameAr: ar,
        areaAr: area,
        supervisorAr: supervisor,
        phone: phoneValue,
        capacity: editDraft.capacity,
        fillStatus: editDraft.fillStatus,
      })

      setItems((prev) =>
        prev.map((sh) =>
          sh.id === id
            ? {
                ...sh,
                nameAr: updated.nameAr,
                areaAr: updated.areaAr,
                supervisorAr: updated.supervisorAr,
                phone: updated.phone,
                capacity: updated.capacity,
                familiesCount: updated.familiesCount ?? sh.familiesCount,
                fillStatus: updated.fillStatus,
              }
            : sh
        )
      )

      setStatusPick((prev) => ({
        ...prev,
        [id]: updated.fillStatus ?? defaultFillStatus(updated.familiesCount ?? 0, updated.capacity),
      }))

      setEditingId(null)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const updateStatusDirectly = async (shelter: Shelter, nextStatus: FillStatus) => {
    try {
      setError('')

      const updated = await sheltersApi.update(shelter.id, {
        fillStatus: nextStatus,
      })

      setItems((prev) =>
        prev.map((sh) =>
          sh.id === shelter.id
            ? {
                ...sh,
                fillStatus: updated.fillStatus ?? nextStatus,
              }
            : sh
        )
      )

      setStatusPick((prev) => ({
        ...prev,
        [shelter.id]: updated.fillStatus ?? nextStatus,
      }))
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const onDeleteAll = async () => {
    try {
      setError('')
      await sheltersApi.removeAll()
      setItems([])
      setStatusPick({})
      setEditingId(null)
    } catch (err) {
      setError(getErrorMessage(err))
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
          <div className="mt-2 text-[11px] text-muted-foreground sm:text-sm">جارٍ التحميل...</div>
        )}

        {!!error && <div className="mt-2 text-[11px] text-red-600 sm:text-sm">{error}</div>}
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
                      placeholder="ابحث عن مركز إيواء"
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
                      setAddFormError('')
                      setAddOpen(true)
                    }}
                  >
                    <Plus className="ms-1 h-4 w-4 shrink-0" />
                    إضافة مركز إيواء
                  </Button>

                  <Button
                    variant="outline"
                    className={`border-slate-200 text-slate-700 hover:bg-slate-50 ${fixedButtonClass}`}
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
                <table
                  className="w-full min-w-[860px] sm:min-w-[980px] lg:min-w-[1120px] table-fixed border-collapse text-xs sm:text-sm lg:text-base"
                  dir="rtl"
                >
                  <thead
                    style={{
                      backgroundColor: '#F9FAFB',
                      boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
                    }}
                  >
                    <tr className="text-right text-foreground/60">
                      <th className="w-[18%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        اسم مركز الإيواء
                      </th>
                      <th className="w-[13%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        المنطقة
                      </th>
                      <th className="w-[14%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        المشرف
                      </th>
                      <th className="w-[15%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        الهاتف
                      </th>
                      <th className="w-[10%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        السعة
                      </th>
                      <th className="w-[12%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        الحالة
                      </th>
                      <th className="w-[18%] border-b px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>

                  <tbody>
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
                                onChange={(e) =>
                                  setEditDraft((p) => ({ ...p, nameAr: e.target.value }))
                                }
                                className="h-9 sm:h-10 lg:h-11 rounded-lg text-right text-xs sm:text-sm lg:text-base font-medium"
                              />
                            ) : (
                              <span className="block break-words text-xs sm:text-sm lg:text-base font-medium leading-6 sm:leading-7">
                                {sh.nameAr}
                              </span>
                            )}
                          </td>

                          <td className="border-b border-l px-2 py-3 text-right break-words sm:px-4 sm:py-4 lg:px-5">
                            {isEditing ? (
                              <Input
                                value={editDraft.areaAr}
                                onChange={(e) =>
                                  setEditDraft((p) => ({ ...p, areaAr: e.target.value }))
                                }
                                className="h-9 sm:h-10 lg:h-11 rounded-lg text-right text-xs sm:text-sm lg:text-base font-medium"
                              />
                            ) : (
                              <span className="block break-words text-xs sm:text-sm lg:text-base font-medium leading-6 sm:leading-7">
                                {sh.areaAr}
                              </span>
                            )}
                          </td>

                          <td className="border-b border-l px-2 py-3 text-right break-words sm:px-4 sm:py-4 lg:px-5">
                            {isEditing ? (
                              <Input
                                value={editDraft.supervisorAr}
                                onChange={(e) =>
                                  setEditDraft((p) => ({ ...p, supervisorAr: e.target.value }))
                                }
                                className="h-9 sm:h-10 lg:h-11 rounded-lg text-right text-xs sm:text-sm lg:text-base font-medium"
                              />
                            ) : (
                              <span className="block break-words text-xs sm:text-sm lg:text-base font-medium leading-6 sm:leading-7">
                                {sh.supervisorAr}
                              </span>
                            )}
                          </td>

                          <td className="border-b border-l px-2 py-3 text-right break-words sm:px-4 sm:py-4 lg:px-5">
                            {isEditing ? (
                              <Input
                                value={editDraft.phone}
                                onChange={(e) =>
                                  setEditDraft((p) => ({
                                    ...p,
                                    phone: toPhoneDigitsOnly(e.target.value),
                                  }))
                                }
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={10}
                                className="h-9 sm:h-10 lg:h-11 rounded-lg text-right text-xs sm:text-sm lg:text-base font-medium"
                                placeholder="0599123456"
                              />
                            ) : (
                              <span className="block break-words text-xs sm:text-sm lg:text-base font-medium leading-6 sm:leading-7">
                                {sh.phone}
                              </span>
                            )}
                          </td>

                          <td className="border-b border-l px-2 py-3 text-right sm:px-4 sm:py-4 lg:px-5">
                            {isEditing ? (
                              <Input
                                inputMode="numeric"
                                pattern="[0-9]*"
                                type="text"
                                value={editDraft.capacity ? String(editDraft.capacity) : ''}
                                onChange={(e) =>
                                  setEditDraft((p) => ({
                                    ...p,
                                    capacity: toIntOnly(e.target.value),
                                  }))
                                }
                                className="h-9 sm:h-10 lg:h-11 rounded-lg text-right text-xs sm:text-sm lg:text-base font-medium"
                              />
                            ) : (
                              <span className="block break-words text-xs sm:text-sm lg:text-base font-medium leading-6 sm:leading-7">
                                {sh.capacity}
                              </span>
                            )}
                          </td>

                          <td className="border-b border-l px-2 py-3 text-right sm:px-4 sm:py-4 lg:px-5">
                            <div className="w-[120px] sm:w-[135px] lg:w-[150px] max-w-full">
                              {isEditing ? (
                                <select
                                  value={editDraft.fillStatus}
                                  onChange={(e) =>
                                    setEditDraft((p) => ({
                                      ...p,
                                      fillStatus: e.target.value as FillStatus,
                                    }))
                                  }
                                  className="h-9 sm:h-10 lg:h-11 w-full min-w-0 rounded-lg border bg-background px-2 sm:px-3 text-right text-xs sm:text-sm lg:text-base truncate"
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
                                  className="h-9 sm:h-10 lg:h-11 w-full min-w-0 rounded-lg border bg-background px-2 sm:px-3 text-right text-xs sm:text-sm lg:text-base truncate"
                                >
                                  <option value="ممتلئ">ممتلئ</option>
                                  <option value="غير ممتلئ">غير ممتلئ</option>
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
                                    onClick={() => startEditRow(sh)}
                                  >
                                    <Pencil className="size-4" />
                                  </button>

                                  <button
                                    type="button"
                                    className={`${fixedIconButtonClass} hover:bg-muted`}
                                    title="حذف"
                                    onClick={() => onDeleteOne(sh.id)}
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    className={tableBtnClass}
                                    onClick={() => saveEditRow(sh.id)}
                                    disabled={
                                      !editDraft.nameAr.trim() ||
                                      !editDraft.areaAr.trim() ||
                                      !editDraft.supervisorAr.trim() ||
                                      !/^(056|059)\d{7}$/.test(editDraft.phone.trim()) ||
                                      !Number.isInteger(editDraft.capacity) ||
                                      editDraft.capacity <= 0
                                    }
                                  >
                                    <Save className="ms-1 size-4" />
                                    حفظ
                                  </Button>

                                  <Button
                                    variant="outline"
                                    className={tableBtnClass}
                                    onClick={cancelEditRow}
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
                        <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                          لا توجد مراكز إيواء
                        </td>
                      </tr>
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
              setAddFormError('')
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
                    if (addFormError) setAddFormError('')
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
                    if (addFormError) setAddFormError('')
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
                    if (addFormError) setAddFormError('')
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
                    setPhone(toPhoneDigitsOnly(e.target.value))
                    if (addFormError) setAddFormError('')
                  }}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  placeholder="مثال: 0599123456"
                  className="h-10 text-right sm:h-11"
                />
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
                    if (addFormError) setAddFormError('')
                  }}
                  placeholder="مثال: 1500"
                  className="h-10 text-right sm:h-11"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">الحالة *</div>
                <select
                  value={fillStatus}
                  onChange={(e) => {
                    setFillStatus(e.target.value as FillStatus)
                    if (addFormError) setAddFormError('')
                  }}
                  className={`h-10 rounded-md border bg-background px-3 text-right sm:h-11 ${
                    addFormError ? 'border-red-500' : ''
                  }`}
                >
                  <option value="غير ممتلئ">غير ممتلئ</option>
                  <option value="ممتلئ">ممتلئ</option>
                </select>

                {!!addFormError && (
                  <div className="text-xs text-red-600 sm:text-sm">{addFormError}</div>
                )}
              </div>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => {
                  setAddOpen(false)
                  setAddFormError('')
                }}
                className={`w-full sm:w-auto ${fixedButtonClass}`}
              >
                إغلاق
              </Button>

              <Button
                onClick={onAdd}
                disabled={submitting || !isAddFormValid}
                className={`w-full sm:w-auto ${fixedButtonClass}`}
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