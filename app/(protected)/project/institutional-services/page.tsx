'use client'

import { useMemo, useState, type ChangeEvent, useEffect } from 'react'

import { Card, CardContent } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../../components/ui/dialog'

import { Pencil, Trash2, Save, X, Plus, Search } from 'lucide-react'

type ActiveStatus = 'مفعل' | 'غير مفعل'

type InstitutionService = {
  id: string // PK (string للعرض/التحرير بسهولة)
  institutionId: number
  serviceId: number // FK
  status: ActiveStatus
}

const seed: InstitutionService[] = [
  { id: 'is_01', institutionId: 10, serviceId: 101, status: 'مفعل' },
  { id: 'is_02', institutionId: 10, serviceId: 102, status: 'غير مفعل' },
  { id: 'is_03', institutionId: 12, serviceId: 104, status: 'مفعل' },
]

// ✅ أرقام صحيحة فقط
const toIntOnly = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

export default function InstitutionServicesPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<InstitutionService[]>(seed)

  // فلترة الحالة من فوق
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Add dialog
  const [addOpen, setAddOpen] = useState(false)
  const [institutionId, setInstitutionId] = useState<number>(0)
  const [serviceId, setServiceId] = useState<number>(0)
  const [status, setStatus] = useState<ActiveStatus>('مفعل')

  // Inline Edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    institutionId: number
    serviceId: number
    status: ActiveStatus
  }>({
    institutionId: 0,
    serviceId: 0,
    status: 'مفعل',
  })

  // ✅ فلترة search + فلترة status
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()

    return items.filter((x) => {
      const matchSearch =
        !s ||
        x.id.toLowerCase().includes(s) ||
        String(x.institutionId).includes(s) ||
        String(x.serviceId).includes(s)

      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
            ? x.status === 'مفعل'
            : x.status === 'غير مفعل'

      return matchSearch && matchStatus
    })
  }, [q, items, statusFilter])

  // ✅ reset page عند أي تغيير
  useEffect(() => {
    setPage(1)
  }, [q, statusFilter, pageSize])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  const onAdd = () => {
    if (!Number.isInteger(institutionId) || institutionId <= 0) return
    if (!Number.isInteger(serviceId) || serviceId <= 0) return

    const newItem: InstitutionService = {
      id: `is_${Math.random().toString(16).slice(2, 8)}`,
      institutionId,
      serviceId,
      status,
    }

    setItems((prev) => [newItem, ...prev])
    setInstitutionId(0)
    setServiceId(0)
    setStatus('مفعل')
    setAddOpen(false)
  }

  const onDeleteOne = (id: string) => {
    if (editingId === id) setEditingId(null)
    setItems((prev) => prev.filter((x) => x.id !== id))
  }

  const startEditRow = (row: InstitutionService) => {
    setEditingId(row.id)
    setEditDraft({
      institutionId: row.institutionId,
      serviceId: row.serviceId,
      status: row.status,
    })
  }

  const cancelEditRow = () => setEditingId(null)

  const saveEditRow = (id: string) => {
    if (!Number.isInteger(editDraft.institutionId) || editDraft.institutionId <= 0) return
    if (!Number.isInteger(editDraft.serviceId) || editDraft.serviceId <= 0) return

    setItems((prev) =>
      prev.map((x) =>
        x.id === id
          ? {
              ...x,
              institutionId: editDraft.institutionId,
              serviceId: editDraft.serviceId,
              status: editDraft.status,
            }
          : x
      )
    )
    setEditingId(null)
  }

  // Pagination label
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

  return (
    <div className="w-full px-3 sm:px-6 py-6" dir="rtl">
      {/* Header */}
      <div className="mb-6" dir="ltr">
        <div className="text-left">
          <div className="text-2xl font-semibold text-foreground">Institution Services</div>

          <div className="mt-1 text-sm text-muted-foreground">
            Home <span className="mx-1">{'>'}</span>{' '}
            <span className="text-foreground">Institution Services Management</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1200px]">
        <Card>
          <CardContent className="p-0" dir="ltr">
            {/* Toolbar */}
            <div className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                {/* Left */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  {/* Search */}
                  <div className="relative w-full sm:w-[260px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={q}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
                      placeholder="Search institution services"
                      className="!h-10 !rounded-lg border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:!ring-2 focus:!ring-slate-200"
                    />
                  </div>

                  {/* Status filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                    className="h-10 w-full sm:w-[180px] rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="all">All status</option>
                    <option value="active">مفعل</option>
                    <option value="inactive">غير مفعل</option>
                  </select>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    className="!h-10 !rounded-lg !bg-blue-600 !px-4 !text-sm !font-semibold !text-white hover:!bg-blue-700 inline-flex items-center gap-2"
                    onClick={() => setAddOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>

                  <Button
                    variant="outline"
                    className="!h-10 !rounded-lg !px-4 !text-sm !font-semibold border-slate-200 text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setItems([])
                      setEditingId(null)
                    }}
                  >
                    Delete all
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t" />

            {/* Table */}
            <div className="rounded-b-lg overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm border-collapse min-w-[900px]">
                  <thead
                    style={{
                      backgroundColor: '#F9FAFB',
                      boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
                    }}
                  >
                    <tr className="text-left text-foreground/60">
                      <th className="px-4 py-3 border-b border-r font-normal">ID (PK)</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Institution ID</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Service ID (FK)</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Status</th>
                      <th className="px-4 py-3 border-b font-normal">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageItems.map((row) => {
                      const isEditing = editingId === row.id

                      return (
                        <tr key={row.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 border-b border-r font-medium">{row.id}</td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <Input
                                inputMode="numeric"
                                pattern="[0-9]*"
                                type="text"
                                value={editDraft.institutionId ? String(editDraft.institutionId) : ''}
                                onChange={(e) =>
                                  setEditDraft((p) => ({ ...p, institutionId: toIntOnly(e.target.value) }))
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
                                inputMode="numeric"
                                pattern="[0-9]*"
                                type="text"
                                value={editDraft.serviceId ? String(editDraft.serviceId) : ''}
                                onChange={(e) => setEditDraft((p) => ({ ...p, serviceId: toIntOnly(e.target.value) }))}
                                className="h-10"
                              />
                            ) : (
                              row.serviceId
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r" dir="rtl">
                            {isEditing ? (
                              <select
                                value={editDraft.status}
                                onChange={(e) => setEditDraft((p) => ({ ...p, status: e.target.value as ActiveStatus }))}
                                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                              >
                                <option value="مفعل">مفعل</option>
                                <option value="غير مفعل">غير مفعل</option>
                              </select>
                            ) : (
                              <span className="inline-flex items-center rounded-md border px-2 py-1 text-xs">
                                {row.status}
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
                                    title="Edit"
                                    onClick={() => startEditRow(row)}
                                  >
                                    <Pencil className="size-4" />
                                  </button>

                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center rounded-md border h-10 w-10 hover:bg-muted"
                                    title="Delete"
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
                                    disabled={
                                      !Number.isInteger(editDraft.institutionId) ||
                                      editDraft.institutionId <= 0 ||
                                      !Number.isInteger(editDraft.serviceId) ||
                                      editDraft.serviceId <= 0
                                    }
                                  >
                                    <Save className="size-4 me-2" />
                                    Save
                                  </Button>

                                  <Button size="sm" variant="outline" className="h-10" onClick={cancelEditRow}>
                                    <X className="size-4 me-2" />
                                    Cancel
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
                          No records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Rows per page</span>
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
                    {rangeStart} - {rangeEnd} of {filtered.length}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader dir="rtl" className="text-right">
              <DialogTitle>إضافة خدمة للمؤسسة</DialogTitle>
              <DialogDescription>إدخال بيانات خدمات المؤسسة</DialogDescription>
            </DialogHeader>

            <div dir="rtl" className="grid gap-3">
              <div className="grid gap-2">
                <div className="text-sm">Institution ID</div>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="text"
                  value={institutionId ? String(institutionId) : ''}
                  onChange={(e) => setInstitutionId(toIntOnly(e.target.value))}
                  placeholder="مثال: 10"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">Service ID (FK)</div>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="text"
                  value={serviceId ? String(serviceId) : ''}
                  onChange={(e) => setServiceId(toIntOnly(e.target.value))}
                  placeholder="مثال: 101"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">حالة الخدمة</div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ActiveStatus)}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="مفعل">مفعل</option>
                  <option value="غير مفعل">غير مفعل</option>
                </select>
              </div>
            </div>

            <DialogFooter dir="rtl" className="gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                إغلاق
              </Button>
              <Button
                onClick={onAdd}
                disabled={
                  !Number.isInteger(institutionId) ||
                  institutionId <= 0 ||
                  !Number.isInteger(serviceId) ||
                  serviceId <= 0
                }
              >
                إضافة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}