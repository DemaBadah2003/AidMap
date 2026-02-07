'use client'

import { useMemo, useState, type ChangeEvent } from 'react'

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

import { Pencil, Trash2, Save, X, Plus } from 'lucide-react'

type Camp = {
  id: string
  nameAr: string
  nameEn: string
  areaAr: string
  familiesCount: number
  capacity: number
  status: 'نشط' | 'مؤقت' | 'مغلق'
}

const campsSeed: Camp[] = [
  { id: 'cp_01', nameAr: 'مخيم الشمال A', nameEn: 'North Camp A', areaAr: 'شمال غزة', familiesCount: 320, capacity: 2000, status: 'نشط' },
  { id: 'cp_02', nameAr: 'مخيم الوسط B', nameEn: 'Middle Camp B', areaAr: 'الوسطى', familiesCount: 210, capacity: 1400, status: 'مؤقت' },
  { id: 'cp_03', nameAr: 'مخيم الجنوب C', nameEn: 'South Camp C', areaAr: 'خانيونس', familiesCount: 120, capacity: 900, status: 'نشط' },
]

type FillStatus = 'Full' | 'Not Full'

const defaultFillStatus = (families: number, capacity: number): FillStatus =>
  families >= capacity ? 'Full' : 'Not Full'

// ✅ أرقام صحيحة فقط
const toIntOnly = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

