'use client'

import {useMemo, useState, type ChangeEvent} from 'react'

import {Card, CardContent} from '../../../../components/ui/card'
import {Button} from '../../../../components/ui/button'
import {Input} from '../../../../components/ui/input'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../../components/ui/dialog'

import {Pencil, Trash2, Save, X, Plus, Search} from 'lucide-react'

type ClinicStatus = 'Open' | 'Closed'

type Clinic = {
  id: string
  nameAr: string
  specialtyAr: string
  capacityPerDay: number
  status: ClinicStatus
}

const clinicsSeed: Clinic[] = [
  {
    id: 'cl_01',
    nameAr: 'عيادة الشفاء',
    specialtyAr: 'طب عام',
    capacityPerDay: 120,
    status: 'Open',
  },
  {
    id: 'cl_02',
    nameAr: 'عيادة الأمل للنساء',
    specialtyAr: 'نسائية',
    capacityPerDay: 60,
    status: 'Closed',
  },
  {
    id: 'cl_03',
    nameAr: 'مركز رعاية الطفل',
    specialtyAr: 'أطفال',
    capacityPerDay: 80,
    status: 'Open',
  },
]

// ✅ أرقام صحيحة فقط
const toIntOnly = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

export default function ClinicsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Clinic[]>(clinicsSeed)

  // فلترة status من فوق
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all')

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Add dialog
  const [addOpen, setAddOpen] = useState(false)
  const [nameAr, setNameAr] = useState('')
  const [specialtyAr, setSpecialtyAr] = useState('')
  const [capacityPerDay, setCapacityPerDay] = useState<number>(0)
  const [status, setStatus] = useState<ClinicStatus>('Open')

  // Inline Edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    nameAr: string
    specialtyAr: string
    capacityPerDay: number
    status: ClinicStatus
  }>({
    nameAr: '',
    specialtyAr: '',
    capacityPerDay: 1,
    status: 'Open',
  })

  // ✅ فلترة search + status
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()

    return items.filter((c) => {
      const matchSearch =
        !s ||
        c.nameAr.includes(q) ||
        c.specialtyAr.includes(q) ||
        String(c.capacityPerDay).includes(s) ||
        c.status.toLowerCase().includes(s)

      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'open'
            ? c.status === 'Open'
            : c.status === 'Closed'

      return matchSearch && matchStatus
    })
  }, [q, items, statusFilter])

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
    const sp = specialtyAr.trim()

    if (!ar || !sp || !Number.isInteger(capacityPerDay) || capacityPerDay <= 0) return

    const newItem: Clinic = {
      id: `cl_${Math.random().toString(16).slice(2, 8)}`,
      nameAr: ar,
      specialtyAr: sp,
      capacityPerDay,
      status,
    }

    setItems((prev) => [newItem, ...prev])
    setNameAr('')
    setSpecialtyAr('')
    setCapacityPerDay(0)
    setStatus('Open')
    setAddOpen(false)
  }

  const onDeleteOne = (id: string) => {
    if (editingId === id) setEditingId(null)
    setItems((prev) => prev.filter((x) => x.id !== id))
  }

  const startEditRow = (c: Clinic) => {
    setEditingId(c.id)
    setEditDraft({
      nameAr: c.nameAr,
      specialtyAr: c.specialtyAr,
      capacityPerDay: c.capacityPerDay,
      status: c.status,
    })
  }

  const cancelEditRow = () => setEditingId(null)

  const saveEditRow = (id: string) => {
    const ar = editDraft.nameAr.trim()
    const sp = editDraft.specialtyAr.trim()

    if (!ar || !sp || !Number.isInteger(editDraft.capacityPerDay) || editDraft.capacityPerDay <= 0) return

    setItems((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              nameAr: ar,
              specialtyAr: sp,
              capacityPerDay: editDraft.capacityPerDay,
              status: editDraft.status,
            }
          : c
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
          <div className="text-2xl font-semibold text-foreground">Clinics</div>

          <div className="mt-1 text-sm text-muted-foreground">
            Home <span className="mx-1">{'>'}</span>{' '}
            <span className="text-foreground">Clinics Management</span>
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
                  {/* ✅ Search مطابق Camps */}
                  <div className="relative w-full sm:w-[260px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={q}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
                      placeholder="Search clinics"
                      className="!h-10 !rounded-lg border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:!ring-2 focus:!ring-slate-200"
                    />
                  </div>

                  {/* ✅ Status filter مطابق */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'open' | 'closed')}
                    className="h-10 w-full sm:w-[160px] rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="all">All status</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    className="!h-10 !rounded-lg !bg-blue-600 !px-4 !text-sm !font-semibold !text-white hover:!bg-blue-700 inline-flex items-center gap-2"
                    onClick={() => setAddOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add clinic
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
                <table className="w-full text-sm border-collapse min-w-[980px]">
                  <thead
                    style={{
                      backgroundColor: '#F9FAFB',
                      boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
                    }}
                  >
                    <tr className="text-left text-foreground/60">
                      <th className="px-4 py-3 border-b border-r font-normal">Clinic Name</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Specialty</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Capacity/Day</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Status</th>
                      <th className="px-4 py-3 border-b font-normal">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageItems.map((c) => {
                      const isEditing = editingId === c.id

                      return (
                        <tr key={c.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 border-b border-r font-medium">
                            {isEditing ? (
                              <Input
                                value={editDraft.nameAr}
                                onChange={(e) => setEditDraft((p) => ({...p, nameAr: e.target.value}))}
                                className="h-9"
                              />
                            ) : (
                              c.nameAr
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <Input
                                value={editDraft.specialtyAr}
                                onChange={(e) => setEditDraft((p) => ({...p, specialtyAr: e.target.value}))}
                                className="h-9"
                              />
                            ) : (
                              c.specialtyAr
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <Input
                                inputMode="numeric"
                                pattern="[0-9]*"
                                type="text"
                                value={editDraft.capacityPerDay ? String(editDraft.capacityPerDay) : ''}
                                onChange={(e) =>
                                  setEditDraft((p) => ({
                                    ...p,
                                    capacityPerDay: toIntOnly(e.target.value),
                                  }))
                                }
                                className="h-9"
                              />
                            ) : (
                              c.capacityPerDay
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <select
                                value={editDraft.status}
                                onChange={(e) =>
                                  setEditDraft((p) => ({...p, status: e.target.value as ClinicStatus}))
                                }
                                className="h-9 rounded-md border px-3 bg-background"
                              >
                                <option value="Open">Open</option>
                                <option value="Closed">Closed</option>
                              </select>
                            ) : (
                              <select
                                value={c.status}
                                onChange={(e) => {
                                  const next = e.target.value as ClinicStatus
                                  setItems((prev) =>
                                    prev.map((x) => (x.id === c.id ? {...x, status: next} : x))
                                  )
                                }}
                                className="h-9 rounded-md border px-3 bg-background"
                              >
                                <option value="Open">Open</option>
                                <option value="Closed">Closed</option>
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
                                    disabled={!Number.isInteger(editDraft.capacityPerDay) || editDraft.capacityPerDay <= 0}
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
                          No clinics found
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

        {/* Add Clinic Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader dir="rtl" className="text-right">
              <DialogTitle>إضافة عيادة</DialogTitle>
              <DialogDescription>إدخال بيانات العيادة</DialogDescription>
            </DialogHeader>

            <div dir="rtl" className="grid gap-3">
              <div className="grid gap-2">
                <div className="text-sm">اسم العيادة</div>
                <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="مثال: عيادة الشفاء" />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">التخصص</div>
                <Input value={specialtyAr} onChange={(e) => setSpecialtyAr(e.target.value)} placeholder="مثال: طب عام" />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">السعة/يوم</div>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="text"
                  value={capacityPerDay ? String(capacityPerDay) : ''}
                  onChange={(e) => setCapacityPerDay(toIntOnly(e.target.value))}
                  placeholder="مثال: 120"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">الحالة</div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ClinicStatus)}
                  className="h-10 rounded-md border px-3 bg-background"
                >
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            <DialogFooter dir="rtl" className="gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                إغلاق
              </Button>
              <Button onClick={onAdd} disabled={!nameAr.trim() || !specialtyAr.trim() || capacityPerDay <= 0}>
                إضافة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}