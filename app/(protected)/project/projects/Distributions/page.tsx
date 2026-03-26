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

type DistributionStatus = 'مجدول' | 'تم' | 'ملغي'

type Distribution = {
  distributionId: string // PK
  institutionId: number // FK
  clinicId: number // FK
  productId: number // FK
  quantity: number
  distributionDate: string
  status: DistributionStatus
}

// Seed
const seed: Distribution[] = [
  {
    distributionId: 'dst_01',
    institutionId: 10,
    clinicId: 3,
    productId: 101,
    quantity: 250,
    distributionDate: '2026-02-16',
    status: 'مجدول',
  },
  {
    distributionId: 'dst_02',
    institutionId: 12,
    clinicId: 1,
    productId: 104,
    quantity: 90,
    distributionDate: '2026-02-15',
    status: 'تم',
  },
  {
    distributionId: 'dst_03',
    institutionId: 10,
    clinicId: 2,
    productId: 110,
    quantity: 40,
    distributionDate: '2026-02-14',
    status: 'ملغي',
  },
]

// ✅ أرقام صحيحة فقط
const toIntOnly = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

export default function DistributionsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Distribution[]>(seed)

  // فلترة الحالة من فوق
  const [statusFilter, setStatusFilter] = useState<'all' | DistributionStatus>('all')

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Add dialog
  const [addOpen, setAddOpen] = useState(false)
  const [institutionId, setInstitutionId] = useState<number>(0)
  const [clinicId, setClinicId] = useState<number>(0)
  const [productId, setProductId] = useState<number>(0)
  const [quantity, setQuantity] = useState<number>(0)
  const [distributionDate, setDistributionDate] = useState('')
  const [status, setStatus] = useState<DistributionStatus>('مجدول')

  // Inline Edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    institutionId: number
    clinicId: number
    productId: number
    quantity: number
    distributionDate: string
    status: DistributionStatus
  }>({
    institutionId: 0,
    clinicId: 0,
    productId: 0,
    quantity: 0,
    distributionDate: '',
    status: 'مجدول',
  })

  // ✅ فلترة search + status
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()

    return items.filter((x) => {
      const matchSearch =
        !s ||
        x.distributionId.toLowerCase().includes(s) ||
        String(x.institutionId).includes(s) ||
        String(x.clinicId).includes(s) ||
        String(x.productId).includes(s) ||
        String(x.quantity).includes(s) ||
        x.distributionDate.toLowerCase().includes(s)

      const matchStatus = statusFilter === 'all' ? true : x.status === statusFilter

      return matchSearch && matchStatus
    })
  }, [q, items, statusFilter])

  // reset page
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
    if (!Number.isInteger(clinicId) || clinicId <= 0) return
    if (!Number.isInteger(productId) || productId <= 0) return
    if (!Number.isInteger(quantity) || quantity <= 0) return
    if (!distributionDate.trim()) return

    const newItem: Distribution = {
      distributionId: `dst_${Math.random().toString(16).slice(2, 8)}`,
      institutionId,
      clinicId,
      productId,
      quantity,
      distributionDate: distributionDate.trim(),
      status,
    }

    setItems((prev) => [newItem, ...prev])

    setInstitutionId(0)
    setClinicId(0)
    setProductId(0)
    setQuantity(0)
    setDistributionDate('')
    setStatus('مجدول')
    setAddOpen(false)
  }

  const onDeleteOne = (id: string) => {
    if (editingId === id) setEditingId(null)
    setItems((prev) => prev.filter((x) => x.distributionId !== id))
  }

  const startEditRow = (row: Distribution) => {
    setEditingId(row.distributionId)
    setEditDraft({
      institutionId: row.institutionId,
      clinicId: row.clinicId,
      productId: row.productId,
      quantity: row.quantity,
      distributionDate: row.distributionDate,
      status: row.status,
    })
  }

  const cancelEditRow = () => setEditingId(null)

  const saveEditRow = (id: string) => {
    if (!Number.isInteger(editDraft.institutionId) || editDraft.institutionId <= 0) return
    if (!Number.isInteger(editDraft.clinicId) || editDraft.clinicId <= 0) return
    if (!Number.isInteger(editDraft.productId) || editDraft.productId <= 0) return
    if (!Number.isInteger(editDraft.quantity) || editDraft.quantity <= 0) return
    if (!editDraft.distributionDate.trim()) return

    setItems((prev) =>
      prev.map((x) =>
        x.distributionId === id
          ? {
              ...x,
              institutionId: editDraft.institutionId,
              clinicId: editDraft.clinicId,
              productId: editDraft.productId,
              quantity: editDraft.quantity,
              distributionDate: editDraft.distributionDate.trim(),
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
          <div className="text-2xl font-semibold text-foreground">Distributions</div>

          <div className="mt-1 text-sm text-muted-foreground">
            Home <span className="mx-1">{'>'}</span>{' '}
            <span className="text-foreground">Distributions Management</span>
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
                  <div className="relative w-full sm:w-[260px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={q}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
                      placeholder="Search distributions"
                      className="!h-10 !rounded-lg border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:!ring-2 focus:!ring-slate-200"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | DistributionStatus)}
                    className="h-10 w-full sm:w-[170px] rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="all">All status</option>
                    <option value="مجدول">مجدول</option>
                    <option value="تم">تم</option>
                    <option value="ملغي">ملغي</option>
                  </select>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    className="!h-10 !rounded-lg !bg-blue-600 !px-4 !text-sm !font-semibold !text-white hover:!bg-blue-700 inline-flex items-center gap-2"
                    onClick={() => setAddOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add distribution
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
                <table className="w-full text-sm border-collapse min-w-[1150px]">
                  <thead
                    style={{
                      backgroundColor: '#F9FAFB',
                      boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
                    }}
                  >
                    <tr className="text-left text-foreground/60">
                      <th className="px-4 py-3 border-b border-r font-normal">Distribution ID (PK)</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Institution ID (FK)</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Clinic ID (FK)</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Product ID (FK)</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Quantity</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Distribution Date</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Status</th>
                      <th className="px-4 py-3 border-b font-normal">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageItems.map((row) => {
                      const isEditing = editingId === row.distributionId

                      return (
                        <tr key={row.distributionId} className="hover:bg-muted/30">
                          <td className="px-4 py-3 border-b border-r font-medium">{row.distributionId}</td>

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
                                value={editDraft.clinicId ? String(editDraft.clinicId) : ''}
                                onChange={(e) => setEditDraft((p) => ({ ...p, clinicId: toIntOnly(e.target.value) }))}
                                className="h-10"
                              />
                            ) : (
                              row.clinicId
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <Input
                                inputMode="numeric"
                                pattern="[0-9]*"
                                type="text"
                                value={editDraft.productId ? String(editDraft.productId) : ''}
                                onChange={(e) =>
                                  setEditDraft((p) => ({ ...p, productId: toIntOnly(e.target.value) }))
                                }
                                className="h-10"
                              />
                            ) : (
                              row.productId
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <Input
                                inputMode="numeric"
                                pattern="[0-9]*"
                                type="text"
                                value={editDraft.quantity ? String(editDraft.quantity) : ''}
                                onChange={(e) => setEditDraft((p) => ({ ...p, quantity: toIntOnly(e.target.value) }))}
                                className="h-10"
                              />
                            ) : (
                              row.quantity
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <Input
                                value={editDraft.distributionDate}
                                onChange={(e) => setEditDraft((p) => ({ ...p, distributionDate: e.target.value }))}
                                className="h-10"
                                placeholder="YYYY-MM-DD"
                              />
                            ) : (
                              row.distributionDate
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r" dir="rtl">
                            {isEditing ? (
                              <select
                                value={editDraft.status}
                                onChange={(e) =>
                                  setEditDraft((p) => ({ ...p, status: e.target.value as DistributionStatus }))
                                }
                                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
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
                                    onClick={() => onDeleteOne(row.distributionId)}
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Button size="sm" className="h-10" onClick={() => saveEditRow(row.distributionId)}>
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
                        <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                          No distributions found
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
              <DialogTitle>إضافة توزيع</DialogTitle>
              <DialogDescription>إدخال بيانات التوزيع</DialogDescription>
            </DialogHeader>

            <div dir="rtl" className="grid gap-3">
              <div className="grid gap-2">
                <div className="text-sm">Institution ID (FK)</div>
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
                <div className="text-sm">Clinic ID (FK)</div>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="text"
                  value={clinicId ? String(clinicId) : ''}
                  onChange={(e) => setClinicId(toIntOnly(e.target.value))}
                  placeholder="مثال: 3"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">Product ID (FK)</div>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="text"
                  value={productId ? String(productId) : ''}
                  onChange={(e) => setProductId(toIntOnly(e.target.value))}
                  placeholder="مثال: 101"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">الكمية</div>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="text"
                  value={quantity ? String(quantity) : ''}
                  onChange={(e) => setQuantity(toIntOnly(e.target.value))}
                  placeholder="مثال: 250"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">تاريخ التوزيع</div>
                <Input
                  value={distributionDate}
                  onChange={(e) => setDistributionDate(e.target.value)}
                  placeholder="مثال: 2026-02-16"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">حالة التوزيع</div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DistributionStatus)}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="مجدول">مجدول</option>
                  <option value="تم">تم</option>
                  <option value="ملغي">ملغي</option>
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
                  !Number.isInteger(clinicId) ||
                  clinicId <= 0 ||
                  !Number.isInteger(productId) ||
                  productId <= 0 ||
                  !Number.isInteger(quantity) ||
                  quantity <= 0 ||
                  !distributionDate.trim()
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