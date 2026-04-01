'use client'

import { useMemo, useState, type ChangeEvent, useEffect } from 'react'
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

type DistributionStatus = 'مجدول' | 'تم' | 'ملغي'

type Distribution = {
  distributionId: string
  institutionId: string
  clinicId: string
  productId: string
  quantity: number
  status: DistributionStatus
}

type DistributionApiItem = {
  id: string
  institutionId: string
  clinicId?: string | null
  productId?: string | null
  quantity: number
  status: DistributionStatus
}

const BASE_URL = '/api/project/projects/distributions'

const createDistributionSchema = z.object({
  institutionId: z.string().trim().min(1, 'معرّف المؤسسة مطلوب'),
  clinicId: z.string().trim().min(1, 'معرّف العيادة مطلوب'),
  productId: z.string().trim().min(1, 'معرّف المنتج مطلوب'),
  quantity: z.coerce.number().int().positive('يجب أن تكون الكمية أكبر من 0'),
  status: z.enum(['مجدول', 'تم', 'ملغي']),
})

const updateDistributionSchema = z.object({
  institutionId: z.string().trim().min(1, 'معرّف المؤسسة مطلوب').optional(),
  clinicId: z.string().trim().min(1, 'معرّف العيادة مطلوب').optional(),
  productId: z.string().trim().min(1, 'معرّف المنتج مطلوب').optional(),
  quantity: z.coerce.number().int().positive('يجب أن تكون الكمية أكبر من 0').optional(),
  status: z.enum(['مجدول', 'تم', 'ملغي']).optional(),
})

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

async function readDistributions(): Promise<DistributionApiItem[]> {
  return requestJSON<DistributionApiItem[]>(BASE_URL)
}

