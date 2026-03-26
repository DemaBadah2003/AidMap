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

type ServiceStatus = 'نشط' | 'مؤقت' | 'مغلق'

type Service = {
  id: string // service_id (PK)
  typeAr: string // نوع الخدمة
  donorAr: string // المتبرع/الجهة
  detailsAr: string // تفاصيل/ملاحظات
  status: ServiceStatus // حالة الخدمة
}

const servicesSeed: Service[] = [
  {
    id: 'srv_01',
    typeAr: 'توزيع سلال غذائية',
    donorAr: 'مؤسسة الخير',
    detailsAr: 'توزيع أسبوعي - حي الرمال',
    status: 'نشط',
  },
  {
    id: 'srv_02',
    typeAr: 'عيادة متنقلة',
    donorAr: 'منظمة الصحة',
    detailsAr: 'زيارة كل 3 أيام',
    status: 'مؤقت',
  },
  {
    id: 'srv_03',
    typeAr: 'توفير مياه',
    donorAr: 'جمعية الإغاثة',
    detailsAr: 'صهاريج مياه للمخيمات',
    status: 'نشط',
  },
]

export default function ServicesPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Service[]>(servicesSeed)

  // فلترة الحالة من فوق
  const [statusFilter, setStatusFilter] = useState<'all' | ServiceStatus>('all')

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Add dialog
  const [addOpen, setAddOpen] = useState(false)
  const [typeAr, setTypeAr] = useState('')
  const [donorAr, setDonorAr] = useState('')
  const [detailsAr, setDetailsAr] = useState('')
  const [status, setStatus] = useState<ServiceStatus>('نشط')

  // Inline Edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    typeAr: string
    donorAr: string
    detailsAr: string
    status: ServiceStatus
  }>({
    typeAr: '',
    donorAr: '',
    detailsAr: '',
    status: 'نشط',
  })

  // ✅ فلترة search + فلترة status
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()

    return items.filter((x) => {
      const matchSearch =
        !s ||
        x.id.toLowerCase().includes(s) ||
        x.typeAr.includes(q) ||
        x.donorAr.includes(q) ||
        x.detailsAr.includes(q)

      const matchStatus = statusFilter === 'all' ? true : x.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [q, items, statusFilter])

  // ✅ reset page عند تغيير الفلاتر/البحث/حجم الصفحة (useEffect مش useMemo)
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
    const t = typeAr.trim()
    const d = donorAr.trim()
    const det = detailsAr.trim()
    if (!t || !d) return

    const newItem: Service = {
      id: `srv_${Math.random().toString(16).slice(2, 8)}`,
      typeAr: t,
      donorAr: d,
      detailsAr: det,
      status,
    }

    setItems((prev) => [newItem, ...prev])
    setTypeAr('')
    setDonorAr('')
    setDetailsAr('')
    setStatus('نشط')
    setAddOpen(false)
  }

  const onDeleteOne = (id: string) => {
    if (editingId === id) setEditingId(null)
    setItems((prev) => prev.filter((x) => x.id !== id))
  }

  const startEditRow = (s: Service) => {
    setEditingId(s.id)
    setEditDraft({
      typeAr: s.typeAr,
      donorAr: s.donorAr,
      detailsAr: s.detailsAr,
      status: s.status,
    })
  }

  const cancelEditRow = () => setEditingId(null)

  const saveEditRow = (id: string) => {
    const t = editDraft.typeAr.trim()
    const d = editDraft.donorAr.trim()
    const det = editDraft.detailsAr.trim()

    if (!t || !d) return

    setItems((prev) =>
      prev.map((x) =>
        x.id === id
          ? {
              ...x,
              typeAr: t,
              donorAr: d,
              detailsAr: det,
              status: editDraft.status,
            }
          : x
      )
    )

    setEditingId(null)
  }

  // Pagination label: "1 - 10 of N"
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

  return (
    <div className="w-full px-3 sm:px-6 py-6" dir="rtl">
      {/* Header */}
      <div className="mb-6" dir="ltr">
        <div className="text-left">
          <div className="text-2xl font-semibold text-foreground">Services</div>

          <div className="mt-1 text-sm text-muted-foreground">
            Home <span className="mx-1">{'>'}</span>{' '}
            <span className="text-foreground">Services Management</span>
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
                      placeholder="Search services"
                      className="!h-10 !rounded-lg border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:!ring-2 focus:!ring-slate-200"
                    />
                  </div>

                  {/* Status filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | ServiceStatus)}
                    className="h-10 w-full sm:w-[160px] rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="all">All status</option>
                    <option value="نشط">Active</option>
                    <option value="مؤقت">Temporary</option>
                    <option value="مغلق">Closed</option>
                  </select>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    className="!h-10 !rounded-lg !bg-blue-600 !px-4 !text-sm !font-semibold !text-white hover:!bg-blue-700 inline-flex items-center gap-2"
                    onClick={() => setAddOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add service
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
                      <th className="px-4 py-3 border-b border-r font-normal">Service ID</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Service Type</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Donor / Organization</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Details</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Status</th>
                      <th className="px-4 py-3 border-b font-normal">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageItems.map((s) => {
                      const isEditing = editingId === s.id

                      return (
                        <tr key={s.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 border-b border-r font-medium">{s.id}</td>

                          <td className="px-4 py-3 border-b border-r" dir="rtl">
                            {isEditing ? (
                              <Input
                                value={editDraft.typeAr}
                                onChange={(e) => setEditDraft((p) => ({ ...p, typeAr: e.target.value }))}
                                className="h-10"
                              />
                            ) : (
                              s.typeAr
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r" dir="rtl">
                            {isEditing ? (
                              <Input
                                value={editDraft.donorAr}
                                onChange={(e) => setEditDraft((p) => ({ ...p, donorAr: e.target.value }))}
                                className="h-10"
                              />
                            ) : (
                              s.donorAr
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r" dir="rtl">
                            {isEditing ? (
                              <Input
                                value={editDraft.detailsAr}
                                onChange={(e) => setEditDraft((p) => ({ ...p, detailsAr: e.target.value }))}
                                className="h-10"
                              />
                            ) : (
                              s.detailsAr || <span className="text-muted-foreground">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
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
                                <option value="نشط">Active</option>
                                <option value="مؤقت">Temporary</option>
                                <option value="مغلق">Closed</option>
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
                                    title="Edit"
                                    onClick={() => startEditRow(s)}
                                  >
                                    <Pencil className="size-4" />
                                  </button>

                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center rounded-md border h-10 w-10 hover:bg-muted"
                                    title="Delete"
                                    onClick={() => onDeleteOne(s.id)}
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Button size="sm" className="h-10" onClick={() => saveEditRow(s.id)}>
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
                        <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                          No services found
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

        {/* Add Service Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader dir="rtl" className="text-right">
              <DialogTitle>إضافة خدمة</DialogTitle>
              <DialogDescription>إدخال بيانات الخدمة</DialogDescription>
            </DialogHeader>

            <div dir="rtl" className="grid gap-3">
              <div className="grid gap-2">
                <div className="text-sm">نوع الخدمة</div>
                <Input value={typeAr} onChange={(e) => setTypeAr(e.target.value)} placeholder="مثال: توزيع سلال غذائية" />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">المتبرع / الجهة</div>
                <Input value={donorAr} onChange={(e) => setDonorAr(e.target.value)} placeholder="مثال: مؤسسة الخير" />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">تفاصيل</div>
                <Input
                  value={detailsAr}
                  onChange={(e) => setDetailsAr(e.target.value)}
                  placeholder="مثال: توزيع أسبوعي - حي الرمال"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">الحالة</div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ServiceStatus)}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="نشط">نشط</option>
                  <option value="مؤقت">مؤقت</option>
                  <option value="مغلق">مغلق</option>
                </select>
              </div>
            </div>

            <DialogFooter dir="rtl" className="gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                إغلاق
              </Button>
              <Button onClick={onAdd} disabled={!typeAr.trim() || !donorAr.trim()}>
                إضافة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}