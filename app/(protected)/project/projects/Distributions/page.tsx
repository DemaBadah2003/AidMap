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

type DistributionStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED'

type Distribution = {
  distributionId: string
  beneficiaryId: string
  institutionId: string
  productId: string
  quantity: number
  status: DistributionStatus
  aidId: string
  clinicId: string
  placeId: string
}

type DistributionApiItem = {
  id: string
  beneficiaryId?: string | null
  institutionId: string
  productId?: string | null
  quantity: number
  status: DistributionStatus
  aidId?: string | null
  clinicId?: string | null
  placeId?: string | null
}

const BASE_URL = '/api/project/projects/distributions'

const statusLabels: Record<DistributionStatus, string> = {
  PENDING: 'مجدول',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغي',
}

const createDistributionSchema = z.object({
  beneficiaryId: z.string().trim().optional().or(z.literal('')),
  institutionId: z.string().trim().min(1, 'معرّف المؤسسة مطلوب'),
  productId: z.string().trim().optional().or(z.literal('')),
  quantity: z.coerce.number().int().min(0, 'الكمية يجب أن تكون 0 أو أكثر'),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']),
  aidId: z.string().trim().optional().or(z.literal('')),
  clinicId: z.string().trim().optional().or(z.literal('')),
  placeId: z.string().trim().optional().or(z.literal('')),
})

const updateDistributionSchema = z.object({
  beneficiaryId: z.string().trim().optional().or(z.literal('')),
  institutionId: z.string().trim().min(1, 'معرّف المؤسسة مطلوب').optional(),
  productId: z.string().trim().optional().or(z.literal('')),
  quantity: z.coerce.number().int().min(0, 'الكمية يجب أن تكون 0 أو أكثر').optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).optional(),
  aidId: z.string().trim().optional().or(z.literal('')),
  clinicId: z.string().trim().optional().or(z.literal('')),
  placeId: z.string().trim().optional().or(z.literal('')),
})

const toIntOnly = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

function getErrorMessage(err: unknown) {
  if (err instanceof z.ZodError) {
    return err.issues[0]?.message ?? 'البيانات المدخلة غير صحيحة'
  }

  return err instanceof Error ? err.message : 'حدث خطأ غير متوقع'
}

