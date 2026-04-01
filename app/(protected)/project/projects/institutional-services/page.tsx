'use client'

import { useMemo, useState, type ChangeEvent, useEffect } from 'react'

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

type ActiveStatus = 'مفعل' | 'غير مفعل'

type InstitutionService = {
  id: string
  institutionId: string
  serviceId: string
  status: ActiveStatus
}

type InstitutionServiceApiItem = {
  id: string
  institutionId: string
  serviceId: string
}

const BASE_URL = '/api/project/projects/institutional-services'

function getErrorMessage(err: unknown) {
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

async function readInstitutionServices(): Promise<InstitutionServiceApiItem[]> {
  return requestJSON<InstitutionServiceApiItem[]>(BASE_URL)
}

async function createInstitutionService(input: {
  institutionId: string
  serviceId: string
}): Promise<InstitutionServiceApiItem> {
  if (!input.institutionId.trim()) throw new Error('معرف المؤسسة مطلوب')
  if (!input.serviceId.trim()) throw new Error('معرف الخدمة مطلوب')

  return requestJSON<InstitutionServiceApiItem>(BASE_URL, {
    method: 'POST',
    body: JSON.stringify({
      institutionId: input.institutionId.trim(),
      serviceId: input.serviceId.trim(),
    }),
  })
}

async function updateInstitutionService(
  id: string,
  input: {
    institutionId?: string
    serviceId?: string
  }
): Promise<InstitutionServiceApiItem> {
  if (!id) throw new Error('معرّف السجل مفقود')

  const body: Record<string, string> = {}

  if (typeof input.institutionId === 'string') {
    if (!input.institutionId.trim()) throw new Error('معرف المؤسسة مطلوب')
    body.institutionId = input.institutionId.trim()
  }

  if (typeof input.serviceId === 'string') {
    if (!input.serviceId.trim()) throw new Error('معرف الخدمة مطلوب')
    body.serviceId = input.serviceId.trim()
  }

  return requestJSON<InstitutionServiceApiItem>(`${BASE_URL}?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

async function deleteInstitutionService(id: string): Promise<void> {
  if (!id) throw new Error('معرّف السجل مفقود')

  await requestJSON(`${BASE_URL}?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

async function deleteAllInstitutionServices(): Promise<void> {
  await requestJSON(`${BASE_URL}?all=true`, {
    method: 'DELETE',
  })
}

const institutionServicesApi = {
  list: readInstitutionServices,
  create: createInstitutionService,
  update: updateInstitutionService,
  remove: deleteInstitutionService,
  removeAll: deleteAllInstitutionServices,
}

export default function InstitutionServicesPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<InstitutionService[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [statusPick, setStatusPick] = useState<Record<string, ActiveStatus>>({})

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [addOpen, setAddOpen] = useState(false)
  const [institutionId, setInstitutionId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [status, setStatus] = useState<ActiveStatus>('مفعل')
  const [submitting, setSubmitting] = useState(false)
  const [addFormError, setAddFormError] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    institutionId: string
    serviceId: string
    status: ActiveStatus
  }>({
    institutionId: '',
    serviceId: '',
    status: 'مفعل',
  })

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError('')

      try {
        const data = await institutionServicesApi.list()

        setItems(
          data.map((x) => ({
            id: x.id,
            institutionId: x.institutionId,
            serviceId: x.serviceId,
            status: 'مفعل',
          }))
        )

        const pick: Record<string, ActiveStatus> = {}
        data.forEach((x) => {
          pick[x.id] = 'مفعل'
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

    return items.filter((x) => {
      const rowStatus = statusPick[x.id] ?? x.status

      const matchSearch =
        !s ||
        x.id.toLowerCase().includes(s) ||
        x.institutionId.toLowerCase().includes(s) ||
        x.serviceId.toLowerCase().includes(s)

      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? rowStatus === 'مفعل'
          : rowStatus === 'غير مفعل'

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
    setInstitutionId('')
    setServiceId('')
    setStatus('مفعل')
    setAddFormError('')
  }

  const isAddFormValid = !!institutionId.trim() && !!serviceId.trim()

  const onAdd = async () => {
    const inst = institutionId.trim()
    const serv = serviceId.trim()

    if (!inst || !serv) {
      setAddFormError('يرجى تعبئة جميع الحقول المطلوبة بشكل صحيح')
      return
    }

    setSubmitting(true)
    setError('')
    setAddFormError('')

    try {
      const created = await institutionServicesApi.create({
        institutionId: inst,
        serviceId: serv,
      })

      setItems((prev) => [
        {
          id: created.id,
          institutionId: created.institutionId,
          serviceId: created.serviceId,
          status,
        },
        ...prev,
      ])

      setStatusPick((prev) => ({
        ...prev,
        [created.id]: status,
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
      await institutionServicesApi.remove(id)

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

  const startEditRow = (row: InstitutionService) => {
    setEditingId(row.id)
    setEditDraft({
      institutionId: row.institutionId,
      serviceId: row.serviceId,
      status: statusPick[row.id] ?? row.status,
    })
  }

  const cancelEditRow = () => setEditingId(null)

  const saveEditRow = async (id: string) => {
    const inst = editDraft.institutionId.trim()
    const serv = editDraft.serviceId.trim()

    if (!inst || !serv) {
      setError('يرجى تعبئة البيانات بشكل صحيح قبل الحفظ')
      return
    }

    try {
      setError('')

      const updated = await institutionServicesApi.update(id, {
        institutionId: inst,
        serviceId: serv,
      })

      setItems((prev) =>
        prev.map((x) =>
          x.id === id
            ? {
                ...x,
                institutionId: updated.institutionId,
                serviceId: updated.serviceId,
                status: editDraft.status,
              }
            : x
        )
      )

      setStatusPick((prev) => ({
        ...prev,
        [id]: editDraft.status,
      }))

      setEditingId(null)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const onDeleteAll = async () => {
    try {
      setError('')
      await institutionServicesApi.removeAll()
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
    <div className="w-full px-3 sm:px-6 py-6" dir="rtl">
      <div className="mb-6">
        <div className="text-right">
          <div className="text-2xl font-semibold text-foreground">خدمات المؤسسات</div>

          <div className="mt-1 text-sm text-muted-foreground">
            الرئيسية <span className="mx-1">{'>'}</span>{' '}
            <span className="text-foreground">إدارة خدمات المؤسسات</span>
          </div>

          {loading && <div className="mt-2 text-sm text-muted-foreground">جارٍ التحميل...</div>}
          {!!error && <div className="mt-2 text-sm text-red-600">{error}</div>}
        </div>
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
                      placeholder="ابحث في خدمات المؤسسات"
                      className="!h-10 !rounded-lg border-slate-200 bg-white pr-9 pl-3 text-sm outline-none focus:!ring-2 focus:!ring-slate-200"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                    className="h-10 w-full sm:w-[180px] rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="all">كل الحالات</option>
                    <option value="active">مفعل</option>
                    <option value="inactive">غير مفعل</option>
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
                    إضافة
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
                <table className="w-full text-sm border-collapse min-w-[900px]">
                  <thead
                    style={{
                      backgroundColor: '#F9FAFB',
                      boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
                    }}
                  >
                    <tr className="text-right text-foreground/60">
                      <th className="px-4 py-3 border-b border-r font-normal">المعرف (أساسي)</th>
                      <th className="px-4 py-3 border-b border-r font-normal">معرف المؤسسة</th>
                      <th className="px-4 py-3 border-b border-r font-normal">معرف الخدمة (مرجع)</th>
                      <th className="px-4 py-3 border-b border-r font-normal">الحالة</th>
                      <th className="px-4 py-3 border-b font-normal">الإجراءات</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageItems.map((row) => {
                      const isEditing = editingId === row.id
                      const currentStatus = statusPick[row.id] ?? row.status

                      return (
                        <tr key={row.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 border-b border-r font-medium">{row.id}</td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <Input
                                type="text"
                                value={editDraft.institutionId}
                                onChange={(e) =>
                                  setEditDraft((p) => ({ ...p, institutionId: e.target.value }))
                                }
                                className="h-10"
                              />
                            ) : (
                              row.institutionId
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <Input
                                type="text"
                                value={editDraft.serviceId}
                                onChange={(e) =>
                                  setEditDraft((p) => ({ ...p, serviceId: e.target.value }))
                                }
                                className="h-10"
                              />
                            ) : (
                              row.serviceId
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <select
                                value={editDraft.status}
                                onChange={(e) =>
                                  setEditDraft((p) => ({ ...p, status: e.target.value as ActiveStatus }))
                                }
                                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                              >
                                <option value="مفعل">مفعل</option>
                                <option value="غير مفعل">غير مفعل</option>
                              </select>
                            ) : (
                              <span className="inline-flex items-center rounded-md border px-2 py-1 text-xs">
                                {currentStatus}
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
                                    onClick={() => startEditRow(row)}
                                  >
                                    <Pencil className="size-4" />
                                  </button>

                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center rounded-md border h-10 w-10 hover:bg-muted"
                                    title="حذف"
                                    onClick={() => onDeleteOne(row.id)}
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    className="h-10"
                                    onClick={() => saveEditRow(row.id)}
                                    disabled={!editDraft.institutionId.trim() || !editDraft.serviceId.trim()}
                                  >
                                    <Save className="size-4 ms-2" />
                                    حفظ
                                  </Button>

                                  <Button size="sm" variant="outline" className="h-10" onClick={cancelEditRow}>
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

                    {!pageItems.length && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                          لا توجد بيانات
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
            if (!open) setAddFormError('')
          }}
        >
          <DialogContent className="sm:max-w-[560px]" dir="rtl">
            <DialogHeader className="text-right">
              <DialogTitle>إضافة خدمة للمؤسسة</DialogTitle>
              <DialogDescription>إدخال بيانات خدمات المؤسسة</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 text-right">
              <div className="grid gap-2">
                <div className="text-sm">معرف المؤسسة</div>
                <Input
                  type="text"
                  value={institutionId}
                  onChange={(e) => {
                    setInstitutionId(e.target.value)
                    if (addFormError) setAddFormError('')
                  }}
                  placeholder="مثال: 10 أو uuid"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">معرف الخدمة (مرجع)</div>
                <Input
                  type="text"
                  value={serviceId}
                  onChange={(e) => {
                    setServiceId(e.target.value)
                    if (addFormError) setAddFormError('')
                  }}
                  placeholder="مثال: 101 أو uuid"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">حالة الخدمة</div>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as ActiveStatus)
                    if (addFormError) setAddFormError('')
                  }}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="مفعل">مفعل</option>
                  <option value="غير مفعل">غير مفعل</option>
                </select>

                {!!addFormError && <div className="text-sm text-red-600">{addFormError}</div>}
              </div>
            </div>

            <DialogFooter className="gap-2">
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