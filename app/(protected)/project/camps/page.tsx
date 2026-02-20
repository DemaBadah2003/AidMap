'use client'

import { useEffect, useMemo, useState, type ChangeEvent } from 'react'

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
import { campsApi, type FillStatus as ApiFillStatus } from '../../../helpers/campsService' // ✅ عدّل المسار إذا لزم
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

const defaultFillStatus = (families: number, capacity: number): FillStatus =>
  families >= capacity ? 'Full' : 'Not Full'

const toIntOnly = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

export default function CampsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Camp[]>([])
  const [loading, setLoading] = useState(false)

  const [statusFilter, setStatusFilter] = useState<'all' | 'full' | 'notfull'>('all')
  const [statusPick, setStatusPick] = useState<Record<string, FillStatus>>({})

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [addOpen, setAddOpen] = useState(false)
  const [nameAr, setNameAr] = useState('')
  const [areaAr, setAreaAr] = useState('')
  const [capacity, setCapacity] = useState<number>(0)

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

  // ✅ Load from backend
  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const data = await campsApi.list()
        setItems(
          data.map((x) => ({
            id: x.id,
            nameAr: x.name,
            nameEn: x.name,
            areaAr: x.area ?? '',
            familiesCount: 0, // UI only
            capacity: x.capacity,
            status: 'مؤقت',
          }))
        )
        // عشان ينعكس status enum على dropdown
        const pick: Record<string, FillStatus> = {}
        data.forEach((x) => {
          pick[x.id] = x.status === 'FULL' ? 'Full' : 'Not Full'
        })
        setStatusPick(pick)
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

  useMemo(() => {
    setPage(1)
  }, [q, statusFilter, pageSize])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  const onAdd = async () => {
    const ar = nameAr.trim()
    const area = areaAr.trim()
    if (!ar || !Number.isInteger(capacity) || capacity <= 0) return

    const created = await campsApi.create({
      nameAr: ar,
      areaAr: area,
      capacity,
      fillStatus: 'Not Full',
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

    setStatusPick((prev) => ({ ...prev, [created.id]: created.status === 'FULL' ? 'Full' : 'Not Full' }))

    setNameAr('')
    setAreaAr('')
    setCapacity(0)
    setAddOpen(false)
  }

  const onDeleteOne = async (id: string) => {
    await campsApi.remove(id)

    if (editingId === id) setEditingId(null)

    setItems((prev) => prev.filter((x) => x.id !== id))
    setStatusPick((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
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

    const updated = await campsApi.update(id, {
      nameAr: ar,
      areaAr: area,
      capacity: editDraft.capacity,
      fillStatus: editDraft.fillStatus as ApiFillStatus,
    })

    setItems((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, nameAr: updated.name, nameEn: updated.name, areaAr: updated.area ?? '', capacity: updated.capacity }
          : c
      )
    )

    setStatusPick((prev) => ({ ...prev, [id]: updated.status === 'FULL' ? 'Full' : 'Not Full' }))
    setEditingId(null)
  }

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

  return (
    <div className="w-full px-3 sm:px-6 py-6" dir="rtl">
      <div className="mb-6" dir="ltr">
        <div className="text-left">
          <div className="text-2xl font-semibold text-foreground">Camps</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Home <span className="mx-1">{'>'}</span>{' '}
            <span className="text-foreground">Camps Management</span>
          </div>
          {loading && <div className="mt-2 text-sm text-muted-foreground">Loading...</div>}
        </div>
      </div>

      <div className="w-full max-w-[1200px]">
        <Card>
          <CardContent className="p-0" dir="ltr">
            <div className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative w-full sm:w-[260px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={q}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
                      placeholder="Search camps"
                      className="!h-10 !rounded-lg border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:!ring-2 focus:!ring-slate-200"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'full' | 'notfull')}
                    className="h-10 w-full sm:w-[160px] rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="all">All status</option>
                    <option value="full">Full</option>
                    <option value="notfull">Not Full</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <Button
                    className="!h-10 !rounded-lg !bg-blue-600 !px-4 !text-sm !font-semibold !text-white hover:!bg-blue-700 inline-flex items-center gap-2"
                    onClick={() => setAddOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add camp
                  </Button>

                  <Button
                    variant="outline"
                    className="!h-10 !rounded-lg !px-4 !text-sm !font-semibold border-slate-200 text-slate-700 hover:bg-slate-50"
                    onClick={async () => {
                      await campsApi.removeAll()
                      setItems([])
                      setStatusPick({})
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
                <table className="w-full text-sm border-collapse min-w-[820px]">
                  <thead style={{ backgroundColor: '#F9FAFB', boxShadow: '0 1px 0 rgba(0,0,0,0.06)' }}>
                    <tr className="text-left text-foreground/60">
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
                                  setEditDraft((p) => ({ ...p, fillStatus: e.target.value as FillStatus }))
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
                                  setStatusPick((prev) => ({ ...prev, [c.id]: e.target.value as FillStatus }))
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
                                    className="inline-flex items-center justify-center rounded-md border h-10 w-10 hover:bg-muted"
                                    title="Edit"
                                    onClick={() => startEditRow(c)}
                                  >
                                    <Pencil className="size-4" />
                                  </button>

                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center rounded-md border h-10 w-10 hover:bg-muted"
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
                                    className="h-10"
                                    onClick={() => saveEditRow(c.id)}
                                    disabled={!Number.isInteger(editDraft.capacity) || editDraft.capacity <= 0}
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
                          No camps found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

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

                  <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    Previous
                  </Button>

                  <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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