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
  areaAr: z.string().trim().optional().default(''),
  capacity: z.coerce.number().int().positive('يجب أن تكون السعة أكبر من 0'),
  fillStatus: z.enum(['Full', 'Not Full']),
})

const updateCampSchema = z
  .object({
    nameAr: z.string().trim().min(1).optional(),
    areaAr: z.string().trim().optional(),
    capacity: z.coerce.number().int().positive().optional(),
    fillStatus: z.enum(['Full', 'Not Full']).optional(),
  })
  .strict()

const defaultFillStatus = (families: number, capacity: number): FillStatus =>
  families >= capacity ? 'Full' : 'Not Full'

const toIntOnly = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
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

async function assertNoDuplicateCampName(nameAr: string, excludeId?: string) {
  const current = await readCamps()

  const exists = current.some(
    (c) =>
      c.id !== excludeId &&
      (c.name ?? '').trim().toLowerCase() === nameAr.trim().toLowerCase()
  )

  if (exists) {
    throw new Error('المخيم موجود بالفعل (اسم مكرر).')
  }
}

async function createCamp(input: unknown): Promise<CampApiItem> {
  const body = createCampSchema.parse(input)
  await assertNoDuplicateCampName(body.nameAr)

  return requestJSON<CampApiItem>(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

async function updateCamp(id: string, input: unknown): Promise<CampApiItem> {
  if (!id) throw new Error('معرّف المخيم مفقود')

  const body = updateCampSchema.parse(input)

  if (body.nameAr) {
    await assertNoDuplicateCampName(body.nameAr, id)
  }

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
        setError(err instanceof Error ? err.message : 'فشل في تحميل المخيمات')
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
  }

  const onAdd = async () => {
    const ar = nameAr.trim()
    const area = areaAr.trim()

    if (!ar || !Number.isInteger(capacity) || capacity <= 0) return

    setSubmitting(true)
    setError('')

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
      const message = err instanceof Error ? err.message : 'فشل في إضافة المخيم'
      setError(message)
      alert(message)
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
      const message = err instanceof Error ? err.message : 'فشل في حذف المخيم'
      setError(message)
      alert(message)
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

    if (!ar || !Number.isInteger(editDraft.capacity) || editDraft.capacity <= 0) return

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
      const message = err instanceof Error ? err.message : 'فشل في تعديل المخيم'
      setError(message)
      alert(message)
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
      const message = err instanceof Error ? err.message : 'فشل في حذف جميع المخيمات'
      setError(message)
      alert(message)
    }
  }

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

  return (
    <div className="w-full px-2 py-4 sm:px-4 sm:py-6 lg:px-6" dir="rtl">
      <div className="mb-6" dir="ltr">
        <div className="text-left">
          <div className="text-xl font-semibold text-foreground sm:text-2xl">المخيمات</div>

          <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
            الرئيسية <span className="mx-1">{'>'}</span>{' '}
            <span className="text-foreground">إدارة المخيمات</span>
          </div>

          {loading && (
            <div className="mt-2 text-xs text-muted-foreground sm:text-sm">جارٍ التحميل...</div>
          )}

          {!!error && <div className="mt-2 text-xs text-red-600 sm:text-sm">{error}</div>}
        </div>
      </div>

      <div className="w-full max-w-[1200px]">
        <Card>
          <CardContent className="p-0" dir="ltr">
            <div className="p-3 sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative w-full min-w-0 sm:w-[260px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={q}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
                      placeholder="ابحث عن مخيم"
                      className="!h-10 !w-full !rounded-lg border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:!ring-2 focus:!ring-slate-200"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'full' | 'notfull')}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200 sm:w-[160px]"
                  >
                    <option value="all">كل الحالات</option>
                    <option value="full">ممتلئ</option>
                    <option value="notfull">غير ممتلئ</option>
                  </select>
                </div>

                <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <Button
                    className="inline-flex w-full items-center justify-center gap-2 !rounded-lg !bg-blue-600 !px-4 !text-sm !font-semibold !text-white hover:!bg-blue-700 sm:w-auto !h-10"
                    onClick={() => setAddOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    إضافة مخيم
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full rounded-lg border-slate-200 !px-4 !text-sm !font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto !h-10"
                    onClick={onDeleteAll}
                  >
                    حذف الكل
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t" />

            <div className="overflow-hidden rounded-b-lg">
              <div className="w-full">
                <table className="w-full table-fixed border-collapse text-[11px] sm:text-sm">
                  <thead
                    style={{
                      backgroundColor: '#F9FAFB',
                      boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
                    }}
                  >
                    <tr className="text-left text-foreground/60">
                      <th className="w-[24%] border-b border-r px-1 py-2 font-normal sm:px-4 sm:py-3">
                        اسم المخيم
                      </th>
                      <th className="w-[20%] border-b border-r px-1 py-2 font-normal sm:px-4 sm:py-3">
                        المنطقة
                      </th>
                      <th className="w-[14%] border-b border-r px-1 py-2 font-normal sm:px-4 sm:py-3">
                        السعة
                      </th>
                      <th className="w-[20%] border-b border-r px-1 py-2 font-normal sm:px-4 sm:py-3">
                        الحالة
                      </th>
                      <th className="w-[22%] border-b px-1 py-2 font-normal sm:px-4 sm:py-3">
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
                        <tr key={c.id} className="hover:bg-muted/30 align-top">
                          <td className="border-b border-r px-1 py-2 font-medium break-words sm:px-4 sm:py-3">
                            {isEditing ? (
                              <Input
                                value={editDraft.nameAr}
                                onChange={(e) =>
                                  setEditDraft((p) => ({ ...p, nameAr: e.target.value }))
                                }
                                className="h-8 text-[11px] sm:h-9 sm:text-sm"
                              />
                            ) : (
                              <span className="block break-words leading-4">{c.nameAr}</span>
                            )}
                          </td>

                          <td className="border-b border-r px-1 py-2 break-words sm:px-4 sm:py-3">
                            {isEditing ? (
                              <Input
                                value={editDraft.areaAr}
                                onChange={(e) =>
                                  setEditDraft((p) => ({ ...p, areaAr: e.target.value }))
                                }
                                className="h-8 text-[11px] sm:h-9 sm:text-sm"
                              />
                            ) : (
                              <span className="block break-words leading-4">{c.areaAr}</span>
                            )}
                          </td>

                          <td className="border-b border-r px-1 py-2 sm:px-4 sm:py-3">
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
                                className="h-8 text-[11px] sm:h-9 sm:text-sm"
                              />
                            ) : (
                              <span className="block break-words leading-4">{c.capacity}</span>
                            )}
                          </td>

                          <td className="border-b border-r px-1 py-2 sm:px-4 sm:py-3">
                            {isEditing ? (
                              <select
                                value={editDraft.fillStatus}
                                onChange={(e) =>
                                  setEditDraft((p) => ({
                                    ...p,
                                    fillStatus: e.target.value as FillStatus,
                                  }))
                                }
                                className="h-8 w-full rounded-md border bg-background px-1 text-[10px] sm:h-9 sm:px-3 sm:text-sm"
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
                                className="h-8 w-full rounded-md border bg-background px-1 text-[10px] sm:h-9 sm:px-3 sm:text-sm"
                              >
                                <option value="Full">ممتلئ</option>
                                <option value="Not Full">غير ممتلئ</option>
                              </select>
                            )}
                          </td>

                          <td className="border-b px-1 py-2 sm:px-4 sm:py-3">
                            <div className="flex flex-wrap items-center justify-center gap-1 sm:justify-start sm:gap-2">
                              {!isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-muted sm:h-10 sm:w-10"
                                    title="تعديل"
                                    onClick={() => startEditRow(c)}
                                  >
                                    <Pencil className="size-3 sm:size-4" />
                                  </button>

                                  <button
                                    type="button"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-muted sm:h-10 sm:w-10"
                                    title="حذف"
                                    onClick={() => onDeleteOne(c.id)}
                                  >
                                    <Trash2 className="size-3 sm:size-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    className="h-8 px-2 text-[10px] sm:h-10 sm:px-3 sm:text-sm"
                                    onClick={() => saveEditRow(c.id)}
                                    disabled={
                                      !Number.isInteger(editDraft.capacity) ||
                                      editDraft.capacity <= 0
                                    }
                                  >
                                    <Save className="me-1 size-3 sm:me-2 sm:size-4" />
                                    حفظ
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2 text-[10px] sm:h-10 sm:px-3 sm:text-sm"
                                    onClick={cancelEditRow}
                                  >
                                    <X className="me-1 size-3 sm:me-2 sm:size-4" />
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
            </div>
          </CardContent>
        </Card>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[560px]">
            <DialogHeader dir="rtl" className="text-right">
              <DialogTitle>إضافة مخيم</DialogTitle>
              <DialogDescription>إدخال بيانات المخيم</DialogDescription>
            </DialogHeader>

            <div dir="rtl" className="grid gap-3">
              <div className="grid gap-2">
                <div className="text-sm">اسم المخيم</div>
                <Input
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="مثال: مخيم الشمال A"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">المنطقة</div>
                <Input
                  value={areaAr}
                  onChange={(e) => setAreaAr(e.target.value)}
                  placeholder="مثال: شمال غزة"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">السعة</div>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="text"
                  value={capacity ? String(capacity) : ''}
                  onChange={(e) => setCapacity(toIntOnly(e.target.value))}
                  placeholder="مثال: 1500"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">الحالة</div>
                <select
                  value={fillStatus}
                  onChange={(e) => setFillStatus(e.target.value as FillStatus)}
                  className="h-10 rounded-md border px-3 bg-background"
                >
                  <option value="Not Full">غير ممتلئ</option>
                  <option value="Full">ممتلئ</option>
                </select>
              </div>
            </div>

            <DialogFooter dir="rtl" className="flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => setAddOpen(false)}
                className="w-full sm:w-auto"
              >
                إغلاق
              </Button>

              <Button
                onClick={onAdd}
                disabled={submitting || !nameAr.trim() || !Number.isInteger(capacity) || capacity <= 0}
                className="w-full sm:w-auto"
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