export default function CampsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Camp[]>(campsSeed)

  // فلترة status (Full / Not Full) من فوق
  const [statusFilter, setStatusFilter] = useState<'all' | 'full' | 'notfull'>('all')

  // اختيار status لكل صف
  const [statusPick, setStatusPick] = useState<Record<string, FillStatus>>({})

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Add dialog
  const [addOpen, setAddOpen] = useState(false)
  const [nameAr, setNameAr] = useState('')
  const [areaAr, setAreaAr] = useState('')
  const [capacity, setCapacity] = useState<number>(0)

  // Inline Edit
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

  // ✅ فلترة search + فلترة status
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()

    return items.filter((c) => {
      const matchSearch =
        !s ||
        c.nameEn.toLowerCase().includes(s) ||
        c.nameAr.includes(q) ||
        c.areaAr.includes(q)

      const rowStatus: FillStatus = statusPick[c.id] ?? defaultFillStatus(c.familiesCount, c.capacity)

      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'full'
          ? rowStatus === 'Full'
          : rowStatus === 'Not Full'

      return matchSearch && matchStatus
    })
  }, [q, items, statusFilter, statusPick])

  useMemo(() => {
    setPage(1)
  }, [q, statusFilter, pageSize])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  const onAdd = () => {
    const ar = nameAr.trim()
    const area = areaAr.trim()
    if (!ar || !area || !Number.isInteger(capacity) || capacity <= 0) return

    const newItem: Camp = {
      id: `cp_${Math.random().toString(16).slice(2, 8)}`,
      nameAr: ar,
      nameEn: ar,
      areaAr: area,
      familiesCount: 0,
      capacity,
      status: 'مؤقت',
    }

    setItems((prev) => [newItem, ...prev])
    setNameAr('')
    setAreaAr('')
    setCapacity(0)
    setAddOpen(false)
  }

  const onDeleteOne = (id: string) => {
    if (editingId === id) setEditingId(null)

    setItems((prev) => prev.filter((x) => x.id !== id))
    setStatusPick((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const startEditRow = (c: Camp) => {
    const currentStatus: FillStatus = statusPick[c.id] ?? defaultFillStatus(c.familiesCount, c.capacity)

    setEditingId(c.id)
    setEditDraft({
      nameAr: c.nameAr,
      areaAr: c.areaAr,
      capacity: c.capacity,
      fillStatus: currentStatus,
    })
  }

  const cancelEditRow = () => setEditingId(null)

  const saveEditRow = (id: string) => {
    const ar = editDraft.nameAr.trim()
    const area = editDraft.areaAr.trim()

    if (!ar || !area || !Number.isInteger(editDraft.capacity) || editDraft.capacity <= 0) return

    setItems((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              nameAr: ar,
              nameEn: ar,
              areaAr: area,
              capacity: editDraft.capacity,
            }
          : c
      )
    )

    setStatusPick((prev) => ({ ...prev, [id]: editDraft.fillStatus }))
    setEditingId(null)
  }

  // Pagination label: "1 - 10 of N"
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

  return (
    <div className="w-full px-3 sm:px-6 py-6" dir="rtl">
      {/* Header (مثل Users) */}
      <div className="mb-6" dir="ltr">
        <div className="text-left">
          <div className="text-2xl font-semibold text-foreground">Camps</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Home <span className="mx-1">{'>'}</span> Camps
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1200px]">
        {/* ✅ قالب واحد: Toolbar + Table داخل Card واحد */}
        <Card>
          <CardContent className="p-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center" dir="ltr">
              <div className="flex-1">
                <Input
                  value={q}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
                  placeholder="Search camps"
                  className="h-11"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'full' | 'notfull')}
                  className="h-11 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="all">All status</option>
                  <option value="full">Full</option>
                  <option value="notfull">Not Full</option>
                </select>

                <Button className="h-11" onClick={() => setAddOpen(true)}>
                  <Plus className="size-4 me-2" />
                  Add camp
                </Button>

                <Button
                  variant="outline"
                  className="h-11"
                  onClick={() => {
                    setItems([])
                    setStatusPick({})
                    setEditingId(null)
                  }}
                >
                  Delete all
                </Button>
              </div>
            </div>

            {/* ✅ خط فاصل + مسافة مثل Users */}
            <div className="mt-4 rounded-lg border overflow-hidden bg-background">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm border-collapse min-w-[820px]" dir="ltr">
                  {/* ✅ Header مثل Users: أفتح + بدون bold */}
                  <thead className="bg-muted/30">
                    <tr className="text-left text-muted-foreground">
                      <th className="px-4 py-3 border-b border-r font-normal">Camp Name</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Area</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Capacity</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Status</th>
                      <th className="px-4 py-3 border-b font-normal">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageItems.map((c) => {
                      const isEditing = editingId === c.id
                      const currentStatus: FillStatus =
                        statusPick[c.id] ?? defaultFillStatus(c.familiesCount, c.capacity)

                      return (
                        <tr key={c.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 border-b border-r font-medium">
                            {isEditing ? (
                              <Input
                                value={editDraft.nameAr}
                                onChange={(e) => setEditDraft((p) => ({ ...p, nameAr: e.target.value }))}
                                className="h-9"
                              />
                            ) : (
                              c.nameAr
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <Input
                                value={editDraft.areaAr}
                                onChange={(e) => setEditDraft((p) => ({ ...p, areaAr: e.target.value }))}
                                className="h-9"
                              />
                            ) : (
                              c.areaAr
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
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
                                className="h-9"
                              />
                            ) : (
                              c.capacity
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <select
                                value={editDraft.fillStatus}
                                onChange={(e) =>
                                  setEditDraft((p) => ({
                                    ...p,
                                    fillStatus: e.target.value as FillStatus,
                                  }))
                                }
                                className="h-9 rounded-md border px-3 bg-background"
                              >
                                <option value="Full">Full</option>
                                <option value="Not Full">Not Full</option>
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
                                className="h-9 rounded-md border px-3 bg-background"
                              >
                                <option value="Full">Full</option>
                                <option value="Not Full">Not Full</option>
                              </select>
                            )}
                          </td>

                          <td className="px-4 py-3 border-b">
                            <div className="flex items-center gap-2">
                              {!isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center rounded-md border h-9 w-9 hover:bg-muted"
                                    title="Edit"
                                    onClick={() => startEditRow(c)}
                                  >
                                    <Pencil className="size-4" />
                                  </button>

                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center rounded-md border h-9 w-9 hover:bg-muted"
                                    title="Delete"
                                    onClick={() => onDeleteOne(c.id)}
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    className="h-9"
                                    onClick={() => saveEditRow(c.id)}
                                    disabled={!Number.isInteger(editDraft.capacity) || editDraft.capacity <= 0}
                                  >
                                    <Save className="size-4 me-2" />
                                    Save
                                  </Button>

                                  <Button size="sm" variant="outline" className="h-9" onClick={cancelEditRow}>
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
                          No camps found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border-t" dir="ltr">
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

        {/* Add Camp Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader dir="rtl" className="text-right">
              <DialogTitle>إضافة مخيم</DialogTitle>
              <DialogDescription>إدخال بيانات المخيم</DialogDescription>
            </DialogHeader>

            <div dir="rtl" className="grid gap-3">
              <div className="grid gap-2">
                <div className="text-sm">اسم المخيم</div>
                <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="مثال: مخيم الشمال A" />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">المنطقة</div>
                <Input value={areaAr} onChange={(e) => setAreaAr(e.target.value)} placeholder="مثال: شمال غزة" />
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
            </div>

            <DialogFooter dir="rtl" className="gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                إغلاق
              </Button>
              <Button onClick={onAdd} disabled={!Number.isInteger(capacity) || capacity <= 0}>
                إضافة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}