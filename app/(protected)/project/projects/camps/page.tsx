'use client'

import { useEffect, useMemo, useState, type ChangeEvent } from 'react'

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
import { campsApi, type FillStatus as ApiFillStatus } from '../../../../helpers/campsService'

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
            familiesCount: 0,
            capacity: x.capacity,
            status: 'مؤقت',
          }))
        )

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

  useEffect(() => {
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

    setStatusPick((prev) => ({
      ...prev,
      [created.id]: created.status === 'FULL' ? 'Full' : 'Not Full',
    }))

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
          ? {
              ...c,
              nameAr: updated.name,
              nameEn: updated.name,
              areaAr: updated.area ?? '',
              capacity: updated.capacity,
            }
          : c
      )
    )

    setStatusPick((prev) => ({
      ...prev,
      [id]: updated.status === 'FULL' ? 'Full' : 'Not Full',
    }))
    setEditingId(null)
  }

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

  return (
    <div className="w-full px-2 py-4 sm:px-4 sm:py-6 lg:px-6" dir="rtl">
      <div className="mb-6" dir="ltr">
        <div className="text-left">
          <div className="text-xl font-semibold text-foreground sm:text-2xl">Camps</div>

          <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Home <span className="mx-1">{'>'}</span>{' '}
            <span className="text-foreground">Camps Management</span>
          </div>

          {loading && (
            <div className="mt-2 text-xs text-muted-foreground sm:text-sm">Loading...</div>
          )}
        </div>
      </div>

      <div className="w-full max-w-[1200px]">
        <Card>
          <CardContent className="p-0" dir="ltr">
            <div className="p-3 sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative w-full min-w-0 sm:w-[260px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={q}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
                      placeholder="Search camps"
                      className="!h-10 !w-full !rounded-lg border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:!ring-2 focus:!ring-slate-200"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'full' | 'notfull')}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200 sm:w-[160px]"
                  >
                    <option value="all">All status</option>
                    <option value="full">Full</option>
                    <option value="notfull">Not Full</option>
                  </select>
                </div>

                <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <Button
                    className="inline-flex w-full items-center justify-center gap-2 !rounded-lg !bg-blue-600 !px-4 !text-sm !font-semibold !text-white hover:!bg-blue-700 sm:w-auto !h-10"
                    onClick={() => setAddOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add camp
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full rounded-lg border-slate-200 !px-4 !text-sm !font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto !h-10"
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

            <div className="overflow-hidden rounded-b-lg">
              <div className="w-full">
                <table className="w-full table-fixed border-collapse text-[11px] sm:text-sm">
                  <thead
                    style={{
                      backgroundColor: '#F9FAFB',
                      boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
                    }}
                  >
                    <tr className="text-left text-foreground/60">
                      <th className="w-[24%] border-b border-r px-1 py-2 font-normal sm:px-4 sm:py-3">
                        Camp Name
                      </th>
                      <th className="w-[20%] border-b border-r px-1 py-2 font-normal sm:px-4 sm:py-3">
                        Area
                      </th>
                      <th className="w-[14%] border-b border-r px-1 py-2 font-normal sm:px-4 sm:py-3">
                        Capacity
                      </th>
                      <th className="w-[20%] border-b border-r px-1 py-2 font-normal sm:px-4 sm:py-3">
                        Status
                      </th>
                      <th className="w-[22%] border-b px-1 py-2 font-normal sm:px-4 sm:py-3">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageItems.map((c) => {
                      const isEditing = editingId === c.id
                      const currentStatus: FillStatus =
                        statusPick[c.id] ?? defaultFillStatus(c.familiesCount, c.capacity)

                      return (
                        <tr key={c.id} className="hover:bg-muted/30 align-top">
                          <td className="border-b border-r px-1 py-2 font-medium break-words sm:px-4 sm:py-3">
                            {isEditing ? (
                              <Input
                                value={editDraft.nameAr}
                                onChange={(e) =>
                                  setEditDraft((p) => ({ ...p, nameAr: e.target.value }))
                                }
                                className="h-8 text-[11px] sm:h-9 sm:text-sm"
                              />
                            ) : (
                              <span className="block break-words leading-4">{c.nameAr}</span>
                            )}
                          </td>

                          <td className="border-b border-r px-1 py-2 break-words sm:px-4 sm:py-3">
                            {isEditing ? (
                              <Input
                                value={editDraft.areaAr}
                                onChange={(e) =>
                                  setEditDraft((p) => ({ ...p, areaAr: e.target.value }))
                                }
                                className="h-8 text-[11px] sm:h-9 sm:text-sm"
                              />
                            ) : (
                              <span className="block break-words leading-4">{c.areaAr}</span>
                            )}
                          </td>

                          <td className="border-b border-r px-1 py-2 sm:px-4 sm:py-3">
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
                                className="h-8 text-[11px] sm:h-9 sm:text-sm"
                              />
                            ) : (
                              <span className="block break-words leading-4">{c.capacity}</span>
                            )}
                          </td>

                          <td className="border-b border-r px-1 py-2 sm:px-4 sm:py-3">
                            {isEditing ? (
                              <select
                                value={editDraft.fillStatus}
                                onChange={(e) =>
                                  setEditDraft((p) => ({
                                    ...p,
                                    fillStatus: e.target.value as FillStatus,
                                  }))
                                }
                                className="h-8 w-full rounded-md border bg-background px-1 text-[10px] sm:h-9 sm:px-3 sm:text-sm"
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
                                className="h-8 w-full rounded-md border bg-background px-1 text-[10px] sm:h-9 sm:px-3 sm:text-sm"
                              >
                                <option value="Full">Full</option>
                                <option value="Not Full">Not Full</option>
                              </select>
                            )}
                          </td>

                          <td className="border-b px-1 py-2 sm:px-4 sm:py-3">
                            <div className="flex flex-wrap items-center justify-center gap-1 sm:justify-start sm:gap-2">
                              {!isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-muted sm:h-10 sm:w-10"
                                    title="Edit"
                                    onClick={() => startEditRow(c)}
                                  >
                                    <Pencil className="size-3 sm:size-4" />
                                  </button>

                                  <button
                                    type="button"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-muted sm:h-10 sm:w-10"
                                    title="Delete"
                                    onClick={() => onDeleteOne(c.id)}
                                  >
                                    <Trash2 className="size-3 sm:size-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    className="h-8 px-2 text-[10px] sm:h-10 sm:px-3 sm:text-sm"
                                    onClick={() => saveEditRow(c.id)}
                                    disabled={
                                      !Number.isInteger(editDraft.capacity) ||
                                      editDraft.capacity <= 0
                                    }
                                  >
                                    <Save className="me-1 size-3 sm:me-2 sm:size-4" />
                                    Save
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2 text-[10px] sm:h-10 sm:px-3 sm:text-sm"
                                    onClick={cancelEditRow}
                                  >
                                    <X className="me-1 size-3 sm:me-2 sm:size-4" />
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

              <div className="flex flex-col gap-3 border-t p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
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

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="text-xs text-muted-foreground sm:text-sm">
                    {rangeStart} - {rangeEnd} of {filtered.length}
                  </div>

                  <div className="flex items-center gap-2">
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
            </div>
          </CardContent>
        </Card>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[560px]">
            <DialogHeader dir="rtl" className="text-right">
              <DialogTitle>إضافة مخيم</DialogTitle>
              <DialogDescription>إدخال بيانات المخيم</DialogDescription>
            </DialogHeader>

            <div dir="rtl" className="grid gap-3">
              <div className="grid gap-2">
                <div className="text-sm">اسم المخيم</div>
                <Input
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="مثال: مخيم الشمال A"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">المنطقة</div>
                <Input
                  value={areaAr}
                  onChange={(e) => setAreaAr(e.target.value)}
                  placeholder="مثال: شمال غزة"
                />
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

            <DialogFooter dir="rtl" className="flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => setAddOpen(false)}
                className="w-full sm:w-auto"
              >
                إغلاق
              </Button>

              <Button
                onClick={onAdd}
                disabled={!Number.isInteger(capacity) || capacity <= 0}
                className="w-full sm:w-auto"
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