async function createDistribution(input: unknown): Promise<DistributionApiItem> {
  const body = createDistributionSchema.parse(input)

  return requestJSON<DistributionApiItem>(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

async function updateDistribution(id: string, input: unknown): Promise<DistributionApiItem> {
  if (!id) throw new Error('معرّف التوزيع مفقود')

  const body = updateDistributionSchema.parse(input)

  return requestJSON<DistributionApiItem>(`${BASE_URL}?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

async function deleteDistribution(id: string): Promise<void> {
  if (!id) throw new Error('معرّف التوزيع مفقود')

  await requestJSON(`${BASE_URL}?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

async function deleteAllDistributions(): Promise<void> {
  await requestJSON(`${BASE_URL}?all=true`, {
    method: 'DELETE',
  })
}

const distributionsApi = {
  list: readDistributions,
  create: createDistribution,
  update: updateDistribution,
  remove: deleteDistribution,
  removeAll: deleteAllDistributions,
}

export default function DistributionsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Distribution[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [statusFilter, setStatusFilter] = useState<'all' | DistributionStatus>('all')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [addOpen, setAddOpen] = useState(false)
  const [institutionId, setInstitutionId] = useState('')
  const [clinicId, setClinicId] = useState('')
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState<number>(0)
  const [status, setStatus] = useState<DistributionStatus>('مجدول')
  const [submitting, setSubmitting] = useState(false)
  const [addFormError, setAddFormError] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    institutionId: string
    clinicId: string
    productId: string
    quantity: number
    status: DistributionStatus
  }>({
    institutionId: '',
    clinicId: '',
    productId: '',
    quantity: 0,
    status: 'مجدول',
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
        const data = await distributionsApi.list()

        setItems(
          data.map((x) => ({
            distributionId: x.id,
            institutionId: x.institutionId,
            clinicId: x.clinicId ?? '',
            productId: x.productId ?? '',
            quantity: x.quantity,
            status: x.status,
          }))
        )
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

    return items.filter((x) => {
      const matchSearch =
        !s ||
        x.distributionId.toLowerCase().includes(s) ||
        x.institutionId.toLowerCase().includes(s) ||
        x.clinicId.toLowerCase().includes(s) ||
        x.productId.toLowerCase().includes(s) ||
        String(x.quantity).includes(s) ||
        x.status.toLowerCase().includes(s)

      const matchStatus = statusFilter === 'all' ? true : x.status === statusFilter

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

  const resetAddForm = () => {
    setInstitutionId('')
    setClinicId('')
    setProductId('')
    setQuantity(0)
    setStatus('مجدول')
    setAddFormError('')
  }

  const isAddFormValid =
    !!institutionId.trim() &&
    !!clinicId.trim() &&
    !!productId.trim() &&
    Number.isInteger(quantity) &&
    quantity > 0 &&
    !!status

  const onAdd = async () => {
    if (
      !institutionId.trim() ||
      !clinicId.trim() ||
      !productId.trim() ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      setAddFormError('يرجى تعبئة جميع الحقول المطلوبة بشكل صحيح')
      return
    }

    setSubmitting(true)
    setError('')
    setAddFormError('')

    try {
      const created = await distributionsApi.create({
        institutionId: institutionId.trim(),
        clinicId: clinicId.trim(),
        productId: productId.trim(),
        quantity,
        status,
      })

      setItems((prev) => [
        {
          distributionId: created.id,
          institutionId: created.institutionId,
          clinicId: created.clinicId ?? '',
          productId: created.productId ?? '',
          quantity: created.quantity,
          status: created.status,
        },
        ...prev,
      ])

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
      await distributionsApi.remove(id)

      if (editingId === id) setEditingId(null)

      setItems((prev) => prev.filter((x) => x.distributionId !== id))
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const startEditRow = (row: Distribution) => {
    setEditingId(row.distributionId)
    setEditDraft({
      institutionId: row.institutionId,
      clinicId: row.clinicId,
      productId: row.productId,
      quantity: row.quantity,
      status: row.status,
    })
  }

  const cancelEditRow = () => setEditingId(null)

  const saveEditRow = async (id: string) => {
    if (
      !editDraft.institutionId.trim() ||
      !editDraft.clinicId.trim() ||
      !editDraft.productId.trim() ||
      !Number.isInteger(editDraft.quantity) ||
      editDraft.quantity <= 0
    ) {
      setError('يرجى تعبئة البيانات بشكل صحيح قبل الحفظ')
      return
    }

    try {
      setError('')

      const updated = await distributionsApi.update(id, {
        institutionId: editDraft.institutionId.trim(),
        clinicId: editDraft.clinicId.trim(),
        productId: editDraft.productId.trim(),
        quantity: editDraft.quantity,
        status: editDraft.status,
      })

      setItems((prev) =>
        prev.map((x) =>
          x.distributionId === id
            ? {
                distributionId: updated.id,
                institutionId: updated.institutionId,
                clinicId: updated.clinicId ?? '',
                productId: updated.productId ?? '',
                quantity: updated.quantity,
                status: updated.status,
              }
            : x
        )
      )

      setEditingId(null)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const onDeleteAll = async () => {
    try {
      setError('')
      await distributionsApi.removeAll()
      setItems([])
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
          التوزيعات
        </div>

        <div className="mt-1 text-[11px] text-muted-foreground sm:text-sm">
          الرئيسية <span className="mx-1">{'>'}</span>
          <span className="text-foreground">إدارة التوزيعات</span>
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
                      placeholder="ابحث في التوزيعات"
                      className={`${inputBaseClass} ${topControlHeight} pr-9 pl-3`}
                    />
                  </div>

                  <div className="min-w-[120px] max-w-[140px] sm:min-w-[150px] sm:max-w-[160px] shrink-0">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as 'all' | DistributionStatus)}
                      className={`${selectBaseClass} ${topControlHeight} truncate`}
                    >
                      <option value="all">كل الحالات</option>
                      <option value="مجدول">مجدول</option>
                      <option value="تم">تم</option>
                      <option value="ملغي">ملغي</option>
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
                    إضافة توزيع
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
                        معرّف التوزيع
                      </th>
                      <th className="w-[20%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        معرّف المؤسسة
                      </th>
                      <th className="w-[18%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        معرّف العيادة
                      </th>
                      <th className="w-[18%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        معرّف المنتج
                      </th>
                      <th className="w-[10%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        الكمية
                      </th>
                      <th className="w-[10%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        الحالة
                      </th>
                      <th className="w-[20%] border-b px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageItems.map((row) => {
                      const isEditing = editingId === row.distributionId

                      return (
                        <tr key={row.distributionId} className="align-top hover:bg-muted/30">
                          <td className="border-b border-l px-2 py-3 text-right font-medium break-words sm:px-4 sm:py-4 lg:px-5">
                            <span className="block break-words text-xs sm:text-sm lg:text-base font-medium leading-6 sm:leading-7">
                              {row.distributionId}
                            </span>
                          </td>

                          <td className="border-b border-l px-2 py-3 text-right break-words sm:px-4 sm:py-4 lg:px-5">
                            {isEditing ? (
                              <Input
                                value={editDraft.institutionId}
                                onChange={(e) =>
                                  setEditDraft((p) => ({ ...p, institutionId: e.target.value }))
                                }
                                className="h-9 sm:h-10 lg:h-11 rounded-lg text-right text-xs sm:text-sm lg:text-base font-medium"
                              />
                            ) : (
                              <span className="block break-words text-xs sm:text-sm lg:text-base font-medium leading-6 sm:leading-7">
                                {row.institutionId}
                              </span>
                            )}
                          </td>

                          <td className="border-b border-l px-2 py-3 text-right break-words sm:px-4 sm:py-4 lg:px-5">
                            {isEditing ? (
                              <Input
                                value={editDraft.clinicId}
                                onChange={(e) =>
                                  setEditDraft((p) => ({ ...p, clinicId: e.target.value }))
                                }
                                className="h-9 sm:h-10 lg:h-11 rounded-lg text-right text-xs sm:text-sm lg:text-base font-medium"
                              />
                            ) : (
                              <span className="block break-words text-xs sm:text-sm lg:text-base font-medium leading-6 sm:leading-7">
                                {row.clinicId}
                              </span>
                            )}
                          </td>

                          <td className="border-b border-l px-2 py-3 text-right break-words sm:px-4 sm:py-4 lg:px-5">
                            {isEditing ? (
                              <Input
                                value={editDraft.productId}
                                onChange={(e) =>
                                  setEditDraft((p) => ({ ...p, productId: e.target.value }))
                                }
                                className="h-9 sm:h-10 lg:h-11 rounded-lg text-right text-xs sm:text-sm lg:text-base font-medium"
                              />
                            ) : (
                              <span className="block break-words text-xs sm:text-sm lg:text-base font-medium leading-6 sm:leading-7">
                                {row.productId}
                              </span>
                            )}
                          </td>

                          <td className="border-b border-l px-2 py-3 text-right sm:px-4 sm:py-4 lg:px-5">
                            {isEditing ? (
                              <Input
                                inputMode="numeric"
                                pattern="[0-9]*"
                                type="text"
                                value={editDraft.quantity ? String(editDraft.quantity) : ''}
                                onChange={(e) =>
                                  setEditDraft((p) => ({
                                    ...p,
                                    quantity: Number(e.target.value.replace(/\D/g, '')) || 0,
                                  }))
                                }
                                className="h-9 sm:h-10 lg:h-11 rounded-lg text-right text-xs sm:text-sm lg:text-base font-medium"
                              />
                            ) : (
                              <span className="block break-words text-xs sm:text-sm lg:text-base font-medium leading-6 sm:leading-7">
                                {row.quantity}
                              </span>
                            )}
                          </td>

                          <td className="border-b border-l px-2 py-3 text-right sm:px-4 sm:py-4 lg:px-5">
                            {isEditing ? (
                              <select
                                value={editDraft.status}
                                onChange={(e) =>
                                  setEditDraft((p) => ({
                                    ...p,
                                    status: e.target.value as DistributionStatus,
                                  }))
                                }
                                className="h-9 sm:h-10 lg:h-11 w-full min-w-0 rounded-lg border bg-background px-2 sm:px-3 text-right text-xs sm:text-sm lg:text-base truncate"
                              >
                                <option value="مجدول">مجدول</option>
                                <option value="تم">تم</option>
                                <option value="ملغي">ملغي</option>
                              </select>
                            ) : (
                              <span className="inline-flex items-center rounded-md border px-2 py-1 text-xs">
                                {row.status}
                              </span>
                            )}
                          </td>

                          <td className="border-b px-2 py-3 sm:px-4 sm:py-4 lg:px-5">
                            <div className="flex flex-nowrap items-center justify-start gap-2 overflow-x-auto">
                              {!isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    className={`${fixedIconButtonClass} hover:bg-muted`}
                                    title="تعديل"
                                    onClick={() => startEditRow(row)}
                                  >
                                    <Pencil className="size-4" />
                                  </button>

                                  <button
                                    type="button"
                                    className={`${fixedIconButtonClass} hover:bg-muted`}
                                    title="حذف"
                                    onClick={() => onDeleteOne(row.distributionId)}
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    className={tableBtnClass}
                                    onClick={() => saveEditRow(row.distributionId)}
                                    disabled={
                                      !editDraft.institutionId.trim() ||
                                      !editDraft.clinicId.trim() ||
                                      !editDraft.productId.trim() ||
                                      !Number.isInteger(editDraft.quantity) ||
                                      editDraft.quantity <= 0
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
                          لا توجد توزيعات
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
            if (!open) setAddFormError('')
          }}
        >
          <DialogContent
            className="w-[95vw] max-w-[95vw] rounded-xl sm:max-w-[560px]"
            dir="rtl"
          >
            <DialogHeader className="text-right">
              <DialogTitle>إضافة توزيع</DialogTitle>
              <DialogDescription>إدخال بيانات التوزيع</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 text-right">
              <div className="grid gap-2">
                <div className="text-sm">معرّف المؤسسة *</div>
                <Input
                  value={institutionId}
                  onChange={(e) => {
                    setInstitutionId(e.target.value)
                    if (addFormError) setAddFormError('')
                  }}
                  placeholder="أدخل UUID المؤسسة"
                  className="h-10 text-right sm:h-11"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">معرّف العيادة *</div>
                <Input
                  value={clinicId}
                  onChange={(e) => {
                    setClinicId(e.target.value)
                    if (addFormError) setAddFormError('')
                  }}
                  placeholder="أدخل UUID العيادة"
                  className="h-10 text-right sm:h-11"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">معرّف المنتج *</div>
                <Input
                  value={productId}
                  onChange={(e) => {
                    setProductId(e.target.value)
                    if (addFormError) setAddFormError('')
                  }}
                  placeholder="أدخل UUID المنتج"
                  className="h-10 text-right sm:h-11"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">الكمية *</div>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="text"
                  value={quantity ? String(quantity) : ''}
                  onChange={(e) => {
                    setQuantity(Number(e.target.value.replace(/\D/g, '')) || 0)
                    if (addFormError) setAddFormError('')
                  }}
                  placeholder="مثال: 150"
                  className="h-10 text-right sm:h-11"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">الحالة *</div>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as DistributionStatus)
                    if (addFormError) setAddFormError('')
                  }}
                  className={`h-10 rounded-md border bg-background px-3 text-right sm:h-11 ${
                    addFormError ? 'border-red-500' : ''
                  }`}
                >
                  <option value="مجدول">مجدول</option>
                  <option value="تم">تم</option>
                  <option value="ملغي">ملغي</option>
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