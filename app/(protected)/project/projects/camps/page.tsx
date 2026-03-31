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

type Camp = {
  id: string
  nameAr: string
  nameEn: string
  areaAr: string
  familiesCount: number
  capacity: number
  status: 'نشط' | 'مؤقت' | 'مغلق'
}

type FillStatus = 'Full' | 'Not Full'

type CampApiItem = {
  id: string
  name: string
  area?: string | null
  capacity: number
  status: 'FULL' | 'NOT_FULL'
}

const BASE_URL = '/api/project/projects/camps'

const createCampSchema = z.object({
  nameAr: z.string().trim().min(1, 'اسم المخيم مطلوب'),
  areaAr: z.string().trim().min(1, 'المنطقة مطلوبة'),
  capacity: z.coerce.number().int().positive('يجب أن تكون السعة أكبر من 0'),
  fillStatus: z.enum(['Full', 'Not Full']),
})

const updateCampSchema = z
  .object({
    nameAr: z.string().trim().min(1, 'اسم المخيم مطلوب').optional(),
    areaAr: z.string().trim().min(1, 'المنطقة مطلوبة').optional(),
    capacity: z.coerce.number().int().positive('يجب أن تكون السعة أكبر من 0').optional(),
    fillStatus: z.enum(['Full', 'Not Full']).optional(),
  })
  .strict()

const defaultFillStatus = (families: number, capacity: number): FillStatus =>
  families >= capacity ? 'Full' : 'Not Full'

const toIntOnly = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

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

async function readCamps(): Promise<CampApiItem[]> {
  return requestJSON<CampApiItem[]>(BASE_URL)
}

function findDuplicateCamp(
  camps: CampApiItem[],
  input: { nameAr: string; areaAr: string },
  excludeId?: string
) {
  const normalizedName = normalizeText(input.nameAr)
  const normalizedArea = normalizeText(input.areaAr)

  const duplicate = camps.find(
    (c) =>
      c.id !== excludeId &&
      normalizeText(c.name ?? '') === normalizedName &&
      normalizeText(c.area ?? '') === normalizedArea
  )

  if (duplicate) {
    return 'اسم المخيم والمنطقة مكررين بالفعل.'
  }

  return ''
}

async function assertCampBusinessValidation(
  input: { nameAr: string; areaAr: string; capacity: number; fillStatus: FillStatus },
  excludeId?: string
) {
  const normalizedName = normalizeText(input.nameAr)
  const normalizedArea = normalizeText(input.areaAr)

  if (!normalizedName) {
    throw new Error('اسم المخيم مطلوب')
  }

  if (!normalizedArea) {
    throw new Error('المنطقة مطلوبة')
  }

  if (!Number.isInteger(input.capacity) || input.capacity <= 0) {
    throw new Error('يجب أن تكون السعة أكبر من 0')
  }

  if (!input.fillStatus) {
    throw new Error('الحالة مطلوبة')
  }

  const current = await readCamps()
  const duplicateMessage = findDuplicateCamp(current, input, excludeId)

  if (duplicateMessage) {
    throw new Error(duplicateMessage)
  }
}