function normalizeOptional(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
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

async function assertDistributionBusinessValidation(input: {
  institutionId: string
  quantity: number
  status: DistributionStatus
}) {
  if (!input.institutionId.trim()) {
    throw new Error('معرّف المؤسسة مطلوب')
  }

  if (!Number.isInteger(input.quantity) || input.quantity < 0) {
    throw new Error('الكمية يجب أن تكون 0 أو أكثر')
  }

  if (!input.status) {
    throw new Error('الحالة مطلوبة')
  }
}

async function createDistribution(input: unknown): Promise<DistributionApiItem> {
  const body = createDistributionSchema.parse(input)

  await assertDistributionBusinessValidation({
    institutionId: body.institutionId,
    quantity: body.quantity,
    status: body.status,
  })

  const payload = {
    beneficiaryId: normalizeOptional(body.beneficiaryId ?? ''),
    institutionId: body.institutionId.trim(),
    productId: normalizeOptional(body.productId ?? ''),
    quantity: body.quantity,
    status: body.status,
    aidId: normalizeOptional(body.aidId ?? ''),
    clinicId: normalizeOptional(body.clinicId ?? ''),
    placeId: normalizeOptional(body.placeId ?? ''),
  }

  return requestJSON<DistributionApiItem>(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

async function updateDistribution(id: string, input: unknown): Promise<DistributionApiItem> {
  if (!id) throw new Error('معرّف التوزيع مفقود')

  const body = updateDistributionSchema.parse(input)

  const current = await readDistributions()
  const existing = current.find((x) => x.id === id)

  if (!existing) {
    throw new Error('التوزيع غير موجود')
  }

  const merged = {
    institutionId: body.institutionId ?? existing.institutionId,
    quantity: body.quantity ?? existing.quantity,
    status: body.status ?? existing.status,
  }

  await assertDistributionBusinessValidation(merged)

  const payload = {
    beneficiaryId:
      body.beneficiaryId !== undefined
        ? normalizeOptional(body.beneficiaryId)
        : existing.beneficiaryId ?? null,
    institutionId: body.institutionId ?? existing.institutionId,
    productId:
      body.productId !== undefined ? normalizeOptional(body.productId) : existing.productId ?? null,
    quantity: body.quantity ?? existing.quantity,
    status: body.status ?? existing.status,
    aidId: body.aidId !== undefined ? normalizeOptional(body.aidId) : existing.aidId ?? null,
    clinicId:
      body.clinicId !== undefined ? normalizeOptional(body.clinicId) : existing.clinicId ?? null,
    placeId:
      body.placeId !== undefined ? normalizeOptional(body.placeId) : existing.placeId ?? null,
  }

  return requestJSON<DistributionApiItem>(`${BASE_URL}?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
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
  const [beneficiaryId, setBeneficiaryId] = useState('')
  const [institutionId, setInstitutionId] = useState('')
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState<number>(0)
  const [status, setStatus] = useState<DistributionStatus>('PENDING')
  const [aidId, setAidId] = useState('')
  const [clinicId, setClinicId] = useState('')
  const [placeId, setPlaceId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [addFormError, setAddFormError] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    beneficiaryId: string
    institutionId: string
    productId: string
    quantity: number
    status: DistributionStatus
    aidId: string
    clinicId: string
    placeId: string
  }>({
    beneficiaryId: '',
    institutionId: '',
    productId: '',
    quantity: 0,
    status: 'PENDING',
    aidId: '',
    clinicId: '',
    placeId: '',
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
            beneficiaryId: x.beneficiaryId ?? '',
            institutionId: x.institutionId,
            productId: x.productId ?? '',
            quantity: x.quantity,
            status: x.status,
            aidId: x.aidId ?? '',
            clinicId: x.clinicId ?? '',
            placeId: x.placeId ?? '',
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
        x.beneficiaryId.toLowerCase().includes(s) ||
        x.institutionId.toLowerCase().includes(s) ||
        x.clinicId.toLowerCase().includes(s) ||
        x.productId.toLowerCase().includes(s) ||
        x.aidId.toLowerCase().includes(s) ||
        x.placeId.toLowerCase().includes(s) ||
        String(x.quantity).includes(s) ||
        statusLabels[x.status].toLowerCase().includes(s) ||
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
    setBeneficiaryId('')
    setInstitutionId('')
    setProductId('')
    setQuantity(0)
    setStatus('PENDING')
    setAidId('')
    setClinicId('')
    setPlaceId('')
    setAddFormError('')
  }

  const isAddFormValid =
    !!institutionId.trim() && Number.isInteger(quantity) && quantity >= 0 && !!status

  const onAdd = async () => {
    const institution = institutionId.trim()

    if (!institution || !Number.isInteger(quantity) || quantity < 0 || !status) {
      setAddFormError('يرجى تعبئة الحقول المطلوبة بشكل صحيح')
      return
    }

    setSubmitting(true)
    setError('')
    setAddFormError('')

    try {
      const created = await distributionsApi.create({
        beneficiaryId,
        institutionId: institution,
        productId,
        quantity,
        status,
        aidId,
        clinicId,
        placeId,
      })

      setItems((prev) => [
        {
          distributionId: created.id,
          beneficiaryId: created.beneficiaryId ?? '',
          institutionId: created.institutionId,
          productId: created.productId ?? '',
          quantity: created.quantity,
          status: created.status,
          aidId: created.aidId ?? '',
          clinicId: created.clinicId ?? '',
          placeId: created.placeId ?? '',
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
      beneficiaryId: row.beneficiaryId,
      institutionId: row.institutionId,
      productId: row.productId,
      quantity: row.quantity,
      status: row.status,
      aidId: row.aidId,
      clinicId: row.clinicId,
      placeId: row.placeId,
    })
    setError('')
  }

  const cancelEditRow = () => {
    setEditingId(null)
    setError('')
  }

  const saveEditRow = async (id: string) => {
    const institution = editDraft.institutionId.trim()

    if (!institution || !Number.isInteger(editDraft.quantity) || editDraft.quantity < 0) {
      setError('يرجى تعبئة البيانات بشكل صحيح قبل الحفظ')
      return
    }

    try {
      setError('')

      const updated = await distributionsApi.update(id, {
        beneficiaryId: editDraft.beneficiaryId,
        institutionId: institution,
        productId: editDraft.productId,
        quantity: editDraft.quantity,
        status: editDraft.status,
        aidId: editDraft.aidId,
        clinicId: editDraft.clinicId,
        placeId: editDraft.placeId,
      })

      setItems((prev) =>
        prev.map((x) =>
          x.distributionId === id
            ? {
                distributionId: updated.id,
                beneficiaryId: updated.beneficiaryId ?? '',
                institutionId: updated.institutionId,
                productId: updated.productId ?? '',
                quantity: updated.quantity,
                status: updated.status,
                aidId: updated.aidId ?? '',
                clinicId: updated.clinicId ?? '',
                placeId: updated.placeId ?? '',
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

                  <div className="min-w-[120px] max-w-[160px] shrink-0">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as 'all' | DistributionStatus)}
                      className={`${selectBaseClass} ${topControlHeight} truncate`}
                    >
                      <option value="all">كل الحالات</option>
                      <option value="PENDING">مجدول</option>
                      <option value="COMPLETED">مكتمل</option>
                      <option value="CANCELLED">ملغي</option>
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
                  className="w-full min-w-[1300px] table-fixed border-collapse text-xs sm:text-sm lg:text-base"
                  dir="rtl"
                >
                  <thead
                    style={{
                      backgroundColor: '#F9FAFB',
                      boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
                    }}
                  >
                    <tr className="text-right text-foreground/60">
                      <th className="border-b border-l px-3 py-3">معرّف التوزيع</th>
                      <th className="border-b border-l px-3 py-3">المستفيد</th>
                      <th className="border-b border-l px-3 py-3">المؤسسة</th>
                      <th className="border-b border-l px-3 py-3">العيادة</th>
                      <th className="border-b border-l px-3 py-3">المنتج</th>
                      <th className="border-b border-l px-3 py-3">المساعدة</th>
                      <th className="border-b border-l px-3 py-3">المكان</th>
                      <th className="border-b border-l px-3 py-3">الكمية</th>
                      <th className="border-b border-l px-3 py-3">الحالة</th>
                      <th className="border-b px-3 py-3">الإجراءات</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageItems.map((row) => {
                      const isEditing = editingId === row.distributionId

                      return (
                        <tr key={row.distributionId} className="align-top hover:bg-muted/30">
                          <td className="border-b border-l px-3 py-3 break-words">
                            {row.distributionId}
                          </td>

                          <td className="border-b border-l px-3 py-3">
                            {isEditing ? (
                              <Input
                                value={editDraft.beneficiaryId}
                                onChange={(e) =>
                                  setEditDraft((p) => ({ ...p, beneficiaryId: e.target.value }))
                                }
                                className="h-9 rounded-lg text-right"
                              />
                            ) : (
                              row.beneficiaryId || '-'
                            )}
                          </td>

                          <td className="border-b border-l px-3 py-3">
                            {isEditing ? (
                              <Input
                                value={editDraft.institutionId}
                                onChange={(e) =>
                                  setEditDraft((p) => ({ ...p, institutionId: e.target.value }))
                                }
                                className="h-9 rounded-lg text-right"
                              />
                            ) : (
                              row.institutionId
                            )}
                          </td>

                          <td className="border-b border-l px-3 py-3">
                            {isEditing ? (
                              <Input
                                value={editDraft.clinicId}
                                onChange={(e) =>
                                  setEditDraft((p) => ({ ...p, clinicId: e.target.value }))
                                }
                                className="h-9 rounded-lg text-right"
                              />
                            ) : (
                              row.clinicId || '-'
                            )}
                          </td>

                          <td className="border-b border-l px-3 py-3">
                            {isEditing ? (
                              <Input
                                value={editDraft.productId}
                                onChange={(e) =>
                                  setEditDraft((p) => ({ ...p, productId: e.target.value }))
                                }
                                className="h-9 rounded-lg text-right"
                              />
                            ) : (
                              row.productId || '-'
                            )}
                          </td>

                          <td className="border-b border-l px-3 py-3">
                            {isEditing ? (
                              <Input
                                value={editDraft.aidId}
                                onChange={(e) =>
                                  setEditDraft((p) => ({ ...p, aidId: e.target.value }))
                                }
                                className="h-9 rounded-lg text-right"
                              />
                            ) : (
                              row.aidId || '-'
                            )}
                          </td>

                          <td className="border-b border-l px-3 py-3">
                            {isEditing ? (
                              <Input
                                value={editDraft.placeId}
                                onChange={(e) =>
                                  setEditDraft((p) => ({ ...p, placeId: e.target.value }))
                                }
                                className="h-9 rounded-lg text-right"
                              />
                            ) : (
                              row.placeId || '-'
                            )}
                          </td>

                          <td className="border-b border-l px-3 py-3">
                            {isEditing ? (
                              <Input
                                inputMode="numeric"
                                pattern="[0-9]*"
                                type="text"
                                value={String(editDraft.quantity)}
                                onChange={(e) =>
                                  setEditDraft((p) => ({
                                    ...p,
                                    quantity: toIntOnly(e.target.value),
                                  }))
                                }
                                className="h-9 rounded-lg text-right"
                              />
                            ) : (
                              row.quantity
                            )}
                          </td>

                          <td className="border-b border-l px-3 py-3">
                            {isEditing ? (
                              <select
                                value={editDraft.status}
                                onChange={(e) =>
                                  setEditDraft((p) => ({
                                    ...p,
                                    status: e.target.value as DistributionStatus,
                                  }))
                                }
                                className="h-9 w-full rounded-lg border bg-background px-3 text-right"
                              >
                                <option value="PENDING">مجدول</option>
                                <option value="COMPLETED">مكتمل</option>
                                <option value="CANCELLED">ملغي</option>
                              </select>
                            ) : (
                              <span className="inline-flex items-center rounded-md border px-2 py-1 text-xs">
                                {statusLabels[row.status]}
                              </span>
                            )}
                          </td>

                          <td className="border-b px-3 py-3">
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
                                      !Number.isInteger(editDraft.quantity) ||
                                      editDraft.quantity < 0
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
                        <td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">
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
                <div className="text-sm">معرّف المستفيد</div>
                <Input
                  value={beneficiaryId}
                  onChange={(e) => setBeneficiaryId(e.target.value)}
                  placeholder="اختياري"
                  className="h-10 text-right sm:h-11"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">معرّف المؤسسة *</div>
                <Input
                  value={institutionId}
                  onChange={(e) => setInstitutionId(e.target.value)}
                  placeholder="أدخل UUID المؤسسة"
                  className="h-10 text-right sm:h-11"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">معرّف العيادة</div>
                <Input
                  value={clinicId}
                  onChange={(e) => setClinicId(e.target.value)}
                  placeholder="اختياري"
                  className="h-10 text-right sm:h-11"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">معرّف المنتج</div>
                <Input
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  placeholder="اختياري"
                  className="h-10 text-right sm:h-11"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">معرّف المساعدة</div>
                <Input
                  value={aidId}
                  onChange={(e) => setAidId(e.target.value)}
                  placeholder="اختياري"
                  className="h-10 text-right sm:h-11"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">معرّف المكان</div>
                <Input
                  value={placeId}
                  onChange={(e) => setPlaceId(e.target.value)}
                  placeholder="اختياري"
                  className="h-10 text-right sm:h-11"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">الكمية *</div>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="text"
                  value={quantity ? String(quantity) : '0'}
                  onChange={(e) => setQuantity(toIntOnly(e.target.value))}
                  placeholder="مثال: 150"
                  className="h-10 text-right sm:h-11"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">الحالة *</div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DistributionStatus)}
                  className="h-10 rounded-md border bg-background px-3 text-right sm:h-11"
                >
                  <option value="PENDING">مجدول</option>
                  <option value="COMPLETED">مكتمل</option>
                  <option value="CANCELLED">ملغي</option>
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