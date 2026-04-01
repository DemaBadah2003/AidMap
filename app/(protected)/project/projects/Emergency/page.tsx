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

type EmergencyStatus = 'جديدة' | 'قيد المعالجة' | 'مغلقة'
type EmergencyLevel = 'منخفض' | 'متوسط' | 'مرتفع'

type Emergency = {
  emergencyId: string
  campId: string
  emergencyType: string
  emergencyDescription: string
  emergencyStatus: EmergencyStatus
  emergencyLevel: EmergencyLevel
  supervisorId: string
  supervisorName: string
}

type EmergencyApiItem = {
  id: string
  campId: string
  emergencyType: string
  emergencyDescription: string
  emergencyStatus: EmergencyStatus
  emergencyLevel: EmergencyLevel
  supervisorId: string
  supervisorName?: string
  supervisor?: string
}

const BASE_URL = '/api/project/projects/Emergency'

const createEmergencySchema = z.object({
  campId: z.string().trim().min(1, 'معرّف المخيم مطلوب'),
  emergencyType: z.string().trim().min(1, 'نوع الطارئ مطلوب'),
  emergencyDescription: z.string().trim().min(1, 'وصف الطارئ مطلوب'),
  emergencyStatus: z.enum(['جديدة', 'قيد المعالجة', 'مغلقة']),
  emergencyLevel: z.enum(['منخفض', 'متوسط', 'مرتفع']),
  supervisorId: z.string().trim().min(1, 'معرّف المشرف مطلوب'),
})

const updateEmergencySchema = z
  .object({
    campId: z.string().trim().min(1, 'معرّف المخيم مطلوب').optional(),
    emergencyType: z.string().trim().min(1, 'نوع الطارئ مطلوب').optional(),
    emergencyDescription: z.string().trim().min(1, 'وصف الطارئ مطلوب').optional(),
    emergencyStatus: z.enum(['جديدة', 'قيد المعالجة', 'مغلقة']).optional(),
    emergencyLevel: z.enum(['منخفض', 'متوسط', 'مرتفع']).optional(),
    supervisorId: z.string().trim().min(1, 'معرّف المشرف مطلوب').optional(),
  })
  .strict()

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

async function readEmergencies(): Promise<EmergencyApiItem[]> {
  return requestJSON<EmergencyApiItem[]>(BASE_URL)
}

