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

type ServiceStatus = 'نشط' | 'مغلق'

type Service = {
  id: string
  serviceType: string
  status: ServiceStatus
}

type ServiceApiItem = {
  id: string
  serviceType: string
  status: ServiceStatus
}

const BASE_URL = '/api/project/projects/service'

const createServiceSchema = z.object({
  serviceType: z.string().trim().min(1, 'نوع الخدمة مطلوب'),
  status: z.enum(['نشط', 'مغلق']),
})

const updateServiceSchema = z
  .object({
    serviceType: z.string().trim().min(1, 'نوع الخدمة مطلوب').optional(),
    status: z.enum(['نشط', 'مغلق']).optional(),
  })
  .strict()

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

async function readServices(): Promise<ServiceApiItem[]> {
  return requestJSON<ServiceApiItem[]>(BASE_URL)
}

function findDuplicateService(
  services: ServiceApiItem[],
  input: { serviceType: string },
  excludeId?: string
) {
  const normalizedType = normalizeText(input.serviceType)

  const duplicate = services.find(
    (s) =>
      s.id !== excludeId &&
      normalizeText(s.serviceType ?? '') === normalizedType
  )

  if (duplicate) {
    return 'الخدمة موجودة بالفعل (نوع خدمة مكرر).'
  }

  return ''
}

async function assertServiceBusinessValidation(
  input: { serviceType: string; status: ServiceStatus },
  excludeId?: string
) {
  const normalizedType = normalizeText(input.serviceType)

  if (!normalizedType) {
    throw new Error('نوع الخدمة مطلوب')
  }

  if (!input.status) {
    throw new Error('الحالة مطلوبة')
  }

  const current = await readServices()
  const duplicateMessage = findDuplicateService(current, input, excludeId)

  if (duplicateMessage) {
    throw new Error(duplicateMessage)
  }
}