async function createCamp(input: unknown): Promise<CampApiItem> {
  const body = createCampSchema.parse(input)

  await assertCampBusinessValidation({
    nameAr: body.nameAr,
    areaAr: body.areaAr,
    capacity: body.capacity,
    fillStatus: body.fillStatus,
  })

  return requestJSON<CampApiItem>(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

async function updateCamp(id: string, input: unknown): Promise<CampApiItem> {
  if (!id) throw new Error('معرّف المخيم مفقود')

  const body = updateCampSchema.parse(input)

  const current = await readCamps()
  const existing = current.find((c) => c.id === id)

  if (!existing) {
    throw new Error('المخيم غير موجود')
  }

  const merged = {
    nameAr: body.nameAr ?? existing.name ?? '',
    areaAr: body.areaAr ?? existing.area ?? '',
    capacity: body.capacity ?? existing.capacity,
    fillStatus: body.fillStatus ?? (existing.status === 'FULL' ? 'Full' : 'Not Full'),
  }

  await assertCampBusinessValidation(merged, id)

  return requestJSON<CampApiItem>(`${BASE_URL}?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

async function deleteCamp(id: string): Promise<void> {
  if (!id) throw new Error('معرّف المخيم مفقود')

  await requestJSON(`${BASE_URL}?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

async function deleteAllCamps(): Promise<void> {
  await requestJSON(`${BASE_URL}?all=true`, {
    method: 'DELETE',
  })
}

const campsApi = {
  list: readCamps,
  create: createCamp,
  update: updateCamp,
  remove: deleteCamp,
  removeAll: deleteAllCamps,
}

export default function CampsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Camp[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [statusFilter, setStatusFilter] = useState<'all' | 'full' | 'notfull'>('all')
  const [statusPick, setStatusPick] = useState<Record<string, FillStatus>>({})

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [addOpen, setAddOpen] = useState(false)
  const [nameAr, setNameAr] = useState('')
  const [areaAr, setAreaAr] = useState('')
  const [capacity, setCapacity] = useState<number>(0)
  const [fillStatus, setFillStatus] = useState<FillStatus>('Not Full')
  const [submitting, setSubmitting] = useState(false)
  const [addFormError, setAddFormError] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    nameAr: string
    areaAr: string
    capacity: number
    fillStatus: FillStatus
  }>({
    nameAr: '',
    areaAr: '',
    capacity: 1,
    fillStatus: 'Not Full',
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
        const data = await campsApi.list()

        setItems(
          data.map((x) => ({
            id: x.id,
            nameAr: x.name,
            nameEn: x.name,
            areaAr: x.area ?? '',
            familiesCount: 0,
            capacity: x.capacity,
            status: 'مؤقت',
          }))
        )

        const pick: Record<string, FillStatus> = {}
        data.forEach((x) => {
          pick[x.id] = x.status === 'FULL' ? 'Full' : 'Not Full'
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

    return items.filter((c) => {
      const matchSearch =
        !s ||
        c.nameEn.toLowerCase().includes(s) ||
        c.nameAr.includes(q) ||
        c.areaAr.includes(q)

      const rowStatus: FillStatus =
        statusPick[c.id] ?? defaultFillStatus(c.familiesCount, c.capacity)

      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'full'
            ? rowStatus === 'Full'
            : rowStatus === 'Not Full'

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
    setCapacity(0)
    setFillStatus('Not Full')
    setAddFormError('')
  }

  const isAddFormValid =
    !!nameAr.trim() &&
    !!areaAr.trim() &&
    Number.isInteger(capacity) &&
    capacity > 0 &&
    !!fillStatus

  const onAdd = async () => {
    const ar = nameAr.trim()
    const area = areaAr.trim()

    if (!ar || !area || !Number.isInteger(capacity) || capacity <= 0 || !fillStatus) {
      setAddFormError('يرجى تعبئة جميع الحقول المطلوبة بشكل صحيح')
      return
    }

    setSubmitting(true)
    setError('')
    setAddFormError('')

    try {
      const created = await campsApi.create({
        nameAr: ar,
        areaAr: area,
        capacity,
        fillStatus,
      })

      setItems((prev) => [
        {
          id: created.id,
          nameAr: created.name,
          nameEn: created.name,
          areaAr: created.area ?? '',
          familiesCount: 0,
          capacity: created.capacity,
          status: 'مؤقت',
        },
        ...prev,
      ])

      setStatusPick((prev) => ({
        ...prev,
        [created.id]: created.status === 'FULL' ? 'Full' : 'Not Full',
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
      await campsApi.remove(id)

      if (editingId === id) setEditingId(null)

      setItems((prev) => prev.filter((x) => x.id !== id))
      setStatusPick((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
    }
  }

  const startEditRow = (c: Camp) => {
    const currentStatus: FillStatus =
      statusPick[c.id] ?? defaultFillStatus(c.familiesCount, c.capacity)

    setEditingId(c.id)
    setEditDraft({
      nameAr: c.nameAr,
      areaAr: c.areaAr,
      capacity: c.capacity,
      fillStatus: currentStatus,
    })
  }

  const cancelEditRow = () => setEditingId(null)

  const saveEditRow = async (id: string) => {
    const ar = editDraft.nameAr.trim()
    const area = editDraft.areaAr.trim()

    if (!ar || !area || !Number.isInteger(editDraft.capacity) || editDraft.capacity <= 0) {
      setError('يرجى تعبئة البيانات بشكل صحيح قبل الحفظ')
      return
    }

    try {
      setError('')

      const updated = await campsApi.update(id, {
        nameAr: ar,
        areaAr: area,
        capacity: editDraft.capacity,
        fillStatus: editDraft.fillStatus,
      })

      setItems((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                nameAr: updated.name,
                nameEn: updated.name,
                areaAr: updated.area ?? '',
                capacity: updated.capacity,
              }
            : c
        )
      )

      setStatusPick((prev) => ({
        ...prev,
        [id]: updated.status === 'FULL' ? 'Full' : 'Not Full',
      }))

      setEditingId(null)
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
    }
  }

  const onDeleteAll = async () => {
    try {
      setError('')
      await campsApi.removeAll()
      setItems([])
      setStatusPick({})
      setEditingId(null)
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
    }
  }

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

  return (
    <div className="w-full px-2 py-3 sm:px-4 sm:py-5 lg:px-6" dir="rtl">
      <div className="mb-4 sm:mb-6 text-right">
        <div className="text-base font-semibold text-foreground sm:text-xl lg:text-2xl">
          المخيمات
        </div>

        <div className="mt-1 text-[11px] text-muted-foreground sm:text-sm">
          الرئيسية <span className="mx-1">{'>'}</span>
          <span className="text-foreground">إدارة المخيمات</span>
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
                      placeholder="ابحث عن مخيم"
                      className={`${inputBaseClass} ${topControlHeight} pr-9 pl-3`}
                    />
                  </div>

                  <div className="min-w-[120px] max-w-[140px] sm:min-w-[150px] sm:max-w-[160px] shrink-0">
                    <select
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(e.target.value as 'all' | 'full' | 'notfull')
                      }
                      className={`${selectBaseClass} ${topControlHeight} truncate`}
                    >
                      <option value="all">كل الحالات</option>
                      <option value="full">ممتلئ</option>
                      <option value="notfull">غير ممتلئ</option>
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
                    إضافة مخيم
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
                        اسم المخيم
                      </th>
                      <th className="w-[18%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        المنطقة
                      </th>
                      <th className="w-[12%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        السعة
                      </th>
                      <th className="w-[20%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        الحالة
                      </th>
                      <th className="w-[26%] border-b px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageItems.map((c) => {
                      const isEditing = editingId === c.id
                      const currentStatus: FillStatus =
                        statusPick[c.id] ?? defaultFillStatus(c.familiesCount, c.capacity)

                      return (
                        <tr key={c.id} className="align-top hover:bg-muted/30">
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
                                {c.nameAr}
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
                                {c.areaAr}
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
                                {c.capacity}
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
                                  <option value="Full">ممتلئ</option>
                                  <option value="Not Full">غير ممتلئ</option>
                                </select>
                              ) : (
                                <select
                                  value={currentStatus}
                                  onChange={(e) =>
                                    setStatusPick((prev) => ({
                                      ...prev,
                                      [c.id]: e.target.value as FillStatus,
                                    }))
                                  }
                                  className="h-9 sm:h-10 lg:h-11 w-full min-w-0 rounded-lg border bg-background px-2 sm:px-3 text-right text-xs sm:text-sm lg:text-base truncate"
                                >
                                  <option value="Full">ممتلئ</option>
                                  <option value="Not Full">غير ممتلئ</option>
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
                                  >
                                    <Pencil className="size-4" />
                                  </button>

                                  <button
                                    type="button"
                                    className={`${fixedIconButtonClass} hover:bg-muted`}
                                    title="حذف"
                                    onClick={() => onDeleteOne(c.id)}
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
                                      !editDraft.nameAr.trim() ||
                                      !editDraft.areaAr.trim() ||
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
                        <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                          لا توجد مخيمات
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
              <DialogTitle>إضافة مخيم</DialogTitle>
              <DialogDescription>إدخال بيانات المخيم</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 text-right">
              <div className="grid gap-2">
                <div className="text-sm">اسم المخيم *</div>
                <Input
                  value={nameAr}
                  onChange={(e) => {
                    setNameAr(e.target.value)
                    if (addFormError) setAddFormError('')
                  }}
                  placeholder="مثال: مخيم الشمال A"
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
                  <option value="Not Full">غير ممتلئ</option>
                  <option value="Full">ممتلئ</option>
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