async function createEmergency(input: unknown): Promise<EmergencyApiItem> {
  const body = createEmergencySchema.parse(input)

  return requestJSON<EmergencyApiItem>(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

async function updateEmergency(id: string, input: unknown): Promise<EmergencyApiItem> {
  if (!id) throw new Error('معرّف الطارئ مفقود')

  const body = updateEmergencySchema.parse(input)

  return requestJSON<EmergencyApiItem>(`${BASE_URL}?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

async function deleteEmergency(id: string): Promise<void> {
  if (!id) throw new Error('معرّف الطارئ مفقود')

  await requestJSON(`${BASE_URL}?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

async function deleteAllEmergencies(): Promise<void> {
  await requestJSON(`${BASE_URL}?all=true`, {
    method: 'DELETE',
  })
}

const emergencyApi = {
  list: readEmergencies,
  create: createEmergency,
  update: updateEmergency,
  remove: deleteEmergency,
  removeAll: deleteAllEmergencies,
}

export default function EmergencyPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Emergency[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [statusFilter, setStatusFilter] = useState<'all' | EmergencyStatus>('all')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [addOpen, setAddOpen] = useState(false)

  const [campId, setCampId] = useState('')
  const [emergencyType, setEmergencyType] = useState('')
  const [emergencyDescription, setEmergencyDescription] = useState('')
  const [emergencyStatus, setEmergencyStatus] = useState<EmergencyStatus>('جديدة')
  const [emergencyLevel, setEmergencyLevel] = useState<EmergencyLevel>('متوسط')
  const [supervisorId, setSupervisorId] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [addFormError, setAddFormError] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    campId: string
    emergencyType: string
    emergencyDescription: string
    emergencyStatus: EmergencyStatus
    emergencyLevel: EmergencyLevel
    supervisorId: string
    supervisorName: string
  }>({
    campId: '',
    emergencyType: '',
    emergencyDescription: '',
    emergencyStatus: 'جديدة',
    emergencyLevel: 'متوسط',
    supervisorId: '',
    supervisorName: '',
  })

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError('')

      try {
        const data = await emergencyApi.list()

        setItems(
          data.map((x) => ({
            emergencyId: x.id,
            campId: x.campId,
            emergencyType: x.emergencyType,
            emergencyDescription: x.emergencyDescription,
            emergencyStatus: x.emergencyStatus,
            emergencyLevel: x.emergencyLevel,
            supervisorId: x.supervisorId,
            supervisorName: x.supervisorName ?? x.supervisor ?? x.supervisorId,
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
        x.emergencyId.toLowerCase().includes(s) ||
        x.campId.toLowerCase().includes(s) ||
        x.emergencyType.toLowerCase().includes(s) ||
        x.emergencyDescription.toLowerCase().includes(s) ||
        x.supervisorId.toLowerCase().includes(s) ||
        x.supervisorName.toLowerCase().includes(s)

      const matchStatus = statusFilter === 'all' ? true : x.emergencyStatus === statusFilter

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
    setCampId('')
    setEmergencyType('')
    setEmergencyDescription('')
    setEmergencyStatus('جديدة')
    setEmergencyLevel('متوسط')
    setSupervisorId('')
    setAddFormError('')
  }

  const isAddFormValid =
    !!campId.trim() &&
    !!emergencyType.trim() &&
    !!emergencyDescription.trim() &&
    !!supervisorId.trim()

  const onAdd = async () => {
    if (!isAddFormValid) {
      setAddFormError('يرجى تعبئة جميع الحقول المطلوبة بشكل صحيح')
      return
    }

    setSubmitting(true)
    setError('')
    setAddFormError('')

    try {
      const created = await emergencyApi.create({
        campId: campId.trim(),
        emergencyType: emergencyType.trim(),
        emergencyDescription: emergencyDescription.trim(),
        emergencyStatus,
        emergencyLevel,
        supervisorId: supervisorId.trim(),
      })

      setItems((prev) => [
        {
          emergencyId: created.id,
          campId: created.campId,
          emergencyType: created.emergencyType,
          emergencyDescription: created.emergencyDescription,
          emergencyStatus: created.emergencyStatus,
          emergencyLevel: created.emergencyLevel,
          supervisorId: created.supervisorId,
          supervisorName: created.supervisorName ?? created.supervisor ?? created.supervisorId,
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
      await emergencyApi.remove(id)

      if (editingId === id) setEditingId(null)
      setItems((prev) => prev.filter((x) => x.emergencyId !== id))
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const startEditRow = (row: Emergency) => {
    setEditingId(row.emergencyId)
    setEditDraft({
      campId: row.campId,
      emergencyType: row.emergencyType,
      emergencyDescription: row.emergencyDescription,
      emergencyStatus: row.emergencyStatus,
      emergencyLevel: row.emergencyLevel,
      supervisorId: row.supervisorId,
      supervisorName: row.supervisorName,
    })
  }

  const cancelEditRow = () => setEditingId(null)

  const saveEditRow = async (id: string) => {
    if (
      !editDraft.campId.trim() ||
      !editDraft.emergencyType.trim() ||
      !editDraft.emergencyDescription.trim() ||
      !editDraft.supervisorId.trim()
    ) {
      setError('يرجى تعبئة البيانات بشكل صحيح قبل الحفظ')
      return
    }

    try {
      setError('')

      const updated = await emergencyApi.update(id, {
        campId: editDraft.campId.trim(),
        emergencyType: editDraft.emergencyType.trim(),
        emergencyDescription: editDraft.emergencyDescription.trim(),
        emergencyStatus: editDraft.emergencyStatus,
        emergencyLevel: editDraft.emergencyLevel,
        supervisorId: editDraft.supervisorId.trim(),
      })

      setItems((prev) =>
        prev.map((x) =>
          x.emergencyId === id
            ? {
                emergencyId: updated.id,
                campId: updated.campId,
                emergencyType: updated.emergencyType,
                emergencyDescription: updated.emergencyDescription,
                emergencyStatus: updated.emergencyStatus,
                emergencyLevel: updated.emergencyLevel,
                supervisorId: updated.supervisorId,
                supervisorName: updated.supervisorName ?? updated.supervisor ?? updated.supervisorId,
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
      await emergencyApi.removeAll()
      setItems([])
      setEditingId(null)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

  return (
    <div className="w-full px-3 py-6 sm:px-6" dir="rtl">
      <div className="mb-6 text-right" dir="rtl">
        <div className="text-2xl font-semibold text-foreground">الطوارئ</div>

        <div className="mt-1 text-sm text-muted-foreground">
          الرئيسية <span className="mx-1">{'>'}</span>{' '}
          <span className="text-foreground">إدارة الطوارئ</span>
        </div>

        {loading && <div className="mt-2 text-sm text-muted-foreground">جارٍ التحميل...</div>}
        {!!error && <div className="mt-2 text-sm text-red-600">{error}</div>}
      </div>

      <div className="w-full max-w-[1200px]">
        <Card>
          <CardContent className="p-0" dir="rtl">
            <div className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between" dir="rtl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative w-full sm:w-[260px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={q}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
                      placeholder="ابحث عن حالة طوارئ"
                      className="!h-10 !rounded-lg border-slate-200 bg-white pl-9 pr-3 text-right text-sm outline-none focus:!ring-2 focus:!ring-slate-200"
                      dir="rtl"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | EmergencyStatus)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-right text-sm outline-none focus:ring-2 focus:ring-slate-200 sm:w-[190px]"
                    dir="rtl"
                  >
                    <option value="all">كل الحالات</option>
                    <option value="جديدة">جديدة</option>
                    <option value="قيد المعالجة">قيد المعالجة</option>
                    <option value="مغلقة">مغلقة</option>
                  </select>
                </div>

                <div className="flex items-center justify-start gap-2">
                  <Button
                    className="inline-flex items-center gap-2 !h-10 !rounded-lg !bg-blue-600 !px-4 !text-sm !font-semibold !text-white hover:!bg-blue-700"
                    onClick={() => {
                      setAddFormError('')
                      setAddOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    إضافة طارئ
                  </Button>

                  <Button
                    variant="outline"
                    className="!h-10 !rounded-lg !px-4 !text-sm !font-semibold border-slate-200 text-slate-700 hover:bg-slate-50"
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
                <table className="w-full min-w-[1200px] border-collapse text-sm" dir="rtl">
                  <thead
                    style={{
                      backgroundColor: '#F9FAFB',
                      boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
                    }}
                  >
                    <tr className="text-right text-foreground/60">
                      <th className="border-b border-l px-4 py-3 text-right font-normal">معرّف الطوارئ</th>
                      <th className="border-b border-l px-4 py-3 text-right font-normal">معرّف المخيم</th>
                      <th className="border-b border-l px-4 py-3 text-right font-normal">نوع الطوارئ</th>
                      <th className="border-b border-l px-4 py-3 text-right font-normal">الوصف</th>
                      <th className="border-b border-l px-4 py-3 text-right font-normal">الحالة</th>
                      <th className="border-b border-l px-4 py-3 text-right font-normal">المستوى</th>
                      <th className="border-b border-l px-4 py-3 text-right font-normal">معرّف المشرف</th>
                      <th className="border-b border-l px-4 py-3 text-right font-normal">اسم المشرف</th>
                      <th className="border-b px-4 py-3 text-right font-normal">الإجراءات</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageItems.map((row) => {
                      const isEditing = editingId === row.emergencyId

                      return (
                        <tr key={row.emergencyId} className="hover:bg-muted/30">
                          <td className="border-b border-l px-4 py-3 text-right font-medium">{row.emergencyId}</td>

                          <td className="border-b border-l px-4 py-3 text-right">
                            {isEditing ? (
                              <Input
                                value={editDraft.campId}
                                onChange={(e) => setEditDraft((p) => ({ ...p, campId: e.target.value }))}
                                className="h-10 text-right"
                                dir="rtl"
                              />
                            ) : (
                              row.campId
                            )}
                          </td>

                          <td className="border-b border-l px-4 py-3 text-right">
                            {isEditing ? (
                              <Input
                                value={editDraft.emergencyType}
                                onChange={(e) => setEditDraft((p) => ({ ...p, emergencyType: e.target.value }))}
                                className="h-10 text-right"
                                dir="rtl"
                              />
                            ) : (
                              row.emergencyType
                            )}
                          </td>

                          <td className="border-b border-l px-4 py-3 text-right">
                            {isEditing ? (
                              <Input
                                value={editDraft.emergencyDescription}
                                onChange={(e) =>
                                  setEditDraft((p) => ({ ...p, emergencyDescription: e.target.value }))
                                }
                                className="h-10 text-right"
                                dir="rtl"
                              />
                            ) : (
                              row.emergencyDescription
                            )}
                          </td>

                          <td className="border-b border-l px-4 py-3 text-right">
                            {isEditing ? (
                              <select
                                value={editDraft.emergencyStatus}
                                onChange={(e) =>
                                  setEditDraft((p) => ({
                                    ...p,
                                    emergencyStatus: e.target.value as EmergencyStatus,
                                  }))
                                }
                                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-right text-sm outline-none focus:ring-2 focus:ring-slate-200"
                                dir="rtl"
                              >
                                <option value="جديدة">جديدة</option>
                                <option value="قيد المعالجة">قيد المعالجة</option>
                                <option value="مغلقة">مغلقة</option>
                              </select>
                            ) : (
                              <span className="inline-flex items-center rounded-md border px-2 py-1 text-xs">
                                {row.emergencyStatus}
                              </span>
                            )}
                          </td>

                          <td className="border-b border-l px-4 py-3 text-right">
                            {isEditing ? (
                              <select
                                value={editDraft.emergencyLevel}
                                onChange={(e) =>
                                  setEditDraft((p) => ({
                                    ...p,
                                    emergencyLevel: e.target.value as EmergencyLevel,
                                  }))
                                }
                                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-right text-sm outline-none focus:ring-2 focus:ring-slate-200"
                                dir="rtl"
                              >
                                <option value="منخفض">منخفض</option>
                                <option value="متوسط">متوسط</option>
                                <option value="مرتفع">مرتفع</option>
                              </select>
                            ) : (
                              <span className="inline-flex items-center rounded-md border px-2 py-1 text-xs">
                                {row.emergencyLevel}
                              </span>
                            )}
                          </td>

                          <td className="border-b border-l px-4 py-3 text-right">
                            {isEditing ? (
                              <Input
                                value={editDraft.supervisorId}
                                onChange={(e) => setEditDraft((p) => ({ ...p, supervisorId: e.target.value }))}
                                className="h-10 text-right"
                                dir="rtl"
                              />
                            ) : (
                              row.supervisorId
                            )}
                          </td>

                          <td className="border-b border-l px-4 py-3 text-right">
                            {isEditing ? editDraft.supervisorName || '-' : row.supervisorName || '-'}
                          </td>

                          <td className="border-b px-4 py-3 text-right">
                            <div className="flex items-center gap-2">
                              {!isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border hover:bg-muted"
                                    title="تعديل"
                                    onClick={() => startEditRow(row)}
                                  >
                                    <Pencil className="size-4" />
                                  </button>

                                  <button
                                    type="button"
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border hover:bg-muted"
                                    title="حذف"
                                    onClick={() => onDeleteOne(row.emergencyId)}
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Button size="sm" className="h-10" onClick={() => saveEditRow(row.emergencyId)}>
                                    <Save className="size-4 me-2" />
                                    حفظ
                                  </Button>

                                  <Button size="sm" variant="outline" className="h-10" onClick={cancelEditRow}>
                                    <X className="size-4 me-2" />
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
                        <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                          لا توجد حالات طوارئ
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between" dir="rtl">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>عدد الصفوف لكل صفحة</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                    dir="rtl"
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
            if (!open) setAddFormError('')
          }}
        >
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader dir="rtl" className="text-right">
              <DialogTitle>إضافة طارئ</DialogTitle>
              <DialogDescription>إدخال بيانات الطارئ</DialogDescription>
            </DialogHeader>

            <div dir="rtl" className="grid gap-3 text-right">
              <div className="grid gap-2">
                <div className="text-sm">معرّف المخيم</div>
                <Input
                  value={campId}
                  onChange={(e) => {
                    setCampId(e.target.value)
                    if (addFormError) setAddFormError('')
                  }}
                  placeholder="مثال: camp uuid"
                  className="text-right"
                  dir="rtl"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">نوع الطارئ</div>
                <Input
                  value={emergencyType}
                  onChange={(e) => {
                    setEmergencyType(e.target.value)
                    if (addFormError) setAddFormError('')
                  }}
                  placeholder="مثال: حريق"
                  className="text-right"
                  dir="rtl"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">وصف الطارئ</div>
                <Input
                  value={emergencyDescription}
                  onChange={(e) => {
                    setEmergencyDescription(e.target.value)
                    if (addFormError) setAddFormError('')
                  }}
                  placeholder="مثال: حريق بسيط في المطبخ"
                  className="text-right"
                  dir="rtl"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">حالة الطارئ</div>
                <select
                  value={emergencyStatus}
                  onChange={(e) => {
                    setEmergencyStatus(e.target.value as EmergencyStatus)
                    if (addFormError) setAddFormError('')
                  }}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-right text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  dir="rtl"
                >
                  <option value="جديدة">جديدة</option>
                  <option value="قيد المعالجة">قيد المعالجة</option>
                  <option value="مغلقة">مغلقة</option>
                </select>
              </div>

              <div className="grid gap-2">
                <div className="text-sm">درجة الطارئ</div>
                <select
                  value={emergencyLevel}
                  onChange={(e) => {
                    setEmergencyLevel(e.target.value as EmergencyLevel)
                    if (addFormError) setAddFormError('')
                  }}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-right text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  dir="rtl"
                >
                  <option value="منخفض">منخفض</option>
                  <option value="متوسط">متوسط</option>
                  <option value="مرتفع">مرتفع</option>
                </select>
              </div>

              <div className="grid gap-2">
                <div className="text-sm">معرّف المشرف</div>
                <Input
                  value={supervisorId}
                  onChange={(e) => {
                    setSupervisorId(e.target.value)
                    if (addFormError) setAddFormError('')
                  }}
                  placeholder="مثال: supervisor uuid"
                  className="text-right"
                  dir="rtl"
                />
              </div>

              {!!addFormError && <div className="text-sm text-red-600">{addFormError}</div>}
            </div>

            <DialogFooter dir="rtl" className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setAddOpen(false)
                  setAddFormError('')
                }}
              >
                إغلاق
              </Button>

              <Button onClick={onAdd} disabled={submitting || !isAddFormValid}>
                {submitting ? 'جارٍ الإضافة...' : 'إضافة'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}