async function createService(input: unknown): Promise<ServiceApiItem> {
  const body = createServiceSchema.parse(input)

  await assertServiceBusinessValidation({
    serviceType: body.serviceType,
    status: body.status,
  })

  return requestJSON<ServiceApiItem>(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

async function updateService(id: string, input: unknown): Promise<ServiceApiItem> {
  if (!id) throw new Error('معرّف الخدمة مفقود')

  const body = updateServiceSchema.parse(input)

  const current = await readServices()
  const existing = current.find((s) => s.id === id)

  if (!existing) {
    throw new Error('الخدمة غير موجودة')
  }

  const merged = {
    serviceType: body.serviceType ?? existing.serviceType,
    status: body.status ?? existing.status,
  }

  await assertServiceBusinessValidation(merged, id)

  return requestJSON<ServiceApiItem>(`${BASE_URL}?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

async function deleteService(id: string): Promise<void> {
  if (!id) throw new Error('معرّف الخدمة مفقود')

  await requestJSON(`${BASE_URL}?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

async function deleteAllServices(): Promise<void> {
  await requestJSON(`${BASE_URL}?all=true`, {
    method: 'DELETE',
  })
}

const servicesApi = {
  list: readServices,
  create: createService,
  update: updateService,
  remove: deleteService,
  removeAll: deleteAllServices,
}

export default function ServicesPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [statusFilter, setStatusFilter] = useState<'all' | ServiceStatus>('all')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [addOpen, setAddOpen] = useState(false)
  const [serviceType, setServiceType] = useState('')
  const [status, setStatus] = useState<ServiceStatus>('نشط')
  const [submitting, setSubmitting] = useState(false)
  const [addFormError, setAddFormError] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    serviceType: string
    status: ServiceStatus
  }>({
    serviceType: '',
    status: 'نشط',
  })

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError('')

      try {
        const data = await servicesApi.list()
        setItems(
          data.map((x) => ({
            id: x.id,
            serviceType: x.serviceType,
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
        x.id.toLowerCase().includes(s) ||
        x.serviceType.toLowerCase().includes(s)

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
    setServiceType('')
    setStatus('نشط')
    setAddFormError('')
  }

  const isAddFormValid = !!serviceType.trim() && !!status

  const onAdd = async () => {
    const t = serviceType.trim()

    if (!t || !status) {
      setAddFormError('يرجى تعبئة جميع الحقول المطلوبة بشكل صحيح')
      return
    }

    setSubmitting(true)
    setError('')
    setAddFormError('')

    try {
      const created = await servicesApi.create({
        serviceType: t,
        status,
      })

      setItems((prev) => [created, ...prev])

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
      await servicesApi.remove(id)

      if (editingId === id) setEditingId(null)

      setItems((prev) => prev.filter((x) => x.id !== id))
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const onDeleteAll = async () => {
    try {
      setError('')
      await servicesApi.removeAll()
      setItems([])
      setEditingId(null)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const startEditRow = (s: Service) => {
    setEditingId(s.id)
    setEditDraft({
      serviceType: s.serviceType,
      status: s.status,
    })
  }

  const cancelEditRow = () => setEditingId(null)

  const saveEditRow = async (id: string) => {
    const t = editDraft.serviceType.trim()

    if (!t || !editDraft.status) {
      setError('يرجى تعبئة البيانات بشكل صحيح قبل الحفظ')
      return
    }

    try {
      setError('')

      const updated = await servicesApi.update(id, {
        serviceType: t,
        status: editDraft.status,
      })

      setItems((prev) => prev.map((x) => (x.id === id ? updated : x)))
      setEditingId(null)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

  return (
    <div className="w-full px-3 sm:px-6 py-6" dir="rtl">
      <div className="mb-6 text-right">
        <div className="text-2xl font-semibold text-foreground">الخدمات</div>

        <div className="mt-1 text-sm text-muted-foreground">
          الرئيسية <span className="mx-1">{'>'}</span>
          <span className="text-foreground">إدارة الخدمات</span>
        </div>

        {loading && <div className="mt-2 text-sm text-muted-foreground">جارٍ التحميل...</div>}
        {!!error && <div className="mt-2 text-sm text-red-600">{error}</div>}
      </div>

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
                      placeholder="ابحث عن خدمة"
                      className="!h-10 !rounded-lg border-slate-200 bg-white pr-9 pl-3 text-sm outline-none focus:!ring-2 focus:!ring-slate-200"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | ServiceStatus)}
                    className="h-10 w-full sm:w-[160px] rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="all">كل الحالات</option>
                    <option value="نشط">نشط</option>
                    <option value="مغلق">مغلق</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <Button
                    className="!h-10 !rounded-lg !bg-blue-600 !px-4 !text-sm !font-semibold !text-white hover:!bg-blue-700 inline-flex items-center gap-2"
                    onClick={() => {
                      setAddFormError('')
                      setAddOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    إضافة خدمة
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

            <div className="rounded-b-lg overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm border-collapse min-w-[700px]">
                  <thead
                    style={{
                      backgroundColor: '#F9FAFB',
                      boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
                    }}
                  >
                    <tr className="text-right text-foreground/60">
                      <th className="px-4 py-3 border-b border-l font-normal">معرف الخدمة</th>
                      <th className="px-4 py-3 border-b border-l font-normal">نوع الخدمة</th>
                      <th className="px-4 py-3 border-b border-l font-normal">الحالة</th>
                      <th className="px-4 py-3 border-b font-normal">الإجراءات</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageItems.map((s) => {
                      const isEditing = editingId === s.id

                      return (
                        <tr key={s.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 border-b border-l font-medium">{s.id}</td>

                          <td className="px-4 py-3 border-b border-l">
                            {isEditing ? (
                              <Input
                                value={editDraft.serviceType}
                                onChange={(e) =>
                                  setEditDraft((p) => ({
                                    ...p,
                                    serviceType: e.target.value,
                                  }))
                                }
                                className="h-10"
                              />
                            ) : (
                              s.serviceType
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-l">
                            {isEditing ? (
                              <select
                                value={editDraft.status}
                                onChange={(e) =>
                                  setEditDraft((p) => ({
                                    ...p,
                                    status: e.target.value as ServiceStatus,
                                  }))
                                }
                                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                              >
                                <option value="نشط">نشط</option>
                                <option value="مغلق">مغلق</option>
                              </select>
                            ) : (
                              <span className="inline-flex items-center rounded-md border px-2 py-1 text-xs">
                                {s.status}
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 border-b">
                            <div className="flex items-center gap-2">
                              {!isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center rounded-md border h-10 w-10 hover:bg-muted"
                                    title="تعديل"
                                    onClick={() => startEditRow(s)}
                                  >
                                    <Pencil className="size-4" />
                                  </button>

                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center rounded-md border h-10 w-10 hover:bg-muted"
                                    title="حذف"
                                    onClick={() => onDeleteOne(s.id)}
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    className="h-10"
                                    onClick={() => saveEditRow(s.id)}
                                    disabled={!editDraft.serviceType.trim()}
                                  >
                                    <Save className="size-4 ms-2" />
                                    حفظ
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-10"
                                    onClick={cancelEditRow}
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

                    {!loading && !pageItems.length && (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                          لا توجد خدمات
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>عدد الصفوف لكل صفحة</span>
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
              setAddFormError('')
            }
          }}
        >
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader dir="rtl" className="text-right">
              <DialogTitle>إضافة خدمة</DialogTitle>
              <DialogDescription>إدخال بيانات الخدمة</DialogDescription>
            </DialogHeader>

            <div dir="rtl" className="grid gap-3">
              <div className="grid gap-2">
                <div className="text-sm">نوع الخدمة *</div>
                <Input
                  value={serviceType}
                  onChange={(e) => {
                    setServiceType(e.target.value)
                    if (addFormError) setAddFormError('')
                  }}
                  placeholder="مثال: توزيع سلال غذائية"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">الحالة *</div>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as ServiceStatus)
                    if (addFormError) setAddFormError('')
                  }}
                  className={`h-10 rounded-lg border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200 ${
                    addFormError ? 'border-red-500' : 'border-slate-200'
                  }`}
                >
                  <option value="نشط">نشط</option>
                  <option value="مغلق">مغلق</option>
                </select>

                {!!addFormError && <div className="text-sm text-red-600">{addFormError}</div>}
              </div>
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